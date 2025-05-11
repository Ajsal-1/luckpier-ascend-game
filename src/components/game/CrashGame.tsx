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

  // Update wallet balance whenever significant events occur
  useEffect(() => {
    if (isAuthenticated && (playerBet !== null || playerWin !== null)) {
      refreshWalletBalance();
    }
  }, [playerBet, playerWin, isAuthenticated, refreshWalletBalance]);
  
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
          refreshWalletBalance();
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(roundsChannel);
    };
  }, [isAuthenticated, refreshWalletBalance]);
  
  // Set up more frequent periodic refreshes of the wallet balance
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Initial refresh once on component mount
    refreshWalletBalance();
    
    // Set up interval for periodic refreshes - more frequent
    const intervalId = setInterval(() => {
      refreshWalletBalance();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshWalletBalance]);

  const onPlaceBet = async (amount: number, autoCashout?: number | null) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place bets", { position: 'top-center' });
      setIsAuthModalOpen(true);
      return;
    }
    
    // Allow betting during countdown AND crashed states (for the 5s betting window)
    if (gameState !== GAME_STATE.COUNTDOWN && gameState !== GAME_STATE.CRASHED) {
      toast.error("Betting is only allowed during betting periods", { position: 'top-center' });
      return;
    }
    
    // Check user's wallet balance
    if (amount > wallet.balance) {
      toast.error("Insufficient balance for this bet", { position: 'top-center' });
      return;
    }
    
    try {
      await handlePlaceBet(amount, autoCashout);
      
      // Refresh wallet balance immediately after placing bet
      refreshWalletBalance();
      
      // Show confirmation toast
      toast.success(`Bet placed: $${amount.toFixed(2)}`, { position: 'top-center' });
    } catch (error: any) {
      toast.error(`Failed to place bet: ${error.message || "Unknown error"}`, { position: 'top-center' });
    }
  };

  const onCashout = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to cash out", { position: 'top-center' });
      setIsAuthModalOpen(true);
      return;
    }
    
    try {
      await handleCashout();
      
      // Refresh wallet balance immediately after cashing out
      refreshWalletBalance();
    } catch (error: any) {
      toast.error(`Failed to cash out: ${error.message || "Unknown error"}`, { position: 'top-center' });
    }
  };

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
