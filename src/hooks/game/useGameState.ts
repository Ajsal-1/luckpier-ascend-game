
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
  
  // Ref to track if a countdown is already in progress
  const isCountdownActiveRef = useRef<boolean>(false);
  
  // Start the game countdown
  const startCountdown = useCallback(() => {
    console.log(`Starting countdown, current game state: ${gameState}, countdown active: ${isCountdownActiveRef.current}`);
    
    // Only start countdown if we're in WAITING or CRASHED state and no countdown is already active
    if ((gameState === GAME_STATE.WAITING || gameState === GAME_STATE.CRASHED) && !isCountdownActiveRef.current) {
      console.log("Countdown initiated with 3 seconds");
      isCountdownActiveRef.current = true;
      setGameState(GAME_STATE.COUNTDOWN);
      setCountdownTimer(3);
      setCurrentMultiplier(1);
      setIsRoundActive(false);
    } else {
      console.log(`Countdown not started - State: ${gameState}, Already active: ${isCountdownActiveRef.current}`);
    }
  }, [gameState]);

  // Handle game crash
  const handleCrash = useCallback((value: number) => {
    console.log(`handleCrash called with value: ${value}, current state: ${gameState}, round active: ${isRoundActive}`);
    
    // Only process crash if we're currently playing and round is active
    if (gameState === GAME_STATE.PLAYING && isRoundActive) {
      console.log("Game crashed, transitioning to CRASHED state");
      setGameState(GAME_STATE.CRASHED);
      setIsRoundActive(false);
      
      // Start cooldown for next round (3 seconds)
      setCountdownTimer(3);
      
      // Reset the countdown active flag
      isCountdownActiveRef.current = false;
    }
  }, [gameState, isRoundActive]);
  
  // Start playing state
  const startPlaying = useCallback(() => {
    console.log(`startPlaying called, current state: ${gameState}`);
    
    if (gameState === GAME_STATE.COUNTDOWN) {
      console.log("Transitioning from COUNTDOWN to PLAYING");
      setGameState(GAME_STATE.PLAYING);
      setIsRoundActive(true);
      setCurrentMultiplier(1);
      setCountdownTimer(null);
      
      // Reset the countdown active flag
      isCountdownActiveRef.current = false;
    }
  }, [gameState]);

  // End current round and reset
  const resetRound = useCallback(() => {
    console.log("Resetting round");
    setGameState(GAME_STATE.WAITING);
    setIsRoundActive(false);
    setCurrentMultiplier(1);
    setCrashPoint(null);
    isCountdownActiveRef.current = false;
  }, []);

  return {
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
    handleCrash,
    resetRound,
  };
};
