
import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AutoCashoutInputProps {
  autoCashout: string;
  useAutoCashout: boolean;
  onAutoCashoutChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleAutoCashout: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDisabled: boolean;
}

const AutoCashoutInput: React.FC<AutoCashoutInputProps> = ({
  autoCashout,
  useAutoCashout,
  onAutoCashoutChange,
  onToggleAutoCashout,
  isDisabled
}) => {
  return (
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
            onChange={onToggleAutoCashout}
            disabled={isDisabled}
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
          onChange={onAutoCashoutChange}
          disabled={isDisabled || !useAutoCashout}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          x
        </div>
      </div>
    </div>
  );
};

export default AutoCashoutInput;
