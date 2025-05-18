
import { useCallback } from 'react';
import { Player } from './types';

// List of realistic usernames
const usernames = [
  'Crypto879', 'BetMaster', 'LuckyJohn', 'Poker_Pro', 'CoinFlip',
  'BigStakes', 'RiskTaker', 'FortuneX', 'WinStreak', 'BetKing',
  'CasinoRoyal', 'HighRoller', 'GameMaster', 'CryptoWhale', 'BetWinner',
  'LuckyDragon', 'DiceRoller', 'GoldMiner', 'CoinMaster', 'JackpotHunter',
  'DiamondHands', 'TokenChaser', 'BullMarket', 'CashFlow', 'MoneyMaker',
  'ChipStacker', 'AcesHigh', 'RoyalFlush', 'StackOverflow', 'GoldenTicket',
  'BlockchainBet', 'EtherWinner', 'SatoshiGambler', 'BetcoinMaster', 'CryptoKing',
  'MoonShot', 'DogeChamp', 'TokenWhale', 'CosmicCash', 'GalaxyGambler',
  'BitBaron', 'HashMaster', 'ChainRunner', 'VirtualVegas', 'DecentralizeDice',
  'MetaMask', 'TokenTrade', 'StakeKing', 'CoinVault', 'CryptoCasino'
];

// Generate a random amount ending with "00"
const generateRealisticAmount = (): number => {
  // Generate base amount between 1 and 100
  const baseAmount = Math.floor(Math.random() * 100) + 1;
  
  // Multiply by 100 to get amounts ending in 00
  return baseAmount * 100;
};

// Generate a player ID
const generatePlayerId = (): string => {
  return `fake-${Math.random().toString(36).substring(2, 15)}`;
};

// Generate random username or use from list
const generateUsername = (): string => {
  // 80% chance to use a predefined username, 20% chance to generate a random one
  if (Math.random() < 0.8) {
    return usernames[Math.floor(Math.random() * usernames.length)];
  } else {
    // Generate random alphanumeric username
    return `User${Math.floor(Math.random() * 10000)}`;
  }
};

export const useFakePlayers = () => {
  // Generate a batch of fake players
  const generateFakePlayers = useCallback((count: number): Player[] => {
    const fakePlayers: Player[] = [];
    
    // Generate between 500-1000 players
    const playerCount = Math.min(Math.max(count, 500), 1000);
    
    for (let i = 0; i < playerCount; i++) {
      fakePlayers.push({
        id: generatePlayerId(),
        name: generateUsername(),
        amount: generateRealisticAmount(),
        multiplier: null // Initially null as they're playing
      });
    }
    
    return fakePlayers;
  }, []);
  
  // Update fake players based on current game state and multiplier
  const updateFakePlayersWithGameProgress = useCallback((
    fakePlayers: Player[], 
    currentMultiplier: number, 
    crashPoint: number | null
  ): Player[] => {
    return fakePlayers.map(player => {
      // Skip players who have already cashed out
      if (player.multiplier !== null) {
        return player;
      }
      
      // Logic for deciding if a player cashes out at this multiplier
      const shouldCashOut = determineShouldCashOut(currentMultiplier, crashPoint);
      
      if (shouldCashOut) {
        return {
          ...player,
          multiplier: currentMultiplier
        };
      }
      
      return player;
    });
  }, []);
  
  // Handle game crash - set all remaining players as lost
  const handleCrash = useCallback((fakePlayers: Player[]): Player[] => {
    return fakePlayers.map(player => {
      // If player hasn't cashed out yet, they lost
      if (player.multiplier === null) {
        return {
          ...player,
          multiplier: 0 // Indicates a loss
        };
      }
      return player;
    });
  }, []);
  
  return {
    generateFakePlayers,
    updateFakePlayersWithGameProgress,
    handleCrash
  };
};

// Helper function to determine if a fake player should cash out at current multiplier
function determineShouldCashOut(currentMultiplier: number, crashPoint: number | null): boolean {
  // If the game has no crash point set yet, use a default high value
  const effectiveCrashPoint = crashPoint || 10.0;
  
  // Players become more likely to cash out as the multiplier increases
  let cashoutProbability = 0;
  
  if (currentMultiplier < 1.5) {
    // Few players cash out below 1.5x
    cashoutProbability = 0.001;
  } else if (currentMultiplier < 2.0) {
    // More cash out between 1.5x and 2.0x
    cashoutProbability = 0.005;
  } else if (currentMultiplier < 3.0) {
    // Even more cash out between 2.0x and 3.0x
    cashoutProbability = 0.01;
  } else if (currentMultiplier < 5.0) {
    // Higher cash out rate between 3.0x and 5.0x
    cashoutProbability = 0.02;
  } else if (currentMultiplier < 10.0) {
    // Most cautious players cash out between 5.0x and 10.0x
    cashoutProbability = 0.03;
  } else {
    // Very high cash out rate above 10.0x
    cashoutProbability = 0.05;
  }
  
  // Adjust probability based on how close we are to the crash point
  // The closer we get to the crash, the more players cash out
  if (crashPoint !== null && currentMultiplier > crashPoint * 0.7) {
    cashoutProbability += 0.03;
  }
  
  // Ensure we don't cash out after crash point
  if (crashPoint !== null && currentMultiplier >= crashPoint) {
    return false;
  }
  
  // Random chance to cash out
  return Math.random() < cashoutProbability;
}
