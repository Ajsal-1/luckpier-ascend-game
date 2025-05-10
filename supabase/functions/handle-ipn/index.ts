
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const IPN_KEY = Deno.env.get('IPN_KEY') || '';
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const body = await req.json();
    console.log("Received IPN payload:", JSON.stringify(body, null, 2));
    
    // Verify IPN key
    if (body.ipn_key !== IPN_KEY) {
      console.error("Invalid IPN key");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const amount = parseFloat(body.amount);
    const pay_status = body.payment_status;
    
    // Only process confirmed payments
    if (pay_status !== "confirmed") {
      console.log(`Payment not confirmed. Status: ${pay_status}`);
      return new Response(
        JSON.stringify({ message: "Payment not confirmed" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Find matching deposit
    const { data: deposits, error: fetchError } = await supabase
      .from("pending_deposits")
      .select("*")
      .eq("amount", amount)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);
      
    if (fetchError) {
      console.error("Error fetching deposits:", fetchError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!deposits || deposits.length === 0) {
      console.error("No matching deposit found");
      return new Response(
        JSON.stringify({ error: "No matching deposit found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const deposit = deposits[0];
    console.log("Found matching deposit:", deposit);
    
    // Update user balance
    const { error: balanceError } = await supabase
      .rpc("update_user_balance", {
        user_id: deposit.user_id,
        delta_amount: amount
      });
      
    if (balanceError) {
      console.error("Error updating balance:", balanceError);
      return new Response(
        JSON.stringify({ error: "Failed to update balance" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create transaction record
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: deposit.user_id,
        amount: amount,
        type: "deposit",
        status: "completed"
      });
      
    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      // Continue despite error, balance was already updated
    }
    
    // Update deposit status
    const { error: updateError } = await supabase
      .from("pending_deposits")
      .update({ status: "confirmed" })
      .eq("id", deposit.id);
      
    if (updateError) {
      console.error("Error updating deposit status:", updateError);
      // Continue despite error, balance was already updated
    }
    
    console.log("Deposit confirmed successfully");
    return new Response(
      JSON.stringify({ message: "Deposit confirmed" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
