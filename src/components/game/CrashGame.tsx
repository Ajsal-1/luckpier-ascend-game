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
import { useClientBetting } from '@/hooks/game/useClientBetting';

const CrashGame: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const { isAuthenticated, wallet, refreshWalletBalance } = useAuth();
  const [lastBalanceRefresh, setLastBalanceRefresh] = useState<number>(Date.now());
  const [isProcessingBet, setIsProcessingBet] = useState<boolean>(false);
  const [isProcessingCashout, setIsProcessingCashout] = useState<boolean>(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;
  
  // Import our new client-side betting functionality
  const { placeBet: clientPlaceBet, cashout: clientCashout } = useClientBetting();

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

  // IMPROVED: Better bet placement with enhanced validation and client-side first approach
  const onPlaceBet = async (amount: number, autoCashout?: number | null) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place bets", { position: 'top-center' });
      setIsAuthModalOpen(true);
      return;
    }
    
    // IMPROVED: Allow betting during both countdown AND crashed states
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
      // NEW APPROACH: Try client-side bet placement first for better reliability
      const clientResult = await clientPlaceBet(currentRound.round_id, amount, autoCashout, gameState);
      
      if (clientResult.success) {
        // If client-side bet was successful, update local state
        handlePlaceBet(amount, autoCashout);
        throttledRefreshBalance();
        toast.success(`Bet placed: $${amount.toFixed(2)}`, { position: 'top-center' });
        setRetryCount(0);
        return;
      }
      
      // If client-side bet failed, try server-side betting as fallback
      await handlePlaceBet(amount, autoCashout);
      
      // If successful, refresh balance and show confirmation toast
      throttledRefreshBalance();
      toast.success(`Bet placed: $${amount.toFixed(2)}`, { position: 'top-center' });
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      const errorMsg = error.message || "Unknown error";
      console.error("Bet placement error:", error);
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        toast.info("Retrying bet placement...", { position: 'top-center' });
        
        try {
          // One more try with client-side approach
          const clientRetryResult = await clientPlaceBet(currentRound.round_id, amount, autoCashout, gameState);
          
          if (clientRetryResult.success) {
            // If retry was successful, update local state
            handlePlaceBet(amount, autoCashout);
            toast.success(`Bet placed on retry: $${amount.toFixed(2)}`, { position: 'top-center' });
            throttledRefreshBalance();
            setRetryCount(0);
            return;
          } else {
            // If both methods fail, show the error
            toast.error(`Failed to place bet: ${clientRetryResult.error || errorMsg}`, { position: 'top-center' });
            setBetError(clientRetryResult.error || errorMsg);
          }
        } catch (fallbackError: any) {
          // If both methods fail, show the error
          toast.error(`Failed to place bet: ${fallbackError.message || errorMsg}`, { position: 'top-center' });
          setBetError(fallbackError.message || errorMsg);
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

  // IMPROVED: Better cashout handling with client-side first approach
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
      // NEW APPROACH: Try client-side cashout first for better reliability
      const clientResult = await clientCashout(currentRound.round_id, currentMultiplier);
      
      if (clientResult.success) {
        // If client-side cashout was successful, update local state
        handleCashout();
        throttledRefreshBalance();
        toast.success(
          `Cashed out! Won $${clientResult.profit.toFixed(2)}. Total: $${clientResult.winnings.toFixed(2)}`, 
          { position: 'top-center' }
        );
        setRetryCount(0);
        return;
      }
      
      // If client-side cashout failed, try server-side cashout as fallback
      await handleCashout();
      throttledRefreshBalance();
      setRetryCount(0);
      
    } catch (error: any) {
      const errorMsg = error.message || "Unknown error";
      console.error("Cashout error:", error);
      
      // Try client-side cashout again as a fallback
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        try {
          toast.info("Retrying cashout...", { position: 'top-center' });
          
          // One more try with client-side approach
          const clientRetryResult = await clientCashout(currentRound.round_id, currentMultiplier);
          
          if (clientRetryResult.success) {
            handleCashout(); // Update local state
            toast.success(
              `Cashed out on retry! Won $${clientRetryResult.profit.toFixed(2)}. Total: $${clientRetryResult.winnings.toFixed(2)}`, 
              { position: 'top-center' }
            );
            throttledRefreshBalance();
            setRetryCount(0);
          } else {
            toast.error(`Failed to cash out: ${clientRetryResult.error || errorMsg}`, { position: 'top-center' });
          }
        } catch (fallbackError: any) {
          toast.error(`Failed to cash out: ${fallbackError.message || errorMsg}`, { position: 'top-center' });
        }
      } else {
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
