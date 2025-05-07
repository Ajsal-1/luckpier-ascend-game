
import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MultiplierProps {
  isPlaying: boolean;
  isCrashed: boolean;
  winValue: number | null;
  crashValue: number | null;
  onCrash: (value: number) => void;
}

const Multiplier: React.FC<MultiplierProps> = ({
  isPlaying,
  isCrashed,
  winValue,
  crashValue,
  onCrash,
}) => {
  const [multiplier, setMultiplier] = useState(1);
  const [displayValue, setDisplayValue] = useState("1.00x");
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Constants to control the multiplier growth curve
  const growthFactor = 0.06; // Adjust for faster/slower growth
  
  const formatMultiplier = (value: number): string => {
    return value.toFixed(2) + "x";
  };

  const animateMultiplier = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const newMultiplier = 1 + Math.pow(elapsed * growthFactor / 1000, 1.5);
    
    // Simulating random crash
    // In a real implementation, this would be determined by server
    if (crashValue && newMultiplier >= crashValue) {
      onCrash(newMultiplier);
      return;
    }
    
    setMultiplier(newMultiplier);
    setDisplayValue(formatMultiplier(newMultiplier));
    
    animationRef.current = requestAnimationFrame(animateMultiplier);
  };

  useEffect(() => {
    if (isPlaying && !isCrashed && !winValue) {
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animateMultiplier);
    } else if (isCrashed && crashValue) {
      setMultiplier(crashValue);
      setDisplayValue(formatMultiplier(crashValue));
    } else if (winValue) {
      setMultiplier(winValue);
      setDisplayValue(formatMultiplier(winValue));
    } else {
      setMultiplier(1);
      setDisplayValue("1.00x");
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isCrashed, winValue, crashValue]);

  return (
    <div className={cn(
      "relative flex items-center justify-center w-full h-full min-h-[240px] md:min-h-[320px]",
      (isCrashed || winValue) ? "animate-pulse-win" : ""
    )}>
      {isPlaying && !isCrashed && (
        <div className="absolute inset-0 flex items-end">
          <div 
            className="h-[80%] w-full animate-chart-grow"
            style={{
              background: "linear-gradient(to top, rgba(255,79,111,0.1) 0%, rgba(255,79,111,0) 100%)"
            }}
          >
            <div 
              className="w-full h-0.5 absolute bottom-0 left-0 right-0" 
              style={{ background: "linear-gradient(to right, rgba(255,79,111,0) 0%, rgba(255,79,111,0.5) 100%)" }}
            />
          </div>
        </div>
      )}
      
      <div 
        className={cn(
          "text-7xl sm:text-8xl font-bold transition-all duration-100 ease-in-out z-10",
          isPlaying && !isCrashed && !winValue ? "text-pink-500" : "",
          isCrashed ? "multiplier-crashed" : "",
          winValue ? "multiplier-win" : "",
        )}
      >
        {displayValue}
      </div>
      
      {isCrashed && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-pink-500 text-xl font-bold animate-fade-in tracking-wider">
          CRASHED
        </div>
      )}
      
      {winValue && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-luckpier-gold text-xl font-bold animate-fade-in tracking-wider">
          CASHED OUT
        </div>
      )}
    </div>
  );
};

export default Multiplier;
