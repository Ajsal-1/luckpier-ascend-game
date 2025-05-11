
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as crypto from "https://deno.land/std@0.167.0/crypto/mod.ts";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a hash from the previous round's hash and server seed
const generateHash = async (previousHash: string, serverSeed: string): Promise<string> => {
  const message = new TextEncoder().encode(previousHash + serverSeed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', message);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Calculate crash point from hash (provably fair)
const calculateCrashPointFromHash = (hash: string): number => {
  // Convert first 8 chars of hash to integer
  const seed = parseInt(hash.slice(0, 8), 16);
  
  // Generate float in range [0, 1)
  const float = seed / 0xffffffff;
  
  // Apply house edge (1%) and use distribution that favors lower values
  const houseEdge = 0.99;
  
  // Formula based on common crypto crash games
  // This creates a distribution where crash points are more likely to be small
  // 1 / (1 - float * houseEdge) gives a curve that naturally creates rare high values
  const crashPoint = Math.max(1.01, (100 * houseEdge) / (1 - float * houseEdge)) / 100;
  
  // Round to 2 decimal places
  return Math.floor(crashPoint * 100) / 100;
};

// Function to calculate current multiplier based on elapsed time
const calculateMultiplier = (startTimeMs: number, growthFactor = 0.06): number => {
  const elapsedTimeMs = Date.now() - startTimeMs;
  const elapsedTimeSeconds = elapsedTimeMs / 1000;
  
  // Use exponential growth formula: 1.0 * e^(growthFactor * elapsedTimeSeconds)
  const multiplier = Math.pow(Math.E, growthFactor * elapsedTimeSeconds);
  
  // Ensure minimum of 1.0 and round to 2 decimal places
  return Math.max(1.0, Math.floor(multiplier * 100) / 100);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get client authentication if available
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const clientSupabase = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { 
          global: { 
            headers: { Authorization: authHeader } 
          } 
        }
      );
      
      const { data: { user } } = await clientSupabase.auth.getUser();
      userId = user?.id || null;
    }
    
    // Process the request based on method and action
    if (req.method === 'GET') {
      // Get game state
      const { data: activeRounds, error: activeRoundsError } = await supabase
        .from('crash_rounds')
        .select('*')
        .or('status.eq.waiting,status.eq.running')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (activeRoundsError) {
        throw new Error(`Error fetching active rounds: ${activeRoundsError.message}`);
      }
      
      if (activeRounds && activeRounds.length > 0) {
        const currentRound = activeRounds[0];
        
        if (currentRound.status === 'running') {
          // Calculate current multiplier
          const startTime = new Date(currentRound.start_time).getTime();
          const currentMultiplier = calculateMultiplier(startTime);
          
          // Check if round should crash
          if (currentMultiplier >= currentRound.crash_multiplier) {
            // Update round status to crashed
            await supabase
              .from('crash_rounds')
              .update({ status: 'crashed' })
              .eq('id', currentRound.id);
              
            // Mark all uncashed bets as losses
            await supabase
              .from('user_bets')
              .update({ status: 'lost' })
              .eq('round_id', currentRound.id)
              .is('cashout_multiplier', null);
              
            // Create a new round to start in 3 seconds (changed from 5 seconds)
            const { data: newRound } = await supabase.rpc('create_new_crash_round');
            
            return new Response(
              JSON.stringify({
                status: 'crashed',
                crashPoint: currentRound.crash_multiplier,
                round_id: currentRound.id,
                next_round: newRound
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({
              status: 'playing',
              current_multiplier: currentMultiplier,
              round_id: currentRound.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else if (currentRound.status === 'waiting') {
          // Check if it's time to start the round
          const now = new Date();
          const startTime = new Date(currentRound.start_time);
          
          if (now >= startTime) {
            // Update round status to running
            await supabase
              .from('crash_rounds')
              .update({ status: 'running' })
              .eq('id', currentRound.id);
              
            return new Response(
              JSON.stringify({
                status: 'started',
                round_id: currentRound.id,
                start_time: currentRound.start_time
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            // Return time until start
            return new Response(
              JSON.stringify({
                status: 'waiting',
                round_id: currentRound.id,
                start_time: currentRound.start_time,
                countdown: Math.max(0, (startTime.getTime() - now.getTime()) / 1000)
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } else {
        // No active round, create one
        const { data: newRoundId } = await supabase.rpc('create_new_crash_round');
        
        return new Response(
          JSON.stringify({
            status: 'created',
            round_id: newRoundId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (req.method === 'POST') {
      // We need to read the body as JSON
      const reqBody = await req.json();
      const { action, roundId } = reqBody;
      
      if (action === 'place_bet') {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        const { amount, autoCashoutAt } = reqBody;
        
        if (!amount || isNaN(amount) || amount <= 0) {
          return new Response(
            JSON.stringify({ error: 'Invalid bet amount' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // Check user balance
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();
          
        if (profileError || !profile) {
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve user profile' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        if (profile.balance < amount) {
          return new Response(
            JSON.stringify({ error: 'Insufficient balance' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // Check if round is still in waiting status
        const { data: round, error: roundError } = await supabase
          .from('crash_rounds')
          .select('status')
          .eq('id', roundId)
          .single();
          
        if (roundError || !round) {
          return new Response(
            JSON.stringify({ error: 'Invalid round' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        if (round.status !== 'waiting') {
          return new Response(
            JSON.stringify({ error: 'Round has already started' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // Deduct balance
        await supabase
          .from('profiles')
          .update({ balance: profile.balance - amount })
          .eq('id', userId);
          
        // Place bet
        const { data: bet, error: betError } = await supabase
          .from('user_bets')
          .insert({
            user_id: userId,
            round_id: roundId,
            bet_amount: amount,
            auto_cashout_at: autoCashoutAt || null,
            status: 'active'
          })
          .select()
          .single();
          
        if (betError) {
          // Rollback balance change
          await supabase
            .from('profiles')
            .update({ balance: profile.balance })
            .eq('id', userId);
            
          return new Response(
            JSON.stringify({ error: 'Failed to place bet' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            bet: bet
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (action === 'cashout') {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        const { multiplier } = reqBody;
        
        if (!multiplier || isNaN(multiplier) || multiplier < 1.0) {
          return new Response(
            JSON.stringify({ error: 'Invalid multiplier' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // Check if round is still running
        const { data: round, error: roundError } = await supabase
          .from('crash_rounds')
          .select('status, crash_multiplier')
          .eq('id', roundId)
          .single();
          
        if (roundError || !round) {
          return new Response(
            JSON.stringify({ error: 'Invalid round' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        if (round.status !== 'running') {
          return new Response(
            JSON.stringify({ error: 'Round is not running' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // Ensure multiplier is valid (not beyond crash point)
        if (multiplier > round.crash_multiplier) {
          return new Response(
            JSON.stringify({ error: 'Invalid cashout: round already crashed' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // Find user's active bet for this round
        const { data: bet, error: betError } = await supabase
          .from('user_bets')
          .select('id, bet_amount, status')
          .eq('user_id', userId)
          .eq('round_id', roundId)
          .eq('status', 'active')
          .is('cashout_multiplier', null)
          .single();
          
        if (betError || !bet) {
          return new Response(
            JSON.stringify({ error: 'No active bet found' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // Calculate winnings
        const winnings = bet.bet_amount * multiplier;
        
        // Update bet with cashout multiplier
        await supabase
          .from('user_bets')
          .update({
            cashout_multiplier: multiplier,
            status: 'won'
          })
          .eq('id', bet.id);
          
        // Add winnings to user balance
        await supabase
          .from('profiles')
          .update({
            balance: supabase.rpc('get_new_balance', { 
              user_id: userId, 
              amount_to_add: winnings 
            })
          })
          .eq('id', userId);
          
        return new Response(
          JSON.stringify({
            success: true,
            cashout_multiplier: multiplier,
            winnings: winnings
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
