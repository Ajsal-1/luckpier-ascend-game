import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

interface BettingPanelProps {
  isPlaying: boolean;
  isCrashed: boolean;
  hasWon: boolean;
  onPlaceBet: (amount: number, autoCashout: number | null) => void;
  onCashout: () => void;
  remainingTime: number | null;
  balance?: number;
  isBetPlaced?: boolean;
}

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

  const formatTime = (seconds: number): string => {
    // Ensure timer doesn't show negative values
    return Math.max(0, seconds).toFixed(1);
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
          <div className="text-right text-sm text-gray-300">
            Balance: <span className="font-medium text-white">${balance?.toFixed(2)}</span>
          </div>
        
          {/* Bet Amount */}
          <div>
            <Label htmlFor="betAmount" className="block text-gray-400 mb-1 text-sm font-medium">
              Bet Amount
            </Label>
            <div className="relative">
              <Input
                id="betAmount"
                type="text"
                className={cn(
                  "pr-12 bg-[#0a121f] border-gray-800/40",
                  inputError && !isPlaying ? "border-red-500" : ""
                )}
                value={betAmount}
                onChange={handleBetAmountChange}
                disabled={isPlaying || isBetPlaced}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                USD
              </div>
            </div>
          </div>
          
          {/* Auto Cashout */}
          <div>
            <div className="flex justify-between mb-1">
              <Label htmlFor="autoCashout" className="text-gray-400 text-sm font-medium">
                Auto Cashout
              </Label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useAutoCashout"
                  checked={useAutoCashout}
                  onChange={(e) => setUseAutoCashout(e.target.checked)}
                  disabled={isPlaying || isBetPlaced}
                  className="w-3.5 h-3.5 accent-luckpier-gold"
                />
                <label htmlFor="useAutoCashout" className="text-gray-400 text-xs ml-1.5">
                  Enable
                </label>
              </div>
            </div>
            <div className="relative">
              <Input
                type="text"
                id="autoCashout"
                className={cn(
                  "pr-12 bg-[#0a121f] border-gray-800/40",
                  !useAutoCashout ? "opacity-50" : ""
                )}
                value={autoCashout}
                onChange={handleAutoCashoutChange}
                disabled={isPlaying || !useAutoCashout || isBetPlaced}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                x
              </div>
            </div>
          </div>
          
          {/* Input Error Display */}
          {inputError && !isPlaying && (
            <div className="text-red-500 text-xs mt-1">
              {inputError}
            </div>
          )}
          
          {/* Bet Status Indicator */}
          {isBetPlaced && !isCrashed && (
            <div className="flex items-center justify-center py-2 px-3 bg-green-900/20 text-green-400 rounded-md text-sm animate-fade-in">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Bet Placed! Good luck!</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-grow"></div>
          
          {/* Action Buttons */}
          <div className="pt-2">
            {!isPlaying ? (
              <button 
                className={cn(
                  "w-full py-3 text-base font-medium rounded-md transition-all",
                  isButtonDisabled() ? 
                    "bg-blue-600/50 text-white/70 cursor-not-allowed" : 
                    "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                onClick={handlePlaceBet}
                disabled={isButtonDisabled()}
              >
                {remainingTime !== null && remainingTime > 0
                  ? `Place Bet (${formatTime(remainingTime)}s)`
                  : "Place Bet"}
              </button>
            ) : (
              <button 
                className={cn(
                  "w-full py-3 text-base font-medium rounded-md transition-all",
                  hasWon || isCrashed ? 
                    "bg-amber-600/50 text-white/70 cursor-not-allowed" : 
                    "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                )}
                onClick={onCashout}
                disabled={hasWon || isCrashed}
              >
                Cash Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingPanel;
