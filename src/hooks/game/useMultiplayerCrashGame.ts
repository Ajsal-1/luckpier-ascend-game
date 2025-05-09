import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GAME_STATE } from './types';

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
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
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
    
    // Using the formula: multiplier = 1.002^(elapsed milliseconds)
    const multiplier = Math.pow(1.002, elapsedMs / 1000);
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
  const pollActiveRounds = useCallback(async () => {
    try {
      // Call our edge function
      const response = await supabase.functions.invoke('crash-game-engine');
      const data = response.data;
      
      if (!data || !data.success) {
        console.error('Error polling rounds:', data?.error || 'Unknown error');
        return;
      }
      
      // If rounds were processed
      if (data.rounds && data.rounds.length > 0) {
        const roundInfo = data.rounds[0]; // Take the first round
        
        // Update round status based on action
        if (roundInfo.action === 'crashed') {
          setCrashPoint(roundInfo.crash_point);
          setGameState(GAME_STATE.CRASHED);
          setIsRoundActive(false);
          
          // Update crash history
          fetchGameHistory();
          
          // Start countdown for next round
          setCountdownTimer(3);
          
          // If we have a player bet and no win, they lost
          if (isBetPlaced && playerWin === null) {
            toast.error(`Crashed at ${roundInfo.crash_point.toFixed(2)}x! You lost your bet.`, {
              position: 'top-center'
            });
          }
        } else if (roundInfo.action === 'running') {
          // Update current multiplier from server
          if (roundInfo.current_multiplier !== currentMultiplier) {
            setCurrentMultiplier(roundInfo.current_multiplier);
          }
          
          // Keep track of the crash point
          setCrashPoint(roundInfo.crash_point);
          
          // Ensure game state is PLAYING
          if (gameState !== GAME_STATE.PLAYING) {
            setGameState(GAME_STATE.PLAYING);
            setIsRoundActive(true);
            // Start the multiplier animation
            startMultiplierAnimation();
          }
        }
      } else if (data.action === 'started_round') {
        // A waiting round just started
        setGameState(GAME_STATE.PLAYING);
        setIsRoundActive(true);
        setCurrentMultiplier(1);
        setCrashPoint(data.round.crash_multiplier);
        setCurrentRound(data.round);
        // Start the multiplier animation
        startMultiplierAnimation();
      } else if (data.action === 'created_round') {
        // A new round was created
        fetchCurrentRound();
      } else if (data.action === 'waiting_for_start') {
        // Waiting for a round to start
        setGameState(GAME_STATE.COUNTDOWN);
        setCountdownTimer(data.time_left);
      }
    } catch (error) {
      console.error('Error in pollActiveRounds:', error);
    }
  }, [currentMultiplier, fetchGameHistory, gameState, isBetPlaced, playerWin, startMultiplierAnimation]);
  
  // Fetch current round
  const fetchCurrentRound = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crash_rounds')
        .select('*')
        .or('status.eq.waiting,status.eq.running')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.error('Error fetching current round:', error);
        return;
      }
      
      if (data) {
        setCurrentRound(data);
        setCrashPoint(data.crash_multiplier);
        
        // Set game state based on round status
        if (data.status === 'waiting') {
          setGameState(GAME_STATE.COUNTDOWN);
          // Calculate countdown timer
          const startTime = new Date(data.start_time).getTime();
          const now = Date.now();
          const timeLeft = Math.max(0, (startTime - now) / 1000);
          setCountdownTimer(timeLeft);
        } else if (data.status === 'running') {
          setGameState(GAME_STATE.PLAYING);
          setIsRoundActive(true);
          // Start the multiplier animation
          startMultiplierAnimation();
        }
      } else {
        // No active or waiting rounds, request one through the edge function
        pollActiveRounds();
      }
    } catch (err) {
      console.error('Error in fetchCurrentRound:', err);
    }
  }, [pollActiveRounds, startMultiplierAnimation]);
  
  // Set up polling and clean up on unmount
  useEffect(() => {
    // Initial fetch
    fetchCurrentRound();
    fetchGameHistory();
    
    // Set up polling
    pollIntervalRef.current = window.setInterval(pollActiveRounds, 100);
    
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
  }, [fetchCurrentRound, fetchGameHistory, pollActiveRounds]);
  
  // Set up countdown timer
  useEffect(() => {
    if (countdownTimer !== null && countdownTimer > 0 && gameState === GAME_STATE.COUNTDOWN) {
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
  
  // Fetch active players for the current round
  const fetchPlayers = useCallback(async () => {
    if (!currentRound) return;
    
    try {
      const { data, error } = await supabase
        .from('user_bets')
        .select(`
          id,
          bet_amount,
          cashout_multiplier,
          profiles:user_id (username)
        `)
        .eq('round_id', currentRound.id);
        
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
  
  // Update players list periodically
  useEffect(() => {
    fetchPlayers();
    
    const playersInterval = setInterval(fetchPlayers, 1000);
    
    return () => {
      clearInterval(playersInterval);
    };
  }, [fetchPlayers]);
  
  // Set up realtime subscription for crash rounds
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'crash_rounds',
      }, () => {
        console.log('New crash round created, updating state');
        fetchCurrentRound();
        fetchGameHistory();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'crash_rounds',
      }, (payload) => {
        console.log('Crash round updated:', payload);
        // If status changed to crashed
        if (payload.new.status === 'crashed' && payload.old.status === 'running') {
          setCrashPoint(payload.new.crash_multiplier);
          setGameState(GAME_STATE.CRASHED);
          setIsRoundActive(false);
          fetchGameHistory();
        } else if (payload.new.status === 'running' && payload.old.status === 'waiting') {
          // Round started
          setGameState(GAME_STATE.PLAYING);
          setIsRoundActive(true);
          setCurrentRound(payload.new);
          // Start the multiplier animation
          startMultiplierAnimation();
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCurrentRound, fetchGameHistory, startMultiplierAnimation]);
  
  // Place bet function
  const handlePlaceBet = useCallback(async (amount: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to place bets', { position: 'top-center' });
      return;
    }
    
    if (!currentRound) {
      toast.error('No active round found', { position: 'top-center' });
      return;
    }
    
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
          roundId: currentRound.id,
          amount: amount
        }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || 'Failed to place bet');
      }
      
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
    
    if (!currentRound) {
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
      
      const response = await supabase.functions.invoke('crash-game-engine', {
        body: {
          action: 'cashout',
          roundId: currentRound.id,
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
  
  // Handle sign in/out
  const handleSignIn = useCallback(async () => {
    try {
      await supabase.auth.signInWithOtp({
        email: prompt('Enter your email to sign in/sign up:') || '',
      });
      toast.success("Check your email for the login link", { position: 'top-center' });
    } catch (error) {
      toast.error("Sign in failed. Please try again.", { position: 'top-center' });
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully", { position: 'top-center' });
    } catch (error) {
      toast.error("Sign out failed. Please try again.", { position: 'top-center' });
    }
  }, []);
  
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
    handleSignIn,
    handleSignOut,
  };
};
