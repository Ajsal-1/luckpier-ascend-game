
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GAME_STATE, HistoryItem, Player } from './types';

export const useMultiplayerCrashGame = () => {
  // Game state
  const [gameState, setGameState] = useState<GAME_STATE>(GAME_STATE.WAITING);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(3);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [isRoundActive, setIsRoundActive] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<number>(1000);
  const [playerBet, setPlayerBet] = useState<number | null>(null);
  const [playerWin, setPlayerWin] = useState<number | null>(null);
  const [isBetPlaced, setIsBetPlaced] = useState<boolean>(false);
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Refs to track timers and animation frames
  const pollIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const gameEngineErrorCount = useRef<number>(0);
  const lastCrashTime = useRef<number | null>(null);
  const postCrashCooldownTime = useRef<number>(6); // 6 seconds cooldown after crash
  const lastMultiplierRef = useRef<number>(1); // Track the last multiplier to prevent decreases
  const startTimeRef = useRef<number | null>(null); // Track animation start time
  const growthRateRef = useRef<number>(0.06); // Growth rate for multiplier (adjust for faster/slower)

  // Calculate multiplier based on start time - now uses client-side animation for smoothness
  const calculateCurrentMultiplier = useCallback((timestamp: number): number => {
    // Only calculate if we have a start time
    if (!startTimeRef.current) return 1.0;
    
    const elapsedMs = timestamp - startTimeRef.current;
    
    // Calculate elapsed time in seconds
    const elapsedSeconds = elapsedMs / 1000;
    
    // Using the formula: multiplier = e^(growthRate * elapsedSeconds)
    // This creates an exponential curve that grows faster over time
    const multiplier = Math.pow(Math.E, growthRateRef.current * elapsedSeconds);
    
    // Format to 2 decimal places
    const formattedMultiplier = Math.floor(multiplier * 100) / 100;
    
    return Math.max(1, formattedMultiplier);
  }, []);

  // Fetch game history
  const fetchGameHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      if (data) {
        // Map to the correct HistoryItem interface format
        const historyItems: HistoryItem[] = data.map(round => ({
          id: round.id,
          multiplier: round.crash_multiplier, // Use crash_multiplier as multiplier
          timestamp: round.ended_at || new Date().toISOString()
        }));
        
        setGameHistory(historyItems);
      }
    } catch (err) {
      console.error('Error fetching game history:', err);
    }
  }, []);
  
  // Update game history when game crashes
  const updateGameHistory = useCallback((multiplier: number) => {
    const timestamp = new Date().toISOString();
    
    setGameHistory(prev => {
      const newHistory = [
        { 
          id: `game-${Date.now()}`, 
          multiplier, 
          timestamp 
        },
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
    
    // Store crash time for cooldown
    lastCrashTime.current = Date.now();
    
    // Re-fetch history to sync with server
    fetchGameHistory();
  }, [fetchGameHistory]);
  
  // Smooth multiplier animation using requestAnimationFrame
  const animateMultiplier = useCallback((timestamp: number) => {
    // If this is the first frame, set the start time
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    // Calculate the new multiplier based on elapsed time
    const newMultiplier = calculateCurrentMultiplier(timestamp);
    
    // Only update if it's higher than the previous one - ensures smooth increasing values
    if (newMultiplier > lastMultiplierRef.current) {
      setCurrentMultiplier(newMultiplier);
      lastMultiplierRef.current = newMultiplier;
    }
    
    // Check if we've reached the crash point (client-side prediction)
    if (crashPoint && lastMultiplierRef.current >= crashPoint) {
      if (gameState !== GAME_STATE.CRASHED) {
        console.log(`Client detected crash at ${lastMultiplierRef.current.toFixed(2)}x`);
        setGameState(GAME_STATE.CRASHED);
        setIsRoundActive(false);
        // Stop the animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
    }
    
    // Continue the animation
    animationFrameRef.current = requestAnimationFrame(animateMultiplier);
  }, [calculateCurrentMultiplier, crashPoint, gameState]);
  
  // Start the multiplier animation
  const startMultiplierAnimation = useCallback(() => {
    // Reset the multiplier and animation state
    setCurrentMultiplier(1);
    lastMultiplierRef.current = 1;
    startTimeRef.current = null;
    
    // Clean up any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Start a new animation
    animationFrameRef.current = requestAnimationFrame(animateMultiplier);
  }, [animateMultiplier]);
  
  // Fetch user authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      // If authenticated, fetch user balance
      if (data.session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData) {
          setUserBalance(profileData.balance);
        }
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      setIsAuthenticated(event !== 'SIGNED_OUT');
      checkAuth();
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // Fetch active players for the current round
  const fetchPlayers = useCallback(async () => {
    if (!currentRound || !currentRound.round_id) return;
    
    try {
      const { data, error } = await supabase
        .from('player_bets')
        .select('id, bet_amount, cashed_out_multiplier, user_id')
        .eq('round_id', currentRound.round_id);
        
      if (error) throw error;
      
      if (data) {
        const formattedPlayers = data.map((bet: any) => ({
          id: bet.id,
          name: bet.user_id.substring(0, 8) || 'Anonymous',
          amount: bet.bet_amount,
          multiplier: bet.cashed_out_multiplier,
          userId: bet.user_id
        }));
        
        setPlayers(formattedPlayers);
      }
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  }, [currentRound]);
  
  // Handle crash event with retry logic
  const pollGameEngine = useCallback(async () => {
    try {
      // Call our edge function with specific options to ensure proper request
      const response = await supabase.functions.invoke('crash-game-engine', {
        method: 'GET' // Explicitly use GET method
      });
      
      // Handle errors better
      if (response.error) {
        console.error(`Error from crash-game-engine:`, response.error);
        gameEngineErrorCount.current++;
        
        if (gameEngineErrorCount.current > 5 && gameState === GAME_STATE.WAITING) {
          // If we're stuck in waiting state with errors, try to reset by starting a new game
          console.log("Too many errors in waiting state, trying to restart game");
          setCountdownTimer(3);
          setGameState(GAME_STATE.COUNTDOWN);
        }
        
        return; // Don't process further if there's an error
      }
      
      // Reset error counter on successful call
      gameEngineErrorCount.current = 0;
      
      const data = response.data;
      
      if (!data) {
        console.error('No data returned from game engine');
        return;
      }
      
      // Update game state based on response
      if (data.status === 'playing') {
        setCurrentRound(data);
        
        // Ensure game state is PLAYING
        if (gameState !== GAME_STATE.PLAYING) {
          console.log("Game is now in PLAYING state");
          setGameState(GAME_STATE.PLAYING);
          setIsRoundActive(true);
          // Start the multiplier animation for all users whether they bet or not
          startMultiplierAnimation();
        }
      } else if (data.status === 'crashed') {
        setCrashPoint(data.crashPoint);
        
        // Only run the crash logic if we're not already in CRASHED state
        if (gameState !== GAME_STATE.CRASHED) {
          console.log(`Server reports crash at ${data.crashPoint.toFixed(2)}x`);
          setGameState(GAME_STATE.CRASHED);
          setIsRoundActive(false);
          
          // Update crash history
          updateGameHistory(data.crashPoint);
          
          // Reset for next round with longer cooldown
          if (data.next_round) {
            console.log("Setting up for next round:", data.next_round);
            setCurrentRound({
              round_id: data.next_round.id,
              start_time: data.next_round.start_time,
              status: 'waiting',
              countdown: data.next_round.countdown
            });
            
            // Start countdown for next round with extended cooldown (6 seconds)
            setCountdownTimer(postCrashCooldownTime.current);
            
            // If we have a player bet and no win, they lost
            if (isBetPlaced && playerWin === null) {
              toast.error(`Crashed at ${data.crashPoint.toFixed(2)}x! You lost your bet.`, {
                position: 'top-center',
                duration: 5000 // Show for 5 seconds
              });
              
              // Reset player state for next round
              setTimeout(() => {
                setPlayerBet(null);
                setPlayerWin(null);
                setIsBetPlaced(false);
                setGameState(GAME_STATE.COUNTDOWN); // Move to countdown for next round
              }, postCrashCooldownTime.current * 1000); // Wait for cooldown period
            } else {
              // No active bet, just move to countdown after cooldown
              setTimeout(() => {
                setGameState(GAME_STATE.COUNTDOWN);
              }, postCrashCooldownTime.current * 1000); // Wait for cooldown period
            }
          }
        }
      } else if (data.status === 'waiting') {
        setCurrentRound(data);
        
        // Only transition to COUNTDOWN if not already in that state
        if (gameState !== GAME_STATE.COUNTDOWN) {
          console.log("Game is now in COUNTDOWN state");
          setGameState(GAME_STATE.COUNTDOWN);
          setCountdownTimer(data.countdown);
        } else {
          // Just update the timer
          setCountdownTimer(data.countdown);
        }
      } else if (data.status === 'started') {
        setCurrentRound(data);
        
        // Reset values for a new round
        if (gameState !== GAME_STATE.PLAYING) {
          console.log("Game is starting a new round");
          setGameState(GAME_STATE.PLAYING);
          setIsRoundActive(true);
          setCurrentMultiplier(1);
          lastMultiplierRef.current = 1; // Reset the last multiplier
          setCrashPoint(null);
          startTimeRef.current = null; // Reset animation start time
          
          // Start the multiplier animation for all users
          startMultiplierAnimation();
        }
      } else if (data.status === 'created') {
        // A new round was created
        console.log("New round was created");
        setCurrentRound({
          round_id: data.round_id,
          start_time: data.start_time,
          status: 'waiting',
          countdown: data.countdown || 3
        });
        
        setGameState(GAME_STATE.COUNTDOWN);
        setCountdownTimer(data.countdown || 3);
        fetchGameHistory();
      }
    } catch (error) {
      console.error('Error in pollGameEngine:', error);
      gameEngineErrorCount.current++;
    }
  }, [fetchGameHistory, gameState, isBetPlaced, playerWin, startMultiplierAnimation, updateGameHistory]);
  
  // Place bet function - IMPROVED ERROR HANDLING
  const handlePlaceBet = useCallback(async (amount: number, autoCashoutAt?: number | null) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to place bets');
    }
    
    if (!currentRound || !currentRound.round_id) {
      throw new Error('No active round found');
    }
    
    // Allow bets during countdown or waiting phase only
    if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.WAITING) {
      throw new Error('You can only place bets before the round starts');
    }
    
    if (amount <= 0) {
      throw new Error('Bet amount must be greater than zero');
    }
    
    console.log(`Attempting to place bet: $${amount}`);
    
    // Get the current session for the auth header
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      throw new Error('Authentication session not found');
    }
    
    const response = await supabase.functions.invoke('crash-game-engine', {
      method: 'POST',
      body: {
        action: 'place_bet',
        roundId: currentRound.round_id,
        amount: amount,
        autoCashoutAt: autoCashoutAt
      },
      // Explicitly include auth header for edge function
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });
    
    console.log("Bet response:", response); // Log full response for debugging
    
    if (response.error) {
      const errorMessage = response.error.message || 'Failed to place bet';
      console.error('Error placing bet:', response.error);
      throw new Error(errorMessage);
    }
    
    if (response.data && response.data.error) {
      console.error('Server error placing bet:', response.data.error);
      throw new Error(response.data.error);
    }
    
    if (!response.data || !response.data.success) {
      console.error('Failed to place bet - no success response');
      throw new Error('Failed to place bet - no success response');
    }
    
    console.log(`Bet placed: $${amount} with auto-cashout at ${autoCashoutAt || 'none'}`);
    
    // Update local state
    setPlayerBet(amount);
    setIsBetPlaced(true);
    setPlayerWin(null);
    
    toast.success('Bet placed successfully!', { position: 'top-center' });
    
    // Refresh player list
    fetchPlayers();
    
    return response.data;
  }, [currentRound, fetchPlayers, gameState, isAuthenticated]);
  
  // Cashout function - IMPROVED ERROR HANDLING
  const handleCashout = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to cash out');
    }
    
    if (gameState !== GAME_STATE.PLAYING) {
      throw new Error('Round is not active - cannot cash out');
    }
    
    if (!isRoundActive) {
      throw new Error('The round is not currently active');
    }
    
    if (!currentRound || !currentRound.round_id) {
      throw new Error('No active round found');
    }
    
    if (!isBetPlaced || playerBet === null) {
      throw new Error('You have not placed a bet in this round');
    }
    
    if (playerWin !== null) {
      throw new Error('You have already cashed out this round');
    }
    
    const cashoutMultiplier = currentMultiplier;
    console.log(`Attempting cashout at ${cashoutMultiplier.toFixed(2)}x`);
    
    // Get the current session for the auth header
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      throw new Error('Authentication session not found');
    }
    
    const response = await supabase.functions.invoke('crash-game-engine', {
      method: 'POST',
      body: {
        action: 'cashout',
        roundId: currentRound.round_id,
        multiplier: cashoutMultiplier
      },
      // Explicitly include auth header for edge function
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });
    
    console.log("Cashout response:", response); // Log full response for debugging
    
    if (response.error) {
      const errorMessage = response.error.message || 'Failed to cash out';
      console.error('Error cashing out:', response.error);
      throw new Error(errorMessage);
    }
    
    if (response.data && response.data.error) {
      console.error('Server error cashing out:', response.data.error);
      throw new Error(response.data.error);
    }
    
    if (!response.data || !response.data.success) {
      console.error('Failed to cash out - no success response');
      throw new Error('Failed to cash out - no success response');
    }
    
    // Update local state
    setPlayerWin(cashoutMultiplier);
    
    // Calculate winnings
    const winnings = playerBet * cashoutMultiplier;
    const profit = winnings - playerBet;
    
    toast.success(
      `You won $${profit.toFixed(2)}! Total: $${winnings.toFixed(2)}`, 
      { position: 'top-center' }
    );
    
    // Refresh player list
    fetchPlayers();
    
    return response.data;
  }, [currentMultiplier, currentRound, fetchPlayers, gameState, isAuthenticated, isBetPlaced, isRoundActive, playerBet, playerWin]);
  
  // Set up polling and clean up on unmount
  useEffect(() => {
    console.log("Setting up polling mechanism");
    // Initial fetch
    pollGameEngine();
    fetchGameHistory();
    
    // Set up polling with increased frequency for more responsive updates
    pollIntervalRef.current = window.setInterval(pollGameEngine, 1000);
    
    return () => {
      // Clean up
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [fetchGameHistory, pollGameEngine]);
  
  // Update players list periodically
  useEffect(() => {
    fetchPlayers();
    
    const playersInterval = setInterval(fetchPlayers, 2000);
    
    return () => {
      clearInterval(playersInterval);
    };
  }, [fetchPlayers]);
  
  // Realtime subscription for crash events
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rounds',
      }, (payload) => {
        console.log('Round updated:', payload);
        
        // If status changed to completed (crashed)
        if (payload.new.status === 'completed' && payload.old.status === 'running') {
          console.log(`Realtime update: crashed at ${payload.new.crash_multiplier}x`);
          setCrashPoint(payload.new.crash_multiplier);
          
          // Only update state if not already crashed
          if (gameState !== GAME_STATE.CRASHED) {
            setGameState(GAME_STATE.CRASHED);
            setIsRoundActive(false);
            
            // Refresh game history
            fetchGameHistory();
            
            // If player had a bet and didn't cash out, they lost
            if (isBetPlaced && playerWin === null) {
              toast.error(`Crashed at ${payload.new.crash_multiplier.toFixed(2)}x! You lost your bet.`, {
                position: 'top-center',
                duration: 5000 // Show for 5 seconds
              });
            }
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGameHistory, gameState, isBetPlaced, playerWin]);

  // Export all required state and functions
  return {
    gameState,
    countdownTimer,
    currentMultiplier,
    crashPoint,
    isRoundActive,
    playerBet,
    playerWin,
    isBetPlaced,
    gameHistory,
    players,
    isAuthenticated,
    currentRound,
    handlePlaceBet,
    handleCashout,
    updateGameHistory,
  };
};
