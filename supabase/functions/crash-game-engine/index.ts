
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

// Helper function to create a standardized response
const createResponse = (data: any, status = 200) => {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      } 
    }
  );
};

// Helper function to create an error response
const createErrorResponse = (message: string, status = 400) => {
  return createResponse({ error: message }, status);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log(`Processing ${req.method} request to crash-game-engine`);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
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
      console.log("Fetching active rounds");
      const { data: activeRounds, error: activeRoundsError } = await supabase
        .from('rounds')
        .select('*')
        .or('status.eq.pending,status.eq.running')
        .order('started_at', { ascending: false })
        .limit(1);
        
      if (activeRoundsError) {
        console.error("Error fetching active rounds:", activeRoundsError);
        throw new Error(`Error fetching active rounds: ${activeRoundsError.message}`);
      }
      
      if (activeRounds && activeRounds.length > 0) {
        const currentRound = activeRounds[0];
        console.log(`Found active round: ${currentRound.id}, status: ${currentRound.status}`);
        
        if (currentRound.status === 'running') {
          // Calculate current multiplier
          const startTime = new Date(currentRound.started_at).getTime();
          const currentMultiplier = calculateMultiplier(startTime);
          console.log(`Current multiplier: ${currentMultiplier.toFixed(2)}x`);
          
          // Check if round should crash
          if (currentMultiplier >= currentRound.crash_multiplier) {
            console.log(`Round crashed at ${currentRound.crash_multiplier.toFixed(2)}x`);
            
            // Update round status to crashed/completed
            const now = new Date().toISOString();
            const { error: updateError } = await supabase
              .from('rounds')
              .update({ 
                status: 'completed',
                ended_at: now
              })
              .eq('id', currentRound.id);
              
            if (updateError) {
              console.error("Error updating round status:", updateError);
            }
              
            // Mark all uncashed bets as losses
            const { error: betUpdateError } = await supabase
              .from('player_bets')
              .update({ status: 'lost' })
              .eq('round_id', currentRound.id)
              .is('cashed_out_multiplier', null);
              
            if (betUpdateError) {
              console.error("Error marking bets as lost:", betUpdateError);
            }
            
            // Create a new round to start in 6 seconds (increased cooldown time)
            const startTime = new Date();
            startTime.setSeconds(startTime.getSeconds() + 6); // Start in 6 seconds
            
            // Generate crash point between 1.01x and 10x
            let crashPoint: number;
            const rng = Math.random();
            if (rng < 0.7) {
              // 70% chance for lower crash (1.01x - 3x)
              crashPoint = 1.01 + Math.random() * 1.99;
            } else if (rng < 0.95) {
              // 25% chance for medium crash (3x - 5x)
              crashPoint = 3 + Math.random() * 2;
            } else {
              // 5% chance for high crash (5x - 10x)
              crashPoint = 5 + Math.random() * 5;
            }
            
            // Round to 2 decimal places
            crashPoint = Math.round(crashPoint * 100) / 100;
            
            // Create new round
            const { data: newRound, error: newRoundError } = await supabase
              .from('rounds')
              .insert({
                crash_multiplier: crashPoint,
                status: 'pending',
                started_at: startTime.toISOString()
              })
              .select()
              .single();
            
            if (newRoundError) {
              console.error("Error creating new round:", newRoundError);
              throw new Error(`Error creating new round: ${newRoundError.message}`);
            }
            
            console.log(`Created new round ${newRound.id} with crash point ${crashPoint}`);
            
            return createResponse({
              status: 'crashed',
              crashPoint: currentRound.crash_multiplier,
              round_id: currentRound.id,
              next_round: {
                id: newRound.id,
                start_time: newRound.started_at,
                countdown: 6 // Extended cooldown time
              }
            });
          }
          
          return createResponse({
            status: 'playing',
            current_multiplier: currentMultiplier,
            round_id: currentRound.id
          });
          
        } else if (currentRound.status === 'pending') {
          // Check if it's time to start the round
          const now = new Date();
          const startTime = new Date(currentRound.started_at);
          
          const countdown = Math.max(0, (startTime.getTime() - now.getTime()) / 1000);
          console.log(`Round ${currentRound.id} countdown: ${countdown.toFixed(1)}s`);
          
          if (now >= startTime) {
            console.log(`Starting round ${currentRound.id}`);
            
            // Update round status to running
            const { error: updateError } = await supabase
              .from('rounds')
              .update({ status: 'running' })
              .eq('id', currentRound.id);
              
            if (updateError) {
              console.error("Error updating round to running:", updateError);
              throw new Error(`Error starting round: ${updateError.message}`);
            }
              
            return createResponse({
              status: 'started',
              round_id: currentRound.id,
              start_time: currentRound.started_at
            });
          } else {
            // Return time until start
            return createResponse({
              status: 'waiting',
              round_id: currentRound.id,
              start_time: currentRound.started_at,
              countdown: countdown
            });
          }
        }
      } else {
        console.log("No active round found, creating a new one");
        
        // No active round, create one
        const startTime = new Date();
        startTime.setSeconds(startTime.getSeconds() + 3); // Start in 3 seconds
        
        // Generate crash point between 1.01x and 10x
        let crashPoint: number;
        const rng = Math.random();
        if (rng < 0.7) {
          // 70% chance for lower crash (1.01x - 3x)
          crashPoint = 1.01 + Math.random() * 1.99;
        } else if (rng < 0.95) {
          // 25% chance for medium crash (3x - 5x)
          crashPoint = 3 + Math.random() * 2;
        } else {
          // 5% chance for high crash (5x - 10x)
          crashPoint = 5 + Math.random() * 5;
        }
        
        // Round to 2 decimal places
        crashPoint = Math.round(crashPoint * 100) / 100;
        
        // Create new round
        const { data: newRound, error: newRoundError } = await supabase
          .from('rounds')
          .insert({
            crash_multiplier: crashPoint,
            status: 'pending',
            started_at: startTime.toISOString()
          })
          .select()
          .single();
        
        if (newRoundError) {
          console.error("Error creating initial round:", newRoundError);
          throw new Error(`Error creating initial round: ${newRoundError.message}`);
        }
        
        console.log(`Created initial round ${newRound.id} with crash point ${crashPoint}`);
        
        return createResponse({
          status: 'created',
          round_id: newRound.id,
          start_time: newRound.started_at,
          countdown: 3 // Standard countdown time
        });
      }
    } else if (req.method === 'POST') {
      // Parse request body
      let reqBody;
      try {
        // Check if the body exists and is not empty
        const bodyText = await req.text();
        if (!bodyText || bodyText.trim() === '') {
          return createErrorResponse("Empty request body", 400);
        }
        reqBody = JSON.parse(bodyText);
        console.log("Received POST request:", JSON.stringify(reqBody));
      } catch (e) {
        console.error("Error parsing JSON request:", e);
        return createErrorResponse("Invalid JSON in request body", 400);
      }
      
      const { action, roundId } = reqBody;
      
      if (action === 'place_bet') {
        if (!userId) {
          return createErrorResponse('Authentication required', 401);
        }
        
        const { amount, autoCashoutAt } = reqBody;
        
        if (!amount || isNaN(amount) || amount <= 0) {
          return createErrorResponse('Invalid bet amount', 400);
        }
        
        // Check user balance
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();
          
        if (profileError || !profile) {
          console.error("Error retrieving user profile:", profileError);
          return createErrorResponse('Failed to retrieve user profile', 400);
        }
        
        if (profile.balance < amount) {
          return createErrorResponse('Insufficient balance', 400);
        }
        
        // Check if round is still in pending status
        const { data: round, error: roundError } = await supabase
          .from('rounds')
          .select('status')
          .eq('id', roundId)
          .single();
          
        if (roundError || !round) {
          console.error("Error retrieving round:", roundError);
          return createErrorResponse('Invalid round', 400);
        }
        
        if (round.status !== 'pending') {
          return createErrorResponse('Round has already started', 400);
        }
        
        // Check if user already has a bet in this round
        const { data: existingBet, error: existingBetError } = await supabase
          .from('player_bets')
          .select('id')
          .eq('user_id', userId)
          .eq('round_id', roundId)
          .maybeSingle();

        if (existingBet) {
          return createErrorResponse('You already have a bet in this round', 400);
        }
        
        // Deduct balance
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: profile.balance - amount })
          .eq('id', userId);
          
        if (balanceError) {
          console.error("Error updating balance:", balanceError);
          return createErrorResponse('Failed to update balance', 500);
        }
        
        // Place bet
        const { data: bet, error: betError } = await supabase
          .from('player_bets')
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
          console.error("Error placing bet:", betError);
          
          // Rollback balance change
          await supabase
            .from('profiles')
            .update({ balance: profile.balance })
            .eq('id', userId);
            
          return createErrorResponse('Failed to place bet', 500);
        }
        
        console.log(`User ${userId} placed ${amount} bet on round ${roundId}`);
        
        return createResponse({
          success: true,
          bet: bet
        });
        
      } else if (action === 'cashout') {
        if (!userId) {
          return createErrorResponse('Authentication required', 401);
        }
        
        const { multiplier } = reqBody;
        
        if (!multiplier || isNaN(multiplier) || multiplier < 1.0) {
          return createErrorResponse('Invalid multiplier', 400);
        }
        
        // Check if round is still running
        const { data: round, error: roundError } = await supabase
          .from('rounds')
          .select('status, crash_multiplier')
          .eq('id', roundId)
          .single();
          
        if (roundError || !round) {
          console.error("Error retrieving round for cashout:", roundError);
          return createErrorResponse('Invalid round', 400);
        }
        
        if (round.status !== 'running') {
          return createErrorResponse('Round is not running', 400);
        }
        
        // Ensure multiplier is valid (not beyond crash point)
        if (multiplier > round.crash_multiplier) {
          return createErrorResponse('Invalid cashout: round already crashed', 400);
        }
        
        // Find user's active bet for this round
        const { data: bet, error: betError } = await supabase
          .from('player_bets')
          .select('id, bet_amount, status, cashed_out_multiplier')
          .eq('user_id', userId)
          .eq('round_id', roundId)
          .eq('status', 'active')
          .maybeSingle();
          
        if (betError) {
          console.error("Error retrieving bet for cashout:", betError);
          return createErrorResponse('Error retrieving bet', 400);
        }
        
        if (!bet) {
          return createErrorResponse('No active bet found for this round', 400);
        }
        
        if (bet.cashed_out_multiplier !== null) {
          return createErrorResponse('You have already cashed out this bet', 400);
        }
        
        // Calculate winnings
        const winnings = bet.bet_amount * multiplier;
        
        // Update bet with cashout multiplier
        const { error: cashoutError } = await supabase
          .from('player_bets')
          .update({
            cashed_out_multiplier: multiplier,
            status: 'won'
          })
          .eq('id', bet.id);
          
        if (cashoutError) {
          console.error("Error updating bet on cashout:", cashoutError);
          return createErrorResponse('Failed to process cashout', 500);
        }
        
        // Add winnings to user balance
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            balance: supabase.rpc('get_new_balance', { 
              user_id: userId, 
              amount_to_add: winnings 
            })
          })
          .eq('id', userId);
          
        if (profileError) {
          console.error("Error updating profile on cashout:", profileError);
          return createErrorResponse('Failed to update balance', 500);
        }
        
        console.log(`User ${userId} cashed out at ${multiplier}x for ${winnings}`);
        
        return createResponse({
          success: true,
          cashout_multiplier: multiplier,
          winnings: winnings
        });
      } else {
        return createErrorResponse('Invalid action', 400);
      }
    }
    
    return createErrorResponse('Invalid request method', 400);
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return createErrorResponse(error.message || 'Internal server error', 500);
  }
});
