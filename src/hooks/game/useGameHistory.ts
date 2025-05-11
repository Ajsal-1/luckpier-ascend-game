
import { useState, useCallback, useRef } from 'react';
import { HistoryItem, Player } from './types';
import { generateRandomPlayers } from './gameUtils';
import { supabase } from '@/integrations/supabase/client';

export const useGameHistory = () => {
  // History and players state
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([]);
  const [players, setPlayers] = useState<Player[]>(generateRandomPlayers(10));
  const fetchingRef = useRef(false);

  // Fetch game history from Supabase
  const fetchGameHistory = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('id, crash_multiplier, ended_at')
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const historyItems: HistoryItem[] = data.map(round => ({
          id: round.id,
          multiplier: parseFloat(round.crash_multiplier.toString()), // Convert to string first before parsing
          timestamp: round.ended_at || new Date().toISOString()
        }));
        
        setGameHistory(historyItems);
      } else if (gameHistory.length === 0) {
        // Set some fallback history if none exists in database
        const currentTime = new Date().toISOString();
        setGameHistory([
          { id: 'game-1', multiplier: 1.27, timestamp: currentTime },
          { id: 'game-2', multiplier: 2.48, timestamp: currentTime },
          { id: 'game-3', multiplier: 7.32, timestamp: currentTime },
          { id: 'game-4', multiplier: 1.07, timestamp: currentTime },
          { id: 'game-5', multiplier: 1.20, timestamp: currentTime },
          { id: 'game-6', multiplier: 1.54, timestamp: currentTime },
        ]);
      }
    } catch (err) {
      console.error('Error fetching game history:', err);
    } finally {
      fetchingRef.current = false;
    }
  }, [gameHistory.length]);

  // Update history when game crashes
  const updateGameHistory = useCallback((multiplier: number) => {
    const timestamp = new Date().toISOString();
    
    setGameHistory(prev => {
      const newHistory = [
        { id: `game-${Date.now()}`, multiplier, timestamp },
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
    
    // Re-fetch history to sync with server
    fetchGameHistory();
  }, [fetchGameHistory]);

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
    fetchGameHistory,
  };
};
