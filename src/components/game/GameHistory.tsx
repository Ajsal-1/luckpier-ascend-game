
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
  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex space-x-2">
        {history.map((item) => (
          <div 
            key={item.id}
            className={cn(
              "flex items-center justify-center min-w-[48px] h-12 rounded-md font-medium text-sm",
              item.multiplier >= 2 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            )}
          >
            {item.multiplier.toFixed(2)}x
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
