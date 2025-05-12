
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GAME_STATE, HistoryItem } from './types';
import { toast } from 'sonner';

export const useProvablyFairGame = () => {
  // Game state
  const [gameState, setGameState] = useState<GAME_STATE>(GAME_STATE.WAITING);
  const [countdownTimer, setCountdownTimer] = useState<number>(10);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [gameHistory, setGameHistory] = useState<HistoryItem[]>([]);
  const [isRoundActive, setIsRoundActive] = useState<boolean>(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);
  
  // Player state
  const [playerBet, setPlayerBet] = useState<number | null>(null);
  const [playerWin, setPlayerWin] = useState<number | null>(null);
  const [isBetPlaced, setIsBetPlaced] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<number>(1000);
  const [isProcessingBet, setIsProcessingBet] = useState<boolean>(false);
  const [isProcessingCashout, setIsProcessingCashout] = useState<boolean>(false);
  const [betError, setBetError] = useState<string | null>(null);
  
  // Refs for animation and timing
  const gameLoopRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const crashPointGeneratedRef = useRef<boolean>(false);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      if (data.session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData && !isNaN(profileData.balance)) {
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
  
  // Fetch game history
  const fetchGameHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('id, crash_multiplier, ended_at')
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      if (data) {
        const historyItems: HistoryItem[] = data.map(round => ({
          id: round.id,
          multiplier: round.crash_multiplier,
          timestamp: round.ended_at || new Date().toISOString()
        }));
        
        setGameHistory(historyItems);
      }
    } catch (err) {
      console.error('Error fetching game history:', err);
    }
  }, []);
  
  // Generate a provably fair crash point
  const generateCrashPoint = useCallback((): number => {
    // Simple random crash point formula 
    // In a real implementation, you'd use a provably fair algorithm with server seed + client seed
    return 1.01 + (Math.random() * 10);
  }, []);
  
  // Calculate current multiplier based on elapsed time
  const calculateMultiplier = useCallback((timeElapsed: number): number => {
    // Using the specified formula: 1 + (timeElapsedInSeconds)^1.3
    return 1 + Math.pow(timeElapsed, 1.3);
  }, []);
  
  // Start a new round
  const startNewRound = useCallback(async () => {
    console.log("Starting new round");
    
    // Generate new crash point
    if (!crashPointGeneratedRef.current) {
      const newCrashPoint = generateCrashPoint();
      setCrashPoint(newCrashPoint);
      crashPointGeneratedRef.current = true;
      console.log(`Generated crash point: ${newCrashPoint.toFixed(2)}x`);
      
      // Create new round in database
      try {
        const { data: roundData, error: roundError } = await supabase
          .from('rounds')
          .insert({
            crash_multiplier: newCrashPoint,
            status: 'pending'
          })
          .select('id')
          .single();
          
        if (roundError) throw roundError;
        
        if (roundData) {
          setRoundId(roundData.id);
          console.log(`Created round with ID: ${roundData.id}`);
        }
      } catch (err) {
        console.error('Error creating round:', err);
      }
    }
    
    // Start countdown
    setGameState(GAME_STATE.COUNTDOWN);
    setCountdownTimer(10);
    setCurrentMultiplier(1);
    setIsRoundActive(false);
    
    console.log("Round countdown started");
  }, [generateCrashPoint]);
  
  // Handle countdown
  useEffect(() => {
    if (gameState === GAME_STATE.COUNTDOWN && countdownTimer > 0) {
      const timer = setTimeout(() => {
        setCountdownTimer(prev => Math.max(0, prev - 0.1));
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    if (gameState === GAME_STATE.COUNTDOWN && countdownTimer <= 0) {
      // Start playing
      setGameState(GAME_STATE.PLAYING);
      setIsRoundActive(true);
      startTimeRef.current = performance.now();
      lastTimeRef.current = performance.now();
      
      // Update round status in database
      if (roundId) {
        supabase
          .from('rounds')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('id', roundId)
          .then(() => {
            console.log(`Updated round ${roundId} status to running`);
          })
          .catch(err => {
            console.error('Error updating round status:', err);
          });
      }
      
      console.log("Round started - multiplier rising");
    }
    
    if (gameState === GAME_STATE.CRASHED && countdownTimer <= 0) {
      // Reset for next round
      crashPointGeneratedRef.current = false;
      setPlayerBet(null);
      setPlayerWin(null);
      setIsBetPlaced(false);
      setBetError(null);
      startNewRound();
    }
  }, [gameState, countdownTimer, roundId, startNewRound]);
  
  // Handle multiplier animation
  const animateMultiplier = useCallback(() => {
    if (gameState !== GAME_STATE.PLAYING || !startTimeRef.current || !lastTimeRef.current) {
      return;
    }
    
    const now = performance.now();
    const elapsedSeconds = (now - startTimeRef.current) / 1000;
    
    // Calculate new multiplier using the formula: 1 + (timeElapsedInSeconds)^1.3
    const newMultiplier = calculateMultiplier(elapsedSeconds);
    
    // Check if we've reached the crash point
    if (crashPoint !== null && newMultiplier >= crashPoint) {
      console.log(`Crash point reached: ${newMultiplier.toFixed(2)}x >= ${crashPoint.toFixed(2)}x`);
      
      // Complete the round
      setCurrentMultiplier(crashPoint);
      setGameState(GAME_STATE.CRASHED);
      setIsRoundActive(false);
      setCountdownTimer(10);
      
      // Update round in database
      if (roundId) {
        supabase
          .from('rounds')
          .update({ status: 'completed', ended_at: new Date().toISOString() })
          .eq('id', roundId)
          .then(() => {
            console.log(`Updated round ${roundId} status to completed`);
            fetchGameHistory();
          })
          .catch(err => {
            console.error('Error updating round status:', err);
          });
      }
      
      // If player placed a bet but didn't cash out, they lost
      if (isBetPlaced && playerWin === null) {
        toast.error(`Crashed at ${crashPoint.toFixed(2)}x! You lost your bet.`, { position: 'top-center' });
      }
      
      return;
    }
    
    // Update multiplier
    setCurrentMultiplier(newMultiplier);
    lastTimeRef.current = now;
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animateMultiplier);
  }, [gameState, crashPoint, isBetPlaced, playerWin, calculateMultiplier, roundId, fetchGameHistory]);
  
  // Start and stop animation
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateMultiplier);
    } else if (gameState !== GAME_STATE.PLAYING && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [gameState, animateMultiplier]);
  
  // Handle bet placement
  const handlePlaceBet = useCallback(async (amount: number, autoCashoutAt?: number | null) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place bets", { position: 'top-center' });
      return;
    }
    
    if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.WAITING) {
      toast.error("You can only place bets before the round starts", { position: 'top-center' });
      setBetError("Betting is only allowed before the round starts");
      return;
    }
    
    if (amount <= 0) {
      toast.error("Bet amount must be greater than zero", { position: 'top-center' });
      setBetError("Bet amount must be greater than zero");
      return;
    }
    
    if (amount > userBalance) {
      toast.error("Insufficient balance for this bet", { position: 'top-center' });
      setBetError("Insufficient balance for this bet");
      return;
    }
    
    setIsProcessingBet(true);
    setBetError(null);
    
    try {
      // Ensure we have a round
      if (!roundId) {
        if (crashPointGeneratedRef.current === false) {
          await startNewRound();
        } else {
          throw new Error("No active round available");
        }
      }
      
      // Place bet in database
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error("User not found");
      }
      
      const userId = userData.user.id;
      
      // First check user's balance
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        throw new Error("Could not retrieve user balance");
      }
      
      if (profileData.balance < amount) {
        throw new Error("Insufficient balance");
      }
      
      // Update balance immediately for responsiveness
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: profileData.balance - amount })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error("Failed to update balance");
      }
      
      // Insert the bet
      const { error: betError } = await supabase
        .from('player_bets')
        .insert({
          user_id: userId,
          round_id: roundId,
          bet_amount: amount,
          auto_cashout_at: autoCashoutAt,
          status: 'active'
        });
        
      if (betError) {
        // Rollback balance change if bet insertion fails
        await supabase
          .from('profiles')
          .update({ balance: profileData.balance })
          .eq('id', userId);
          
        throw new Error("Failed to place bet");
      }
      
      // Update local state
      setPlayerBet(amount);
      setIsBetPlaced(true);
      setUserBalance(profileData.balance - amount);
      
      toast.success(`Bet placed: $${amount.toFixed(2)}`, { position: 'top-center' });
      
      // If game is waiting, start the countdown
      if (gameState === GAME_STATE.WAITING) {
        startNewRound();
      }
    } catch (error: any) {
      console.error("Bet placement error:", error);
      setBetError(error.message || "Failed to place bet");
      toast.error(error.message || "Failed to place bet", { position: 'top-center' });
    } finally {
      setIsProcessingBet(false);
    }
  }, [gameState, isAuthenticated, roundId, startNewRound, userBalance]);
  
  // Handle cashout
  const handleCashout = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to cash out", { position: 'top-center' });
      return;
    }
    
    if (gameState !== GAME_STATE.PLAYING) {
      toast.error("Round is not active - cannot cash out", { position: 'top-center' });
      return;
    }
    
    if (!isBetPlaced || playerBet === null) {
      toast.error("You have not placed a bet in this round", { position: 'top-center' });
      return;
    }
    
    if (playerWin !== null) {
      toast.error("You have already cashed out this round", { position: 'top-center' });
      return;
    }
    
    setIsProcessingCashout(true);
    
    try {
      // Cash out in database
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user || !roundId) {
        throw new Error("User or round not found");
      }
      
      const userId = userData.user.id;
      
      // Update the bet with cashout multiplier
      const { error: updateError } = await supabase
        .from('player_bets')
        .update({ 
          cashed_out_multiplier: currentMultiplier,
          status: 'won'
        })
        .eq('user_id', userId)
        .eq('round_id', roundId)
        .is('cashed_out_multiplier', null);
        
      if (updateError) {
        throw new Error("Failed to update bet status");
      }
      
      // Calculate winnings
      const winnings = playerBet * currentMultiplier;
      
      // Update user balance
      const { data: newBalance, error: balanceError } = await supabase.rpc(
        'get_new_balance', 
        { 
          user_id: userId, 
          amount_to_add: winnings 
        }
      );
      
      if (balanceError) {
        throw new Error("Failed to calculate new balance");
      }
      
      const { error: updateBalanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
        
      if (updateBalanceError) {
        throw new Error("Failed to update balance");
      }
      
      // Update local state
      setPlayerWin(currentMultiplier);
      setUserBalance(newBalance);
      
      const profit = winnings - playerBet;
      toast.success(
        `Cashed out! Won $${profit.toFixed(2)}. Total: $${winnings.toFixed(2)}`, 
        { position: 'top-center' }
      );
    } catch (error: any) {
      console.error("Cashout error:", error);
      toast.error(error.message || "Failed to cash out", { position: 'top-center' });
    } finally {
      setIsProcessingCashout(false);
    }
  }, [gameState, isAuthenticated, isBetPlaced, playerBet, playerWin, roundId, currentMultiplier]);
  
  // Auto-cashout
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING && playerBet !== null && playerWin === null) {
      // Implement auto-cashout logic here if needed
    }
  }, [gameState, currentMultiplier, playerBet, playerWin]);
  
  // Start the game loop when component mounts
  useEffect(() => {
    if (gameLoopRef.current) return;
    
    gameLoopRef.current = true;
    fetchGameHistory();
    startNewRound();
    
    return () => {
      gameLoopRef.current = false;
    };
  }, [fetchGameHistory, startNewRound]);
  
  return {
    gameState,
    countdownTimer,
    currentMultiplier,
    crashPoint,
    gameHistory,
    playerBet,
    playerWin,
    isBetPlaced,
    userBalance,
    isAuthenticated,
    isRoundActive,
    players,
    isProcessingBet,
    isProcessingCashout,
    betError,
    handlePlaceBet,
    handleCashout,
    fetchGameHistory,
  };
};
