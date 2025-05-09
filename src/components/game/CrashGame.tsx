
import React from 'react';
import { useCrashGame, GAME_STATE } from '@/hooks/useCrashGame';
import Multiplier from '@/components/game/Multiplier';
import BettingPanel from '@/components/game/BettingPanel';
import GameHistory from '@/components/game/GameHistory';
import LeaderBoard from '@/components/game/LeaderBoard';
import HelpModal from '@/components/game/HelpModal';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const CrashGame: React.FC = () => {
  const {
    userBalance,
    gameState,
    countdownTimer,
    crashPoint,
    currentMultiplier,
    playerWin,
    isBetPlaced,
    gameHistory,
    players,
    isAuthenticated,
    handlePlaceBet,
    handleCashout,
    handleCrash,
    setCurrentMultiplier,
  } = useCrashGame();

  // Handle sign in/out
  const handleSignIn = async () => {
    await supabase.auth.signInWithOtp({
      email: prompt('Enter your email to sign in/sign up:') || '',
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
            onPlaceBet={handlePlaceBet}
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
            onCrash={handleCrash}
            currentMultiplier={currentMultiplier}
            onMultiplierUpdate={setCurrentMultiplier}
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
