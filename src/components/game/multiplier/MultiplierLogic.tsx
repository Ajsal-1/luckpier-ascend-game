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
  
  // Constants to control the multiplier growth curve
  const growthFactor = 0.06; // Adjust for faster/slower growth

  const animateMultiplier = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    
    // Calculate new multiplier using exponential growth function
    // The longer the time, the faster it grows
    const newMultiplier = 1 + Math.pow(elapsed * growthFactor / 1000, 1.5);
    
    // Update chart data with new point
    setChartData(prev => {
      // Keep a rolling window of points for performance
      const newData = [...prev, { x: elapsed / 1000, y: newMultiplier }];
      // Only keep the most recent 200 points for performance
      if (newData.length > 200) {
        return newData.slice(newData.length - 200);
      }
      return newData;
    });
    
    // Check if we've reached the crash point
    if (crashValue && newMultiplier >= crashValue) {
      setCrashEffectActive(true);
      onCrash(newMultiplier);
      onMultiplierUpdate(newMultiplier);
      return;
    }
    
    // Update the multiplier display
    onMultiplierUpdate(newMultiplier);
    setDisplayValue(formatMultiplier(newMultiplier));
    
    animationRef.current = requestAnimationFrame(animateMultiplier);
  };

  useEffect(() => {
    if (isPlaying && !isCrashed && !winValue) {
      startTimeRef.current = null;
      setChartData([{ x: 0, y: 1 }]); // Initialize with starting point
      animationRef.current = requestAnimationFrame(animateMultiplier);
      setCrashEffectActive(false); // Reset crash effect
    } else if (isCrashed && crashValue) {
      // Display the exact crash value
      setDisplayValue(formatMultiplier(currentMultiplier));
      setCrashEffectActive(true); // Activate crash effect
      
      // Reset crash effect after animation completes
      const resetTimer = setTimeout(() => {
        setCrashEffectActive(false);
      }, 2000); // 2 seconds of crash effect
      
      return () => clearTimeout(resetTimer);
    } else if (winValue) {
      setDisplayValue(formatMultiplier(winValue));
    } else {
      setDisplayValue("1.00x");
      setChartData([]); // Clear chart when not playing
      setCrashEffectActive(false); // Reset crash effect
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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
