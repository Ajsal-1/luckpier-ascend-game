
import { useState, useCallback, useRef } from 'react';
import { GAME_STATE } from './types';

export const useGameState = () => {
  // Game state
  const [gameState, setGameState] = useState<GAME_STATE>(GAME_STATE.WAITING);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(3);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [isRoundActive, setIsRoundActive] = useState<boolean>(false);
  
  // Use ref to preserve values between renders for timers
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  
  // Start the game countdown
  const startCountdown = useCallback(() => {
    // Only start countdown if we're in WAITING or CRASHED state
    if (gameState !== GAME_STATE.PLAYING && gameState !== GAME_STATE.COUNTDOWN) {
      setGameState(GAME_STATE.COUNTDOWN);
      setCountdownTimer(3);
      setCurrentMultiplier(1);
      setIsRoundActive(false);
    }
  }, [gameState]);

  // Handle game crash
  const handleCrash = useCallback((value: number) => {
    // Only process crash if we're currently playing and round is active
    if (gameState === GAME_STATE.PLAYING && isRoundActive) {
      setGameState(GAME_STATE.CRASHED);
      setIsRoundActive(false);
      
      // Start cooldown for next round (3 seconds)
      setCountdownTimer(3);
    }
  }, [gameState, isRoundActive]);
  
  // Start playing state
  const startPlaying = useCallback(() => {
    if (gameState === GAME_STATE.COUNTDOWN) {
      setGameState(GAME_STATE.PLAYING);
      setIsRoundActive(true);
      setCurrentMultiplier(1);
      setCountdownTimer(null);
    }
  }, [gameState]);

  return {
    gameState,
    countdownTimer,
    crashPoint,
    currentMultiplier,
    isRoundActive,
    gameStateRef,
    setGameState,
    setCountdownTimer,
    setCrashPoint,
    setCurrentMultiplier,
    setIsRoundActive,
    startCountdown,
    startPlaying,
    handleCrash,
  };
};
