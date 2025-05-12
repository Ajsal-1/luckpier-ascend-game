
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GAME_STATE } from './types';

// Standardized timings for consistency
const COUNTDOWN_TIME = 10; // seconds
const POST_CRASH_COOLDOWN = 10; // seconds

export const useCrashRoundManager = () => {
  const [gameState, setGameState] = useState<GAME_STATE>(GAME_STATE.WAITING);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<number>(COUNTDOWN_TIME);
  const [isRoundActive, setIsRoundActive] = useState<boolean>(false);
  
  // Refs to track state across renders
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const crashPointGeneratedRef = useRef<boolean>(false);
  const roundInProgressRef = useRef<boolean>(false);

  // Generate a crash point between 1.01 and 10
  const generateCrashPoint = useCallback((): number => {
    // Simple random crash point formula as requested
    // 1.01 + Math.random() * 10
    return 1.01 + Math.random() * 10;
  }, []);

  // Start a new round
  const startNewRound = useCallback(async () => {
    // Prevent multiple round starts
    if (roundInProgressRef.current) {
      console.log("Round already in progress, ignoring startNewRound call");
      return;
    }
    
    roundInProgressRef.current = true;
    console.log("Starting new round");
    
    try {
      // Generate crash point BEFORE round starts (requirement #4)
      let nextCrashPoint: number;
      if (!crashPointGeneratedRef.current) {
        nextCrashPoint = generateCrashPoint();
        setCrashPoint(nextCrashPoint);
        crashPointGeneratedRef.current = true;
        console.log(`Generated crash point: ${nextCrashPoint.toFixed(2)}x`);
      } else {
        // Use existing crash point if already generated
        nextCrashPoint = crashPoint || generateCrashPoint();
      }
      
      // Create round in database with PENDING status
      const { data: roundData, error: roundError } = await supabase
        .from('rounds')
        .insert({
          crash_multiplier: nextCrashPoint,
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (roundError) {
        console.error("Error creating round:", roundError);
        throw new Error("Failed to create new round");
      }
      
      // Update state with new round ID
      setCurrentRoundId(roundData.id);
      
      // Start countdown for betting phase
      setGameState(GAME_STATE.COUNTDOWN);
      setCountdownTimer(COUNTDOWN_TIME);
      setIsRoundActive(false);
      
      console.log(`New round created with ID ${roundData.id}, starting ${COUNTDOWN_TIME}s countdown`);
    } catch (err) {
      console.error("Error in startNewRound:", err);
      toast.error("Failed to start new round, retrying...", { position: 'top-center' });
      
      // Reset for retry
      setTimeout(() => {
        roundInProgressRef.current = false;
        startNewRound();
      }, 2000);
    } finally {
      // Ensure flag is reset even if error occurs
      roundInProgressRef.current = false;
    }
  }, [crashPoint, generateCrashPoint]);

  // Start the playing phase after countdown
  const startPlaying = useCallback(async () => {
    console.log("Starting playing phase");
    setGameState(GAME_STATE.PLAYING);
    setIsRoundActive(true);
    
    // Update round status in database
    if (currentRoundId) {
      try {
        const { error } = await supabase
          .from('rounds')
          .update({
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('id', currentRoundId);
        
        if (error) {
          console.error("Error updating round status to running:", error);
        } else {
          console.log(`Updated round ${currentRoundId} status to running`);
        }
      } catch (err) {
        console.error("Error updating round status:", err);
      }
    }
  }, [currentRoundId]);

  // Handle crash event
  const handleCrash = useCallback(async (crashValue: number) => {
    console.log(`Game crashed at ${crashValue.toFixed(2)}x`);
    setGameState(GAME_STATE.CRASHED);
    setIsRoundActive(false);
    
    // Update round in database
    if (currentRoundId) {
      try {
        const { error } = await supabase
          .from('rounds')
          .update({
            status: 'completed',
            ended_at: new Date().toISOString()
          })
          .eq('id', currentRoundId);
        
        if (error) {
          console.error("Error updating round status to completed:", error);
        } else {
          console.log(`Updated round ${currentRoundId} status to completed`);
        }
      } catch (err) {
        console.error("Error updating round on crash:", err);
      }
      
      // Update all uncashed bets to "lost" status
      try {
        const { error } = await supabase
          .from('player_bets')
          .update({ status: 'lost' })
          .eq('round_id', currentRoundId)
          .is('cashed_out_multiplier', null);
        
        if (error) {
          console.error("Error updating lost bets:", error);
        } else {
          console.log(`Updated lost bets for round ${currentRoundId}`);
        }
      } catch (err) {
        console.error("Error updating lost bets:", err);
      }
    }
    
    // Start cooldown timer for next round
    setCountdownTimer(POST_CRASH_COOLDOWN);
    console.log(`Starting ${POST_CRASH_COOLDOWN}s cooldown before next round`);
  }, [currentRoundId]);

  // Reset for next round
  const resetRound = useCallback(() => {
    console.log("Resetting round state");
    setGameState(GAME_STATE.WAITING);
    setCountdownTimer(COUNTDOWN_TIME);
    setIsRoundActive(false);
    crashPointGeneratedRef.current = false; // Allow new crash point generation
    setCrashPoint(null);
  }, []);

  // Timer effect with proper cleanup
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Handle countdown
    if ((gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.CRASHED) && countdownTimer > 0) {
      timerRef.current = setTimeout(() => {
        setCountdownTimer(prevTimer => Math.max(0, prevTimer - 0.1));
      }, 100); // Update every 100ms for smooth countdown
      
    } else if (gameState === GAME_STATE.COUNTDOWN && countdownTimer <= 0) {
      // Countdown reached zero, start playing
      startPlaying();
      
    } else if (gameState === GAME_STATE.CRASHED && countdownTimer <= 0) {
      // Cooldown completed, reset and start new round
      resetRound();
      startNewRound();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, countdownTimer, startPlaying, resetRound, startNewRound]);

  // Auto-start first round on mount
  useEffect(() => {
    if (gameState === GAME_STATE.WAITING && !currentRoundId) {
      startNewRound();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, currentRoundId, startNewRound]);

  return {
    gameState,
    countdownTimer,
    crashPoint,
    currentRoundId,
    isRoundActive,
    startNewRound,
    handleCrash,
    resetRound
  };
};
