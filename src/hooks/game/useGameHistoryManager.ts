
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HistoryItem, Player } from './types';
import { useFakePlayers } from './useFakePlayers';

export const useGameHistoryManager = () => {
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fakePlayers, setFakePlayers] = useState<Player[]>([]);
  const [realPlayers, setRealPlayers] = useState<Player[]>([]);
  
  // Get fake players utilities
  const { generateFakePlayers, updateFakePlayersWithGameProgress, handleCrash } = useFakePlayers();

  // Initialize fake players
  useEffect(() => {
    // Generate between 500-1000 fake players
    const playerCount = Math.floor(Math.random() * 501) + 500;
    setFakePlayers(generateFakePlayers(playerCount));
  }, [generateFakePlayers]);

  // Fetch game history from database
  const fetchGameHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get the 10 most recent completed rounds
      const { data, error } = await supabase
        .from('rounds')
        .select('id, crash_multiplier, ended_at')
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      if (data) {
        // Map to HistoryItem format
        const historyItems: HistoryItem[] = data.map(round => ({
          id: round.id,
          multiplier: round.crash_multiplier,
          timestamp: round.ended_at || new Date().toISOString()
        }));
        
        setGameHistory(historyItems);
      }
    } catch (err) {
      console.error('Error fetching game history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch players for current round
  const fetchPlayers = useCallback(async (roundId: string | null) => {
    if (!roundId) return;
    
    try {
      const { data, error } = await supabase
        .from('player_bets')
        .select('id, user_id, bet_amount, cashed_out_multiplier')
        .eq('round_id', roundId);
      
      if (error) throw error;
      
      if (data) {
        // Map to Player format
        const playersList: Player[] = data.map(bet => ({
          id: bet.id,
          name: bet.user_id?.substring(0, 8) || 'Anonymous',
          amount: bet.bet_amount,
          multiplier: bet.cashed_out_multiplier
        }));
        
        // Store real players separately
        setRealPlayers(playersList);
        
        // Combine real players with fake players
        const combinedPlayers = [...playersList, ...fakePlayers];
        setPlayers(combinedPlayers);
      }
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  }, [fakePlayers]);

  // Update fake players based on current multiplier
  const updateFakePlayers = useCallback((currentMultiplier: number, crashPoint: number | null) => {
    setFakePlayers(prevFakePlayers => {
      const updatedFakePlayers = updateFakePlayersWithGameProgress(
        prevFakePlayers, 
        currentMultiplier, 
        crashPoint
      );
      
      // Update combined players list
      setPlayers([...realPlayers, ...updatedFakePlayers]);
      
      return updatedFakePlayers;
    });
  }, [realPlayers, updateFakePlayersWithGameProgress]);

  // Handle crash - mark all remaining fake players as lost
  const handleFakePlayersCrash = useCallback(() => {
    setFakePlayers(prevFakePlayers => {
      const updatedFakePlayers = handleCrash(prevFakePlayers);
      
      // Update combined players list
      setPlayers([...realPlayers, ...updatedFakePlayers]);
      
      return updatedFakePlayers;
    });
  }, [handleCrash, realPlayers]);

  // Update history when a new crash occurs
  const updateGameHistory = useCallback((crashMultiplier: number) => {
    const newHistoryItem: HistoryItem = {
      id: `local-${Date.now()}`,
      multiplier: crashMultiplier,
      timestamp: new Date().toISOString()
    };
    
    setGameHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
    
    // Handle fake players crash
    handleFakePlayersCrash();
    
    // Re-fetch from database to ensure consistency
    fetchGameHistory();
  }, [fetchGameHistory, handleFakePlayersCrash]);

  // Reset players for new round
  const resetPlayers = useCallback(() => {
    // Generate new fake players for the new round
    const playerCount = Math.floor(Math.random() * 501) + 500;
    const newFakePlayers = generateFakePlayers(playerCount);
    setFakePlayers(newFakePlayers);
    
    // Reset real players
    setRealPlayers([]);
    
    // Set combined players
    setPlayers(newFakePlayers);
  }, [generateFakePlayers]);

  // Initial data fetch on mount
  useEffect(() => {
    fetchGameHistory();

    // Subscribe to database changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rounds',
      }, () => {
        fetchGameHistory();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGameHistory]);

  return {
    gameHistory,
    players,
    isLoading,
    fetchGameHistory,
    fetchPlayers,
    updateGameHistory,
    resetPlayers,
    setPlayers,
    updateFakePlayers  // Export this to be used by the game engine
  };
};
