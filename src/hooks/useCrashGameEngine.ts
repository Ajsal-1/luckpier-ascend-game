
import { useEffect, useCallback, useRef } from 'react';
import { useCrashRoundManager } from './game/useCrashRoundManager';
import { useBetManager } from './game/useBetManager';
import { useGameHistoryManager } from './game/useGameHistoryManager';
import { useSmoothMultiplier } from './game/useSmoothMultiplier';
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
  
  // Get bet management functionality
  const {
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
  } = useBetManager({
    gameState,
    currentRoundId,
    currentMultiplier: 1.0 // Will be updated below
  });
  
  // Get game history functionality
  const {
    gameHistory,
    players,
    fetchGameHistory,
    fetchPlayers,
    updateGameHistory,
    resetPlayers,
    setPlayers
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
  
  // Handle auto-cashout
  useEffect(() => {
    checkAutoCashout();
  }, [currentMultiplier, checkAutoCashout]);
  
  // Fetch players when round changes
  useEffect(() => {
    if (currentRoundId) {
      fetchPlayers(currentRoundId);
    }
  }, [currentRoundId, fetchPlayers]);
  
  // Reset player state on round completion
  useEffect(() => {
    if (gameState === GAME_STATE.CRASHED) {
      if (isBetPlaced && playerWin === null) {
        // Player lost their bet - ensure UI reflects this immediately
        // Add a small delay to allow UI to show crash state
        console.log("Resetting player state after crash");
        const resetTimer = setTimeout(() => {
          setPlayerBet(null);
          setPlayerAutoCashout(null);
          setPlayerWin(null);
          setIsBetPlaced(false);
          setBetError(null);
          resetFailedRef.current = false;
        }, 1000);
        
        return () => clearTimeout(resetTimer);
      }
    }
  }, [gameState, isBetPlaced, playerWin, setPlayerBet, setPlayerAutoCashout, setPlayerWin, setIsBetPlaced, setBetError]);
  
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
  
  // Ensure game doesn't get stuck - emergency reset if state is inconsistent
  useEffect(() => {
    // If we have a bet placed but game is in WAITING or COUNTDOWN state for too long
    const emergencyResetTimer = setTimeout(() => {
      if (isBetPlaced && (gameState === GAME_STATE.WAITING || 
         (gameState === GAME_STATE.COUNTDOWN && countdownTimer && countdownTimer < 0.5)) && 
         !isProcessingBet && !isProcessingCashout && !resetFailedRef.current) {
        // Something is stuck - let's try an emergency reset of player state
        console.log("EMERGENCY RESET: Game appears stuck, resetting player state");
        resetFailedRef.current = true;
        setPlayerBet(null);
        setPlayerAutoCashout(null);
        setPlayerWin(null);
        setIsBetPlaced(false);
        setBetError(null);
      }
      
      // Also check for stuck PLAYING state without an active bet
      if (gameState === GAME_STATE.PLAYING && !isBetPlaced && !isProcessingBet && !isProcessingCashout) {
        // This is a weird state - the game is playing but the user doesn't have an active bet
        console.log("WARNING: Game is in PLAYING state but user doesn't have an active bet");
      }
      
      // If the game is in CRASHED state for too long, force reset
      if (gameState === GAME_STATE.CRASHED && countdownTimer !== null && countdownTimer < -5) {
        console.log("EMERGENCY RESET: Game stuck in CRASHED state, forcing reset");
        resetRound();
      }
      
    }, 10000); // Shortened to 10 seconds for faster detection
    
    return () => clearTimeout(emergencyResetTimer);
  }, [countdownTimer, gameState, isBetPlaced, isProcessingBet, isProcessingCashout, 
      setBetError, setIsBetPlaced, setPlayerAutoCashout, setPlayerBet, setPlayerWin, resetRound]);
  
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
        setBetError(null);
        
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
  }, [gameState, countdownTimer, isRoundActive, setBetError, setIsBetPlaced, 
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
    
    // Game data
    gameHistory,
    players,
    
    // Processing states
    isProcessingBet,
    isProcessingCashout,
    betError,
    isAuthenticated,
    
    // Actions
    handlePlaceBet,
    handleCashout,
    handleGameCrash,
    
    // Game control
    isRoundActive,
    hasCrashedRef
  };
};
