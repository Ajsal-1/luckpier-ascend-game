import { useEffect, useState, useRef, useCallback } from 'react';
import { GAME_STATE } from './game/types';
import { useGameState } from './game/useGameState';
import { usePlayerActions } from './game/usePlayerActions';
import { useGameHistory } from './game/useGameHistory';
import { 
  getCrashMultiplier, 
  getServerFallbackCrashPoint, 
  generateServerCrashPoint 
} from './game/gameUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export { GAME_STATE } from './game/types';
export type { HistoryItem, Player } from './game/types';

export const useCrashGame = (initialBalance: number = 1000) => {
  // Track if we're using server-side crash points
  const [isUsingServerCrashPoints, setIsUsingServerCrashPoints] = useState<boolean>(false);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [errorCount, setErrorCount] = useState<number>(0);
  const gameLoopActiveRef = useRef<boolean>(false);
  const roundsInProgress = useRef<boolean>(false);

  // Get game state logic
  const {
    gameState,
    countdownTimer,
    crashPoint,
    currentMultiplier,
    isRoundActive,
    gameStateRef,
    setGameState,
    setCountdownTimer,
    setCrashPoint,
    setCurrentMultiplier,
    setIsRoundActive,
    startCountdown,
    startPlaying,
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
      }, () => {
        fetchGameHistory();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(roundsChannel);
    };
  }, [fetchGameHistory]);

  // Handle crash with history update and database update
  const handleCrash = useCallback(async (value: number) => {
    if (!isRoundActive) return; // Prevent multiple crash handlers
    
    console.log(`Game crashed at ${value.toFixed(2)}x`);
    
    // Update game state
    handleCrashState(value);
    
    // Update history
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
  }, [currentRoundId, handleCrashState, isBetPlaced, isRoundActive, isUsingServerCrashPoints, playerWin, updateGameHistory]);

  // Get recent crash points from Supabase
  const getRecentCrashPoints = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_recent_crash_points');
      
      if (error) throw error;
      
      if (data && data.length > 0 && data[0].crash_values) {
        return data[0].crash_values;
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching recent crash points:', err);
      return [];
    }
  }, []);
  
  // Generate next crash point
  const generateNextCrashPoint = useCallback(async () => {
    try {
      console.log("Generating next crash point...");
      // Get recent crash points to generate next crash
      const recentCrashes = await getRecentCrashPoints();
      
      let nextCrashPoint: number;
      
      if (recentCrashes && recentCrashes.length > 0) {
        console.log("Using server crash points based on historical data");
        console.log("Recent crashes:", recentCrashes);
        
        // Use server-generated crash point based on history
        nextCrashPoint = generateServerCrashPoint(recentCrashes);
        setIsUsingServerCrashPoints(true);
        console.log(`Generated crash point based on history: ${nextCrashPoint.toFixed(2)}x`);
      } else {
        // Fallback to client-side if no data
        console.log("No server crash data, using fallback generator");
        nextCrashPoint = getServerFallbackCrashPoint();
        setIsUsingServerCrashPoints(false);
        console.log(`Generated fallback crash point: ${nextCrashPoint.toFixed(2)}x`);
      }
      
      return nextCrashPoint;
    } catch (err) {
      console.error('Error generating next crash point:', err);
      setErrorCount(prev => prev + 1);
      
      // Use fallback crash point generation if server fails
      const fallbackCrashPoint = getServerFallbackCrashPoint();
      console.log(`Error getting crash point, using fallback: ${fallbackCrashPoint.toFixed(2)}x`);
      
      setIsUsingServerCrashPoints(false);
      if (errorCount > 3) {
        toast.error("Server connection issues detected. Using local crash generator.", { position: 'top-center' });
      }
      
      return fallbackCrashPoint;
    }
  }, [errorCount, getRecentCrashPoints]);

  // Start a new round
  const startNewRound = useCallback(async () => {
    if (roundsInProgress.current) {
      console.log("Round already in progress, skipping startNewRound");
      return;
    }
    
    roundsInProgress.current = true;
    
    try {
      console.log("Starting new round...");
      
      // Generate the next crash point
      const nextCrashPoint = await generateNextCrashPoint();
      
      // Create a new round in the database
      let roundId = null;
      
      try {
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
          roundId = roundData.id;
          setCurrentRoundId(roundId);
          console.log(`New round created with ID: ${roundId}`);
        }
      } catch (err) {
        console.error('Error creating round in database:', err);
        // Continue with local round even if database fails
      }
      
      // Set the crash point locally
      setCrashPoint(nextCrashPoint);
      console.log(`New round prepared with crash point: ${nextCrashPoint.toFixed(2)}x`);
      
      // Start countdown
      startCountdown();
    } catch (err) {
      console.error('Error starting new round:', err);
      // Use fallback crash point generation if everything fails
      const fallbackCrashPoint = getServerFallbackCrashPoint();
      setCrashPoint(fallbackCrashPoint);
      setIsUsingServerCrashPoints(false);
      
      // Start countdown anyway to keep the game going
      startCountdown();
      
      toast.error("Error starting new round, using local crash generator", { position: 'top-center' });
    } finally {
      roundsInProgress.current = false;
    }
  }, [generateNextCrashPoint, setCrashPoint, setCurrentRoundId, startCountdown]);

  // Modified place bet function to record in database
  const handlePlaceBetWithDB = useCallback(async (amount: number, autoCashout: number | null) => {
    // If not authenticated, show a toast
    if (!isAuthenticated) {
      toast.error("Please sign in to place bets", { position: 'top-center' });
      return;
    }
    
    // Only allow bets during countdown
    if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.WAITING) {
      toast.error("You can only place bets during the countdown", { position: 'top-center' });
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
    
    // If we're in WAITING state, start a new round
    if (gameState === GAME_STATE.WAITING) {
      startNewRound();
    }
  }, [currentRoundId, gameState, handlePlaceBet, isAuthenticated, isUsingServerCrashPoints, startNewRound]);

  // Modified cash out function to record in database
  const handleCashoutWithDB = useCallback(async () => {
    // Only allow cashout during PLAYING state
    if (gameState !== GAME_STATE.PLAYING) {
      return;
    }
    
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
          
          // Use functions.invoke for the edge function
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
  }, [currentMultiplier, currentRoundId, gameState, handleCashout, isAuthenticated, isUsingServerCrashPoints, playerBet]);

  // Auto-cashout logic
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING && 
        playerAutoCashout !== null && 
        currentMultiplier >= playerAutoCashout && 
        playerWin === null) {
      console.log(`Auto-cashout triggered at ${currentMultiplier.toFixed(2)}x`);
      handleCashoutWithDB();
    }
  }, [currentMultiplier, gameState, handleCashoutWithDB, playerAutoCashout, playerWin]);

  // Main game loop effect
  useEffect(() => {
    // Prevent multiple instances of the game loop
    if (gameLoopActiveRef.current) return;
    
    gameLoopActiveRef.current = true;
    
    // Process the countdown
    if (countdownTimer !== null && countdownTimer > 0) {
      const timer = setTimeout(() => {
        setCountdownTimer(prevTimer => {
          if (prevTimer === null) return null;
          const newValue = prevTimer - 0.1;
          
          // When countdown reaches zero, start the game
          if (newValue <= 0 && gameStateRef.current === GAME_STATE.COUNTDOWN) {
            startPlaying();
            return null;
          }
          
          // When cooldown after crash reaches zero, reset for new round
          if (newValue <= 0 && gameStateRef.current === GAME_STATE.CRASHED) {
            // Reset game state for next round
            setGameState(GAME_STATE.WAITING);
            setCrashPoint(null);
            setCurrentMultiplier(1);
            setPlayerBet(null);
            setPlayerAutoCashout(null);
            setPlayerWin(null);
            setIsBetPlaced(false);
            resetPlayers();
            
            // Start a new round
            startNewRound();
            
            return null;
          }
          
          return Math.max(0, newValue);
        });
      }, 100);
      
      return () => {
        clearTimeout(timer);
        gameLoopActiveRef.current = false;
      };
    } else {
      gameLoopActiveRef.current = false;
    }
  }, [countdownTimer, gameStateRef, resetPlayers, setCrashPoint, setCurrentMultiplier, setGameState, setIsBetPlaced, setPlayerAutoCashout, setPlayerBet, setPlayerWin, startNewRound, startPlaying]);

  // Auto-start the first round
  useEffect(() => {
    if (gameState === GAME_STATE.WAITING && !roundsInProgress.current) {
      console.log("Game in WAITING state, starting first round");
      startNewRound();
    }
  }, [gameState, startNewRound]);

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
    isRoundActive,
    handlePlaceBet: handlePlaceBetWithDB,
    handleCashout: handleCashoutWithDB,
    handleCrash,
    setCurrentMultiplier,
  };
};
