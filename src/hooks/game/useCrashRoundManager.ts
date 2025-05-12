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
  const dbErrorCountRef = useRef<number>(0); // Track DB errors to avoid excessive error messages
  const gameFlowBlockedRef = useRef<boolean>(false); // Track if game flow is blocked

  // Generate a crash point between 1.01 and 10
  const generateCrashPoint = useCallback((): number => {
    // Simple random crash point formula as requested
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
      let roundId = null;
      try {
        const { data: roundData, error: roundError } = await supabase
          .from('rounds')
          .insert({
            crash_multiplier: nextCrashPoint,
            status: 'pending'
          })
          .select('id')
          .single();
        
        if (roundError) {
          throw new Error(`Failed to create new round: ${roundError.message}`);
        }
        
        // Update state with new round ID
        roundId = roundData.id;
        console.log(`New round created with ID ${roundData.id}, starting ${COUNTDOWN_TIME}s countdown`);
      } catch (dbErr) {
        // If database operation fails, continue with a fallback local ID
        console.error("Error creating round in database, continuing with local game state:", dbErr);
        dbErrorCountRef.current += 1;
        
        // Generate a fallback local round ID to keep game state consistent
        roundId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.log(`Using fallback round ID: ${roundId}`);
        
        // Only show toast on first few errors to avoid spamming
        if (dbErrorCountRef.current <= 2) {
          toast.error("Network error detected. Game will continue in offline mode.", { position: 'top-center' });
        }
      }
      
      // Always update the local state to ensure game progresses
      setCurrentRoundId(roundId);
      
      // Start countdown for betting phase - do this regardless of DB success
      setGameState(GAME_STATE.COUNTDOWN);
      setCountdownTimer(COUNTDOWN_TIME);
      setIsRoundActive(false);
      gameFlowBlockedRef.current = false; // Reset the flow blocked flag
      
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
    
    // CRITICAL: Update local game state IMMEDIATELY to keep game flowing
    // regardless of database status
    setGameState(GAME_STATE.PLAYING);
    setIsRoundActive(true);
    
    // Reset game flow blocked flag as we're now in playing state
    gameFlowBlockedRef.current = false;
    
    // Then try to update the database, but don't block the game on this
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
          dbErrorCountRef.current += 1;
        } else {
          console.log(`Updated round ${currentRoundId} status to running`);
        }
      } catch (err) {
        console.error("Error updating round status, continuing with game:", err);
        dbErrorCountRef.current += 1;
        
        // Only show toast on first few errors to avoid spamming
        if (dbErrorCountRef.current <= 2) {
          toast.error("Network error detected. Game will continue in offline mode.", { position: 'top-center' });
        }
      }
    }
  }, [currentRoundId]);

  // Handle crash event
  const handleCrash = useCallback(async (crashValue: number) => {
    console.log(`Game crashed at ${crashValue.toFixed(2)}x`);
    
    // CRITICAL: Update local game state immediately
    setGameState(GAME_STATE.CRASHED);
    setIsRoundActive(false);
    
    // Try to update round in database, but don't block the game flow
    if (currentRoundId && !currentRoundId.startsWith('local-')) {
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
          dbErrorCountRef.current += 1;
        } else {
          console.log(`Updated round ${currentRoundId} status to completed`);
          
          // Only try to update bets if the round update was successful
          try {
            const { error: betsError } = await supabase
              .from('player_bets')
              .update({ status: 'lost' })
              .eq('round_id', currentRoundId)
              .is('cashed_out_multiplier', null);
            
            if (betsError) {
              console.error("Error updating lost bets:", betsError);
            } else {
              console.log(`Updated lost bets for round ${currentRoundId}`);
            }
          } catch (err) {
            console.error("Error updating lost bets:", err);
          }
        }
      } catch (err) {
        console.error("Error updating round on crash:", err);
        dbErrorCountRef.current += 1;
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
    setCurrentRoundId(null);
    gameFlowBlockedRef.current = false; // Reset the flow blocked flag
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
      console.log("Countdown complete, transitioning to PLAYING state");
      startPlaying();
      
    } else if (gameState === GAME_STATE.CRASHED && countdownTimer <= 0) {
      // Cooldown completed, reset and start new round
      console.log("Cooldown complete, resetting for new round");
      resetRound();
      startNewRound();
    }
    
    // Emergency recovery: If we're stuck in countdown for too long (15+ seconds)
    if (gameState === GAME_STATE.COUNTDOWN && countdownTimer <= -5) {
      console.error("EMERGENCY: Game stuck in countdown state. Forcing transition to PLAYING");
      startPlaying(); // Force transition to playing state
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

  // Emergency recovery for stuck game states
  useEffect(() => {
    // Check every 5 seconds if the game is stuck
    const emergencyCheck = setInterval(() => {
      if (gameFlowBlockedRef.current) {
        console.error("EMERGENCY: Game flow blocked for too long. Attempting recovery.");
        
        // Force transition based on current state
        if (gameState === GAME_STATE.COUNTDOWN) {
          console.log("Forcing transition from COUNTDOWN to PLAYING");
          setGameState(GAME_STATE.PLAYING);
          setIsRoundActive(true);
        } else if (gameState === GAME_STATE.PLAYING && !isRoundActive) {
          console.log("Inconsistent state: PLAYING but not active. Forcing active.");
          setIsRoundActive(true);
        } else if (gameState === GAME_STATE.CRASHED) {
          console.log("Forcing new round after crash");
          resetRound();
          setTimeout(() => startNewRound(), 500);
        }
        
        // Reset the blocked flag
        gameFlowBlockedRef.current = false;
      }
    }, 5000);
    
    return () => clearInterval(emergencyCheck);
  }, [gameState, isRoundActive, resetRound, startNewRound]);
  
  // If any critical state transition is taking longer than expected, mark game flow as blocked
  useEffect(() => {
    // Monitor state transitions
    const stateTransitionTimeout = setTimeout(() => {
      // If we're in countdown but timer is done, and we haven't transitioned to playing
      if (gameState === GAME_STATE.COUNTDOWN && countdownTimer <= 0) {
        console.warn("Countdown complete but game hasn't transitioned to PLAYING state");
        gameFlowBlockedRef.current = true;
      }
      
      // If we're crashed and timer is done, but haven't reset
      if (gameState === GAME_STATE.CRASHED && countdownTimer <= 0) {
        console.warn("Crash cooldown complete but game hasn't reset");
        gameFlowBlockedRef.current = true;
      }
    }, 2000); // Check 2 seconds after expected transition
    
    return () => clearTimeout(stateTransitionTimeout);
  }, [gameState, countdownTimer]);

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
