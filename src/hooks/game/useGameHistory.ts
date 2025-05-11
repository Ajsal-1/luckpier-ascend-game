
import { useState, useCallback, useRef } from 'react';
import { HistoryItem, Player } from './types';
import { supabase } from '@/integrations/supabase/client';

export const useGameHistory = () => {
  // History and players state
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
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
          multiplier: parseFloat(round.crash_multiplier.toString()), // Convert to number consistently
          timestamp: round.ended_at || new Date().toISOString()
        }));
        
        setGameHistory(historyItems);
        console.log(`Fetched ${historyItems.length} history items`);
      } else {
        // Reset history but don't set fallback data - only use real Supabase data
        setGameHistory([]);
      }
    } catch (err) {
      console.error('Error fetching game history:', err);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Update game history when a new round is completed
  const updateGameHistory = useCallback((multiplier: number) => {
    // Don't create local history items anymore, just refetch from Supabase
    fetchGameHistory();
    
    // Update players - mark those who didn't cash out as losers
    setPlayers(prev => 
      prev.map(player => {
        if (player.multiplier === null) {
          return { ...player, multiplier: 0 }; // Lost
        }
        return player;
      })
    );
    
    console.log(`Updated game history with crash at ${multiplier.toFixed(2)}x`);
  }, [fetchGameHistory]);

  // Reset players state for the next round
  const resetPlayers = useCallback(() => {
    setPlayers([]);
    console.log('Reset players for new round');
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
