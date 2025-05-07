
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
      "relative flex items-center justify-center w-full h-full",
      (isCrashed || winValue) ? "animate-pulse-win" : ""
    )}>
      <div className={cn(
        "text-7xl sm:text-8xl md:text-9xl font-bold transition-all duration-100 ease-in-out",
        isPlaying && !isCrashed && !winValue ? "animate-multiplier-grow" : "",
        isCrashed ? "multiplier-crashed text-red-500" : "",
        winValue ? "multiplier-win text-luckpier-gold" : "multiplier-text",
      )}>
        {displayValue}
      </div>
      
      {isCrashed && (
        <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 text-red-500 text-xl sm:text-2xl font-bold animate-fade-in">
          CRASHED!
        </div>
      )}
      
      {winValue && (
        <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 text-luckpier-gold text-xl sm:text-2xl font-bold animate-fade-in">
          WIN!
        </div>
      )}
    </div>
  );
};

export default Multiplier;
