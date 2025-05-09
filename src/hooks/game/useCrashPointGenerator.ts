
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCrashPointGenerator = () => {
  const [isUsingServerCrashPoints, setIsUsingServerCrashPoints] = useState<boolean>(false);
  const [errorCount, setErrorCount] = useState<number>(0);
  
  // Get recent crash points from Supabase
  const getRecentCrashPoints = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_recent_crash_points');
      
      if (error) throw error;
      
      if (data && data.length > 0 && data[0].crash_values) {
        return data[0].crash_values;
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching recent crash points:', err);
      return [];
    }
  }, []);

  // Generate fallback crash point locally
  const getLocalCrashPoint = useCallback(() => {
    // Distribution that favors lower multipliers (more realistic)
    const rand = Math.random();
    let crashPoint: number;
    
    if (rand < 0.6) {
      // 60% chance: 1.3x to 2.5x (common crashes)
      crashPoint = 1.3 + Math.random() * 1.2;
    } else if (rand < 0.9) {
      // 30% chance: 2.5x to 5x (medium crashes)
      crashPoint = 2.5 + Math.random() * 2.5;
    } else {
      // 10% chance: 5x to 10x (rare high crashes)
      crashPoint = 5 + Math.random() * 5;
    }
    
    console.log(`Generated local crash point: ${crashPoint.toFixed(2)}x`);
    return parseFloat(crashPoint.toFixed(2));
  }, []);
  
  // Generate crash point based on history
  const generateCrashPointFromHistory = useCallback((recentCrashes: number[]): number => {
    // Calculate the average crash value
    const avgCrash = recentCrashes.reduce((sum, value) => sum + value, 0) / recentCrashes.length;
    
    // Count recent low and high crashes
    let lowCrashCount = 0;
    let highCrashCount = 0;
    
    for (const crash of recentCrashes) {
      if (crash < 2.0) lowCrashCount++;
      if (crash > 5.0) highCrashCount++;
    }
    
    let crashPoint: number;
    
    if (lowCrashCount >= 3 && Math.random() < 0.7) {
      // Generate a higher crash point with 70% probability after several low crashes
      crashPoint = 3 + Math.random() * 12;
      console.log(`Many low crashes recently, generating higher crash: ${crashPoint.toFixed(2)}x`);
    } else if (highCrashCount >= 2 && Math.random() < 0.7) {
      // Generate a lower crash point with 70% probability after several high crashes
      crashPoint = 1.2 + Math.random() * 1.3;
      console.log(`Many high crashes recently, generating lower crash: ${crashPoint.toFixed(2)}x`);
    } else {
      // Generate a balanced crash point
      crashPoint = getLocalCrashPoint();
      console.log(`Generating balanced crash point: ${crashPoint.toFixed(2)}x`);
    }
    
    return parseFloat(crashPoint.toFixed(2));
  }, [getLocalCrashPoint]);

  // Generate the next crash point
  const generateNextCrashPoint = useCallback(async () => {
    try {
      console.log("Generating next crash point...");
      
      // If we've had too many errors, use local generation only
      if (errorCount > 3) {
        console.log("Too many errors, using local crash generator only");
        setIsUsingServerCrashPoints(false);
        return getLocalCrashPoint();
      }
      
      // Get recent crash points to generate next crash
      const recentCrashes = await getRecentCrashPoints();
      
      let nextCrashPoint: number;
      
      if (recentCrashes && recentCrashes.length > 0) {
        console.log("Using server crash points based on historical data");
        
        // Use server-generated crash point based on history
        nextCrashPoint = generateCrashPointFromHistory(recentCrashes);
        setIsUsingServerCrashPoints(true);
        console.log(`Generated crash point based on history: ${nextCrashPoint.toFixed(2)}x`);
      } else {
        // Fallback to client-side if no data
        console.log("No server crash data, using fallback generator");
        nextCrashPoint = getLocalCrashPoint();
        setIsUsingServerCrashPoints(false);
      }
      
      // Ensure the crash point is never below 1.01 to prevent immediate crashes
      if (nextCrashPoint < 1.01) {
        nextCrashPoint = 1.3;
        console.log(`Adjusted too low crash point to: ${nextCrashPoint.toFixed(2)}x`);
      }
      
      return nextCrashPoint;
    } catch (err) {
      console.error('Error generating next crash point:', err);
      setErrorCount(prev => prev + 1);
      
      // Use fallback crash point generation if server fails
      const fallbackCrashPoint = getLocalCrashPoint();
      
      setIsUsingServerCrashPoints(false);
      if (errorCount > 2) {
        toast.error("Server connection issues detected. Using local crash generator.", { position: 'top-center' });
      }
      
      return fallbackCrashPoint;
    }
  }, [errorCount, generateCrashPointFromHistory, getLocalCrashPoint, getRecentCrashPoints]);

  return {
    isUsingServerCrashPoints,
    generateNextCrashPoint,
    getLocalCrashPoint
  };
};
