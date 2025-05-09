
import { useState, useCallback, useRef, useEffect } from 'react';
import { GAME_STATE } from './types';
import { getCrashMultiplier } from './gameUtils';

export const useGameState = () => {
  // Game state
  const [gameState, setGameState] = useState<GAME_STATE>(GAME_STATE.WAITING);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(3);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  
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
      
      // Generate crash point at the start of countdown
      // This ensures the crash point is determined before the round starts
      const newCrashPoint = getCrashMultiplier();
      setCrashPoint(newCrashPoint);
    }
  }, [gameState]);

  // Handle game crash
  const handleCrash = useCallback((value: number) => {
    // Only process crash if we're currently playing
    if (gameState === GAME_STATE.PLAYING) {
      setGameState(GAME_STATE.CRASHED);
      
      // Start cooldown for next round (3 seconds)
      setCountdownTimer(3);
    }
  }, [gameState]);

  return {
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
    handleCrash,
  };
};
