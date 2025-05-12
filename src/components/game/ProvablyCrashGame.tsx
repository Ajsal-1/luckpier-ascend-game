
import React, { useState } from 'react';
import { useProvablyCrashGame } from '@/hooks/useProvablyCrashGame';
import { GameState } from '@/utils/crashGame';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import AuthModal from '@/components/auth/AuthModal';

/**
 * ProvablyCrashGame Component
 * Implements a provably fair crash game with simple, accurate mechanics
 */
const ProvablyCrashGame: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<string>("10.00");
  const { isAuthenticated, wallet, refreshWalletBalance } = useAuth();
  
  const {
    gameState,
    currentMultiplier,
    countdownTimer,
    roundHistory,
    userBalance,
    userBet,
    hasUserCashedOut,
    userWinnings,
    placeBet,
    cashout,
    formatMultiplier
  } = useProvablyCrashGame();
  
  // Handle bet placement
  const handlePlaceBet = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to place bets", { position: 'top-center' });
      setIsAuthModalOpen(true);
      return;
    }
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bet amount", { position: 'top-center' });
      return;
    }
    
    // Place bet
    await placeBet(amount);
    
    // Refresh wallet balance
    refreshWalletBalance();
  };
  
  // Handle cashout
  const handleCashout = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to cash out", { position: 'top-center' });
      setIsAuthModalOpen(true);
      return;
    }
    
    // Cash out
    await cashout();
    
    // Refresh wallet balance
    refreshWalletBalance();
  };
  
  // Get game state message
  const getGameStateMessage = () => {
    switch (gameState) {
      case GameState.WAITING:
        return "Waiting for next round...";
      case GameState.COUNTDOWN:
        return `Betting open! Starting in ${countdownTimer}s`;
      case GameState.PLAYING:
        return "Game in progress";
      case GameState.CRASHED:
        return `CRASHED at ${formatMultiplier(currentMultiplier)}`;
      default:
        return "Unknown game state";
    }
  };
  
  // Get button label
  const getButtonLabel = () => {
    if (userBet === null) {
      return "Place Bet";
    }
    
    if (gameState === GameState.PLAYING && !hasUserCashedOut) {
      return "Cash Out";
    }
    
    return hasUserCashedOut ? "Cashed Out" : "Waiting";
  };
  
  // Get button action
  const handleButtonClick = () => {
    if (userBet === null) {
      handlePlaceBet();
    } else if (gameState === GameState.PLAYING && !hasUserCashedOut) {
      handleCashout();
    }
  };
  
  // Calculate button disabled state
  const isButtonDisabled = () => {
    if (userBet === null) {
      return gameState !== GameState.COUNTDOWN;
    }
    
    if (gameState === GameState.PLAYING && !hasUserCashedOut) {
      return false;
    }
    
    return true;
  };
  
  // Get button color class based on game state
  const getButtonColorClass = () => {
    if (gameState === GameState.PLAYING && !hasUserCashedOut && userBet !== null) {
      return "bg-green-500 hover:bg-green-600";
    }
    
    if (gameState === GameState.COUNTDOWN && userBet === null) {
      return "bg-blue-500 hover:bg-blue-600";
    }
    
    return "bg-gray-500";
  };
  
  return (
    <div className="w-full flex flex-col gap-6">
      {/* Game status indicator */}
      <div className={`text-center text-xl font-bold p-4 rounded-md ${
        gameState === GameState.CRASHED ? "bg-red-500/10 text-red-500" : 
        gameState === GameState.PLAYING ? "bg-green-500/10 text-green-500" :
        "bg-blue-500/10 text-blue-500"
      }`}>
        {getGameStateMessage()}
      </div>
      
      {/* Current Multiplier Display - large, centered, clear */}
      <div className="text-center">
        <div className={`text-6xl font-bold ${
          gameState === GameState.CRASHED ? "text-red-500" :
          gameState === GameState.PLAYING ? "text-green-500" :
          "text-blue-500"
        }`}>
          {formatMultiplier(currentMultiplier)}
        </div>
      </div>
      
      {/* Game History */}
      <div className="bg-[#131c29] border border-gray-800/40 rounded-md p-4">
        <h3 className="text-white font-semibold mb-2">Recent Crashes</h3>
        <div className="flex flex-wrap gap-2">
          {roundHistory.map((round, index) => (
            <div 
              key={round.id || index}
              className={`px-3 py-1 rounded ${
                round.crashPoint < 2 ? "bg-red-500/20 text-red-500" :
                round.crashPoint < 5 ? "bg-blue-500/20 text-blue-500" :
                "bg-green-500/20 text-green-500"
              }`}
            >
              {formatMultiplier(round.crashPoint)}
            </div>
          ))}
        </div>
      </div>
      
      {/* Betting Panel */}
      <div className="bg-[#131c29] border border-gray-800/40 rounded-md p-4">
        <h3 className="text-white font-semibold mb-4">Place Your Bet</h3>
        
        {/* Balance */}
        <div className="mb-4">
          <p className="text-gray-400 mb-1">Your Balance</p>
          <p className="text-white text-lg font-semibold">${wallet.balance.toFixed(2)}</p>
        </div>
        
        {/* Bet amount input */}
        <div className="mb-4">
          <label htmlFor="betAmount" className="block text-gray-400 mb-1">Bet Amount</label>
          <div className="flex">
            <input
              id="betAmount"
              type="text"
              value={betAmount}
              onChange={(e) => {
                // Only allow valid numeric input
                if (e.target.value === "" || /^\d*\.?\d{0,2}$/.test(e.target.value)) {
                  setBetAmount(e.target.value);
                }
              }}
              disabled={userBet !== null || gameState !== GameState.COUNTDOWN}
              className="bg-[#0d1421] text-white px-3 py-2 rounded-l border-r-0 border border-gray-700 w-full"
            />
            <button 
              onClick={() => setBetAmount((wallet.balance / 2).toFixed(2))}
              disabled={userBet !== null || gameState !== GameState.COUNTDOWN}
              className="bg-[#1a2332] text-white px-3 py-2 border border-gray-700 hover:bg-[#232e44]"
            >
              1/2
            </button>
            <button 
              onClick={() => setBetAmount(wallet.balance.toFixed(2))}
              disabled={userBet !== null || gameState !== GameState.COUNTDOWN}
              className="bg-[#1a2332] text-white px-3 py-2 rounded-r border-l-0 border border-gray-700 hover:bg-[#232e44]"
            >
              Max
            </button>
          </div>
        </div>
        
        {/* Bet information */}
        {userBet !== null && (
          <div className="mb-4 p-3 bg-[#1a2332] rounded">
            <div className="flex justify-between">
              <span className="text-gray-400">Your bet:</span>
              <span className="text-white font-medium">${userBet.toFixed(2)}</span>
            </div>
            
            {hasUserCashedOut && userWinnings !== null && (
              <>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400">Cashed out at:</span>
                  <span className="text-green-500 font-medium">{formatMultiplier(userWinnings / userBet)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400">Winnings:</span>
                  <span className="text-green-500 font-medium">${userWinnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400">Profit:</span>
                  <span className="text-green-500 font-medium">+${(userWinnings - userBet).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Action button */}
        <button
          onClick={handleButtonClick}
          disabled={isButtonDisabled()}
          className={`w-full py-3 text-white font-semibold rounded transition-colors ${getButtonColorClass()} disabled:bg-gray-700 disabled:opacity-50`}
        >
          {getButtonLabel()}
        </button>
        
        {/* Game status message */}
        <p className="text-gray-400 mt-3 text-sm text-center">
          {gameState === GameState.COUNTDOWN && "Place your bet before the countdown ends"}
          {gameState === GameState.PLAYING && !hasUserCashedOut && userBet !== null && "Click Cash Out before the game crashes!"}
          {gameState === GameState.CRASHED && "Wait for the next round to start"}
        </p>
      </div>
      
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default ProvablyCrashGame;
