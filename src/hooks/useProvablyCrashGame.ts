import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  GameState, 
  calculateMultiplier, 
  generateCrashPoint, 
  hasCrashed,
  formatMultiplier,
  RoundHistory,
  PlayerBet
} from '@/utils/crashGame';

const COUNTDOWN_DURATION = 10; // 10 seconds countdown between rounds

export const useProvablyCrashGame = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [countdownTimer, setCountdownTimer] = useState<number>(COUNTDOWN_DURATION);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [roundHistory, setRoundHistory] = useState<RoundHistory[]>([]);
  const [players, setPlayers] = useState<PlayerBet[]>([]);
  const [userBet, setUserBet] = useState<number | null>(null);
  const [hasUserCashedOut, setHasUserCashedOut] = useState<boolean>(false);
  const [userWinnings, setUserWinnings] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number>(1000);
  
  // Refs to track state between renders and for animation
  const gameStateRef = useRef<GameState>(GameState.WAITING);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMultiplierRef = useRef<number>(1);
  const crashPointRef = useRef<number | null>(null);
  const isAuthenticated = useRef<boolean>(false);
  const currentRoundId = useRef<string | null>(null);
  
  // Keep refs synced with state
  useEffect(() => {
    gameStateRef.current = gameState;
    crashPointRef.current = crashPoint;
  }, [gameState, crashPoint]);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      isAuthenticated.current = !!data.session;
      
      if (data.session) {
        // Fetch user balance
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
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      isAuthenticated.current = event !== 'SIGNED_OUT';
      await checkAuth();
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // Fetch initial game history
  useEffect(() => {
    const fetchGameHistory = async () => {
      try {
        // Get recent crash points
        const { data, error } = await supabase
          .from('rounds')
          .select('id, crash_multiplier, ended_at')
          .eq('status', 'completed')
          .order('ended_at', { ascending: false })
          .limit(10);
          
        if (error) {
          console.error('Error fetching game history:', error);
          return;
        }
        
        if (data) {
          const history: RoundHistory[] = data.map(round => ({
            id: round.id,
            crashPoint: Number(round.crash_multiplier),
            timestamp: new Date(round.ended_at)
          }));
          
          setRoundHistory(history);
        }
      } catch (err) {
        console.error('Error in fetchGameHistory:', err);
      }
    };
    
    fetchGameHistory();
    
    // Subscribe to rounds table for real-time updates
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
  }, []);
  
  // Start a new round
  const startNewRound = useCallback(async () => {
    // Generate a new crash point
    const newCrashPoint = generateCrashPoint();
    console.log(`New round starting with crash point: ${newCrashPoint}`);
    setCrashPoint(newCrashPoint);
    crashPointRef.current = newCrashPoint;
    
    // Reset game state
    setGameState(GameState.COUNTDOWN);
    gameStateRef.current = GameState.COUNTDOWN;
    setCountdownTimer(COUNTDOWN_DURATION);
    setCurrentMultiplier(1);
    lastMultiplierRef.current = 1;
    setHasUserCashedOut(false);
    setUserWinnings(null);
    
    // Create a new round in the database
    try {
      const { data, error } = await supabase
        .from('rounds')
        .insert({
          crash_multiplier: newCrashPoint,
          status: 'pending'
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Error creating round:', error);
        return;
      }
      
      if (data) {
        currentRoundId.current = data.id;
      }
    } catch (err) {
      console.error('Error in startNewRound:', err);
    }
    
    // Start countdown
    intervalRef.current = setInterval(() => {
      setCountdownTimer(prev => {
        const newValue = prev - 1;
        
        // When countdown reaches zero, start the game
        if (newValue <= 0) {
          clearInterval(intervalRef.current!);
          startGame();
          return 0;
        }
        
        return newValue;
      });
    }, 1000);
  }, []);
  
  // Start the game (after countdown)
  const startGame = useCallback(() => {
    console.log('Starting game');
    setGameState(GameState.PLAYING);
    gameStateRef.current = GameState.PLAYING;
    
    // Reset animation values
    startTimeRef.current = null;
    lastMultiplierRef.current = 1;
    setCurrentMultiplier(1);
    
    // Update round status in database
    if (currentRoundId.current) {
      supabase
        .from('rounds')
        .update({ status: 'running' })
        .eq('id', currentRoundId.current)
        .then(({ error }) => {
          if (error) console.error('Error updating round status:', error);
        });
    }
    
    // Start the multiplier animation using requestAnimationFrame for smooth updates
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      // Calculate elapsed time in seconds
      const elapsedMs = timestamp - startTimeRef.current;
      const elapsedSeconds = elapsedMs / 1000;
      
      // Calculate new multiplier using the specified formula
      const newMultiplier = calculateMultiplier(elapsedSeconds);
      
      // Prevent multiplier from going backward (important for consistency)
      if (newMultiplier > lastMultiplierRef.current) {
        lastMultiplierRef.current = newMultiplier;
        setCurrentMultiplier(newMultiplier);
      }
      
      // Check if crashed
      if (crashPointRef.current && hasCrashed(newMultiplier, crashPointRef.current)) {
        handleCrash(newMultiplier);
        return; // Stop animation
      }
      
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);
  
  // Handle game crash
  const handleCrash = useCallback((finalMultiplier: number) => {
    console.log(`Game crashed at ${finalMultiplier}`);
    
    // Update state
    setGameState(GameState.CRASHED);
    gameStateRef.current = GameState.CRASHED;
    
    // Update the final multiplier (important for accuracy)
    setCurrentMultiplier(finalMultiplier);
    
    // Cancel animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Update round in database
    if (currentRoundId.current) {
      supabase
        .from('rounds')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', currentRoundId.current)
        .then(({ error }) => {
          if (error) console.error('Error updating round status:', error);
        });
    }
    
    // Process bets that didn't cash out
    if (userBet && !hasUserCashedOut && isAuthenticated.current) {
      // User lost their bet
      toast.error(`Game crashed at ${finalMultiplier.toFixed(2)}x! You lost your bet.`, {
        position: 'top-center'
      });
    }
    
    // Update history locally for immediate UI update
    const newHistoryItem: RoundHistory = {
      id: currentRoundId.current || `local-${Date.now()}`,
      crashPoint: finalMultiplier,
      timestamp: new Date()
    };
    
    setRoundHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
    
    // Start new round after 10 seconds
    setTimeout(() => {
      startNewRound();
    }, 10000); // 10 second wait between rounds
  }, [userBet, hasUserCashedOut, startNewRound]);
  
  // Place bet
  const placeBet = useCallback(async (amount: number) => {
    // Validate game state - can only bet during countdown
    if (gameStateRef.current !== GameState.COUNTDOWN) {
      toast.error("You can only place bets during the countdown", {
        position: 'top-center'
      });
      return false;
    }
    
    // Validate authentication
    if (!isAuthenticated.current) {
      toast.error("Please sign in to place bets", {
        position: 'top-center'
      });
      return false;
    }
    
    // Validate amount
    if (amount <= 0) {
      toast.error("Bet amount must be greater than zero", {
        position: 'top-center'
      });
      return false;
    }
    
    if (amount > userBalance) {
      toast.error("Insufficient balance", {
        position: 'top-center'
      });
      return false;
    }
    
    // Check if already bet
    if (userBet !== null) {
      toast.error("You already have a bet for this round", {
        position: 'top-center'
      });
      return false;
    }
    
    try {
      // Get user data
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not found');
      }
      
      if (!currentRoundId.current) {
        throw new Error('No active round found');
      }
      
      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: userBalance - amount })
        .eq('id', userData.user.id);
        
      if (updateError) {
        throw new Error('Failed to update balance');
      }
      
      // Store bet in database
      const { error: betError } = await supabase
        .from('player_bets')
        .insert({
          user_id: userData.user.id,
          round_id: currentRoundId.current,
          bet_amount: amount,
          status: 'active'
        });
        
      if (betError) {
        // Rollback balance if bet insertion fails
        await supabase
          .from('profiles')
          .update({ balance: userBalance })
          .eq('id', userData.user.id);
          
        throw new Error('Failed to place bet');
      }
      
      // Update local state
      setUserBet(amount);
      setUserBalance(prev => prev - amount);
      
      // Refresh user balance
      await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userData.user.id)
        .single();
        
      toast.success(`Bet placed: $${amount.toFixed(2)}`, {
        position: 'top-center'
      });
      
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to place bet', {
        position: 'top-center'
      });
      console.error('Error placing bet:', error);
      return false;
    }
  }, [userBalance, userBet]);
  
  // Cash out
  const cashout = useCallback(async () => {
    // Validate game state - can only cash out during playing
    if (gameStateRef.current !== GameState.PLAYING) {
      toast.error("Game is not active", {
        position: 'top-center'
      });
      return false;
    }
    
    // Validate authentication
    if (!isAuthenticated.current) {
      toast.error("Please sign in to cash out", {
        position: 'top-center'
      });
      return false;
    }
    
    // Check if user has a bet
    if (userBet === null) {
      toast.error("You don't have an active bet", {
        position: 'top-center'
      });
      return false;
    }
    
    // Check if already cashed out
    if (hasUserCashedOut) {
      toast.error("You've already cashed out", {
        position: 'top-center'
      });
      return false;
    }
    
    try {
      // Get user data
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not found');
      }
      
      if (!currentRoundId.current) {
        throw new Error('No active round found');
      }
      
      // Calculate winnings based on current multiplier
      const winnings = userBet * currentMultiplier;
      
      // Update bet in database
      const { error: updateError } = await supabase
        .from('player_bets')
        .update({
          cashed_out_multiplier: currentMultiplier,
          status: 'won'
        })
        .eq('round_id', currentRoundId.current)
        .eq('user_id', userData.user.id);
        
      if (updateError) {
        throw new Error('Failed to update bet');
      }
      
      // Update balance in database
      const { data: balanceData, error: balanceError } = await supabase.rpc(
        'get_new_balance',
        {
          user_id: userData.user.id,
          amount_to_add: winnings
        }
      );
      
      if (balanceError) {
        throw new Error('Failed to calculate new balance');
      }
      
      const { error: updateBalanceError } = await supabase
        .from('profiles')
        .update({ balance: balanceData })
        .eq('id', userData.user.id);
        
      if (updateBalanceError) {
        throw new Error('Failed to update balance');
      }
      
      // Update local state
      setHasUserCashedOut(true);
      setUserWinnings(winnings);
      setUserBalance(prev => prev + winnings);
      
      const profit = winnings - userBet;
      toast.success(`Cashed out at ${currentMultiplier.toFixed(2)}x! Won $${profit.toFixed(2)}`, {
        position: 'top-center'
      });
      
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to cash out', {
        position: 'top-center'
      });
      console.error('Error cashing out:', error);
      return false;
    }
  }, [userBet, currentMultiplier, hasUserCashedOut]);
  
  // Start the first round when component mounts
  useEffect(() => {
    startNewRound();
    
    // Clean up on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startNewRound]);
  
  // Return the game state and functions
  return {
    // Game state
    gameState,
    currentMultiplier,
    countdownTimer,
    crashPoint,
    roundHistory,
    players,
    
    // User state
    userBalance,
    userBet,
    hasUserCashedOut,
    userWinnings,
    
    // Actions
    placeBet,
    cashout,
    formatMultiplier
  };
};
