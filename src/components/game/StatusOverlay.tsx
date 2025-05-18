
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
      
      // Hide overlay after a few seconds (only for crash, cash out stays until next round)
      if (isCrashed) {
        const timer = setTimeout(() => {
          setShowOverlay(false);
        }, 3000); // Show crashed overlay for 3 seconds
        
        return () => clearTimeout(timer);
      }
    } else {
      // Reset when both states are false (new round)
      setShowOverlay(false);
    }
  }, [isCrashed, isCashedOut]);
  
  if (!showOverlay) return null;
  
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      {isCrashed && (
        <div className="w-full max-w-xs md:max-w-md animate-bounce">
          <img 
            src="/lovable-uploads/0589009f-7770-48ce-a550-90f5c2d0bf3d.png" 
            alt="Crashed! It's okay, you can win again" 
            className="w-full h-auto"
          />
        </div>
      )}
      
      {isCashedOut && !isCrashed && (
        <div className="w-full max-w-xs md:max-w-md animate-pulse">
          <img 
            src="/lovable-uploads/790639a8-07b4-43f9-8cdd-885cdd3b066f.png" 
            alt="Cashed Out!" 
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  );
};

export default StatusOverlay;
