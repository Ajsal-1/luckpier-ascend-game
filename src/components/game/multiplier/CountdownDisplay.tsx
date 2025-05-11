
import React from 'react';
import { cn } from '@/lib/utils';
import { GAME_STATE } from '@/hooks/game/types';
import { Progress } from '@/components/ui/progress';

interface CountdownDisplayProps {
  gameState: GAME_STATE;
  displayValue: string;
  remainingTime?: number | null;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  gameState,
  displayValue,
  remainingTime
}) => {
  // Only show the countdown when in COUNTDOWN or WAITING state
  if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.WAITING) {
    return null;
  }
  
  // Use the server-provided countdown or default to 5.0
  const countdown = remainingTime !== undefined && remainingTime !== null ? remainingTime : 5.0;
  
  // Calculate progress percentage (from 0 to 100)
  // Assuming a standard 5 second countdown
  const progress = Math.max(0, Math.min(100, ((5.0 - countdown) / 5.0) * 100));
  
  // Format the countdown to always have one decimal place
  const formattedCountdown = countdown.toFixed(1);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/30 backdrop-blur-sm rounded-md">
      <div className="text-5xl md:text-7xl font-bold mb-4 text-white">
        {formattedCountdown}
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
