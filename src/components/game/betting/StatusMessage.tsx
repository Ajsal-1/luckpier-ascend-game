
import React from 'react';
import { CheckCircle, Loader2 } from "lucide-react";

interface StatusMessageProps {
  inputError: string | null;
  isPlaying: boolean;
  isBetPlaced: boolean;
  isCrashed: boolean;
  isProcessing?: boolean;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  inputError, 
  isPlaying, 
  isBetPlaced, 
  isCrashed,
  isProcessing = false
}) => {
  return (
    <>
      {inputError && !isPlaying && (
        <div className="text-red-500 text-xs mt-1 min-h-[1.5rem]">
          {inputError}
        </div>
      )}
      
      {isProcessing && (
        <div className="flex items-center justify-center py-2 px-3 bg-blue-900/20 text-blue-400 rounded-md text-sm animate-pulse min-h-[2.5rem]">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span>Processing...</span>
        </div>
      )}
      
      {isBetPlaced && !isCrashed && !isProcessing && (
        <div className="flex items-center justify-center py-2 px-3 bg-green-900/20 text-green-400 rounded-md text-sm min-h-[2.5rem]">
          <CheckCircle className="w-4 h-4 mr-2" />
          <span>Bet Placed! Good luck!</span>
        </div>
      )}

      {isBetPlaced && isCrashed && !isProcessing && (
        <div className="flex items-center justify-center py-2 px-3 bg-red-900/20 text-red-400 rounded-md text-sm min-h-[2.5rem]">
          <span>Round crashed! Place a new bet.</span>
        </div>
      )}
      
      {/* Add a minimum height placeholder when no message is shown */}
      {!inputError && !isProcessing && !isBetPlaced && (
        <div className="min-h-[2.5rem]"></div>
      )}
    </>
  );
};

export default StatusMessage;
