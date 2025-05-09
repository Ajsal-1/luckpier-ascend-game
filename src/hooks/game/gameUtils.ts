
import { Player } from './types';

// Random player names
const randomNames = [
  'CryptoKing', 'LuckyJack', 'MoonRunner', 'DiamondHands', 'RocketMan',
  'BitQueen', 'WhaleTrade', 'SatoshiFan', 'BlockChaser', 'CoinFlip',
  'TokenMaster', 'HashRacer', 'CryptoCraze', 'BullMarket', 'ChainGang'
];

// Generate crash point with proper distribution for exciting gameplay
export const getCrashMultiplier = (): number => {
  // Basic distribution with house edge
  const houseEdge = 0.01;
  
  // Generate a random value between 0 and 1 that avoids values too close to 0
  // to prevent extremely high crashes
  const r = Math.max(0.01, Math.random());
  
  let crash: number;
  
  // 80% chance of normal multiplier (1.2x to 3x)
  if (Math.random() < 0.8) {
    crash = 1.2 + Math.random() * 1.8;
  }
  // 15% chance of medium multiplier (3x to 10x)
  else if (Math.random() < 0.95) {
    crash = 3 + Math.random() * 7;
  }
  // 5% chance of high multiplier (10x to 30x)
  else {
    crash = 10 + Math.random() * 20;
  }
  
  // Round to 2 decimal places
  const roundedCrash = parseFloat(crash.toFixed(2));
  
  // Log the generated crash point for debugging
  console.log(`Generated crash point: ${roundedCrash}x`);
  
  return roundedCrash;
};

// Get a random player name
export const getRandomName = (): string => {
  return randomNames[Math.floor(Math.random() * randomNames.length)];
};

// Generate random players for the game
export const generateRandomPlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: getRandomName(),
    amount: Math.floor(Math.random() * 10000) / 100 + 10,
    multiplier: null,
  }));
};

// Generate a fallback crash point for when Supabase fails
// This ensures we have realistic crash points even without the database
export const getServerFallbackCrashPoint = (): number => {
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
  
  return parseFloat(crashPoint.toFixed(2));
};

// Helper function to analyze crash history and determine if we need to adjust the next crash
export const analyzeRecentCrashes = (recentCrashes: number[]): { 
  needHighCrash: boolean, 
  needLowCrash: boolean 
} => {
  if (!recentCrashes || recentCrashes.length === 0) {
    return { needHighCrash: false, needLowCrash: false };
  }
  
  // Count recent low and high crashes
  let lowCrashCount = 0;
  let highCrashCount = 0;
  
  for (const crash of recentCrashes) {
    if (crash < 2.0) lowCrashCount++;
    if (crash > 5.0) highCrashCount++;
  }
  
  // Calculate the average crash value
  const avgCrash = recentCrashes.reduce((sum, value) => sum + value, 0) / recentCrashes.length;
  
  // If we've had several low crashes in a row, we might need a high one
  const needHighCrash = lowCrashCount >= 3 || avgCrash < 2.0;
  
  // If we've had several high crashes in a row, we might need a low one
  const needLowCrash = highCrashCount >= 2 || avgCrash > 4.0;
  
  return { needHighCrash, needLowCrash };
};

// Generate server-side crash point based on history
export const generateServerCrashPoint = (recentCrashes: number[]): number => {
  const { needHighCrash, needLowCrash } = analyzeRecentCrashes(recentCrashes);
  
  let crashPoint: number;
  
  if (needHighCrash && Math.random() < 0.7) {
    // Generate a higher crash point with 70% probability
    crashPoint = 3 + Math.random() * 12;
  } else if (needLowCrash && Math.random() < 0.7) {
    // Generate a lower crash point with 70% probability
    crashPoint = 1.2 + Math.random() * 1.3;
  } else {
    // Generate a balanced crash point
    crashPoint = getServerFallbackCrashPoint();
  }
  
  return parseFloat(crashPoint.toFixed(2));
};
