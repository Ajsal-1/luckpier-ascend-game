
import React from 'react';

interface BalanceDisplayProps {
  balance: number;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balance }) => {
  return (
    <div className="text-right text-sm text-gray-300 h-5"> {/* Fixed height to prevent jumping */}
      Balance: <span className="font-medium text-white inline-block min-w-[60px]">${balance.toFixed(2)}</span>
    </div>
  );
};

export default BalanceDisplay;
