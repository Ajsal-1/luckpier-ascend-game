
import React from 'react';
import { useProvablyFairGame } from '@/hooks/game/useProvablyFairGame';
import BettingPanel from '@/components/game/betting/BettingPanel';
import GameHistory from '@/components/game/GameHistory';
import LeaderBoard from '@/components/game/LeaderBoard';
import SimpleMultiplier from '@/components/game/SimpleMultiplier';
import AuthModal from '@/components/auth/AuthModal';
import { useState } from 'react';

const CrashGame: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  
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
  } = useProvablyFairGame();

  const onPlaceBet = async (amount: number, autoCashout?: number | null) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    handlePlaceBet(amount, autoCashout);
  };

  const onCashout = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    
    handleCashout();
  };

  return (
    <div className="w-full">
      {/* Game area with multiplier, betting panel and leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Game History */}
        <div className="lg:col-span-12 mb-2">
          <GameHistory history={gameHistory} />
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
