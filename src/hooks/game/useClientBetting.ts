
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GAME_STATE } from './types';
import { toast } from 'sonner';

/**
 * Hook that provides client-side betting functionality
 * This serves as a more reliable alternative to server-side betting
 */
export const useClientBetting = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Place a bet directly in the database without going through the edge function
   */
  const placeBet = useCallback(async (
    roundId: string, 
    amount: number, 
    autoCashout: number | null = null,
    gameState: GAME_STATE
  ) => {
    if (!roundId) {
      return { success: false, error: 'No active round found' };
    }

    // Allow bets during countdown or crashed states
    if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.CRASHED) {
      return { success: false, error: 'Betting is only allowed during betting periods' };
    }

    setIsProcessing(true);
    try {
      // Get user ID
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not found');
      }
      const userId = userData.user.id;
      
      // First check user's balance
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        throw new Error('Could not retrieve user balance');
      }

      if (profileData.balance < amount) {
        throw new Error('Insufficient balance');
      }
      
      // Update balance immediately for responsiveness
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: profileData.balance - amount })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error('Failed to update balance');
      }
      
      // Insert the bet
      const { error: betError } = await supabase
        .from('player_bets')
        .insert({
          user_id: userId,
          round_id: roundId,
          bet_amount: amount,
          auto_cashout_at: autoCashout,
          status: 'active'
        });
        
      if (betError) {
        // Rollback balance change if bet insertion fails
        await supabase
          .from('profiles')
          .update({ balance: profileData.balance })
          .eq('id', userId);
          
        throw new Error('Failed to place bet');
      }
      
      // Refresh user balance
      await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      return { 
        success: true, 
        betAmount: amount,
        autoCashout: autoCashout
      };
      
    } catch (error: any) {
      console.error('Client-side bet placement error:', error);
      return { success: false, error: error.message || 'Failed to place bet' };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Cash out a bet directly in the database without going through the edge function
   */
  const cashout = useCallback(async (
    roundId: string, 
    multiplier: number
  ) => {
    if (!roundId) {
      return { success: false, error: 'No active round found' };
    }

    setIsProcessing(true);
    try {
      // Get user ID
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not found');
      }
      const userId = userData.user.id;
      
      // Find the bet
      const { data: bet, error: betError } = await supabase
        .from('player_bets')
        .select('bet_amount')
        .eq('user_id', userId)
        .eq('round_id', roundId)
        .is('cashed_out_multiplier', null)
        .single();
      
      if (betError || !bet) {
        throw new Error('No active bet found');
      }
      
      // Update the bet with cashout multiplier
      const { error: updateError } = await supabase
        .from('player_bets')
        .update({ 
          cashed_out_multiplier: multiplier,
          status: 'won'
        })
        .eq('user_id', userId)
        .eq('round_id', roundId)
        .is('cashed_out_multiplier', null);
        
      if (updateError) {
        throw new Error('Failed to update bet status');
      }
      
      // Calculate winnings
      const winnings = bet.bet_amount * multiplier;
      
      // Get the new balance using the RPC function
      const { data: newBalance, error: balanceError } = await supabase.rpc(
        'get_new_balance', 
        { 
          user_id: userId, 
          amount_to_add: winnings 
        }
      );
      
      if (balanceError) {
        throw new Error('Failed to calculate new balance');
      }
      
      // Update user balance with the returned value
      const { error: updateBalanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
        
      if (updateBalanceError) {
        throw new Error('Failed to update balance');
      }
      
      return { 
        success: true,
        winnings: winnings,
        profit: winnings - bet.bet_amount,
        multiplier: multiplier
      };
      
    } catch (error: any) {
      console.error('Client-side cashout error:', error);
      return { success: false, error: error.message || 'Failed to cash out' };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    placeBet,
    cashout,
    isProcessing
  };
};
