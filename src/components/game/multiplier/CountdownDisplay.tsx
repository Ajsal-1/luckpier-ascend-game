
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
  const countdownValue = parseFloat(displayValue);
  
  // Calculate progress percentage - we assume countdown is 3 seconds
  // Value goes from 0 to 3, so we reverse it and multiply by 100/3
  // to get a percentage that goes from 0 to 100
  const progress = countdownValue === 1 ? 0 : Math.max(0, Math.min(100, (3 - countdownValue) * (100/3)));

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
      <div 
        className={cn(
          "text-5xl md:text-6xl font-bold mb-2",
          countdownValue <= 1 ? "text-green-500" : "text-white"
        )}
      >
        {/* Display rounded countdown value */}
        {Math.ceil(countdownValue)}
      </div>
      
      {/* Progress bar */}
      <div className="w-32 md:w-40 bg-gray-800 h-1.5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default CountdownDisplay;
