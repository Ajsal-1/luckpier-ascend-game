
import React from 'react';
import { cn } from '@/lib/utils';

interface GameHistoryItem {
  id: string;
  multiplier: number;
  isWin?: boolean;
}

interface GameHistoryProps {
  history: GameHistoryItem[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ history }) => {
  // Function to determine the color based on the multiplier value
  const getMultiplierColor = (value: number) => {
    if (value < 1.2) return "rgb(255, 79, 111)"; // Pink/Red
    if (value < 2) return "rgb(255, 152, 0)";    // Orange
    return "rgb(0, 201, 134)";                   // Green
  };
  
  return (
    <div className="w-full overflow-x-auto py-3 mb-3 -mt-1">
      <div className="flex space-x-2 px-1">
        {history.map((item) => (
          <div 
            key={item.id}
            className="text-center"
          >
            <div 
              style={{ backgroundColor: `${getMultiplierColor(item.multiplier)}20`, color: getMultiplierColor(item.multiplier) }}
              className={cn(
                "flex items-center justify-center min-w-[56px] h-9 rounded font-medium text-sm border",
              )}
              style={{
                borderColor: `${getMultiplierColor(item.multiplier)}40`,
                color: getMultiplierColor(item.multiplier)
              }}
            >
              {item.multiplier.toFixed(2)}x
            </div>
          </div>
        ))}
        
        {history.length === 0 && (
          <div className="text-gray-500 w-full text-center py-2">
            No game history yet
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHistory;
