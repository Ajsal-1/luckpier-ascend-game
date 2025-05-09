import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCrashPointGenerator } from './useCrashPointGenerator';

export const useRoundManager = (
  setCrashPoint: (point: number) => void,
  startCountdown: () => void
) => {
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const roundInProgressRef = useRef<boolean>(false);
  const [dbErrorCount, setDbErrorCount] = useState<number>(0);
  
  const {
    isUsingServerCrashPoints,
    generateNextCrashPoint
  } = useCrashPointGenerator();

  // Start a new round with crash point
  const startNewRound = useCallback(async () => {
    // Prevent multiple simultaneous round starts
    if (roundInProgressRef.current) {
      console.log("⚠️ Round already in progress, skipping startNewRound");
      return;
    }
    
    roundInProgressRef.current = true;
    
    try {
      console.log("🎮 Starting new round...");
      
      // Generate the next crash point
      const nextCrashPoint = await generateNextCrashPoint();
      console.log(`🎯 Generated crash point: ${nextCrashPoint.toFixed(2)}x`);
      
      // Create a new round in the database only if we haven't had too many errors
      let roundId = null;
      
      if (dbErrorCount < 3) {
        try {
          // Always store all rounds in Supabase for history purposes
          const { data: roundData, error: roundError } = await supabase
            .from('rounds')
            .insert({
              crash_multiplier: nextCrashPoint,
              status: 'pending'
            })
            .select('id')
            .single();
            
          if (roundError) {
            console.error('⚠️ Database error creating round:', roundError);
            setDbErrorCount(prev => prev + 1);
            if (dbErrorCount === 2) {
              toast.error("Database connection issues detected. Game will continue in offline mode.", { position: 'top-center' });
            }
          } else if (roundData) {
            // Store the current round ID
            roundId = roundData.id;
            setCurrentRoundId(roundId);
            console.log(`🆔 New round created with ID: ${roundId}`);
          }
        } catch (err) {
          console.error('⚠️ Error creating round in database:', err);
          setDbErrorCount(prev => prev + 1);
        }
      }
      
      // Set the crash point locally - this happens even if DB fails
      console.log(`✅ Setting crash point to ${nextCrashPoint.toFixed(2)}x`);
      setCrashPoint(nextCrashPoint);
      
      // Always start countdown for new round
      startCountdown();
    } catch (err) {
      console.error('⚠️ Error in startNewRound:', err);
      
      // Fallback crash point
      const fallbackCrashPoint = 1.5 + Math.random() * 3;
      console.log(`⚠️ Using fallback crash point: ${fallbackCrashPoint.toFixed(2)}x`);
      setCrashPoint(fallbackCrashPoint);
      
      // Start countdown anyway to keep the game flowing
      startCountdown();
      
    } finally {
      // Always reset the flag to allow future rounds
      roundInProgressRef.current = false;
    }
  }, [dbErrorCount, generateNextCrashPoint, setCrashPoint, startCountdown]);

  // Update round status in database when a round ends
  const completeRound = useCallback(async (crashMultiplier: number) => {
    console.log(`Completing round ${currentRoundId} with crash: ${crashMultiplier.toFixed(2)}x`);
    
    // Only update database if we have a valid round ID and not too many errors
    if (currentRoundId && dbErrorCount < 3) {
      try {
        const { error } = await supabase
          .from('rounds')
          .update({ 
            ended_at: new Date().toISOString(),
            status: 'completed' 
          })
          .eq('id', currentRoundId);
          
        if (error) {
          console.error('⚠️ Error updating round on completion:', error);
          setDbErrorCount(prev => prev + 1);
        }
      } catch (err) {
        console.error('⚠️ Error completing round in database:', err);
        setDbErrorCount(prev => prev + 1);
      }
    }
  }, [currentRoundId, dbErrorCount]);

  return {
    currentRoundId,
    isUsingServerCrashPoints,
    dbErrorCount,
    roundInProgressRef,
    startNewRound,
    completeRound
  };
};
