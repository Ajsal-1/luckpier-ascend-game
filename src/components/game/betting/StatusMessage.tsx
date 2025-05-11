
import React from 'react';
import { CheckCircle } from "lucide-react";

interface StatusMessageProps {
  inputError: string | null;
  isPlaying: boolean;
  isBetPlaced: boolean;
  isCrashed: boolean;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  inputError, 
  isPlaying, 
  isBetPlaced, 
  isCrashed 
}) => {
  return (
    <>
      {inputError && !isPlaying && (
        <div className="text-red-500 text-xs mt-1">
          {inputError}
        </div>
      )}
      
      {isBetPlaced && !isCrashed && (
        <div className="flex items-center justify-center py-2 px-3 bg-green-900/20 text-green-400 rounded-md text-sm animate-fade-in">
          <CheckCircle className="w-4 h-4 mr-2" />
          <span>Bet Placed! Good luck!</span>
        </div>
      )}

      {isBetPlaced && isCrashed && (
        <div className="flex items-center justify-center py-2 px-3 bg-red-900/20 text-red-400 rounded-md text-sm animate-fade-in">
          <span>Round crashed! Place a new bet.</span>
        </div>
      )}
    </>
  );
};

export default StatusMessage;
