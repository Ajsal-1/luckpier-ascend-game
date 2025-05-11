
import React from 'react';
import { cn } from '@/lib/utils';

interface GameActionButtonProps {
  isPlaying: boolean;
  isDisabled: boolean;
  remainingTime: number | null;
  hasWon: boolean;
  isCrashed: boolean;
  onClick: () => void;
  isBetPlaced: boolean;
}

const GameActionButton: React.FC<GameActionButtonProps> = ({
  isPlaying,
  isDisabled,
  remainingTime,
  hasWon,
  isCrashed,
  onClick,
  isBetPlaced
}) => {
  const formatTime = (seconds: number): string => {
    // Ensure timer always shows exactly one decimal place for perfect sync with CountdownDisplay
    const time = Math.max(0, seconds);
    return time.toFixed(1);
  };
  
  // Only show "Cash Out" when the game is playing AND a bet has been placed AND there's no win yet
  const showCashOut = isPlaying && isBetPlaced && !hasWon;
  
  if (showCashOut) {
    return (
      <button 
        className={cn(
          "w-full py-3 text-base font-medium rounded-md transition-all",
          isCrashed ? 
            "bg-amber-600/50 text-white/70 cursor-not-allowed" : 
            "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
        )}
        onClick={onClick}
        disabled={isCrashed || hasWon}
      >
        Cash Out
      </button>
    );
  } else {
    // Enhanced visual feedback during countdown period
    const isCountdownActive = remainingTime !== null && remainingTime > 0;
    const isNearlyFinished = remainingTime !== null && remainingTime <= 0.1;
    
    return (
      <button 
        className={cn(
          "w-full py-3 text-base font-medium rounded-md transition-all",
          isDisabled ? 
            "bg-blue-600/50 text-white/70 cursor-not-allowed" : 
            isCountdownActive ? 
              "bg-green-600 hover:bg-green-700 text-white font-bold" : 
              "bg-blue-600 hover:bg-blue-700 text-white"
        )}
        onClick={onClick}
        disabled={isDisabled}
      >
        {isCountdownActive
          ? `Place Bet (${formatTime(remainingTime)}s)`
          : isNearlyFinished
            ? "Place Bet Now!"
            : "Place Bet"}
      </button>
    );
  }
};

export default GameActionButton;
