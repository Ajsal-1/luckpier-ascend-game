
import React, { useState, useEffect } from 'react';
import { useCrashGameEngine } from '@/hooks/useCrashGameEngine';
import BettingPanel from '@/components/game/betting/BettingPanel';
import GameStatistics from '@/components/game/GameStatistics';
import LeaderBoard from '@/components/game/LeaderBoard';
import SimpleMultiplier from '@/components/game/SimpleMultiplier';
import AuthModal from '@/components/auth/AuthModal';
import { toast } from 'sonner';

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
    userBalance,
    isAuthenticated,
    players,
    isProcessingBet,
    isProcessingCashout,
    betError,
    handlePlaceBet,
    handleCashout,
  } = useCrashGameEngine();

  // Monitor game state changes for debugging
  useEffect(() => {
    if (lastGameState !== gameState) {
      console.log(`Game state changed from ${lastGameState || 'initial'} to ${gameState}`);
      setLastGameState(gameState);
    }
  }, [gameState, lastGameState]);
  
  // Monitor player bet/win state changes for debugging
  useEffect(() => {
    console.log(`Bet state: ${isBetPlaced ? 'PLACED' : 'NOT PLACED'}, Win state: ${playerWin !== null ? `WON at ${playerWin}x` : 'NO WIN'}`);
  }, [isBetPlaced, playerWin]);

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
      // Pass the current multiplier to handleCashout to ensure the correct value is used
      await handleCashout(currentMultiplier);
    } catch (err) {
      console.error("Error in cashout handler:", err);
      toast.error("Failed to cash out. Please try again.", { position: 'top-center' });
    }
  };

  return (
    <div className="w-full">
      {/* Game area with multiplier, betting panel and leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Game Statistics - Replaced GameHistory */}
        <div className="lg:col-span-12 mb-2">
          <GameStatistics lastUpdate={new Date()} />
        </div>
        
        {/* Betting Panel (Left on desktop) */}
        <div className="lg:col-span-3 order-3 lg:order-1">
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
        
        {/* Multiplier Display (Center) */}
        <div className="lg:col-span-6 order-1 lg:order-2 bg-[#131c29] rounded-md flex items-center justify-center min-h-[240px] md:min-h-[320px] p-4 relative">
          <SimpleMultiplier 
            currentMultiplier={currentMultiplier}
            gameState={gameState}
            crashPoint={crashPoint}
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
