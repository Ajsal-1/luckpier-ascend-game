
import React, { useState } from 'react';
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
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [useAutoCashout, setUseAutoCashout] = useState(true);
  
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
    <div className="bg-[#131c29] border border-gray-800/40 rounded-md overflow-hidden h-full">
      {/* Tabs for Manual/Auto - similar to BC.Game */}
      <div className="flex border-b border-gray-800/40">
        <div className="flex-1 py-3 text-center text-white font-medium border-b-2 border-luckpier-gold">
          Manual
        </div>
        <div className="flex-1 py-3 text-center text-gray-400 cursor-not-allowed">
          Auto
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          {/* Bet Amount */}
          <div>
            <label className="block text-gray-400 mb-1 text-sm font-medium">
              Bet Amount
            </label>
            <div className="relative">
              <input
                type="text"
                className="bet-input pr-12"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isPlaying}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                USD
              </div>
            </div>
          </div>
          
          {/* Auto Cashout */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-gray-400 text-sm font-medium">
                Auto Cashout
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useAutoCashout"
                  checked={useAutoCashout}
                  onChange={(e) => setUseAutoCashout(e.target.checked)}
                  disabled={isPlaying}
                  className="w-3.5 h-3.5 accent-luckpier-gold"
                />
                <label htmlFor="useAutoCashout" className="text-gray-400 text-xs ml-1.5">
                  Enable
                </label>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                className={cn("bet-input pr-12", !useAutoCashout && "opacity-50")}
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                disabled={isPlaying || !useAutoCashout}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                x
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="pt-2">
            {!isPlaying ? (
              <button 
                className={cn(
                  "primary-button w-full py-3 text-base",
                  isCrashed === false && remainingTime !== null ? "opacity-70 cursor-not-allowed" : ""
                )}
                onClick={handlePlaceBet}
                disabled={isCrashed === false && remainingTime !== null}
              >
                {isCrashed === false && remainingTime !== null
                  ? `Place Bet (${formatTime(remainingTime)}s)`
                  : "Place Bet"}
              </button>
            ) : (
              <button 
                className={cn(
                  "secondary-button w-full py-3 text-base border border-gray-700/50",
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
    </div>
  );
};

export default BettingPanel;
