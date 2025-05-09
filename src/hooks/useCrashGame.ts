
import { useEffect } from 'react';
import { GAME_STATE } from './game/types';
import { useGameState } from './game/useGameState';
import { usePlayerActions } from './game/usePlayerActions';
import { useGameHistory } from './game/useGameHistory';

export { GAME_STATE } from './game/types';
export type { HistoryItem, Player } from './game/types';

export const useCrashGame = (initialBalance: number = 1000) => {
  // Get game state logic
  const {
    gameState,
    countdownTimer,
    crashPoint,
    currentMultiplier,
    gameStateRef,
    setGameState,
    setCountdownTimer,
    setCrashPoint,
    setCurrentMultiplier,
    startCountdown,
    handleCrash: handleCrashState
  } = useGameState();

  // Get game history logic
  const {
    gameHistory,
    players,
    setPlayers,
    updateGameHistory,
    resetPlayers
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
    setIsBetPlaced
  } = usePlayerActions({
    gameState,
    currentMultiplier,
    setPlayers,
    startCountdown
  });

  // Handle crash with history update
  const handleCrash = (value: number) => {
    handleCrashState(value);
    updateGameHistory(value);
  };

  // Countdown timer logic
  useEffect(() => {
    if (countdownTimer !== null && countdownTimer > 0) {
      const timer = setTimeout(() => {
        setCountdownTimer(prev => {
          if (prev === null) return null;
          const newValue = prev - 0.1;
          
          // When countdown reaches zero, start the game
          if (newValue <= 0 && gameStateRef.current === GAME_STATE.COUNTDOWN) {
            setGameState(GAME_STATE.PLAYING);
            setCurrentMultiplier(1);
            return null;
          }
          
          // When cooldown after crash reaches zero, reset for new round
          if (newValue <= 0 && gameStateRef.current === GAME_STATE.CRASHED) {
            setGameState(GAME_STATE.WAITING);
            setCrashPoint(null);
            setCurrentMultiplier(1);
            setPlayerBet(null);
            setPlayerAutoCashout(null);
            setPlayerWin(null);
            setIsBetPlaced(false); // Reset bet placement status
            resetPlayers();
            startCountdown(); // Automatically start next round
            return null;
          }
          
          return Math.max(0, newValue); // Prevent negative values
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [countdownTimer, gameStateRef, setGameState, setCountdownTimer, setCrashPoint, 
      setCurrentMultiplier, setPlayerBet, setPlayerAutoCashout, setPlayerWin, setIsBetPlaced, 
      resetPlayers, startCountdown]);

  // Auto cashout logic
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING && 
        playerAutoCashout !== null && 
        currentMultiplier >= playerAutoCashout && 
        playerWin === null) {
      handleCashout();
    }
  }, [gameState, playerAutoCashout, currentMultiplier, playerWin, handleCashout]);

  // Simulate other players behavior
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING) {
      // Simulate other players cashing out at random times
      players.forEach(player => {
        if (player.id !== 'player-user' && player.multiplier === null) {
          // Each player has a different risk tolerance (1.1x to 10x)
          const cashoutMultiplier = 1.1 + Math.random() * 8.9;
          
          // Check each frame if they should cash out
          const checkInterval = setInterval(() => {
            // Only cash out if game is still in progress
            if (gameStateRef.current === GAME_STATE.PLAYING) {
              if (currentMultiplier >= cashoutMultiplier) {
                setPlayers(prev => 
                  prev.map(p => {
                    if (p.id === player.id) {
                      return { ...p, multiplier: currentMultiplier };
                    }
                    return p;
                  })
                );
                clearInterval(checkInterval);
              }
            } else {
              clearInterval(checkInterval);
            }
          }, 100);
          
          return () => clearInterval(checkInterval);
        }
      });
    }
  }, [gameState, players, gameStateRef, currentMultiplier, setPlayers]);

  // Auto-start the first round if in waiting state
  useEffect(() => {
    if (gameState === GAME_STATE.WAITING) {
      startCountdown();
    }
  }, [gameState, startCountdown]);

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
    handlePlaceBet,
    handleCashout,
    handleCrash,
    setCurrentMultiplier,
  };
};
