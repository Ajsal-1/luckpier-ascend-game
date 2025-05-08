
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Types
export interface HistoryItem {
  id: string;
  multiplier: number;
}

export interface Player {
  id: string;
  name: string;
  amount: number;
  multiplier: number | null;
}

// Game states
export const GAME_STATE = {
  WAITING: 'waiting',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  CRASHED: 'crashed',
};

// Function to calculate crash point (as specified in the requirements)
export const getCrashMultiplier = (): number => {
  if (Math.floor(Math.random() * 33) === 0) return 1.00;
  const r = Math.random();
  const multiplier = Math.max(1.00, Math.round(1.0 / (1.0 - r) * 100) / 100);
  return Math.min(multiplier, 1000.0);
};

// Generate random names
const randomNames = [
  'CryptoKing', 'LuckyJack', 'MoonRunner', 'DiamondHands', 'RocketMan',
  'BitQueen', 'WhaleTrade', 'SatoshiFan', 'BlockChaser', 'CoinFlip',
  'TokenMaster', 'HashRacer', 'CryptoCraze', 'BullMarket', 'ChainGang'
];

const getRandomName = (): string => {
  return randomNames[Math.floor(Math.random() * randomNames.length)];
};

// Generate random players
const generateRandomPlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i}`,
    name: getRandomName(),
    amount: Math.floor(Math.random() * 10000) / 100 + 10,
    multiplier: null,
  }));
};

export const useCrashGame = (initialBalance: number = 1000) => {
  // User state
  const [userBalance, setUserBalance] = useState<number>(initialBalance);
  
  // Game state
  const [gameState, setGameState] = useState<string>(GAME_STATE.WAITING);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(3);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [playerBet, setPlayerBet] = useState<number | null>(null);
  const [playerAutoCashout, setPlayerAutoCashout] = useState<number | null>(null);
  const [playerWin, setPlayerWin] = useState<number | null>(null);
  const [isBetPlaced, setIsBetPlaced] = useState<boolean>(false);
  
  // History and players
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([
    { id: 'game-1', multiplier: 1.27 },
    { id: 'game-2', multiplier: 2.48 },
    { id: 'game-3', multiplier: 7.32 },
    { id: 'game-4', multiplier: 1.07 },
    { id: 'game-5', multiplier: 1.20 },
    { id: 'game-6', multiplier: 1.54 },
  ]);
  const [players, setPlayers] = useState<Player[]>(generateRandomPlayers(10));

  // Use refs to preserve values between renders for timers
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  
  // Start the game countdown
  const startCountdown = useCallback(() => {
    setGameState(GAME_STATE.COUNTDOWN);
    setCountdownTimer(3);
    
    // Generate crash point at the start of countdown
    const newCrashPoint = getCrashMultiplier();
    setCrashPoint(newCrashPoint);
    console.log(`Generated crash point: ${newCrashPoint}x`);
  }, []);

  // Handle game crash
  const handleCrash = useCallback((value: number) => {
    setGameState(GAME_STATE.CRASHED);
    
    // Update game history
    setGameHistory(prev => {
      const newHistory = [
        { id: `game-${Date.now()}`, multiplier: value },
        ...prev.slice(0, 19) // Keep only the 20 most recent games
      ];
      return newHistory;
    });
    
    // Update players
    setPlayers(prev => 
      prev.map(player => {
        if (player.multiplier === null) {
          return { ...player, multiplier: 0 }; // Lost
        }
        return player;
      })
    );
    
    // Start cooldown for next round
    setCountdownTimer(3);
  }, []);

  // Handle bet placement
  const handlePlaceBet = useCallback((amount: number, autoCashout: number | null) => {
    // Only allow placing bets if not already in a round
    if (gameState === GAME_STATE.PLAYING) {
      toast.error("Round already in progress. Wait for the next round.", { position: 'top-center' });
      return;
    }
    
    if (isBetPlaced) {
      toast.error("You already have a bet placed for this round.", { position: 'top-center' });
      return;
    }
    
    // Deduct bet amount from balance
    setUserBalance(prev => prev - amount);
    
    setPlayerBet(amount);
    setPlayerAutoCashout(autoCashout);
    setPlayerWin(null);
    setIsBetPlaced(true);
    
    toast.success("Bet placed successfully!", { position: 'top-center' });
    
    // Add player to the game
    setPlayers(prev => [
      { id: 'player-user', name: 'You', amount, multiplier: null },
      ...prev.filter(p => p.id !== 'player-user')
    ]);
    
    // If no game is in progress, start one
    if (gameState === GAME_STATE.WAITING) {
      startCountdown();
    }
  }, [gameState, startCountdown, isBetPlaced]);

  // Handle cashout
  const handleCashout = useCallback(() => {
    if (gameState === GAME_STATE.PLAYING && playerBet !== null) {
      // Update player status
      setPlayers(prev => 
        prev.map(player => {
          if (player.id === 'player-user') {
            return { ...player, multiplier: currentMultiplier };
          }
          return player;
        })
      );
      
      // Calculate winnings
      const winnings = playerBet * currentMultiplier;
      const profit = winnings - playerBet;
      
      // Update balance
      setUserBalance(prev => prev + winnings);
      
      // Set player win
      setPlayerWin(currentMultiplier);
      
      // Show win notification
      toast.success(
        `You won $${profit.toFixed(2)}!`, 
        { position: 'top-center' }
      );
    }
  }, [gameState, playerBet, currentMultiplier]);

  // Countdown timer logic
  useEffect(() => {
    if (countdownTimer !== null && countdownTimer > 0) {
      const timer = setTimeout(() => {
        setCountdownTimer(prev => {
          if (prev === null) return null;
          const newValue = prev - 0.1;
          
          // When countdown reaches zero, start the game
          if (newValue <= 0 && gameStateRef.current === GAME_STATE.COUNTDOWN) {
            setGameState(GAME_STATE.PLAYING);
            setCurrentMultiplier(1);
            return null;
          }
          
          // When cooldown after crash reaches zero, reset for new round
          if (newValue <= 0 && gameStateRef.current === GAME_STATE.CRASHED) {
            setGameState(GAME_STATE.WAITING);
            setCrashPoint(null);
            setCurrentMultiplier(1);
            setPlayerBet(null);
            setPlayerAutoCashout(null);
            setPlayerWin(null);
            setIsBetPlaced(false); // Reset bet placement status
            setPlayers(generateRandomPlayers(Math.floor(Math.random() * 8) + 5));
            return null;
          }
          
          return Math.max(0, newValue); // Prevent negative values
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [countdownTimer]);

  // Auto cashout logic
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING && 
        playerAutoCashout !== null && 
        currentMultiplier >= playerAutoCashout && 
        playerWin === null) {
      handleCashout();
    }
  }, [gameState, playerAutoCashout, currentMultiplier, playerWin, handleCashout]);

  // Simulate other players behavior
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING) {
      // Simulate other players cashing out at random times
      players.forEach(player => {
        if (player.id !== 'player-user' && player.multiplier === null) {
          const randomTime = Math.random() * 5000 + 1000; // 1-6 seconds
          const randomMultiplier = 1.1 + Math.random() * 5; // 1.1-6.1x
          
          setTimeout(() => {
            // Only cash out if game is still in progress
            if (gameStateRef.current === GAME_STATE.PLAYING) {
              setPlayers(prev => 
                prev.map(p => {
                  if (p.id === player.id) {
                    return { ...p, multiplier: randomMultiplier };
                  }
                  return p;
                })
              );
            }
          }, randomTime);
        }
      });
    }
  }, [gameState, players]);

  return {
    userBalance,
    gameState,
    countdownTimer,
    crashPoint,
    currentMultiplier,
    playerWin,
    isBetPlaced,
    gameHistory,
    players,
    handlePlaceBet,
    handleCashout,
    handleCrash,
    setCurrentMultiplier,
  };
};
