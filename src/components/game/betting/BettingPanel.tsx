
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BettingPanelProps } from './types';
import { GAME_STATE } from '@/hooks/game/types';
import { Timer, TimerOff, CircleX } from 'lucide-react';

const BettingPanel: React.FC<BettingPanelProps> = ({
  isPlaying,
  isCrashed,
  hasWon,
  onPlaceBet,
  onCashout,
  remainingTime,
  balance = 0,
  isBetPlaced = false,
  gameState,
  isProcessingBet = false,
  isProcessingCashout = false,
  betError = null,
}) => {
  const [betAmount, setBetAmount] = useState<string>('10.00');
  const [autoCashout, setAutoCashout] = useState<string>('1.50');
  const [useAutoCashout, setUseAutoCashout] = useState<boolean>(true);
  
  // CRITICAL FIX: Improved logic for when to allow placing bets
  // Now we check game state first, ignoring hasWon if game state is COUNTDOWN or WAITING
  const canPlaceBet = 
    (gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.WAITING) && 
    !isBetPlaced && 
    !isProcessingBet;

  // Only allow cashout during active play when bet is placed and not yet won
  const canCashout = isPlaying && isBetPlaced && !hasWon && !isProcessingCashout;

  // Reset bet error when game state changes to allow new bets
  useEffect(() => {
    if (gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.WAITING) {
      // Keep the form ready for betting during appropriate game states
      if (!isBetPlaced) {
        // Form should be enabled for placing bets if no bet is currently placed
        // This ensures the panel is ready for a new bet regardless of previous round outcomes
      }
    }
  }, [gameState, isBetPlaced]);

  const handlePlaceBet = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    // Only pass autoCashout value if the checkbox is enabled
    const autoCashoutValue = useAutoCashout ? parseFloat(autoCashout) : null;
    onPlaceBet(amount, autoCashoutValue);
  };

  const handleCashout = () => {
    onCashout();
  };

  // CRITICAL FIX: Only show "Cashed Out!" during the same round the user cashed out
  // In new rounds (COUNTDOWN/WAITING), we should show the "Place Bet" button
  const showCashedOutButton = hasWon && gameState === GAME_STATE.PLAYING;
  const showCrashedButton = isCrashed && isBetPlaced && !hasWon;
  const showPlaceBetButton = canPlaceBet;
  const showCashOutButton = canCashout;

  return (
    <div className="flex flex-col space-y-3 bg-[#131c29] rounded-md p-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-white">Place Bet</h3>
        <div className="text-sm text-gray-400">
          Balance: <span className="text-white">${balance.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Bet amount input */}
      <div className="space-y-1">
        <label htmlFor="betAmount" className="text-xs text-gray-400">Bet Amount ($)</label>
        <Input
          id="betAmount"
          type="number"
          min="0.01"
          step="0.01"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          disabled={!canPlaceBet || isProcessingBet}
          className="bg-[#0d141e] border-gray-700"
        />
      </div>
      
      {/* Auto cashout input with checkbox */}
      <div className="space-y-1">
        <div className="flex justify-between mb-1">
          <label htmlFor="autoCashout" className="text-xs text-gray-400">Auto Cashout</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useAutoCashout"
              checked={useAutoCashout}
              onChange={(e) => setUseAutoCashout(e.target.checked)}
              disabled={!canPlaceBet || isProcessingBet}
              className="w-3.5 h-3.5 accent-green-500"
            />
            <label htmlFor="useAutoCashout" className="text-gray-400 text-xs ml-1.5">Enable</label>
          </div>
        </div>
        <Input
          id="autoCashout"
          type="number"
          min="1.01"
          step="0.01"
          placeholder="e.g. 1.50"
          value={autoCashout}
          onChange={(e) => setAutoCashout(e.target.value)}
          disabled={!canPlaceBet || isProcessingBet || !useAutoCashout}
          className={`bg-[#0d141e] border-gray-700 ${!useAutoCashout ? 'opacity-50' : ''}`}
        />
        <div className="text-xs text-gray-500">Set a multiplier to auto-cashout (min: 1.01x)</div>
      </div>

      {/* Error message */}
      {betError && (
        <div className="p-2 bg-red-900/30 border border-red-900 text-red-400 text-xs rounded-sm flex items-start">
          <CircleX className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
          <span>{betError}</span>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="pt-2">
        {showPlaceBetButton && (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            disabled={!canPlaceBet || isProcessingBet}
            onClick={handlePlaceBet}
          >
            {isProcessingBet ? 'Processing...' : 'Place Bet'}
          </Button>
        )}
        
        {showCashOutButton && (
          <Button 
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            disabled={!canCashout || isProcessingCashout}
            onClick={handleCashout}
          >
            {isProcessingCashout ? 'Processing...' : 'Cash Out'}
          </Button>
        )}
        
        {showCashedOutButton && (
          <Button 
            className="w-full bg-green-600 opacity-75 cursor-default"
            disabled={true}
          >
            Cashed Out!
          </Button>
        )}
        
        {showCrashedButton && (
          <Button 
            className="w-full bg-red-600 opacity-75 cursor-default"
            disabled={true}
          >
            Crashed!
          </Button>
        )}
      </div>
      
      {/* Game status */}
      <div className="flex items-center justify-center mt-2 text-sm">
        {gameState === GAME_STATE.COUNTDOWN && (
          <div className="flex items-center text-blue-400">
            <Timer className="w-4 h-4 mr-1.5" />
            <span>Betting open! Starting in {remainingTime?.toFixed(1) || 10}s</span>
          </div>
        )}
        
        {gameState === GAME_STATE.PLAYING && (
          <div className="flex items-center text-green-400">
            <TimerOff className="w-4 h-4 mr-1.5" />
            <span>Round in progress</span>
          </div>
        )}
        
        {gameState === GAME_STATE.CRASHED && (
          <div className="flex items-center text-amber-400">
            <Timer className="w-4 h-4 mr-1.5" />
            <span>Next round in {remainingTime?.toFixed(1) || 10}s</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingPanel;
