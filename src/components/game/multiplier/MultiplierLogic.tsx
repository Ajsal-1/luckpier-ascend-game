
import React, { useEffect, useState, useRef } from 'react';
import { formatMultiplier } from './utils';
import { ChartDataPoint } from './types';

interface MultiplierLogicProps {
  isPlaying: boolean;
  isCrashed: boolean;
  winValue: number | null;
  crashValue: number | null;
  onCrash: (value: number) => void;
  currentMultiplier: number;
  onMultiplierUpdate: (multiplier: number) => void;
  children: (props: {
    displayValue: string;
    chartData: ChartDataPoint[];
    crashEffectActive: boolean;
  }) => React.ReactNode;
}

const MultiplierLogic: React.FC<MultiplierLogicProps> = ({
  isPlaying,
  isCrashed,
  winValue,
  crashValue,
  onCrash,
  currentMultiplier,
  onMultiplierUpdate,
  children,
}) => {
  const [displayValue, setDisplayValue] = useState("1.00x");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [crashEffectActive, setCrashEffectActive] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasCrashedRef = useRef<boolean>(false);
  
  // Growth factor - higher = faster rise (previously 0.15)
  // Using 0.18 for even more exciting gameplay
  const growthFactor = 0.18;

  const animateMultiplier = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    
    // Calculate new multiplier using exponential growth formula
    // Similar to how stake.com calculates it
    // This creates a curve that grows faster over time
    const elapsedInSeconds = elapsed / 1000;
    const newMultiplier = Math.pow(Math.E, growthFactor * elapsedInSeconds);
    
    // Round to 2 decimal places for display
    const roundedMultiplier = Math.floor(newMultiplier * 100) / 100;
    
    // Update chart data with new point
    setChartData(prev => {
      // Keep a rolling window of points for performance
      const newData = [...prev, { x: elapsedInSeconds, y: roundedMultiplier }];
      // Only keep the most recent 200 points for performance
      if (newData.length > 200) {
        return newData.slice(newData.length - 200);
      }
      return newData;
    });
    
    // Check if we've reached the crash point
    if (crashValue && roundedMultiplier >= crashValue) {
      if (!hasCrashedRef.current) {
        // Only trigger crash once to avoid multiple crash events
        console.log(`Crash detected: ${roundedMultiplier.toFixed(2)}x >= ${crashValue.toFixed(2)}x`);
        hasCrashedRef.current = true;
        setCrashEffectActive(true);
        onCrash(roundedMultiplier);
        onMultiplierUpdate(roundedMultiplier);
        setDisplayValue(formatMultiplier(roundedMultiplier));
        
        // Cancel the animation
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
      return;
    }
    
    // Update the multiplier display
    onMultiplierUpdate(roundedMultiplier);
    setDisplayValue(formatMultiplier(roundedMultiplier));
    
    // Continue the animation loop
    animationRef.current = requestAnimationFrame(animateMultiplier);
  };

  useEffect(() => {
    console.log(`MultiplierLogic update: isPlaying=${isPlaying}, isCrashed=${isCrashed}, currentMultiplier=${currentMultiplier}, crashValue=${crashValue}`);
    
    if (isPlaying && !isCrashed && !winValue) {
      console.log("Starting multiplier animation");
      // Reset crash flag when starting a new round
      hasCrashedRef.current = false;
      
      // Reset the timer and chart
      startTimeRef.current = null;
      setChartData([{ x: 0, y: 1 }]); // Initialize with starting point
      
      // Start the animation
      animationRef.current = requestAnimationFrame(animateMultiplier);
      setCrashEffectActive(false); // Reset crash effect
      
    } else if (isCrashed && crashValue) {
      console.log(`Game crashed at ${currentMultiplier.toFixed(2)}x`);
      // Display the exact crash value
      setDisplayValue(formatMultiplier(currentMultiplier));
      setCrashEffectActive(true); // Activate crash effect
      
      // Reset crash effect after animation completes
      // Extended from 2 seconds to 5 seconds for more visibility
      const resetTimer = setTimeout(() => {
        setCrashEffectActive(false);
      }, 5000); // 5 seconds of crash effect
      
      return () => clearTimeout(resetTimer);
      
    } else if (winValue) {
      console.log(`Player won at ${winValue.toFixed(2)}x`);
      // Display cashout value
      setDisplayValue(formatMultiplier(winValue));
      
    } else {
      console.log("MultiplierLogic reset to default state");
      // Default state - show 1.00x and clear chart
      setDisplayValue("1.00x");
      setChartData([]);
      setCrashEffectActive(false);
    }

    // Clean up animation on unmount or state change
    return () => {
      if (animationRef.current) {
        console.log("Cleaning up multiplier animation");
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, isCrashed, winValue, crashValue, currentMultiplier, onMultiplierUpdate, onCrash]);

  return (
    <>
      {children({
        displayValue,
        chartData,
        crashEffectActive,
      })}
    </>
  );
};

export default MultiplierLogic;
