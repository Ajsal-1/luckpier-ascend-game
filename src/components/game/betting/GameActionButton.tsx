
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
    // Ensure timer doesn't show negative values and always shows exactly one decimal place
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
    return (
      <button 
        className={cn(
          "w-full py-3 text-base font-medium rounded-md transition-all",
          isDisabled ? 
            "bg-blue-600/50 text-white/70 cursor-not-allowed" : 
            "bg-blue-600 hover:bg-blue-700 text-white"
        )}
        onClick={onClick}
        disabled={isDisabled}
      >
        {remainingTime !== null && remainingTime > 0
          ? `Place Bet (${formatTime(remainingTime)}s)`
          : "Place Bet"}
      </button>
    );
  }
};

export default GameActionButton;
