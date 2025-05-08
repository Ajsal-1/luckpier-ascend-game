
import { useState, useCallback } from 'react';
import { HistoryItem, Player } from './types';
import { generateRandomPlayers } from './gameUtils';

export const useGameHistory = () => {
  // History and players state
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([
    { id: 'game-1', multiplier: 1.27 },
    { id: 'game-2', multiplier: 2.48 },
    { id: 'game-3', multiplier: 7.32 },
    { id: 'game-4', multiplier: 1.07 },
    { id: 'game-5', multiplier: 1.20 },
    { id: 'game-6', multiplier: 1.54 },
  ]);
  const [players, setPlayers] = useState<Player[]>(generateRandomPlayers(10));

  // Update history when game crashes
  const updateGameHistory = useCallback((multiplier: number) => {
    setGameHistory(prev => {
      const newHistory = [
        { id: `game-${Date.now()}`, multiplier: multiplier },
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
  }, []);

  // Generate new players for the next round
  const resetPlayers = useCallback(() => {
    setPlayers(generateRandomPlayers(Math.floor(Math.random() * 8) + 5));
  }, []);

  return {
    gameHistory,
    players,
    setGameHistory,
    setPlayers,
    updateGameHistory,
    resetPlayers,
  };
};
