
import React, { useState, useEffect } from 'react';
import BetAmountInput from './betting/BetAmountInput';
import AutoCashoutInput from './betting/AutoCashoutInput';
import GameActionButton from './betting/GameActionButton';
import StatusMessage from './betting/StatusMessage';
import BalanceDisplay from './betting/BalanceDisplay';
import { BettingPanelProps } from './betting/types';
import { GAME_STATE } from '@/hooks/game/types';

const BettingPanel: React.FC<BettingPanelProps> = ({
  isPlaying,
  isCrashed,
  hasWon,
  onPlaceBet,
  onCashout,
  remainingTime,
  balance = 1000.00,
  isBetPlaced = false,
  gameState
}) => {
  const [betAmount, setBetAmount] = useState("100.00");
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [useAutoCashout, setUseAutoCashout] = useState(true);
  const [inputError, setInputError] = useState<string | null>(null);
  
  // Validate inputs when they change
  useEffect(() => {
    const amount = parseFloat(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setInputError("Enter a valid bet amount");
    } else if (amount > (balance || 0)) {
      setInputError("Insufficient balance");
    } else if (useAutoCashout) {
      const autoValue = parseFloat(autoCashout);
      if (isNaN(autoValue) || autoValue <= 1) {
        setInputError("Auto cashout must be above 1.00x");
      } else {
        setInputError(null);
      }
    } else {
      setInputError(null);
    }
  }, [betAmount, autoCashout, useAutoCashout, balance]);
  
  const handlePlaceBet = () => {
    const amount = parseFloat(betAmount);
    let autoValue: number | null = null;
    
    if (useAutoCashout && autoCashout) {
      autoValue = parseFloat(autoCashout);
    }
    
    if (amount > 0 && amount <= (balance || 0) && !inputError) {
      onPlaceBet(amount, autoValue);
    }
  };
  
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input with up to 2 decimal places
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setBetAmount(value);
    }
  };
  
  const handleAutoCashoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input with up to 2 decimal places
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAutoCashout(value);
    }
  };

  const handleToggleAutoCashout = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseAutoCashout(e.target.checked);
  };

  // Determine if button should be disabled based on game state and countdown
  const isButtonDisabled = () => {
    // If bet is already placed, check if we're in playing state
    if (isBetPlaced) {
      // Button should only be disabled in playing state if the user won or game crashed
      return !isPlaying || hasWon || isCrashed;
    }
    
    // If there's an input error, always disable
    if (inputError) return true;
    
    // FIXED: Allow betting during both COUNTDOWN and CRASHED states
    // This allows betting during the 5-second post-crash period
    if (gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.CRASHED) {
      return false; // Enable during countdown and crashed states
    }
    
    // If currently playing, disable placing bets
    if (isPlaying) return true;
    
    // Default to disabled for safety
    return true;
  };

  // Format time to show only whole seconds
  const formatTime = (time: number | null) => {
    if (time === null) return "5";
    return Math.ceil(time).toString();
  };

  return (
    <div className="bg-[#131c29] border border-gray-800/40 rounded-md overflow-hidden h-full flex flex-col">
      {/* Tabs for Manual/Auto - similar to BC.Game */}
      <div className="flex border-b border-gray-800/40">
        <div className="flex-1 py-3 text-center text-white font-medium border-b-2 border-luckpier-gold">
          Manual
        </div>
        <div className="flex-1 py-3 text-center text-gray-400 cursor-not-allowed">
          Auto
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {/* Balance Display */}
          <BalanceDisplay balance={balance} />
        
          {/* Bet Amount */}
          <BetAmountInput 
            betAmount={betAmount}
            onBetAmountChange={handleBetAmountChange}
            isDisabled={isPlaying || isBetPlaced}
            hasError={!!inputError}
            isPlaying={isPlaying}
          />
          
          {/* Auto Cashout */}
          <AutoCashoutInput 
            autoCashout={autoCashout}
            useAutoCashout={useAutoCashout}
            onAutoCashoutChange={handleAutoCashoutChange}
            onToggleAutoCashout={handleToggleAutoCashout}
            isDisabled={isPlaying || isBetPlaced}
          />
          
          {/* Betting Period Indicator - improved! */}
          {(gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.CRASHED) && (
            <div className="bg-green-700/20 border border-green-600/30 rounded-md p-2 text-center">
              <span className="text-green-400 text-sm font-medium">
                Betting open for {formatTime(remainingTime)}s
              </span>
            </div>
          )}
          
          {/* Error and Status Messages */}
          <StatusMessage 
            inputError={inputError}
            isPlaying={isPlaying}
            isBetPlaced={isBetPlaced}
            isCrashed={isCrashed}
          />

          {/* Spacer */}
          <div className="flex-grow"></div>
          
          {/* Action Buttons */}
          <div className="pt-2">
            <GameActionButton 
              isPlaying={isPlaying}
              isDisabled={isButtonDisabled()}
              remainingTime={remainingTime}
              hasWon={hasWon}
              isCrashed={isCrashed}
              isBetPlaced={isBetPlaced}
              onClick={isPlaying && isBetPlaced ? onCashout : handlePlaceBet}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingPanel;
