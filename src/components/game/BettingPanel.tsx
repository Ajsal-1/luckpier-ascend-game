
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BettingPanelProps {
  isPlaying: boolean;
  isCrashed: boolean;
  hasWon: boolean;
  onPlaceBet: (amount: number, autoCashout: number | null) => void;
  onCashout: () => void;
  remainingTime: number | null;
}

const BettingPanel: React.FC<BettingPanelProps> = ({
  isPlaying,
  isCrashed,
  hasWon,
  onPlaceBet,
  onCashout,
  remainingTime,
}) => {
  const [betAmount, setBetAmount] = useState("100.00");
  const [autoCashout, setAutoCashout] = useState<string>("");
  const [useAutoCashout, setUseAutoCashout] = useState(false);
  
  const handlePlaceBet = () => {
    const amount = parseFloat(betAmount);
    let autoValue: number | null = null;
    
    if (useAutoCashout && autoCashout) {
      autoValue = parseFloat(autoCashout);
    }
    
    if (amount > 0) {
      onPlaceBet(amount, autoValue);
    }
  };

  const formatTime = (seconds: number): string => {
    return seconds.toFixed(1);
  };

  return (
    <div className="card-glass p-5 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium">Place your bet</h2>
        {remainingTime !== null && !isPlaying && (
          <div className="text-luckpier-blue font-medium">
            Next round in {formatTime(remainingTime)}s
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Bet Amount */}
        <div>
          <label htmlFor="betAmount" className="block text-gray-300 mb-1 text-sm">
            Bet Amount
          </label>
          <input
            id="betAmount"
            type="text"
            className="bet-input"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            disabled={isPlaying}
          />
        </div>
        
        {/* Auto Cashout */}
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <input
              type="checkbox"
              id="useAutoCashout"
              checked={useAutoCashout}
              onChange={(e) => setUseAutoCashout(e.target.checked)}
              disabled={isPlaying}
              className="w-4 h-4 accent-luckpier-blue"
            />
            <label htmlFor="useAutoCashout" className="text-gray-300 text-sm">
              Auto Cashout
            </label>
          </div>
          {useAutoCashout && (
            <input
              type="text"
              className="bet-input"
              value={autoCashout}
              onChange={(e) => setAutoCashout(e.target.value)}
              placeholder="2.00"
              disabled={isPlaying}
            />
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="pt-2">
          {!isPlaying ? (
            <button 
              className="primary-button w-full py-3 text-lg"
              onClick={handlePlaceBet}
              disabled={isCrashed === false && remainingTime !== null}
            >
              {isCrashed === false && remainingTime !== null
                ? `Wait ${formatTime(remainingTime)}s`
                : "Place Bet"}
            </button>
          ) : (
            <button 
              className={cn(
                "accent-button w-full py-3 text-lg",
                hasWon ? "opacity-50 cursor-not-allowed" : ""
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
  );
};

export default BettingPanel;
