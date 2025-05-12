import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GAME_STATE } from './types';

interface UseBetManagerProps {
  gameState: GAME_STATE;
  currentRoundId: string | null;
  currentMultiplier: number;
}

export const useBetManager = ({ 
  gameState, 
  currentRoundId, 
  currentMultiplier 
}: UseBetManagerProps) => {
  const [userBalance, setUserBalance] = useState<number>(1000);
  const [playerBet, setPlayerBet] = useState<number | null>(null);
  const [playerAutoCashout, setPlayerAutoCashout] = useState<number | null>(null);
  const [playerWin, setPlayerWin] = useState<number | null>(null);
  const [isBetPlaced, setIsBetPlaced] = useState<boolean>(false);
  const [isProcessingBet, setIsProcessingBet] = useState<boolean>(false);
  const [isProcessingCashout, setIsProcessingCashout] = useState<boolean>(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status on mount
  useState(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      // If authenticated, fetch user balance
      if (data.session) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', data.session.user.id)
            .single();
          
          if (profileError) throw profileError;
          if (profileData) {
            setUserBalance(profileData.balance || 1000);
          }
        } catch (err) {
          console.error("Error fetching user balance:", err);
        }
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(event !== 'SIGNED_OUT');
      checkAuth();
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Place bet function
  const handlePlaceBet = useCallback(async (amount: number, autoCashout: number | null = null) => {
    console.log(`Attempting to place bet: $${amount}, auto-cashout: ${autoCashout || 'none'}`);
    setBetError(null);
    
    // Validation checks
    if (!isAuthenticated) {
      toast.error("Please sign in to place bets", { position: 'top-center' });
      setBetError("Authentication required");
      return false;
    }
    
    if (!currentRoundId) {
      toast.error("No active round", { position: 'top-center' });
      setBetError("No active round");
      return false;
    }
    
    if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.WAITING) {
      toast.error("You can only place bets before the round starts", { position: 'top-center' });
      setBetError("Betting window closed");
      return false;
    }
    
    if (amount <= 0) {
      toast.error("Bet amount must be greater than zero", { position: 'top-center' });
      setBetError("Invalid bet amount");
      return false;
    }
    
    if (amount > userBalance) {
      toast.error("Insufficient balance for this bet", { position: 'top-center' });
      setBetError("Insufficient balance");
      return false;
    }
    
    if (isBetPlaced) {
      toast.error("You already have a bet for this round", { position: 'top-center' });
      setBetError("Bet already placed");
      return false;
    }
    
    setIsProcessingBet(true);
    
    try {
      // Get user ID
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Authentication error");
      }
      
      const userId = userData.user.id;
      
      // 1. Get current balance to verify
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (profileError) throw new Error("Failed to verify balance");
      
      if (profileData.balance < amount) {
        throw new Error("Insufficient balance");
      }
      
      // 2. Deduct balance immediately (requirement #2)
      const newBalance = profileData.balance - amount;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
      
      if (balanceError) throw new Error("Failed to update balance");
      
      // 3. Store the bet in database
      const { error: betError } = await supabase
        .from('player_bets')
        .insert({
          user_id: userId,
          round_id: currentRoundId,
          bet_amount: amount,
          status: 'active'
        });
      
      if (betError) {
        // Rollback balance change if bet insertion failed
        await supabase
          .from('profiles')
          .update({ balance: profileData.balance })
          .eq('id', userId);
        
        throw new Error("Failed to place bet");
      }
      
      // 4. Update local state
      setUserBalance(newBalance);
      setPlayerBet(amount);
      setPlayerAutoCashout(autoCashout);
      setIsBetPlaced(true);
      setPlayerWin(null);
      
      toast.success(`Bet placed: $${amount.toFixed(2)}`, { position: 'top-center' });
      return true;
    } catch (error: any) {
      console.error("Bet placement error:", error);
      setBetError(error.message || "Failed to place bet");
      toast.error(error.message || "Failed to place bet", { position: 'top-center' });
      return false;
    } finally {
      setIsProcessingBet(false);
    }
  }, [currentRoundId, gameState, isAuthenticated, isBetPlaced, userBalance]);

  // Cashout function
  const handleCashout = useCallback(async () => {
    console.log(`Attempting to cash out at ${currentMultiplier.toFixed(2)}x`);
    
    // Validation checks
    if (!isAuthenticated) {
      toast.error("Please sign in to cash out", { position: 'top-center' });
      return false;
    }
    
    if (gameState !== GAME_STATE.PLAYING) {
      toast.error("Round is not active", { position: 'top-center' });
      return false;
    }
    
    if (!isBetPlaced || playerBet === null) {
      toast.error("No active bet to cash out", { position: 'top-center' });
      return false;
    }
    
    if (playerWin !== null) {
      toast.error("Already cashed out", { position: 'top-center' });
      return false;
    }
    
    if (!currentRoundId) {
      toast.error("No active round", { position: 'top-center' });
      return false;
    }
    
    setIsProcessingCashout(true);
    
    try {
      // Get user ID
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Authentication error");
      }
      
      const userId = userData.user.id;
      
      // 1. Update bet with cashout multiplier
      const { error: updateError } = await supabase
        .from('player_bets')
        .update({
          cashed_out_multiplier: currentMultiplier,
          status: 'won'
        })
        .eq('round_id', currentRoundId)
        .eq('user_id', userId)
        .is('cashed_out_multiplier', null);
      
      if (updateError) throw new Error("Failed to update bet");
      
      // 2. Calculate winnings
      const winnings = playerBet * currentMultiplier;
      const profit = winnings - playerBet;
      
      // 3. Update user balance
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (profileError) throw new Error("Failed to fetch balance");
      
      const newBalance = profileData.balance + winnings;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
      
      if (balanceError) throw new Error("Failed to update balance");
      
      // 4. Update local state
      setUserBalance(newBalance);
      setPlayerWin(currentMultiplier);
      
      toast.success(
        `Cashed out at ${currentMultiplier.toFixed(2)}x! Won $${profit.toFixed(2)}`, 
        { position: 'top-center' }
      );
      return true;
    } catch (error: any) {
      console.error("Cashout error:", error);
      toast.error(error.message || "Failed to cash out", { position: 'top-center' });
      return false;
    } finally {
      setIsProcessingCashout(false);
    }
  }, [currentMultiplier, currentRoundId, gameState, isAuthenticated, isBetPlaced, playerBet, playerWin]);

  // Auto-cashout logic
  const checkAutoCashout = useCallback(() => {
    if (gameState === GAME_STATE.PLAYING && 
        isBetPlaced && 
        playerAutoCashout !== null && 
        playerWin === null &&
        currentMultiplier >= playerAutoCashout) {
      console.log(`Auto-cashout triggered at ${currentMultiplier.toFixed(2)}x`);
      handleCashout();
    }
  }, [gameState, isBetPlaced, playerAutoCashout, playerWin, currentMultiplier, handleCashout]);

  return {
    userBalance,
    playerBet,
    playerAutoCashout,
    playerWin,
    isBetPlaced,
    isProcessingBet,
    isProcessingCashout,
    betError,
    isAuthenticated,
    handlePlaceBet,
    handleCashout,
    checkAutoCashout,
    setUserBalance,
    setPlayerBet,
    setPlayerAutoCashout,
    setPlayerWin,
    setIsBetPlaced,
    setBetError
  };
};
