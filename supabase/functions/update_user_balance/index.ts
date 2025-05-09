
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context of the logged-in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Get the JWT token from the request
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "No authorization token provided" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Extract the request body
    const { delta_amount, user_id } = await req.json();
    
    if (typeof delta_amount !== 'number') {
      return new Response(
        JSON.stringify({ error: "delta_amount must be a number" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get the user from the JWT to verify they're updating their own balance
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if the authenticated user matches the user_id param
    if (user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: "Cannot update another user's balance" }),
        { 
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Updating balance for user ${user_id} by ${delta_amount}`);

    // Get current balance
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('balance')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Error fetching user profile" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const currentBalance = profileData.balance || 0;
    const newBalance = currentBalance + delta_amount;

    // Update the user's balance
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update balance" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Record the transaction
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id,
        amount: delta_amount,
        type: delta_amount > 0 ? 'win' : 'bet',
        status: 'completed'
      });

    if (transactionError) {
      console.error("Error recording transaction:", transactionError);
      // Don't fail the whole operation if just the transaction recording fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        new_balance: newBalance,
        message: `Balance updated successfully to ${newBalance}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
