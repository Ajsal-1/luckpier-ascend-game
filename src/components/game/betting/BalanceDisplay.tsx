
import React from 'react';

interface BalanceDisplayProps {
  balance: number;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balance }) => {
  return (
    <div className="text-right text-sm text-gray-300">
      Balance: <span className="font-medium text-white">${balance.toFixed(2)}</span>
    </div>
  );
};

export default BalanceDisplay;
