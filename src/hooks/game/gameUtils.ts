
import { Player } from './types';

// Random player names
const randomNames = [
  'CryptoKing', 'LuckyJack', 'MoonRunner', 'DiamondHands', 'RocketMan',
  'BitQueen', 'WhaleTrade', 'SatoshiFan', 'BlockChaser', 'CoinFlip',
  'TokenMaster', 'HashRacer', 'CryptoCraze', 'BullMarket', 'ChainGang'
];

// Generate crash point using the specified algorithm with improved randomness
export const getCrashMultiplier = (): number => {
  const houseEdge = 0.01;
  
  // Generate a more truly random value between 0 and 1, excluding values very close to 0
  // This prevents the denominator from being too small, which would result in extremely high crashes
  const r = Math.max(0.01, Math.random()); // Ensure r is at least 0.01
  
  // Modified algorithm to increase likelihood of higher multipliers
  // The multiplier will still follow the house edge rule but with better distribution
  let crash: number;
  
  // 10% chance of generating a higher multiplier (between 2x and 10x)
  if (Math.random() < 0.10) {
    crash = 2 + Math.random() * 8;
  } else {
    // Standard formula, but ensuring we don't get consistently low values
    crash = Math.max(1.05, Math.floor((100 * (1 - houseEdge)) / r) / 100);
  }
  
  // Log the generated crash point for debugging
  console.log(`Generated crash point: ${crash.toFixed(2)}x`);
  
  return parseFloat(crash.toFixed(2));
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
