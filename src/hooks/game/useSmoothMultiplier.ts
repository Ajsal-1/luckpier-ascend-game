
import { useState, useEffect, useRef } from 'react';

interface UseSmoothMultiplierProps {
  isPlaying: boolean;
  crashPoint: number | null;
  onCrash: (value: number) => void;
}

export const useSmoothMultiplier = ({ 
  isPlaying, 
  crashPoint, 
  onCrash 
}: UseSmoothMultiplierProps) => {
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastMultiplierRef = useRef<number>(1.0);
  const hasCrashedRef = useRef<boolean>(false);
  
  // Use consistent growth rate matching the server (0.06)
  const growthRate = 0.06;

  // Animation function using requestAnimationFrame for smooth updates
  const animateMultiplier = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    // Calculate elapsed time in seconds
    const elapsed = (timestamp - startTimeRef.current) / 1000;
    
    // Calculate the new multiplier using the exact formula:
    // multiplier = 1 + (elapsedTimeInSeconds)^1.3
    const newMultiplier = Math.pow(Math.E, growthRate * elapsed);
    
    // Round to 2 decimal places for display consistency
    const roundedMultiplier = Math.floor(newMultiplier * 100) / 100;
    
    // IMPORTANT: Never decrease the multiplier value
    // This fixes jumps where the multiplier would go backward
    if (roundedMultiplier <= lastMultiplierRef.current) {
      animationRef.current = requestAnimationFrame(animateMultiplier);
      return;
    }
    
    // Update the reference for the next frame
    lastMultiplierRef.current = roundedMultiplier;
    setCurrentMultiplier(roundedMultiplier);
    
    // Check if we've reached the crash point
    if (crashPoint !== null && roundedMultiplier >= crashPoint) {
      if (!hasCrashedRef.current) {
        console.log(`Crash detected at ${roundedMultiplier.toFixed(2)}x`);
        hasCrashedRef.current = true;
        onCrash(roundedMultiplier);
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }
    }
    
    // Continue the animation loop
    animationRef.current = requestAnimationFrame(animateMultiplier);
  };

  // Start or stop the animation based on game state
  useEffect(() => {
    if (isPlaying && !hasCrashedRef.current) {
      console.log("Starting multiplier animation");
      // Reset the animation state
      startTimeRef.current = null;
      lastMultiplierRef.current = 1.0;
      setCurrentMultiplier(1.0);
      hasCrashedRef.current = false;
      
      // Start the animation
      animationRef.current = requestAnimationFrame(animateMultiplier);
    } else {
      // Clean up the animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    // Clean up on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, crashPoint]);

  return { currentMultiplier, hasCrashedRef };
};
