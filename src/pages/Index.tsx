
import React, { useState, useEffect, useCallback } from 'react';
import Multiplier from '@/components/game/Multiplier';
import BettingPanel from '@/components/game/BettingPanel';
import GameHistory from '@/components/game/GameHistory';
import LeaderBoard from '@/components/game/LeaderBoard';
import { toast } from 'sonner';

// Types
interface HistoryItem {
  id: string;
  multiplier: number;
}

interface Player {
  id: string;
  name: string;
  amount: number;
  multiplier: number | null;
}

// Game states
const GAME_STATE = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  CRASHED: 'crashed',
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

// Home page (Crash Game)
const Index = () => {
  // Game state
  const [gameState, setGameState] = useState<string>(GAME_STATE.WAITING);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(3);
  const [crashValue, setCrashValue] = useState<number | null>(null);
  const [playerBet, setPlayerBet] = useState<number | null>(null);
  const [playerAutoCashout, setPlayerAutoCashout] = useState<number | null>(null);
  const [playerWin, setPlayerWin] = useState<number | null>(null);
  
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

  // Generate a random crash point between 1.1 and 10
  const generateCrashPoint = useCallback((): number => {
    // This is a simplified version. Real crash games use complex algorithms
    // that ensure the house always has an edge in the long run
    return 1.1 + Math.random() * 8.9;
  }, []);

  // Handle game crash
  const handleCrash = useCallback((value: number) => {
    setGameState(GAME_STATE.CRASHED);
    setCrashValue(value);
    
    // Update game history
    setGameHistory(prev => {
      const newHistory = [
        { id: `game-${Date.now()}`, multiplier: value },
        ...prev.slice(0, 9)
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
    
    // Start countdown for next round
    setCountdownTimer(5);
  }, []);

  // Handle bet placement
  const handlePlaceBet = useCallback((amount: number, autoCashout: number | null) => {
    setPlayerBet(amount);
    setPlayerAutoCashout(autoCashout);
    setPlayerWin(null);
    
    // Add player to the game
    setPlayers(prev => [
      { id: 'player-user', name: 'You', amount, multiplier: null },
      ...prev.filter(p => p.id !== 'player-user')
    ]);
    
    // Simulate other players joining
    const randomOtherPlayers = generateRandomPlayers(Math.floor(Math.random() * 5) + 2);
    setPlayers(prev => [
      ...prev.filter(p => p.id === 'player-user'),
      ...randomOtherPlayers
    ]);
    
    // Start the game
    setGameState(GAME_STATE.PLAYING);
    setCrashValue(generateCrashPoint());
  }, [generateCrashPoint]);

  // Handle cashout
  const handleCashout = useCallback(() => {
    if (gameState === GAME_STATE.PLAYING && playerBet) {
      // Calculate current multiplier (this would normally come from the server)
      const currentMultiplier = crashValue ? crashValue * 0.8 : 2; // Simplified for demo
      
      // Update player status
      setPlayers(prev => 
        prev.map(player => {
          if (player.id === 'player-user') {
            return { ...player, multiplier: currentMultiplier };
          }
          return player;
        })
      );
      
      // Set player win
      setPlayerWin(currentMultiplier);
      
      // Show win notification
      toast.success(
        `You won $${(playerBet * currentMultiplier - playerBet).toFixed(2)}!`, 
        { position: 'top-center' }
      );
    }
  }, [gameState, playerBet, crashValue]);

  // Auto cashout logic
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING && playerAutoCashout !== null) {
      const checkInterval = setInterval(() => {
        const currentMultiplier = crashValue ? crashValue * Math.random() * 0.8 : 1.5; // Simplified
        
        if (currentMultiplier >= playerAutoCashout) {
          handleCashout();
          clearInterval(checkInterval);
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }
  }, [gameState, playerAutoCashout, handleCashout, crashValue]);

  // Countdown timer logic
  useEffect(() => {
    if (countdownTimer !== null && countdownTimer > 0) {
      const timer = setTimeout(() => {
        setCountdownTimer(prev => prev !== null ? prev - 0.1 : null);
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (countdownTimer !== null && countdownTimer <= 0) {
      // Reset game state
      setCountdownTimer(null);
      setGameState(GAME_STATE.WAITING);
      setCrashValue(null);
      setPlayerBet(null);
      setPlayerAutoCashout(null);
      setPlayerWin(null);
      
      // Reset players
      setPlayers(generateRandomPlayers(Math.floor(Math.random() * 8) + 5));
    }
  }, [countdownTimer]);

  // Random players auto-cashout
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING) {
      // Simulate other players cashing out at random times
      players.forEach(player => {
        if (player.id !== 'player-user' && player.multiplier === null) {
          const randomTime = Math.random() * 5000 + 1000; // 1-6 seconds
          const randomMultiplier = 1 + Math.random() * 5; // 1-6x
          
          setTimeout(() => {
            // Only cash out if game is still in progress
            if (gameState === GAME_STATE.PLAYING) {
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

  return (
    <div className="w-full">
      {/* Game History */}
      <div className="w-full">
        <GameHistory history={gameHistory} />
      </div>
      
      {/* Game area with multiplier, betting panel and leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Betting Panel (Left on desktop) */}
        <div className="lg:col-span-3 order-3 lg:order-1">
          <BettingPanel
            isPlaying={gameState === GAME_STATE.PLAYING}
            isCrashed={gameState === GAME_STATE.CRASHED}
            hasWon={playerWin !== null}
            onPlaceBet={handlePlaceBet}
            onCashout={handleCashout}
            remainingTime={countdownTimer}
          />
        </div>
        
        {/* Multiplier Chart (Center) */}
        <div className="lg:col-span-6 order-1 lg:order-2 bg-[#131c29] rounded-md flex items-center justify-center min-h-[240px] md:min-h-[320px] p-4">
          <Multiplier 
            isPlaying={gameState === GAME_STATE.PLAYING}
            isCrashed={gameState === GAME_STATE.CRASHED}
            winValue={playerWin}
            crashValue={crashValue}
            onCrash={handleCrash}
          />
        </div>
        
        {/* Leaderboard (Right) */}
        <div className="lg:col-span-3 order-2 lg:order-3">
          <LeaderBoard players={players} />
        </div>
      </div>
    </div>
  );
};

export default Index;
