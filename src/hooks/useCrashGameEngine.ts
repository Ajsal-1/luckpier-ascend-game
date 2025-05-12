
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
        // Player lost their bet
        setTimeout(() => {
          setPlayerBet(null);
          setPlayerAutoCashout(null);
          setPlayerWin(null);
          setIsBetPlaced(false);
          setBetError(null);
        }, 1000); // Small delay to allow UI to show crash state
      }
    }
  }, [gameState, isBetPlaced, playerWin, setPlayerBet, setPlayerAutoCashout, setPlayerWin, setIsBetPlaced, setBetError]);
  
  // When round ends, reset players for next round
  useEffect(() => {
    if (gameState === GAME_STATE.WAITING) {
      resetPlayers();
    }
  }, [gameState, resetPlayers]);
  
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
