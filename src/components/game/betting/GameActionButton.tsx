
import React from 'react';
import { cn } from '@/lib/utils';

interface GameActionButtonProps {
  isPlaying: boolean;
  isDisabled: boolean;
  remainingTime: number | null;
  hasWon: boolean;
  isCrashed: boolean;
  onClick: () => void;
  isBetPlaced: boolean; // Add this prop to check if a bet is placed
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
    // Ensure timer doesn't show negative values
    return Math.max(0, seconds).toFixed(1);
  };
  
  // Show "Cash Out" button only when the game is playing AND a bet has been placed
  const showCashOut = isPlaying && isBetPlaced;
  
  if (!showCashOut) {
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
  } else {
    return (
      <button 
        className={cn(
          "w-full py-3 text-base font-medium rounded-md transition-all",
          hasWon || isCrashed ? 
            "bg-amber-600/50 text-white/70 cursor-not-allowed" : 
            "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
        )}
        onClick={onClick}
        disabled={hasWon || isCrashed}
      >
        Cash Out
      </button>
    );
  }
};

export default GameActionButton;
