
import { useEffect, useState, useRef, useCallback } from 'react';
import { GAME_STATE } from './game/types';
import { useGameState } from './game/useGameState';
import { usePlayerActions } from './game/usePlayerActions';
import { useGameHistory } from './game/useGameHistory';
import { useRoundManager } from './game/useRoundManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export { GAME_STATE } from './game/types';
export type { HistoryItem, Player } from './game/types';

export const useCrashGame = (initialBalance: number = 1000) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Game loop refs
  const gameLoopActiveRef = useRef<boolean>(false);
  
  // Get game state logic
  const {
    gameState,
    countdownTimer,
    crashPoint,
    currentMultiplier,
    isRoundActive,
    gameStateRef,
    isCountdownActiveRef,
    setGameState,
    setCountdownTimer,
    setCrashPoint,
    setCurrentMultiplier,
    setIsRoundActive,
    startCountdown,
    startPlaying,
    handleCrash: handleCrashState,
    resetRound
  } = useGameState();

  // Get round manager
  const {
    currentRoundId,
    isUsingServerCrashPoints,
    startNewRound,
    completeRound
  } = useRoundManager(setCrashPoint, startCountdown);

  // Get game history logic
  const {
    gameHistory,
    players,
    setPlayers,
    updateGameHistory,
    resetPlayers,
    fetchGameHistory
  } = useGameHistory();

  // Get player actions
  const {
    userBalance,
    playerBet,
    playerAutoCashout,
    playerWin,
    isBetPlaced,
    handlePlaceBet,
    handleCashout,
    setPlayerBet,
    setPlayerAutoCashout,
    setPlayerWin,
    setIsBetPlaced,
    setUserBalance
  } = usePlayerActions({
    gameState,
    currentMultiplier,
    setPlayers,
    startCountdown
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      // If authenticated, fetch user balance from profiles
      if (data.session) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData && !error) {
          setUserBalance(profileData.balance || initialBalance);
        }
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      setIsAuthenticated(event !== 'SIGNED_OUT');
      checkAuth();
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initialBalance, setUserBalance]);

  // Fetch game history on component mount
  useEffect(() => {
    console.log("Fetching initial game history");
    fetchGameHistory();
    
    // Subscribe to changes in rounds table
    const roundsChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rounds',
      }, () => {
        console.log("New round detected in database, refreshing history");
        fetchGameHistory();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(roundsChannel);
    };
  }, [fetchGameHistory]);

  // Handle crash with history update and database update
  const handleCrash = useCallback(async (value: number) => {
    console.log(`🔴 Game crashed at ${value.toFixed(2)}x (isRoundActive: ${isRoundActive})`);
    
    if (!isRoundActive) {
      console.log("Ignoring crash - round not active");
      return; // Prevent multiple crash handlers
    }
    
    // Update game state
    handleCrashState(value);
    
    // Update history
    updateGameHistory(value);
    
    // Update round in database
    await completeRound(value);
    
    // Update player bets that didn't cash out as lost
    if (isBetPlaced && playerWin === null && isAuthenticated && currentRoundId && isUsingServerCrashPoints) {
      try {
        const { error: betError } = await supabase
          .from('player_bets')
          .update({ status: 'lost' })
          .eq('round_id', currentRoundId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .is('cashed_out_multiplier', null);
          
        if (betError) {
          console.error('Error updating bet on crash:', betError);
        }
      } catch (err) {
        console.error('Error processing bet on crash:', err);
      }
    }
  }, [completeRound, currentRoundId, handleCrashState, isAuthenticated, isBetPlaced, isRoundActive, isUsingServerCrashPoints, playerWin, updateGameHistory]);

  // Modified place bet function to record in database
  const handlePlaceBetWithDB = useCallback(async (amount: number, autoCashout: number | null) => {
    console.log(`Placing bet: $${amount}, auto-cashout: ${autoCashout || 'none'}`);
    
    // If not authenticated, show a toast
    if (!isAuthenticated) {
      toast.error("Please sign in to place bets", { position: 'top-center' });
      return;
    }
    
    // Only allow bets during countdown or waiting
    if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.WAITING) {
      toast.error("You can only place bets before the round starts", { position: 'top-center' });
      return;
    }
    
    // Place bet in local state
    handlePlaceBet(amount, autoCashout);
    
    // Record the bet in database if we have a current round
    if (currentRoundId && isUsingServerCrashPoints) {
      try {
        const { error } = await supabase
          .from('player_bets')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            round_id: currentRoundId,
            bet_amount: amount,
            status: 'active'
          });
          
        if (error) {
          console.error('Error recording bet in database:', error);
        }
      } catch (err) {
        console.error('Error processing bet:', err);
      }
    }
    
    // If we're in WAITING state, start a new round
    if (gameState === GAME_STATE.WAITING) {
      console.log("Bet placed in WAITING state, starting new round");
      startNewRound();
    }
  }, [currentRoundId, gameState, handlePlaceBet, isAuthenticated, isUsingServerCrashPoints, startNewRound]);

  // Modified cash out function to record in database
  const handleCashoutWithDB = useCallback(async () => {
    console.log(`Attempting cashout at ${currentMultiplier.toFixed(2)}x multiplier`);
    
    // Only allow cashout during PLAYING state
    if (gameState !== GAME_STATE.PLAYING) {
      console.log(`Cannot cashout in ${gameState} state`);
      return;
    }
    
    // Handle cashout in local state
    handleCashout();
    
    // Record the cashout in database if we have a current round
    if (currentRoundId && isUsingServerCrashPoints && isAuthenticated) {
      try {
        const { error } = await supabase
          .from('player_bets')
          .update({ 
            cashed_out_multiplier: currentMultiplier,
            status: 'won'
          })
          .eq('round_id', currentRoundId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .is('cashed_out_multiplier', null);
          
        if (error) {
          console.error('Error recording cashout in database:', error);
        }
        
        // Update user balance in profiles table
        if (playerBet !== null) {
          const winnings = playerBet * currentMultiplier;
          
          try {
            // Use functions.invoke for the edge function
            const { error: balanceError } = await supabase.functions.invoke(
              'update_user_balance', 
              { 
                body: { 
                  delta_amount: winnings,
                  user_id: (await supabase.auth.getUser()).data.user?.id
                }
              }
            );
            
            if (balanceError) {
              console.error('Error updating balance:', balanceError);
            }
          } catch (err) {
            console.error('Error processing winnings:', err);
          }
        }
      } catch (err) {
        console.error('Error recording cashout:', err);
      }
    }
  }, [currentMultiplier, currentRoundId, gameState, handleCashout, isAuthenticated, isUsingServerCrashPoints, playerBet]);

  // Auto-cashout logic
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING && 
        playerAutoCashout !== null && 
        currentMultiplier >= playerAutoCashout && 
        playerWin === null) {
      console.log(`Auto-cashout triggered at ${currentMultiplier.toFixed(2)}x (target: ${playerAutoCashout}x)`);
      handleCashoutWithDB();
    }
  }, [currentMultiplier, gameState, handleCashoutWithDB, playerAutoCashout, playerWin]);

  // Main game loop effect
  useEffect(() => {
    // Prevent multiple instances of the game loop
    if (gameLoopActiveRef.current) {
      return;
    }
    
    gameLoopActiveRef.current = true;
    console.log(`Game loop running: state=${gameState}, timer=${countdownTimer}, isRoundActive=${isRoundActive}`);
    
    // Process the countdown
    if (countdownTimer !== null && countdownTimer > 0) {
      const timer = setTimeout(() => {
        setCountdownTimer(prevTimer => {
          if (prevTimer === null) return null;
          
          const newValue = parseFloat((prevTimer - 0.1).toFixed(1));
          console.log(`Countdown: ${newValue.toFixed(1)}`);
          
          // When countdown reaches zero, start the game
          if (newValue <= 0 && gameStateRef.current === GAME_STATE.COUNTDOWN) {
            console.log("Countdown reached zero, starting game");
            startPlaying();
            return null;
          }
          
          // When cooldown after crash reaches zero, reset for new round
          if (newValue <= 0 && gameStateRef.current === GAME_STATE.CRASHED) {
            console.log("Post-crash cooldown complete, resetting for new round");
            // Reset game state for next round
            resetRound();
            
            // Reset player state
            setPlayerBet(null);
            setPlayerAutoCashout(null);
            setPlayerWin(null);
            setIsBetPlaced(false);
            resetPlayers();
            
            // Start a new round
            setTimeout(() => {
              startNewRound();
            }, 100);
            
            return null;
          }
          
          return Math.max(0, newValue);
        });
      }, 100); // Update every 100ms for smooth countdown
      
      return () => {
        clearTimeout(timer);
        gameLoopActiveRef.current = false;
      };
    } else {
      gameLoopActiveRef.current = false;
    }
  }, [countdownTimer, gameState, gameStateRef, isRoundActive, resetPlayers, resetRound, setIsBetPlaced, setPlayerAutoCashout, setPlayerBet, setPlayerWin, startNewRound, startPlaying]);

  // Auto-start the first round on mount
  useEffect(() => {
    if (gameState === GAME_STATE.WAITING && !isCountdownActiveRef.current) {
      console.log("Game in WAITING state, starting first round");
      startNewRound();
    }
  }, [gameState, isCountdownActiveRef, startNewRound]);

  return {
    userBalance,
    gameState,
    countdownTimer,
    crashPoint,
    currentMultiplier,
    playerWin,
    isBetPlaced,
    gameHistory,
    players,
    isAuthenticated,
    isRoundActive,
    handlePlaceBet: handlePlaceBetWithDB,
    handleCashout: handleCashoutWithDB,
    handleCrash,
    setCurrentMultiplier,
  };
};
