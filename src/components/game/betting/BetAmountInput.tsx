
import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BetAmountInputProps {
  betAmount: string;
  onBetAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled: boolean;
  hasError: boolean;
  isPlaying: boolean;
}

const BetAmountInput: React.FC<BetAmountInputProps> = ({
  betAmount,
  onBetAmountChange,
  isDisabled,
  hasError,
  isPlaying
}) => {
  return (
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
            hasError && !isPlaying ? "border-red-500" : ""
          )}
          value={betAmount}
          onChange={onBetAmountChange}
          disabled={isDisabled}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          USD
        </div>
      </div>
    </div>
  );
};

export default BetAmountInput;
