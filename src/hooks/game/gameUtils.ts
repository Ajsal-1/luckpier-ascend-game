
import { Player } from './types';

// Random player names
const randomNames = [
  'CryptoKing', 'LuckyJack', 'MoonRunner', 'DiamondHands', 'RocketMan',
  'BitQueen', 'WhaleTrade', 'SatoshiFan', 'BlockChaser', 'CoinFlip',
  'TokenMaster', 'HashRacer', 'CryptoCraze', 'BullMarket', 'ChainGang'
];

// Generate crash point using the specified algorithm
export const getCrashMultiplier = (): number => {
  const houseEdge = 0.01;
  const r = Math.random();
  const crash = Math.max(1.0, Math.floor((100 * (1 - houseEdge)) / r) / 100);
  
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
