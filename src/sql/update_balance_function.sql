
-- Function to safely update user balance
CREATE OR REPLACE FUNCTION public.update_user_balance(
  user_id UUID,
  delta_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.profiles
  WHERE id = user_id;
  
  -- Calculate new balance
  new_balance := COALESCE(current_balance, 0) + delta_amount;
  
  -- Update balance
  UPDATE public.profiles
  SET 
    balance = new_balance,
    updated_at = now()
  WHERE id = user_id;
  
  -- Return new balance
  RETURN new_balance;
END;
$$;

-- Allow access to this function
GRANT EXECUTE ON FUNCTION public.update_user_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_balance TO service_role;
