
import React, { useState, useEffect, useCallback } from 'react';
import { useMultiplayerCrashGame } from '@/hooks/game/useMultiplayerCrashGame';
import { GAME_STATE } from '@/hooks/game/types';
import Multiplier from '@/components/game/Multiplier';
import BettingPanel from '@/components/game/BettingPanel';
import GameHistory from '@/components/game/GameHistory';
import LeaderBoard from '@/components/game/LeaderBoard';
import HelpModal from '@/components/game/HelpModal';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import AuthModal from '@/components/auth/AuthModal';
import { supabase } from '@/integrations/supabase/client';

const CrashGame: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const { isAuthenticated, wallet, refreshWalletBalance } = useAuth();
  const [lastBalanceRefresh, setLastBalanceRefresh] = useState<number>(Date.now());
  const [isProcessingBet, setIsProcessingBet] = useState<boolean>(false);
  const [isProcessingCashout, setIsProcessingCashout] = useState<boolean>(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;

  const {
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
    handlePlaceBet,
    handleCashout,
    currentRound,
  } = useMultiplayerCrashGame();

  // Update wallet balance only when significant events occur, with rate limiting
  const throttledRefreshBalance = useCallback(() => {
    const now = Date.now();
    if (now - lastBalanceRefresh > 2000) { // Limit to once every 2 seconds
      refreshWalletBalance();
      setLastBalanceRefresh(now);
    }
  }, [lastBalanceRefresh, refreshWalletBalance]);
  
  // Update wallet balance for key events only
  useEffect(() => {
    if (isAuthenticated && (playerBet !== null || playerWin !== null)) {
      throttledRefreshBalance();
    }
  }, [playerBet, playerWin, isAuthenticated, throttledRefreshBalance]);
  
  // Add a realtime subscription for round updates with more aggressive balance refreshing
  useEffect(() => {
    // Subscribe to changes in rounds table to keep history updated
    const roundsChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rounds',
        filter: 'status=eq.completed'
      }, () => {
        console.log("Round completed, refreshing game history");
        // This will be triggered when a round is completed
        if (useMultiplayerCrashGame().fetchGameHistory) {
          useMultiplayerCrashGame().fetchGameHistory();
        }
        
        // Also refresh wallet balance on round completion
        if (isAuthenticated) {
          throttledRefreshBalance();
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(roundsChannel);
    };
  }, [isAuthenticated, throttledRefreshBalance]);
  
  // Initial balance load when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      throttledRefreshBalance();
    }
  }, [isAuthenticated, throttledRefreshBalance]);

  // Helper function to place bet directly in the database
  const placeBetInDatabase = async (roundId: string, amount: number, autoCashout: number | null) => {
    try {
      // Get user ID
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not found');
      const userId = userData.user.id;
      
      // First subtract balance to prevent double betting
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
        
      if (profileError) throw new Error('Could not retrieve user balance');
      if (profileData.balance < amount) throw new Error('Insufficient balance');
      
      // Update balance immediately for responsiveness
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: profileData.balance - amount })
        .eq('id', userId);
        
      if (updateError) throw new Error('Failed to update balance');
      
      // Insert the bet
      const { error: betError } = await supabase
        .from('player_bets')
        .insert({
          user_id: userId,
          round_id: roundId,
          bet_amount: amount,
          auto_cashout_at: autoCashout,
          status: 'active'
        });
        
      if (betError) {
        // Rollback balance change
        await supabase
          .from('profiles')
          .update({ balance: profileData.balance })
          .eq('id', userId);
          
        throw new Error('Failed to place bet');
      }
      
      return true;
    } catch (error: any) {
      console.error('Database bet placement error:', error);
      throw error;
    }
  };

  // IMPROVED: Better bet placement with enhanced validation and direct database fallback
  const onPlaceBet = async (amount: number, autoCashout?: number | null) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place bets", { position: 'top-center' });
      setIsAuthModalOpen(true);
      return;
    }
    
    // FIXED: Allow betting during both countdown AND crashed states
    if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.CRASHED) {
      toast.error("Betting is only allowed during betting periods", { position: 'top-center' });
      setBetError("Betting is only allowed during betting periods");
      return;
    }
    
    // Reset any previous errors
    setBetError(null);
    
    // Check user's wallet balance
    if (amount > wallet.balance) {
      toast.error("Insufficient balance for this bet", { position: 'top-center' });
      setBetError("Insufficient balance for this bet");
      return;
    }

    // Check if we have a round ID
    if (!currentRound || !currentRound.round_id) {
      toast.error("No active round available", { position: 'top-center' });
      setBetError("No active round available");
      return;
    }
    
    setIsProcessingBet(true);
    try {
      // First try the standard bet placement method
      await handlePlaceBet(amount, autoCashout);
      
      // If successful, refresh balance and show confirmation toast
      throttledRefreshBalance();
      toast.success(`Bet placed: $${amount.toFixed(2)}`, { position: 'top-center' });
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      const errorMsg = error.message || "Unknown error";
      console.error("Bet placement error:", error);
      
      // If we get an error and have retries left, attempt direct database insertion as fallback
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        try {
          toast.info("Retrying bet placement...", { position: 'top-center' });
          
          // Direct database placement as fallback
          await placeBetInDatabase(currentRound.round_id, amount, autoCashout || null);
          
          // If successful, show success message and refresh UI state
          toast.success(`Bet placed on retry: $${amount.toFixed(2)}`, { position: 'top-center' });
          throttledRefreshBalance();
          
          // Manually update our game state since we bypassed the normal flow
          setRetryCount(0); // Reset retry count on success
          
        } catch (fallbackError: any) {
          // If both methods fail, show the error
          const fallbackErrorMsg = fallbackError.message || "Unknown error";
          toast.error(`Failed to place bet: ${fallbackErrorMsg}`, { position: 'top-center' });
          setBetError(fallbackErrorMsg);
        }
      } else {
        // We've tried enough times, show the error
        toast.error(`Failed to place bet after ${maxRetries} attempts: ${errorMsg}`, { position: 'top-center' });
        setBetError(errorMsg);
      }
    } finally {
      setIsProcessingBet(false);
    }
  };

  // Direct database cashout function as fallback
  const cashoutInDatabase = async (roundId: string, multiplier: number) => {
    try {
      // Get user ID
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not found');
      const userId = userData.user.id;
      
      // Find the bet
      const { data: bet, error: betError } = await supabase
        .from('player_bets')
        .select('bet_amount')
        .eq('user_id', userId)
        .eq('round_id', roundId)
        .is('cashed_out_multiplier', null)
        .single();
      
      if (betError || !bet) throw new Error('No active bet found');
      
      // Update the bet with cashout multiplier
      const { error: updateError } = await supabase
        .from('player_bets')
        .update({ 
          cashed_out_multiplier: multiplier,
          status: 'won'
        })
        .eq('user_id', userId)
        .eq('round_id', roundId)
        .is('cashed_out_multiplier', null);
        
      if (updateError) throw new Error('Failed to update bet status');
      
      // Calculate winnings
      const winnings = bet.bet_amount * multiplier;
      
      // Update user balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          balance: supabase.rpc('get_new_balance', { 
            user_id: userId, 
            amount_to_add: winnings 
          }) 
        })
        .eq('id', userId);
        
      if (balanceError) throw new Error('Failed to update balance');
      
      return winnings;
    } catch (error: any) {
      console.error('Database cashout error:', error);
      throw error;
    }
  };

  // IMPROVED: Better cashout handling with enhanced error feedback
  const onCashout = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to cash out", { position: 'top-center' });
      setIsAuthModalOpen(true);
      return;
    }
    
    if (!currentRound || !currentRound.round_id) {
      toast.error("No active round", { position: 'top-center' });
      return;
    }
    
    setIsProcessingCashout(true);
    try {
      await handleCashout();
      
      // Refresh wallet balance immediately after cashing out
      throttledRefreshBalance();
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      const errorMsg = error.message || "Unknown error";
      console.error("Cashout error:", error);
      
      // Try direct database cashout as fallback if we have retries left
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        try {
          toast.info("Retrying cashout...", { position: 'top-center' });
          
          // Fall back to direct database update
          const winnings = await cashoutInDatabase(currentRound.round_id, currentMultiplier);
          
          // Manual success message
          const profit = winnings - (playerBet || 0);
          toast.success(
            `Cashed out on retry! Won $${profit.toFixed(2)}. Total: $${winnings.toFixed(2)}`, 
            { position: 'top-center' }
          );
          
          throttledRefreshBalance();
          setRetryCount(0); // Reset retry count on success
          
        } catch (fallbackError: any) {
          // If both methods fail, show the error
          toast.error(`Failed to cash out: ${fallbackError.message || errorMsg}`, { position: 'top-center' });
        }
      } else {
        // We've tried enough times, show the error
        toast.error(`Failed to cash out after ${maxRetries} attempts: ${errorMsg}`, { position: 'top-center' });
      }
    } finally {
      setIsProcessingCashout(false);
    }
  };

  // IMPROVED: Better game state messages
  const getGameStateMessage = () => {
    switch(gameState) {
      case GAME_STATE.WAITING:
        return "Waiting for next round...";
      case GAME_STATE.COUNTDOWN:
        return `Betting open! Starting in ${Math.ceil(countdownTimer || 5)}s`;
      case GAME_STATE.PLAYING:
        return "Game in progress";
      case GAME_STATE.CRASHED:
        return `Game crashed! Betting open for ${Math.ceil(countdownTimer || 5)}s`;
      default:
        return "Unknown game state";
    }
  };

  return (
    <div className="w-full">
      {/* Game status indicator */}
      <div className="w-full flex justify-between items-center mb-2">
        <div className={`text-sm font-medium ${(gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.CRASHED) ? 'text-green-400' : ''}`}>
          {getGameStateMessage()}
        </div>
        <div className="text-sm font-medium">
          Players: {players.length}
        </div>
      </div>
      
      {/* Game History */}
      <div className="w-full">
        <GameHistory history={gameHistory} />
      </div>
      
      {/* Game area with multiplier, betting panel and leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Betting Panel (Left on desktop) */}
        <div className="lg:col-span-3 order-3 lg:order-1">
          <BettingPanel
            isPlaying={gameState === GAME_STATE.PLAYING}
            isCrashed={gameState === GAME_STATE.CRASHED}
            hasWon={playerWin !== null}
            onPlaceBet={onPlaceBet}
            onCashout={onCashout}
            remainingTime={countdownTimer}
            balance={wallet.balance}
            isBetPlaced={isBetPlaced}
            gameState={gameState}
            isProcessingBet={isProcessingBet}
            isProcessingCashout={isProcessingCashout}
            betError={betError}
          />
        </div>
        
        {/* Multiplier Chart (Center) */}
        <div className="lg:col-span-6 order-1 lg:order-2 bg-[#131c29] rounded-md flex items-center justify-center min-h-[240px] md:min-h-[320px] p-4 relative">
          {/* Help Modal Button */}
          <HelpModal />
          
          <Multiplier 
            isPlaying={gameState === GAME_STATE.PLAYING}
            isCrashed={gameState === GAME_STATE.CRASHED}
            winValue={playerWin}
            crashValue={crashPoint}
            onCrash={() => {}} // This is now handled by the server
            currentMultiplier={currentMultiplier}
            onMultiplierUpdate={() => {}} // This is now handled by the server
            gameState={gameState}
            remainingTime={countdownTimer}
          />
        </div>
        
        {/* Leaderboard (Right) */}
        <div className="lg:col-span-3 order-2 lg:order-3">
          <LeaderBoard players={players} />
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default CrashGame;
