
import React, { useState, useEffect } from 'react';
import { useCrashGameEngine } from '@/hooks/useCrashGameEngine';
import BettingPanel from '@/components/game/betting/BettingPanel';
import GameStatistics from '@/components/game/GameStatistics';
import LeaderBoard from '@/components/game/LeaderBoard';
import SimpleMultiplier from '@/components/game/SimpleMultiplier';
import StatusOverlay from '@/components/game/StatusOverlay';
import AuthModal from '@/components/auth/AuthModal';
import { toast } from 'sonner';
import { GAME_STATE } from '@/hooks/game/types';

const CrashGame: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [lastGameState, setLastGameState] = useState<string | null>(null);
  
  const {
    gameState,
    countdownTimer,
    currentMultiplier,
    crashPoint,
    gameHistory,
    playerBet,
    playerWin,
    isBetPlaced,
    playerAutoCashout, // Get auto cashout value to show in UI if needed
    userBalance,
    isAuthenticated,
    players,
    isProcessingBet,
    isProcessingCashout,
    betError,
    handlePlaceBet,
    handleCashout,
    resetPlayerState, // We'll use this function to reset player state
  } = useCrashGameEngine();

  // Monitor game state changes for debugging
  useEffect(() => {
    if (lastGameState !== gameState) {
      console.log(`Game state changed from ${lastGameState || 'initial'} to ${gameState}`);
      setLastGameState(gameState);
      
      // CRITICAL FIX: Reset player state when transitioning to WAITING state after a round
      // This ensures previously cashed out players can bet in the new round
      if (gameState === GAME_STATE.WAITING && lastGameState === GAME_STATE.CRASHED) {
        console.log("Explicitly resetting player state in CrashGame component");
        resetPlayerState(); // Fixed: Don't pass any arguments
      }
    }
  }, [gameState, lastGameState, resetPlayerState]);
  
  // Monitor player bet/win state changes for debugging
  useEffect(() => {
    console.log(`Bet state: ${isBetPlaced ? 'PLACED' : 'NOT PLACED'}, Win state: ${playerWin !== null ? `WON at ${playerWin}x` : 'NO WIN'}`);
    // Also log if auto cashout is set
    if (playerAutoCashout) {
      console.log(`Auto cashout set to ${playerAutoCashout}x`);
    }
  }, [isBetPlaced, playerWin, playerAutoCashout]);

  const onPlaceBet = async (amount: number, autoCashout?: number | null) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    try {
      await handlePlaceBet(amount, autoCashout);
    } catch (err) {
      console.error("Error in place bet handler:", err);
      toast.error("Failed to place bet. Please try again.", { position: 'top-center' });
    }
  };

  const onCashout = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    try {
      // Fixed: Remove the current multiplier argument from handleCashout
      await handleCashout();
    } catch (err) {
      console.error("Error in cashout handler:", err);
      toast.error("Failed to cash out. Please try again.", { position: 'top-center' });
    }
  };

  return (
    <div className="w-full relative">
      {/* Game area with multiplier, betting panel and leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Multiplier Display (Top) */}
        <div className="lg:col-span-6 lg:col-start-4 order-1 bg-[#131c29] rounded-md flex items-center justify-center min-h-[240px] md:min-h-[320px] p-4 relative">
          <SimpleMultiplier 
            currentMultiplier={currentMultiplier}
            gameState={gameState}
            crashPoint={crashPoint}
            remainingTime={countdownTimer}
            playerWin={playerWin} // Pass playerWin to show cashout status
          />
        </div>
        
        {/* Betting Panel (Left) */}
        <div className="lg:col-span-3 lg:col-start-1 lg:row-start-1 order-3 lg:order-2">
          <BettingPanel
            isPlaying={gameState === 'playing'}
            isCrashed={gameState === 'crashed'}
            hasWon={playerWin !== null}
            onPlaceBet={onPlaceBet}
            onCashout={onCashout}
            remainingTime={countdownTimer}
            balance={userBalance}
            isBetPlaced={isBetPlaced}
            gameState={gameState}
            isProcessingBet={isProcessingBet}
            isProcessingCashout={isProcessingCashout}
            betError={betError}
          />
        </div>
        
        {/* Leaderboard (Right) */}
        <div className="lg:col-span-3 lg:col-start-10 lg:row-start-1 order-2 lg:order-3">
          <LeaderBoard players={players} />
        </div>
        
        {/* Game Statistics - Now at the bottom */}
        <div className="lg:col-span-12 order-4 mt-4">
          <GameStatistics />
        </div>
      </div>

      {/* Status Overlay */}
      <StatusOverlay 
        isCrashed={gameState === GAME_STATE.CRASHED} 
        isCashedOut={playerWin !== null && gameState === GAME_STATE.PLAYING}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default CrashGame;
