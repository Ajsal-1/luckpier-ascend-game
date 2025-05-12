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
  const [autoCashout, setAutoCashout] = useState<string>('');
  
  const canPlaceBet = 
    (gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.WAITING) && 
    !isBetPlaced && 
    !isProcessingBet;

  const canCashout = isPlaying && isBetPlaced && !hasWon && !isProcessingCashout;

  // Reset bet error when game state changes
  useEffect(() => {
    if (gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.WAITING) {
      // Keep the form ready for betting
    }
  }, [gameState]);

  const handlePlaceBet = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const autoCashoutValue = autoCashout ? parseFloat(autoCashout) : null;
    onPlaceBet(amount, autoCashoutValue);
  };

  const handleCashout = () => {
    onCashout();
  };

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
      
      {/* Auto cashout input */}
      <div className="space-y-1">
        <label htmlFor="autoCashout" className="text-xs text-gray-400">Auto Cashout (Optional)</label>
        <Input
          id="autoCashout"
          type="number"
          min="1.1"
          step="0.1"
          placeholder="e.g. 2.00"
          value={autoCashout}
          onChange={(e) => setAutoCashout(e.target.value)}
          disabled={!canPlaceBet || isProcessingBet}
          className="bg-[#0d141e] border-gray-700"
        />
        <div className="text-xs text-gray-500">Set a multiplier to auto-cashout</div>
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
        {!isPlaying && !isBetPlaced && (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            disabled={!canPlaceBet || isProcessingBet}
            onClick={handlePlaceBet}
          >
            {isProcessingBet ? 'Processing...' : 'Place Bet'}
          </Button>
        )}
        
        {isPlaying && isBetPlaced && !hasWon && (
          <Button 
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            disabled={!canCashout || isProcessingCashout}
            onClick={handleCashout}
          >
            {isProcessingCashout ? 'Processing...' : 'Cash Out'}
          </Button>
        )}
        
        {hasWon && (
          <Button 
            className="w-full bg-green-600 opacity-75 cursor-default"
            disabled={true}
          >
            Cashed Out!
          </Button>
        )}
        
        {isCrashed && isBetPlaced && !hasWon && (
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
