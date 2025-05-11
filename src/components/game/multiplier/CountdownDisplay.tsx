
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GAME_STATE } from '@/hooks/game/types';
import { Progress } from '@/components/ui/progress';

interface CountdownDisplayProps {
  gameState: GAME_STATE;
  displayValue: string;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  gameState,
  displayValue
}) => {
  // Only show the countdown when in COUNTDOWN or WAITING state
  if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.WAITING) {
    return null;
  }
  
  // Extract numerical value from displayValue if it's in the form "1.00x"
  const [countdown, setCountdown] = useState<number>(5);
  const [progress, setProgress] = useState<number>(0);
  
  useEffect(() => {
    // Start with 5 seconds max countdown
    let startCountdown = 5;
    setCountdown(startCountdown);
    setProgress(0);
    
    // Set up interval for counting down
    const countdownInterval = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 0) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prevCount - 0.1;
      });
    }, 100); // Update every 100ms for more fluid countdown
    
    // Set up more frequent interval for smooth progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Calculate progress from 0 to 100 over the total countdown period
        const newProgress = Math.min(100, prev + (100 / (startCountdown * 10)));
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100); // Update progress 10 times per second for smoothness
    
    return () => {
      clearInterval(countdownInterval);
      clearInterval(progressInterval);
    };
  }, [gameState]); // Reset when game state changes

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/30 backdrop-blur-sm rounded-md">
      <div className="text-5xl md:text-7xl font-bold mb-4 text-white">
        {countdown.toFixed(1)}
      </div>
      
      <div className="text-xl md:text-2xl mb-4 text-white/80">
        Next round starting soon
      </div>
      
      {/* Progress bar using shadcn UI components */}
      <div className="w-32 md:w-40 mb-2">
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
};

export default CountdownDisplay;
