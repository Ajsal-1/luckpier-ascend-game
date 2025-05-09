
import React, { useState } from 'react';
import { useMultiplayerCrashGame } from '@/hooks/game/useMultiplayerCrashGame';
import { GAME_STATE } from '@/hooks/game/types';
import Multiplier from '@/components/game/Multiplier';
import BettingPanel from '@/components/game/BettingPanel';
import GameHistory from '@/components/game/GameHistory';
import LeaderBoard from '@/components/game/LeaderBoard';
import HelpModal from '@/components/game/HelpModal';
import { Button } from '@/components/ui/button';

const CrashGame: React.FC = () => {
  const [betAmount, setBetAmount] = useState<string>("100.00");

  const {
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
    handlePlaceBet,
    handleCashout,
    handleSignIn,
    handleSignOut,
  } = useMultiplayerCrashGame();

  const onPlaceBet = (amount: number) => {
    handlePlaceBet(amount);
  };

  return (
    <div className="w-full">
      {/* Auth Button */}
      <div className="w-full flex justify-end mb-2">
        {isAuthenticated ? (
          <Button onClick={handleSignOut} variant="outline" size="sm">Sign Out</Button>
        ) : (
          <Button onClick={handleSignIn} variant="outline" size="sm">Sign In</Button>
        )}
      </div>
      
      {/* Game status indicator */}
      <div className="w-full flex justify-between items-center mb-2">
        <div className="text-sm font-medium">
          {gameState === GAME_STATE.WAITING && "Waiting for next round..."}
          {gameState === GAME_STATE.COUNTDOWN && `Starting in ${countdownTimer?.toFixed(1)}s`}
          {gameState === GAME_STATE.PLAYING && "Game in progress"}
          {gameState === GAME_STATE.CRASHED && "Game crashed"}
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
            onCashout={handleCashout}
            remainingTime={countdownTimer}
            balance={userBalance}
            isBetPlaced={isBetPlaced}
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
          />
        </div>
        
        {/* Leaderboard (Right) */}
        <div className="lg:col-span-3 order-2 lg:order-3">
          <LeaderBoard players={players} />
        </div>
      </div>
    </div>
  );
};

export default CrashGame;
