
import { useEffect, useState } from 'react';
import { GAME_STATE } from './game/types';
import { useGameState } from './game/useGameState';
import { usePlayerActions } from './game/usePlayerActions';
import { useGameHistory } from './game/useGameHistory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export { GAME_STATE } from './game/types';
export type { HistoryItem, Player } from './game/types';

export const useCrashGame = (initialBalance: number = 1000) => {
  // Track if we're using server-side crash points
  const [isUsingServerCrashPoints, setIsUsingServerCrashPoints] = useState<boolean>(false);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Get game state logic
  const {
    gameState,
    countdownTimer,
    crashPoint,
    currentMultiplier,
    gameStateRef,
    setGameState,
    setCountdownTimer,
    setCrashPoint,
    setCurrentMultiplier,
    startCountdown,
    handleCrash: handleCrashState
  } = useGameState();

  // Get game history logic
  const {
    gameHistory,
    players,
    setPlayers,
    updateGameHistory,
    resetPlayers,
    fetchGameHistory
  } = useGameHistory();

  // Get player actions
  const {
    userBalance,
    playerBet,
    playerAutoCashout,
    playerWin,
    isBetPlaced,
    handlePlaceBet,
    handleCashout,
    setPlayerBet,
    setPlayerAutoCashout,
    setPlayerWin,
    setIsBetPlaced,
    setUserBalance
  } = usePlayerActions({
    gameState,
    currentMultiplier,
    setPlayers,
    startCountdown
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      // If authenticated, fetch user balance from profiles
      if (data.session) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData && !error) {
          setUserBalance(profileData.balance || initialBalance);
        }
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      setIsAuthenticated(event !== 'SIGNED_OUT');
      checkAuth();
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initialBalance, setUserBalance]);

  // Fetch game history on component mount
  useEffect(() => {
    fetchGameHistory();
    
    // Subscribe to changes in rounds table
    const roundsChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rounds',
      }, (payload) => {
        fetchGameHistory();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(roundsChannel);
    };
  }, [fetchGameHistory]);

  // Handle crash with history update and database update
  const handleCrash = async (value: number) => {
    handleCrashState(value);
    updateGameHistory(value);
    
    // Update round in database if we have a current round
    if (currentRoundId && isUsingServerCrashPoints) {
      try {
        const { error } = await supabase
          .from('rounds')
          .update({ 
            ended_at: new Date().toISOString(),
            status: 'completed' 
          })
          .eq('id', currentRoundId);
          
        if (error) throw error;
        
        // Update player bets that didn't cash out as lost
        if (isBetPlaced && playerWin === null) {
          const { error: betError } = await supabase
            .from('player_bets')
            .update({ status: 'lost' })
            .eq('round_id', currentRoundId)
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .is('cashed_out_multiplier', null);
            
          if (betError) throw betError;
        }
      } catch (err) {
        console.error('Error updating round on crash:', err);
      }
    }
  };

  // Start a new round
  const startNewRound = async () => {
    try {
      // Get recent crash points to generate next crash
      const { data, error } = await supabase.rpc('get_recent_crash_points');
      
      if (error) throw error;
      
      let nextCrashPoint: number;
      
      if (data && data.length > 0 && data[0].crash_values) {
        // Using Supabase function to get the next crash point
        const recentCrashes = data[0].crash_values;
        const { data: crashPointData, error: crashPointError } = await supabase.rpc(
          'generate_crash_point', 
          { recent_crashes: recentCrashes }
        );
        
        if (crashPointError) throw crashPointError;
        nextCrashPoint = crashPointData || getCrashMultiplierFallback();
        setIsUsingServerCrashPoints(true);
      } else {
        // Fallback to client-side if no data
        nextCrashPoint = getCrashMultiplierFallback();
        setIsUsingServerCrashPoints(false);
      }
      
      // Create a new round in the database
      const { data: roundData, error: roundError } = await supabase
        .from('rounds')
        .insert({
          crash_multiplier: nextCrashPoint,
          status: 'pending'
        })
        .select('id')
        .single();
        
      if (roundError) throw roundError;
      
      // Store the current round ID
      if (roundData) {
        setCurrentRoundId(roundData.id);
      }
      
      // Set the crash point locally
      setCrashPoint(nextCrashPoint);
      console.log(`New round started with crash point: ${nextCrashPoint}`);
      
    } catch (err) {
      console.error('Error starting new round:', err);
      // Use fallback crash point generation if server fails
      const fallbackCrashPoint = getCrashMultiplierFallback();
      setCrashPoint(fallbackCrashPoint);
      setIsUsingServerCrashPoints(false);
    }
  };
  
  // Client-side fallback for crash point generation
  const getCrashMultiplierFallback = () => {
    // Similar algorithm to server-side, but simplified
    const houseEdge = 0.01;
    const r = Math.random();
    const crash = Math.max(1.0, Math.floor((100 * (1 - houseEdge)) / r) / 100);
    return parseFloat(crash.toFixed(2));
  };

  // Modified place bet function to record in database
  const handlePlaceBetWithDB = async (amount: number, autoCashout: number | null) => {
    // If not authenticated, show a toast
    if (!isAuthenticated) {
      toast.error("Please sign in to place bets", { position: 'top-center' });
      return;
    }
    
    // Place bet in local state first
    handlePlaceBet(amount, autoCashout);
    
    // Record the bet in database if we have a current round
    if (currentRoundId && isUsingServerCrashPoints) {
      try {
        const { error } = await supabase
          .from('player_bets')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            round_id: currentRoundId,
            bet_amount: amount,
            status: 'active'
          });
          
        if (error) throw error;
      } catch (err) {
        console.error('Error recording bet in database:', err);
        // Continue with local bet even if database fails
      }
    }
  };

  // Modified cash out function to record in database
  const handleCashoutWithDB = async () => {
    // Handle cashout in local state
    handleCashout();
    
    // Record the cashout in database if we have a current round
    if (currentRoundId && isUsingServerCrashPoints && isAuthenticated) {
      try {
        const { error } = await supabase
          .from('player_bets')
          .update({ 
            cashed_out_multiplier: currentMultiplier,
            status: 'won'
          })
          .eq('round_id', currentRoundId)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .is('cashed_out_multiplier', null);
          
        if (error) throw error;
        
        // Update user balance in profiles table
        if (playerBet !== null) {
          const winnings = playerBet * currentMultiplier;
          
          // Use functions.invoke instead of rpc for the edge function
          const { error: balanceError } = await supabase.functions.invoke(
            'update_user_balance', 
            { 
              body: { 
                delta_amount: winnings,
                user_id: (await supabase.auth.getUser()).data.user?.id
              }
            }
          );
          
          if (balanceError) {
            console.error('Error updating balance:', balanceError);
          }
        }
      } catch (err) {
        console.error('Error recording cashout in database:', err);
      }
    }
  };

  // Modified countdown timer logic with server integration
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
            
            // Update round status to 'in_progress' in database
            if (currentRoundId && isUsingServerCrashPoints) {
              supabase
                .from('rounds')
                .update({ status: 'in_progress', started_at: new Date().toISOString() })
                .eq('id', currentRoundId)
                .then(({ error }) => {
                  if (error) console.error('Error updating round status:', error);
                });
            }
            
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
            setIsBetPlaced(false);
            resetPlayers();
            startCountdown();
            
            // Start a new round in the database
            startNewRound();
            
            return null;
          }
          
          return Math.max(0, newValue);
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [countdownTimer, gameStateRef, setGameState, setCountdownTimer, setCrashPoint, 
      setCurrentMultiplier, setPlayerBet, setPlayerAutoCashout, setPlayerWin, setIsBetPlaced, 
      resetPlayers, startCountdown, currentRoundId, isUsingServerCrashPoints]);

  // Auto-start the first round with server integration
  useEffect(() => {
    if (gameState === GAME_STATE.WAITING) {
      startNewRound();
      startCountdown();
    }
  }, [gameState, startCountdown]);

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
    isAuthenticated,
    handlePlaceBet: handlePlaceBetWithDB,
    handleCashout: handleCashoutWithDB,
    handleCrash,
    setCurrentMultiplier,
  };
};
