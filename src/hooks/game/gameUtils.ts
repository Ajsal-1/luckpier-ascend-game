
import { Player } from './types';

// Random player names
const randomNames = [
  'CryptoKing', 'LuckyJack', 'MoonRunner', 'DiamondHands', 'RocketMan',
  'BitQueen', 'WhaleTrade', 'SatoshiFan', 'BlockChaser', 'CoinFlip',
  'TokenMaster', 'HashRacer', 'CryptoCraze', 'BullMarket', 'ChainGang'
];

// Function to calculate crash point
export const getCrashMultiplier = (): number => {
  if (Math.floor(Math.random() * 33) === 0) return 1.00;
  const r = Math.random();
  const multiplier = Math.max(1.00, Math.round(1.0 / (1.0 - r) * 100) / 100);
  return Math.min(multiplier, 1000.0);
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
