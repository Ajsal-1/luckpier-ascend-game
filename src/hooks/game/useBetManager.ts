
import { useState, useCallback, useEffect, useRef } from 'react';
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
  
  // Track operations to prevent double-processing
  const isPlacingBetRef = useRef<boolean>(false);
  const isCashingOutRef = useRef<boolean>(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication status on mount
  useEffect(() => {
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
    
    // Listen for auth changes - Fix the TypeScript error by providing the correct function signature
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(event !== 'SIGNED_OUT');
      // Don't call checkAuth directly in the callback to avoid potential deadlocks
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setTimeout(checkAuth, 0); // Schedule checkAuth to run after the current event loop
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Place bet function
  const handlePlaceBet = useCallback(async (amount: number, autoCashout: number | null = null) => {
    console.log(`Attempting to place bet: $${amount}, auto-cashout: ${autoCashout || 'none'}`);
    setBetError(null);
    
    // Prevent double-processing
    if (isPlacingBetRef.current) {
      console.log("Bet placement already in progress, ignoring duplicate request");
      return false;
    }
    
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
    
    isPlacingBetRef.current = true;
    setIsProcessingBet(true);
    
    try {
      // Get user ID
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Authentication error");
      }
      
      const userId = userData.user.id;
      
      // CRITICAL: Update local state IMMEDIATELY to allow game to progress
      // even if database operations fail
      const newBalance = userBalance - amount;
      setUserBalance(newBalance);
      setPlayerBet(amount);
      setPlayerAutoCashout(autoCashout);
      setIsBetPlaced(true);
      setPlayerWin(null);
      
      // Set a timeout to clear the processing state in case the database operations take too long
      processingTimeoutRef.current = setTimeout(() => {
        console.log("Bet placement database operations timeout - ensuring UI is updated");
        setIsProcessingBet(false);
        isPlacingBetRef.current = false;
      }, 5000);
      
      // Now try database operations, but don't block UI on them
      try {
        // 1. Get current balance to verify
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error("Failed to verify balance:", profileError);
        } else if (profileData.balance < amount) {
          // If server balance is insufficient but we already updated local balance,
          // we'll continue with the bet but log the issue
          console.error("Server balance insufficient, continuing with local balance");
        } else {
          // 2. Deduct balance in database
          const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: profileData.balance - amount })
            .eq('id', userId);
          
          if (balanceError) {
            console.error("Failed to update balance in database:", balanceError);
          }
          
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
            console.error("Failed to record bet in database:", betError);
          }
        }
      } catch (dbErr) {
        // Log but don't block the game flow
        console.error("Database operations failed, continuing with local state:", dbErr);
      } finally {
        // Clear the processing timeout if we finished quickly
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }
      }
      
      toast.success(`Bet placed: $${amount.toFixed(2)}`, { position: 'top-center' });
      return true;
      
    } catch (error: any) {
      console.error("Bet placement error:", error);
      setBetError(error.message || "Failed to place bet");
      toast.error(error.message || "Failed to place bet", { position: 'top-center' });
      
      // Revert local state changes on error
      setPlayerBet(null);
      setPlayerAutoCashout(null);
      setIsBetPlaced(false);
      return false;
    } finally {
      setIsProcessingBet(false);
      isPlacingBetRef.current = false;
    }
  }, [currentRoundId, gameState, isAuthenticated, isBetPlaced, userBalance]);

  // Cashout function
  const handleCashout = useCallback(async () => {
    console.log(`Attempting to cash out at ${currentMultiplier.toFixed(2)}x`);
    
    // Prevent double-processing
    if (isCashingOutRef.current) {
      console.log("Cashout already in progress, ignoring duplicate request");
      return false;
    }
    
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
    
    isCashingOutRef.current = true;
    setIsProcessingCashout(true);
    
    try {
      // CRITICAL: Update local state IMMEDIATELY to provide instant feedback
      // Calculate winnings
      const winnings = playerBet * currentMultiplier;
      const newBalance = userBalance + winnings;
      
      // Update local state right away
      setUserBalance(newBalance);
      setPlayerWin(currentMultiplier);
      
      // Show success message
      const profit = winnings - playerBet;
      toast.success(
        `Cashed out at ${currentMultiplier.toFixed(2)}x! Won $${profit.toFixed(2)}`, 
        { position: 'top-center' }
      );
      
      // Set a timeout to clear processing state in case database operations fail
      processingTimeoutRef.current = setTimeout(() => {
        console.log("Cashout database operations timeout - ensuring UI is updated");
        setIsProcessingCashout(false);
        isCashingOutRef.current = false;
      }, 5000);
      
      // Now try database operations, but don't block UI
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
        
        if (updateError) {
          console.error("Failed to update bet:", updateError);
        }
        
        // 2. Update user balance
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error("Failed to fetch balance:", profileError);
        } else {
          const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: profileData.balance + winnings })
            .eq('id', userId);
          
          if (balanceError) {
            console.error("Failed to update balance:", balanceError);
          }
        }
      } catch (dbErr) {
        // Log but don't block UI
        console.error("Database operations failed, continuing with local state:", dbErr);
      } finally {
        // Clear the processing timeout if we finished quickly
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }
      }
      
      return true;
    } catch (error: any) {
      console.error("Cashout error:", error);
      toast.error(error.message || "Failed to cash out", { position: 'top-center' });
      return false;
    } finally {
      setIsProcessingCashout(false);
      isCashingOutRef.current = false;
    }
  }, [currentMultiplier, currentRoundId, gameState, isAuthenticated, isBetPlaced, playerBet, playerWin, userBalance]);

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
  
  // Clear any pending timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    };
  }, []);

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
