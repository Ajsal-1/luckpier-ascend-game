
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
  gameState,
  isProcessingBet = false,
  isProcessingCashout = false,
  betError
}) => {
  const [betAmount, setBetAmount] = useState("100.00");
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [useAutoCashout, setUseAutoCashout] = useState(true);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cachedBalance, setCachedBalance] = useState(balance);
  
  // Smooth balance updates with increased delay for better visual stability
  useEffect(() => {
    const timer = setTimeout(() => {
      setCachedBalance(balance);
    }, 800); // Increased delay for better UI stability
    
    return () => clearTimeout(timer);
  }, [balance]);
  
  // Validate inputs when they change
  useEffect(() => {
    const amount = parseFloat(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setInputError("Enter a valid bet amount");
    } else if (amount > (cachedBalance || 0)) {
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
  }, [betAmount, autoCashout, useAutoCashout, cachedBalance]);
  
  const handlePlaceBet = async () => {
    const amount = parseFloat(betAmount);
    let autoValue: number | null = null;
    
    if (useAutoCashout && autoCashout) {
      autoValue = parseFloat(autoCashout);
    }
    
    if (amount > 0 && amount <= (cachedBalance || 0) && !inputError) {
      try {
        await onPlaceBet(amount, autoValue);
      } catch (error) {
        console.error("Bet placement failed:", error);
      }
    }
  };
  
  const handleCashout = async () => {
    try {
      await onCashout();
    } catch (error) {
      console.error("Cashout failed:", error);
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

  // IMPROVED: Better button disabled state logic
  const isButtonDisabled = () => {
    // If processing, always disable
    if (isProcessingBet || isProcessingCashout) return true;
    
    // If bet is already placed, check if we're in playing state
    if (isBetPlaced) {
      // Button should only be disabled in playing state if the user won or game crashed
      return !isPlaying || hasWon || isCrashed;
    }
    
    // If there's an input error, always disable
    if (inputError) return true;
    
    // IMPROVED: Only allow betting during COUNTDOWN and CRASHED states
    if (gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.CRASHED) {
      return false; // Enable during countdown and crashed states
    }
    
    // Default to disabled for safety
    return true;
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
          {/* Balance Display - Now using cached balance to prevent UI jumps */}
          <BalanceDisplay balance={cachedBalance} />
        
          {/* Bet Amount */}
          <BetAmountInput 
            betAmount={betAmount}
            onBetAmountChange={handleBetAmountChange}
            isDisabled={isPlaying || isBetPlaced || isProcessingBet || isProcessingCashout}
            hasError={!!inputError}
            isPlaying={isPlaying}
          />
          
          {/* Auto Cashout */}
          <AutoCashoutInput 
            autoCashout={autoCashout}
            useAutoCashout={useAutoCashout}
            onAutoCashoutChange={handleAutoCashoutChange}
            onToggleAutoCashout={handleToggleAutoCashout}
            isDisabled={isPlaying || isBetPlaced || isProcessingBet || isProcessingCashout}
          />
          
          {/* Betting Period Indicator - improved! */}
          {(gameState === GAME_STATE.COUNTDOWN || gameState === GAME_STATE.CRASHED) && (
            <div className="bg-green-700/20 border border-green-600/30 rounded-md p-2 text-center">
              <span className="text-green-400 text-sm font-medium">
                Betting open for {Math.ceil(remainingTime || 5)}s
              </span>
            </div>
          )}
          
          {/* Error and Status Messages */}
          <StatusMessage 
            inputError={inputError || betError}
            isPlaying={isPlaying}
            isBetPlaced={isBetPlaced}
            isCrashed={isCrashed}
            isProcessing={isProcessingBet || isProcessingCashout}
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
              isProcessing={isPlaying && isBetPlaced ? isProcessingCashout : isProcessingBet}
              onClick={isPlaying && isBetPlaced ? handleCashout : handlePlaceBet}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingPanel;
