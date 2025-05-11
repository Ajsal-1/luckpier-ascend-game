
import React from 'react';
import { cn } from '@/lib/utils';
import { GAME_STATE } from '@/hooks/game/types';

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
  
  // Extract the number from the display value, assume it's "1.00x" format
  // and convert to a number for the calculation, defaulting to 0 if not a valid number
  const countdownValue = parseFloat(displayValue) || 3;
  
  // Calculate progress percentage - we assume countdown can be up to 6 seconds
  // Value goes from 0 to 6, so we reverse it and multiply by 100/6
  // to get a percentage that goes from 0 to 100
  const maxCountdown = 6; // Maximum countdown in seconds
  const progress = countdownValue === 1 ? 
    0 : 
    Math.max(0, Math.min(100, ((maxCountdown - countdownValue) / maxCountdown) * 100));

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/30 backdrop-blur-sm rounded-md">
      <div 
        className={cn(
          "text-5xl md:text-7xl font-bold mb-4",
          countdownValue <= 1 ? "text-green-500" : "text-white"
        )}
      >
        {/* Display rounded countdown value */}
        {Math.ceil(countdownValue)}
      </div>
      
      <div className="text-xl md:text-2xl mb-4 text-white/80">
        Next round starting soon
      </div>
      
      {/* Progress bar */}
      <div className="w-32 md:w-40 bg-gray-800 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default CountdownDisplay;
