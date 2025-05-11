
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface GameActionButtonProps {
  isPlaying: boolean;
  isDisabled: boolean;
  remainingTime: number | null;
  hasWon: boolean;
  isCrashed: boolean;
  onClick: () => void;
  isBetPlaced: boolean;
  isProcessing?: boolean;
}

const GameActionButton: React.FC<GameActionButtonProps> = ({
  isPlaying,
  isDisabled,
  remainingTime,
  hasWon,
  isCrashed,
  onClick,
  isBetPlaced,
  isProcessing = false
}) => {
  // Only show "Cash Out" when the game is playing AND a bet has been placed AND there's no win yet
  const showCashOut = isPlaying && isBetPlaced && !hasWon;
  
  if (showCashOut) {
    return (
      <button 
        className={cn(
          "w-full py-3 text-base font-medium rounded-md transition-all",
          isCrashed ? 
            "bg-amber-600/50 text-white/70 cursor-not-allowed" : 
            isProcessing ?
              "bg-amber-600 text-white cursor-wait" :
              "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
        )}
        onClick={onClick}
        disabled={isCrashed || hasWon || isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </span>
        ) : "Cash Out"}
      </button>
    );
  } else {
    // Enhanced visual feedback during countdown period
    const isCountdownActive = remainingTime !== null && remainingTime > 0;
    const isNearlyFinished = remainingTime !== null && remainingTime <= 1;
    
    return (
      <button 
        className={cn(
          "w-full py-3 text-base font-medium rounded-md transition-all",
          isDisabled ? 
            "bg-blue-600/50 text-white/70 cursor-not-allowed" : 
            isProcessing ?
              "bg-blue-700 text-white cursor-wait" :
              isCountdownActive ? 
                "bg-green-600 hover:bg-green-700 text-white font-bold" : 
                "bg-blue-600 hover:bg-blue-700 text-white"
        )}
        onClick={onClick}
        disabled={isDisabled || isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </span>
        ) : isCountdownActive
          ? `Place Bet (${Math.ceil(remainingTime)}s)`
          : isNearlyFinished
            ? "Place Bet Now!"
            : "Place Bet"}
      </button>
    );
  }
};

export default GameActionButton;
