import React, { useState, useEffect } from 'react';
import BetAmountInput from './betting/BetAmountInput';
import AutoCashoutInput from './betting/AutoCashoutInput';
import GameActionButton from './betting/GameActionButton';
import StatusMessage from './betting/StatusMessage';
import BalanceDisplay from './betting/BalanceDisplay';
import { BettingPanelProps } from './betting/types';

const BettingPanel: React.FC<BettingPanelProps> = ({
  isPlaying,
  isCrashed,
  hasWon,
  onPlaceBet,
  onCashout,
  remainingTime,
  balance = 1000.00,
  isBetPlaced = false,
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
    // If bet is already placed, disable
    if (isBetPlaced) return true;
    
    // If there's an input error, always disable
    if (inputError) return true;
    
    // If countdown is active but not showing a negative value
    if (remainingTime !== null && remainingTime > 0) return true;
    
    // If currently playing, disable placing bets
    if (isPlaying) return true;
    
    // Otherwise enable
    return false;
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
              onClick={isPlaying ? onCashout : handlePlaceBet}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingPanel;
