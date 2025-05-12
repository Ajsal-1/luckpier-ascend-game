
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { GAME_STATE } from '@/hooks/game/types';

interface SimpleMultiplierProps {
  currentMultiplier: number;
  gameState: GAME_STATE;
  crashPoint: number | null;
  remainingTime: number | null;
}

const SimpleMultiplier: React.FC<SimpleMultiplierProps> = ({
  currentMultiplier,
  gameState,
  crashPoint,
  remainingTime,
}) => {
  const [displayValue, setDisplayValue] = useState<string>("1.00x");
  
  // Update display value when multiplier changes
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING) {
      setDisplayValue(currentMultiplier.toFixed(2) + "x");
    } else if (gameState === GAME_STATE.CRASHED && crashPoint !== null) {
      setDisplayValue(crashPoint.toFixed(2) + "x");
    } else if (gameState === GAME_STATE.COUNTDOWN) {
      setDisplayValue("1.00x");
    }
  }, [currentMultiplier, gameState, crashPoint]);
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {/* Display countdown timer during countdown */}
      {gameState === GAME_STATE.COUNTDOWN && remainingTime !== null && (
        <div className="mb-4 text-3xl font-medium text-blue-400">
          Starting in {remainingTime.toFixed(1)}s
        </div>
      )}
      
      {/* Large multiplier display */}
      <div 
        className={cn(
          "text-7xl sm:text-8xl md:text-9xl font-bold",
          gameState === GAME_STATE.PLAYING ? "text-white" : "",
          gameState === GAME_STATE.CRASHED ? "text-red-500" : "",
          gameState === GAME_STATE.COUNTDOWN ? "text-gray-400" : "",
        )}
      >
        {displayValue}
      </div>
      
      {/* Crash message */}
      {gameState === GAME_STATE.CRASHED && crashPoint !== null && (
        <div className="mt-4 text-2xl sm:text-3xl font-bold text-red-500">
          CRASHED AT {crashPoint.toFixed(2)}x
        </div>
      )}
      
      {/* Next round countdown */}
      {gameState === GAME_STATE.CRASHED && remainingTime !== null && (
        <div className="mt-4 text-xl font-medium text-amber-400">
          Next round in {remainingTime.toFixed(1)}s
        </div>
      )}
    </div>
  );
};

export default SimpleMultiplier;
