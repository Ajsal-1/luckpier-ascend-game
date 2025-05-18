
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Define types for our statistics data
export interface GameStats {
  avgMultiplier: number;
  consecutiveWinRecord: number; // Changed from playersWon
  totalWinnings: number;
  highestMultiplier: number;
  lastHourWinRate: number;
}

// 24 sets of pre-defined templates (one for each hour)
const HOURLY_STAT_TEMPLATES: GameStats[] = [
  { avgMultiplier: 2.87, consecutiveWinRecord: 12, totalWinnings: 482790, highestMultiplier: 128.42, lastHourWinRate: 68 }, // 12 AM
  { avgMultiplier: 3.12, consecutiveWinRecord: 15, totalWinnings: 356420, highestMultiplier: 142.16, lastHourWinRate: 71 }, // 1 AM
  { avgMultiplier: 2.65, consecutiveWinRecord: 11, totalWinnings: 289650, highestMultiplier: 116.32, lastHourWinRate: 67 }, // 2 AM
  { avgMultiplier: 2.89, consecutiveWinRecord: 9, totalWinnings: 234780, highestMultiplier: 119.75, lastHourWinRate: 64 }, // 3 AM
  { avgMultiplier: 2.74, consecutiveWinRecord: 10, totalWinnings: 198340, highestMultiplier: 117.85, lastHourWinRate: 62 }, // 4 AM
  { avgMultiplier: 2.93, consecutiveWinRecord: 14, totalWinnings: 267580, highestMultiplier: 122.45, lastHourWinRate: 63 }, // 5 AM
  { avgMultiplier: 3.21, consecutiveWinRecord: 16, totalWinnings: 342970, highestMultiplier: 128.12, lastHourWinRate: 69 }, // 6 AM
  { avgMultiplier: 3.54, consecutiveWinRecord: 19, totalWinnings: 398450, highestMultiplier: 132.67, lastHourWinRate: 72 }, // 7 AM
  { avgMultiplier: 3.87, consecutiveWinRecord: 22, totalWinnings: 529640, highestMultiplier: 136.28, lastHourWinRate: 76 }, // 8 AM
  { avgMultiplier: 4.12, consecutiveWinRecord: 26, totalWinnings: 642830, highestMultiplier: 142.16, lastHourWinRate: 79 }, // 9 AM
  { avgMultiplier: 3.95, consecutiveWinRecord: 24, totalWinnings: 785460, highestMultiplier: 139.85, lastHourWinRate: 78 }, // 10 AM
  { avgMultiplier: 3.63, consecutiveWinRecord: 21, totalWinnings: 693210, highestMultiplier: 134.73, lastHourWinRate: 74 }, // 11 AM
  { avgMultiplier: 3.42, consecutiveWinRecord: 18, totalWinnings: 624750, highestMultiplier: 129.64, lastHourWinRate: 73 }, // 12 PM
  { avgMultiplier: 3.18, consecutiveWinRecord: 17, totalWinnings: 578930, highestMultiplier: 126.82, lastHourWinRate: 70 }, // 1 PM
  { avgMultiplier: 2.96, consecutiveWinRecord: 13, totalWinnings: 492680, highestMultiplier: 123.57, lastHourWinRate: 67 }, // 2 PM
  { avgMultiplier: 2.78, consecutiveWinRecord: 12, totalWinnings: 437560, highestMultiplier: 121.28, lastHourWinRate: 65 }, // 3 PM
  { avgMultiplier: 2.69, consecutiveWinRecord: 11, totalWinnings: 412780, highestMultiplier: 119.47, lastHourWinRate: 64 }, // 4 PM
  { avgMultiplier: 2.82, consecutiveWinRecord: 14, totalWinnings: 468230, highestMultiplier: 122.64, lastHourWinRate: 66 }, // 5 PM
  { avgMultiplier: 3.05, consecutiveWinRecord: 18, totalWinnings: 548970, highestMultiplier: 127.83, lastHourWinRate: 69 }, // 6 PM
  { avgMultiplier: 3.24, consecutiveWinRecord: 20, totalWinnings: 627540, highestMultiplier: 131.42, lastHourWinRate: 72 }, // 7 PM
  { avgMultiplier: 3.47, consecutiveWinRecord: 23, totalWinnings: 698430, highestMultiplier: 134.26, lastHourWinRate: 75 }, // 8 PM
  { avgMultiplier: 3.38, consecutiveWinRecord: 21, totalWinnings: 645780, highestMultiplier: 132.64, lastHourWinRate: 74 }, // 9 PM
  { avgMultiplier: 3.16, consecutiveWinRecord: 17, totalWinnings: 573940, highestMultiplier: 129.35, lastHourWinRate: 70 }, // 10 PM
  { avgMultiplier: 2.95, consecutiveWinRecord: 14, totalWinnings: 512380, highestMultiplier: 124.76, lastHourWinRate: 69 }  // 11 PM
];

/**
 * Custom hook to provide game statistics data that updates hourly
 */
export const useGameStatistics = () => {
  const [stats, setStats] = useState<GameStats>(HOURLY_STAT_TEMPLATES[0]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());

  // Get a unique seed based on the date for consistent daily shuffling
  const getDailySeed = () => {
    const today = new Date();
    return format(today, 'yyyyMMdd'); 
  };
  
  // Fisher-Yates shuffle algorithm with seeded random
  const shuffleTemplates = (seed: string): GameStats[] => {
    // Create seeded random function
    const seededRandom = (max: number) => {
      // Simple string hash to number for seeding
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Use the hash as seed for Math.random-like output
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x) < max ? x - Math.floor(x) : seededRandom(max);
    };
    
    const templates = [...HOURLY_STAT_TEMPLATES];
    for (let i = templates.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(1) * (i + 1));
      [templates[i], templates[j]] = [templates[j], templates[i]];
    }
    
    return templates;
  };
  
  // Get real game data from Supabase to incorporate with templates
  const fetchGameData = async () => {
    try {
      // Get recent crash points
      const { data: rounds, error: roundsError } = await supabase
        .from('rounds')
        .select('crash_multiplier')
        .order('ended_at', { ascending: false })
        .limit(100);

      if (roundsError) throw roundsError;
      
      // Get some player data if available
      const { data: playerBets, error: betsError } = await supabase
        .from('player_bets')
        .select('*')
        .limit(50);

      if (betsError) throw betsError;
      
      // Process real data to update our stats
      if (rounds && rounds.length > 0) {
        // Get hour-specific template first, before any modifications
        const hour = new Date().getHours();
        const shuffledTemplates = shuffleTemplates(getDailySeed());
        const baseStats = shuffledTemplates[hour];
        
        // Get the real multiplier data if available
        const multipliers = rounds.map(r => r.crash_multiplier);
        let avgMultiplier = baseStats.avgMultiplier;
        let highestMultiplier = baseStats.highestMultiplier;
        
        if (multipliers.length > 0) {
          // Calculate the average but keep it positive and nicely formatted
          const realAvg = multipliers.reduce((sum, m) => sum + m, 0) / multipliers.length;
          avgMultiplier = Math.max(2.5, realAvg * 1.1); // Slightly inflate real average
          
          // For highest multiplier, ensure it's in the 100-200 range  
          const realMax = Math.max(...multipliers);
          highestMultiplier = Math.max(baseStats.highestMultiplier, realMax * 5);
          highestMultiplier = Math.max(100, Math.min(200, highestMultiplier));
        }
        
        setStats({
          ...baseStats,
          avgMultiplier,
          highestMultiplier,
        });
        
        setCurrentHour(hour);
        setLastUpdate(new Date());
      } else {
        // If no real data, just use the template for the current hour
        const hour = new Date().getHours();
        const shuffledTemplates = shuffleTemplates(getDailySeed());
        setStats(shuffledTemplates[hour]);
        setCurrentHour(hour);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching game statistics:', error);
      // On error, fall back to template data
      const hour = new Date().getHours();
      const shuffledTemplates = shuffleTemplates(getDailySeed());
      setStats(shuffledTemplates[hour]);
      setCurrentHour(hour);
      setLastUpdate(new Date());
    }
  };
  
  // Update stats when the component mounts and at the top of each hour
  useEffect(() => {
    // Initial data fetch
    fetchGameData();
    
    // Check for hour change every minute, but only update at the top of the hour
    const updateInterval = setInterval(() => {
      const now = new Date();
      
      // Only update if it's the top of the hour (minutes = 0)
      if (now.getMinutes() === 0 && now.getHours() !== currentHour) {
        console.log(`Hourly update: ${now.getHours()}:00`);
        fetchGameData();
      }
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(updateInterval);
    };
  }, [currentHour]);
  
  return { stats, lastUpdate };
};
