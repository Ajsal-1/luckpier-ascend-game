
import React, { useEffect, useState } from 'react';

interface StatusOverlayProps {
  isCrashed: boolean;
  isCashedOut: boolean;
}

const StatusOverlay: React.FC<StatusOverlayProps> = ({ isCrashed, isCashedOut }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  
  useEffect(() => {
    // Show overlay when state changes to crashed or cashed out
    if (isCrashed || isCashedOut) {
      setShowOverlay(true);
      
      // Hide overlay after a few seconds for both crash and cash out
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, isCrashed ? 3000 : 2000); // 3 seconds for crash, 2 seconds for cash out
      
      return () => clearTimeout(timer);
    } else {
      // Reset when both states are false (new round)
      setShowOverlay(false);
    }
  }, [isCrashed, isCashedOut]);
  
  if (!showOverlay) return null;
  
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      {isCrashed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 md:w-40 bg-black/30 rounded-lg p-2 backdrop-blur-sm">
          <img 
            src="/lovable-uploads/0589009f-7770-48ce-a550-90f5c2d0bf3d.png" 
            alt="Crashed!" 
            className="w-full h-auto animate-bounce-once"
          />
          <p className="text-center text-red-500 text-xs md:text-sm font-bold mt-1">
            CRASHED!
          </p>
        </div>
      )}
      
      {isCashedOut && !isCrashed && (
        <div className="absolute bottom-2 right-2 w-24 md:w-32 bg-black/30 rounded-lg p-2 backdrop-blur-sm">
          <img 
            src="/lovable-uploads/790639a8-07b4-43f9-8cdd-885cdd3b066f.png" 
            alt="Cashed Out!" 
            className="w-full h-auto animate-pulse-once"
          />
          <p className="text-center text-green-500 text-xs md:text-sm font-bold mt-1">
            CASHED OUT!
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusOverlay;
