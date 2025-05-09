
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to calculate multiplier based on start time
const calculateMultiplier = (startTime: string): number => {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const elapsedMs = now - start;
  
  // Only calculate if we've passed the start time
  if (elapsedMs <= 0) return 1.0;
  
  // Using the formula: multiplier = 1.002^(elapsed milliseconds)
  const multiplier = Math.pow(1.002, elapsedMs / 1000);
  return parseFloat(multiplier.toFixed(2));
};

// Function to process active rounds
const processActiveRounds = async (supabase: any) => {
  // Get active rounds
  const { data: activeRounds, error: fetchError } = await supabase
    .from('crash_rounds')
    .select('*')
    .eq('status', 'running');
    
  if (fetchError) {
    console.error('Error fetching active rounds:', fetchError);
    return { success: false, error: fetchError };
  }
  
  if (!activeRounds || activeRounds.length === 0) {
    // No active rounds, check if we need to start a waiting round
    const { data: waitingRounds } = await supabase
      .from('crash_rounds')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(1);
      
    if (waitingRounds && waitingRounds.length > 0) {
      const waitingRound = waitingRounds[0];
      const now = new Date();
      const startTime = new Date(waitingRound.start_time);
      
      if (now >= startTime) {
        // Time to start this round
        const { error: updateError } = await supabase
          .from('crash_rounds')
          .update({ status: 'running' })
          .eq('id', waitingRound.id);
          
        if (updateError) {
          console.error('Error updating round status:', updateError);
          return { success: false, error: updateError };
        }
        
        console.log(`Round ${waitingRound.id} started at ${startTime}`);
        return { success: true, action: 'started_round', round: waitingRound };
      }
      
      return { success: true, action: 'waiting_for_start', time_left: (startTime.getTime() - now.getTime()) / 1000 };
    }
    
    // No waiting rounds either, create a new one
    const { data: newRound, error: createError } = await supabase
      .rpc('create_new_crash_round');
      
    if (createError) {
      console.error('Error creating new round:', createError);
      return { success: false, error: createError };
    }
    
    return { success: true, action: 'created_round', round_id: newRound };
  }
  
  // Process each active round
  const results = await Promise.all(activeRounds.map(async (round) => {
    const currentMultiplier = calculateMultiplier(round.start_time);
    
    // Check if we've reached the crash point
    if (currentMultiplier >= round.crash_multiplier) {
      // Crash the round
      const { error: crashError } = await supabase
        .rpc('update_round_status', { 
          round_id: round.id, 
          new_status: 'crashed' 
        });
        
      if (crashError) {
        console.error(`Error crashing round ${round.id}:`, crashError);
        return { id: round.id, action: 'error', error: crashError };
      }
      
      // Mark all uncashed bets as losses
      const { error: betError } = await supabase
        .from('user_bets')
        .update({ cashout_multiplier: null })
        .eq('round_id', round.id)
        .is('cashout_multiplier', null);
        
      if (betError) {
        console.error(`Error updating bets for round ${round.id}:`, betError);
      }
      
      // Create a new round to start in 3 seconds
      const { data: newRound, error: createError } = await supabase
        .rpc('create_new_crash_round');
        
      if (createError) {
        console.error('Error creating next round:', createError);
      }
      
      return { 
        id: round.id, 
        action: 'crashed', 
        crash_point: round.crash_multiplier,
        next_round: newRound 
      };
    }
    
    return { 
      id: round.id, 
      action: 'running', 
      current_multiplier: currentMultiplier,
      crash_point: round.crash_multiplier
    };
  }));
  
  return { success: true, rounds: results };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (req.method === 'GET') {
      // Process active rounds
      const result = await processActiveRounds(supabase);
      
      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    // Parse the request body for POST requests
    const { action, roundId, multiplier, amount } = await req.json();
    
    if (action === 'cashout') {
      // Handle cashout request
      const client = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { 
          global: { 
            headers: { Authorization: req.headers.get('Authorization')! }
          } 
        }
      );
      
      // Get the user from the token
      const {
        data: { user },
      } = await client.auth.getUser();
      
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Not authenticated' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
          }
        );
      }
      
      // Call the cashout function
      const { data, error } = await supabase
        .rpc('cash_out_bet', { 
          p_round_id: roundId, 
          p_user_id: user.id,
          p_multiplier: multiplier 
        });
        
      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, result: data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else if (action === 'place_bet') {
      // Handle place bet request
      const client = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { 
          global: { 
            headers: { Authorization: req.headers.get('Authorization')! }
          } 
        }
      );
      
      // Get the user from the token
      const {
        data: { user },
      } = await client.auth.getUser();
      
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Not authenticated' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
          }
        );
      }
      
      // Call the place bet function
      const { data, error } = await supabase
        .rpc('place_bet', { 
          p_round_id: roundId, 
          p_amount: amount 
        });
        
      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, result: data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
