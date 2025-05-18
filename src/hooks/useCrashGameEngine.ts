
import { useEffect, useCallback, useRef } from 'react';
import { useCrashRoundManager } from './game/useCrashRoundManager';
import { useBetManager } from './game/useBetManager';
import { useGameHistoryManager } from './game/useGameHistoryManager';
import { useSmoothMultiplier } from './game/useSmoothMultiplier';
import { usePlayerActions } from './game/usePlayerActions';
import { GAME_STATE } from './game/types';

export { GAME_STATE } from './game/types';

export const useCrashGameEngine = () => {
  // Get round management functionality
  const {
    gameState,
    countdownTimer,
    crashPoint,
    currentRoundId,
    isRoundActive,
    startNewRound,
    handleCrash,
    resetRound
  } = useCrashRoundManager();
  
  // Get player actions functionality
  const {
    userBalance,
    playerBet,
    playerAutoCashout,
    playerWin,
    isBetPlaced,
    handlePlaceBet,
    handleCashout,
    setUserBalance,
    setPlayerBet,
    setPlayerAutoCashout,
    setPlayerWin,
    setIsBetPlaced,
    resetPlayerState // Import the reset function from usePlayerActions
  } = usePlayerActions({
    gameState,
    currentMultiplier: 1.0, // Will be updated below
    setPlayers: () => {}, // Will be overridden below
    startCountdown: () => {} // Will be overridden below
  });
  
  // Get game history functionality
  const {
    gameHistory,
    players,
    fetchGameHistory,
    fetchPlayers,
    updateGameHistory,
    resetPlayers,
    setPlayers,
    updateFakePlayers // Get the new function for updating fake players
  } = useGameHistoryManager();
  
  // Use the multiplier animation hook
  const { currentMultiplier, hasCrashedRef } = useSmoothMultiplier({
    isPlaying: gameState === GAME_STATE.PLAYING,
    crashPoint,
    onCrash: handleCrash
  });
  
  // Reference to track if a round update is in progress
  const isUpdatingRoundRef = useRef<boolean>(false);
  const resetFailedRef = useRef<boolean>(false);
  const gameStateTransitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastGameStateRef = useRef<GAME_STATE>(gameState);
  const betErrorRef = useRef<string | null>(null);
  const isProcessingBetRef = useRef<boolean>(false);
  const isProcessingCashoutRef = useRef<boolean>(false);
  
  // Handle round crashes with history updates
  const handleGameCrash = useCallback((multiplier: number) => {
    // Prevent multiple crash handlers from firing
    if (isUpdatingRoundRef.current) return;
    isUpdatingRoundRef.current = true;
    
    try {
      console.log(`Game crashed at ${multiplier.toFixed(2)}x`);
      
      // Update game history
      updateGameHistory(multiplier);
      
      // Update player states for those who didn't cash out
      if (isBetPlaced && playerWin === null) {
        // Player lost their bet
        console.log("Player bet was active but not cashed out - marked as lost");
        setPlayerBet(null);
        setPlayerAutoCashout(null);
      }
    } finally {
      isUpdatingRoundRef.current = false;
    }
  }, [isBetPlaced, playerWin, updateGameHistory, setPlayerBet, setPlayerAutoCashout]);
  
  // Handle auto-cashout function - FIXED and improved to check more frequently
  const checkAutoCashout = useCallback((currentMultiplierValue: number) => {
    // If player has an auto-cashout set and we've reached or exceeded that value, cash out
    if (gameState === GAME_STATE.PLAYING && isBetPlaced && playerAutoCashout !== null && 
        currentMultiplierValue >= playerAutoCashout && playerWin === null) {
      console.log(`Auto-cashout triggered at ${currentMultiplierValue.toFixed(2)}x (target: ${playerAutoCashout}x)`);
      handleCashout();
    }
  }, [gameState, isBetPlaced, playerAutoCashout, playerWin, handleCashout]);
  
  // Handle auto-cashout - check EVERY time multiplier changes for more precision
  useEffect(() => {
    if (currentMultiplier > 1.0) {
      checkAutoCashout(currentMultiplier);
    }
  }, [currentMultiplier, checkAutoCashout]);
  
  // Fetch players when round changes
  useEffect(() => {
    if (currentRoundId) {
      fetchPlayers(currentRoundId);
    }
  }, [currentRoundId, fetchPlayers]);
  
  // CRITICAL FIX: Reset player state specifically when transitioning to WAITING state after CRASHED
  useEffect(() => {
    // Track game state transitions for reset timing
    if (gameState !== lastGameStateRef.current) {
      console.log(`Game state transition: ${lastGameStateRef.current} -> ${gameState}`);
      
      // If transitioning from CRASHED to WAITING, ensure complete player state reset
      if (lastGameStateRef.current === GAME_STATE.CRASHED && gameState === GAME_STATE.WAITING) {
        console.log("CRITICAL TRANSITION: Crashed → Waiting, performing full player state reset");
        // Force immediate reset without delay
        resetPlayerState();
      }
      
      lastGameStateRef.current = gameState;
    }
    
    // Original reset logic - keep this but it will be supplemented by the above transition-specific reset
    if (gameState === GAME_STATE.CRASHED) {
      if (isBetPlaced && playerWin === null) {
        // Player lost their bet - ensure UI reflects this immediately
        console.log("Resetting player state after crash (loss)");
        const resetTimer = setTimeout(() => {
          resetPlayerState();
          resetFailedRef.current = false;
        }, 1000);
        
        return () => clearTimeout(resetTimer);
      }
    }
    
    // This waiting state reset is still useful as a backup, but we now have more specific transition handling
    if (gameState === GAME_STATE.WAITING) {
      console.log("Game state is WAITING, resetting player state");
      const resetTimer = setTimeout(() => {
        resetPlayerState();
        resetFailedRef.current = false;
      }, 500);
      
      return () => clearTimeout(resetTimer);
    }
  }, [gameState, isBetPlaced, playerWin, resetPlayerState]);
  
  // When round ends, reset players for next round
  useEffect(() => {
    if (gameState === GAME_STATE.WAITING) {
      console.log("Game state is WAITING, resetting players");
      resetPlayers();
    }
  }, [gameState, resetPlayers]);
  
  // Detect game state transition and clear any stuck timers
  useEffect(() => {
    if (gameState !== lastGameStateRef.current) {
      console.log(`Game state transition: ${lastGameStateRef.current} -> ${gameState}`);
      lastGameStateRef.current = gameState;
      
      // Clear any pending timers on state transition
      if (gameStateTransitionTimerRef.current) {
        clearTimeout(gameStateTransitionTimerRef.current);
        gameStateTransitionTimerRef.current = null;
      }
    }
  }, [gameState]);
  
  // Update fake players when multiplier changes during PLAYING state
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING && updateFakePlayers) {
      // Throttle updates to avoid too many renders
      const throttleUpdateInterval = setTimeout(() => {
        updateFakePlayers(currentMultiplier, crashPoint);
      }, 200); // Update every 200ms for better performance
      
      return () => clearTimeout(throttleUpdateInterval);
    }
  }, [gameState, currentMultiplier, crashPoint, updateFakePlayers]);
  
  // Ensure game doesn't get stuck - emergency reset if state is inconsistent
  useEffect(() => {
    // If we have a bet placed but game is in WAITING or COUNTDOWN state for too long
    const emergencyResetTimer = setTimeout(() => {
      if (isBetPlaced && (gameState === GAME_STATE.WAITING || 
         (gameState === GAME_STATE.COUNTDOWN && countdownTimer && countdownTimer < 0.5)) && 
         !isProcessingBetRef.current && !isProcessingCashoutRef.current && !resetFailedRef.current) {
        // Something is stuck - let's try an emergency reset of player state
        console.log("EMERGENCY RESET: Game appears stuck, resetting player state");
        resetFailedRef.current = true;
        setPlayerBet(null);
        setPlayerAutoCashout(null);
        setPlayerWin(null);
        setIsBetPlaced(false);
        betErrorRef.current = null;
      }
      
      // Also check for stuck PLAYING state without an active bet
      if (gameState === GAME_STATE.PLAYING && !isBetPlaced && !isProcessingBetRef.current && !isProcessingCashoutRef.current) {
        // This is a weird state - the game is playing but the user doesn't have an active bet
        console.warn("WARNING: Game is in PLAYING state but user doesn't have an active bet");
      }
      
      // If the game is in CRASHED state for too long, force reset
      if (gameState === GAME_STATE.CRASHED && countdownTimer !== null && countdownTimer < -5) {
        console.log("EMERGENCY RESET: Game stuck in CRASHED state, forcing reset");
        resetRound();
      }
      
    }, 10000); // Shortened to 10 seconds for faster detection
    
    return () => clearTimeout(emergencyResetTimer);
  }, [countdownTimer, gameState, isBetPlaced, resetFailedRef, setIsBetPlaced, setPlayerAutoCashout, setPlayerBet, setPlayerWin, resetRound]);
  
  // Additional emergency reset for edge cases - completely reset game flow if needed
  useEffect(() => {
    const completeGameStateCheckTimer = setTimeout(() => {
      // If we're in a weird combination of states, try to force a complete reset
      if ((gameState === GAME_STATE.PLAYING && !isRoundActive) || 
          (gameState === GAME_STATE.COUNTDOWN && countdownTimer && countdownTimer < -2)) {
            
        console.log("CRITICAL GAME STATE INCONSISTENCY DETECTED - FORCING FULL RESET");
        
        // Reset player bet state
        setPlayerBet(null);
        setPlayerAutoCashout(null);
        setPlayerWin(null);
        setIsBetPlaced(false);
        betErrorRef.current = null;
        
        // Reset game state
        resetRound();
        
        // Force start a new round after a small delay
        setTimeout(() => {
          console.log("Forcing start of new round after emergency reset");
          startNewRound();
        }, 1000);
      }
    }, 15000); // Check every 15 seconds
    
    return () => clearTimeout(completeGameStateCheckTimer);
  }, [gameState, countdownTimer, isRoundActive, betErrorRef, setIsBetPlaced, 
      setPlayerAutoCashout, setPlayerBet, setPlayerWin, resetRound, startNewRound]);
  
  return {
    // Game state
    gameState,
    countdownTimer,
    crashPoint,
    currentMultiplier,
    
    // Player state
    userBalance,
    playerBet,
    playerWin,
    isBetPlaced,
    playerAutoCashout, // Export autoCashout value so UI can display it
    
    // Game data
    gameHistory,
    players,
    
    // Processing states
    isProcessingBet: isProcessingBetRef.current,
    isProcessingCashout: isProcessingCashoutRef.current,
    betError: betErrorRef.current,
    isAuthenticated: true, // Simplified for this example
    
    // Actions
    handlePlaceBet,
    handleCashout,
    handleGameCrash,
    resetPlayerState, // Export reset function for use in other components
    updateFakePlayers, // Export the fake player update function
    
    // Game control
    isRoundActive,
    hasCrashedRef
  };
};
