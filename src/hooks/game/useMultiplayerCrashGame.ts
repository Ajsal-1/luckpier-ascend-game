
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
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Fetch game history
  const fetchGameHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crash_rounds')
        .select('*')
        .in('status', ['crashed'])
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      if (data) {
        setGameHistory(data.map(round => ({
          id: round.id,
          crashPoint: round.crash_multiplier,
          timestamp: round.created_at
        })));
      }
    } catch (err) {
      console.error('Error fetching game history:', err);
    }
  }, []);
  
  // Calculate multiplier based on start time
  const calculateCurrentMultiplier = useCallback((startTime: string): number => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const elapsedMs = now - start;
    
    // Only calculate if we've passed the start time
    if (elapsedMs <= 0) return 1.0;
    
    // Using the formula: multiplier = e^(0.06 * elapsedSeconds)
    const elapsedSeconds = elapsedMs / 1000;
    const multiplier = Math.pow(Math.E, 0.06 * elapsedSeconds);
    return Math.max(1, parseFloat(multiplier.toFixed(2)));
  }, []);
  
  // Update multiplier animation
  const updateMultiplier = useCallback(() => {
    if (currentRound && currentRound.status === 'running' && currentRound.start_time) {
      const newMultiplier = calculateCurrentMultiplier(currentRound.start_time);
      setCurrentMultiplier(newMultiplier);
      
      // Check if we've reached the crash point (client-side prediction)
      if (crashPoint && newMultiplier >= crashPoint) {
        if (gameState !== GAME_STATE.CRASHED) {
          console.log(`Client detected crash at ${newMultiplier.toFixed(2)}x`);
          setGameState(GAME_STATE.CRASHED);
          setIsRoundActive(false);
          // Stop the animation
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        }
        return;
      }
      
      // Continue the animation
      animationFrameRef.current = requestAnimationFrame(updateMultiplier);
    }
  }, [calculateCurrentMultiplier, crashPoint, currentRound, gameState]);
  
  // Start the multiplier animation
  const startMultiplierAnimation = useCallback(() => {
    // Clean up any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Start a new animation
    animationFrameRef.current = requestAnimationFrame(updateMultiplier);
  }, [updateMultiplier]);
  
  // Poll for active rounds
  const pollGameEngine = useCallback(async () => {
    try {
      // Call our edge function
      const response = await supabase.functions.invoke('crash-game-engine');
      const data = response.data;
      
      if (!data) {
        console.error('No data returned from game engine');
        return;
      }
      
      // Update game state based on response
      if (data.status === 'playing') {
        setCurrentRound(data);
        setCurrentMultiplier(data.current_multiplier);
        
        // Ensure game state is PLAYING
        if (gameState !== GAME_STATE.PLAYING) {
          console.log("Game is now in PLAYING state");
          setGameState(GAME_STATE.PLAYING);
          setIsRoundActive(true);
          // Start the multiplier animation
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
          fetchGameHistory();
          
          // Start countdown for next round (3 seconds)
          setCountdownTimer(3);
          
          // If we have a player bet and no win, they lost
          if (isBetPlaced && playerWin === null) {
            toast.error(`Crashed at ${data.crashPoint.toFixed(2)}x! You lost your bet.`, {
              position: 'top-center'
            });
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
          setCrashPoint(null);
          
          // If player had a previous bet but didn't cash out, reset for new round
          if (isBetPlaced && playerWin === null) {
            setPlayerBet(null);
            setPlayerWin(null);
            setIsBetPlaced(false);
          }
          
          // Start the multiplier animation
          startMultiplierAnimation();
        }
      } else if (data.status === 'created') {
        // A new round was created
        console.log("New round was created");
        fetchGameHistory();
      }
    } catch (error) {
      console.error('Error in pollGameEngine:', error);
    }
  }, [fetchGameHistory, gameState, isBetPlaced, playerWin, startMultiplierAnimation]);
  
  // Fetch active players for the current round
  const fetchPlayers = useCallback(async () => {
    if (!currentRound || !currentRound.round_id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_bets')
        .select(`
          id,
          bet_amount,
          cashout_multiplier,
          profiles:user_id (username)
        `)
        .eq('round_id', currentRound.round_id);
        
      if (error) throw error;
      
      if (data) {
        const formattedPlayers = data.map((bet: any) => ({
          id: bet.id,
          name: bet.profiles?.username || 'Anonymous',
          amount: bet.bet_amount,
          multiplier: bet.cashout_multiplier
        }));
        
        setPlayers(formattedPlayers);
      }
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  }, [currentRound]);
  
  // Set up polling and clean up on unmount
  useEffect(() => {
    console.log("Setting up polling mechanism");
    // Initial fetch
    pollGameEngine();
    fetchGameHistory();
    
    // Set up polling with increased frequency for more responsive updates
    pollIntervalRef.current = window.setInterval(pollGameEngine, 500);
    
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
  
  // Set up realtime subscription for crash rounds
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'crash_rounds',
      }, (payload) => {
        console.log('Crash round updated:', payload);
        
        // If status changed to crashed
        if (payload.new.status === 'crashed' && payload.old.status === 'running') {
          console.log(`Realtime update: crashed at ${payload.new.crash_multiplier}x`);
          setCrashPoint(payload.new.crash_multiplier);
          setGameState(GAME_STATE.CRASHED);
          setIsRoundActive(false);
          setCountdownTimer(3);  // Set 3-second countdown after crash
          fetchGameHistory();
        }
        // If status changed to waiting (new round countdown)
        else if (payload.new.status === 'waiting' && payload.old.status === 'crashed') {
          console.log('Realtime update: new round countdown started');
          setGameState(GAME_STATE.COUNTDOWN);
          // Reset player state for new round if they had a bet
          if (isBetPlaced && playerWin === null) {
            setPlayerBet(null);
            setPlayerWin(null);
            setIsBetPlaced(false);
          }
        }
        // If status changed to running (round started)
        else if (payload.new.status === 'running' && payload.old.status === 'waiting') {
          console.log('Realtime update: round started');
          setGameState(GAME_STATE.PLAYING);
          setIsRoundActive(true);
          setCurrentMultiplier(1);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGameHistory, isBetPlaced, playerWin]);
  
  // Set up countdown timer
  useEffect(() => {
    if (countdownTimer !== null && countdownTimer > 0 && gameState === GAME_STATE.COUNTDOWN) {
      console.log(`Countdown: ${countdownTimer.toFixed(1)}s`);
      
      // Clean up any existing interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      
      // Start a new interval
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownTimer(prev => {
          if (prev === null) return null;
          const newValue = prev - 0.1;
          return newValue > 0 ? parseFloat(newValue.toFixed(1)) : 0;
        });
      }, 100);
    } else if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [countdownTimer, gameState]);
  
  // Place bet function
  const handlePlaceBet = useCallback(async (amount: number, autoCashoutAt?: number | null) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to place bets', { position: 'top-center' });
      return;
    }
    
    if (!currentRound || !currentRound.round_id) {
      toast.error('No active round found', { position: 'top-center' });
      return;
    }
    
    // Allow bets during countdown or waiting phase
    if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.WAITING) {
      toast.error('You can only place bets before the round starts', { position: 'top-center' });
      return;
    }
    
    if (amount <= 0) {
      toast.error('Bet amount must be greater than zero', { position: 'top-center' });
      return;
    }
    
    if (amount > userBalance) {
      toast.error('Insufficient balance for this bet', { position: 'top-center' });
      return;
    }
    
    try {
      const response = await supabase.functions.invoke('crash-game-engine', {
        body: {
          action: 'place_bet',
          roundId: currentRound.round_id,
          amount: amount,
          autoCashoutAt: autoCashoutAt
        }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Failed to place bet');
      }
      
      console.log(`Bet placed: $${amount} with auto-cashout at ${autoCashoutAt || 'none'}`);
      
      // Update local state
      setPlayerBet(amount);
      setIsBetPlaced(true);
      setPlayerWin(null);
      
      // Update user balance (optimistically)
      setUserBalance(prev => prev - amount);
      
      toast.success('Bet placed successfully!', { position: 'top-center' });
      
      // Refresh player list
      fetchPlayers();
    } catch (error: any) {
      toast.error(`Error placing bet: ${error.message}`, { position: 'top-center' });
    }
  }, [currentRound, fetchPlayers, gameState, isAuthenticated, userBalance]);
  
  // Cashout function
  const handleCashout = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to cash out', { position: 'top-center' });
      return;
    }
    
    if (gameState !== GAME_STATE.PLAYING || !isRoundActive) {
      toast.error('Round not active', { position: 'top-center' });
      return;
    }
    
    if (!currentRound || !currentRound.round_id) {
      toast.error('No active round found', { position: 'top-center' });
      return;
    }
    
    if (!isBetPlaced || playerBet === null) {
      toast.error('No active bet to cash out', { position: 'top-center' });
      return;
    }
    
    if (playerWin !== null) {
      toast.error('Already cashed out', { position: 'top-center' });
      return;
    }
    
    try {
      const cashoutMultiplier = currentMultiplier;
      console.log(`Attempting cashout at ${cashoutMultiplier.toFixed(2)}x`);
      
      const response = await supabase.functions.invoke('crash-game-engine', {
        body: {
          action: 'cashout',
          roundId: currentRound.round_id,
          multiplier: cashoutMultiplier
        }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Failed to cash out');
      }
      
      // Update local state
      setPlayerWin(cashoutMultiplier);
      
      // Calculate winnings
      const winnings = playerBet * cashoutMultiplier;
      const profit = winnings - playerBet;
      
      // Update user balance (optimistically)
      setUserBalance(prev => prev + winnings);
      
      toast.success(
        `You won $${profit.toFixed(2)}! Total: $${winnings.toFixed(2)}`, 
        { position: 'top-center' }
      );
      
      // Refresh player list
      fetchPlayers();
    } catch (error: any) {
      toast.error(`Error cashing out: ${error.message}`, { position: 'top-center' });
    }
  }, [currentMultiplier, currentRound, fetchPlayers, gameState, isAuthenticated, isBetPlaced, isRoundActive, playerBet, playerWin]);
  
  return {
    gameState,
    countdownTimer,
    currentMultiplier,
    crashPoint,
    isRoundActive,
    userBalance,
    playerBet,
    playerWin,
    isBetPlaced,
    gameHistory,
    players,
    isAuthenticated,
    currentRound,
    handlePlaceBet,
    handleCashout,
  };
};
