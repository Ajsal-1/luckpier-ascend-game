
import React from 'react';
import { cn } from '@/lib/utils';
import { HistoryItem } from '@/hooks/game/types';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface GameHistoryProps {
  history: HistoryItem[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ history }) => {
  // Function to determine the color based on the multiplier value
  const getMultiplierColor = (value: number) => {
    if (value < 1.2) return "rgb(255, 79, 111)"; // Pink/Red
    if (value < 2) return "rgb(255, 152, 0)";    // Orange
    return "rgb(0, 201, 134)";                   // Green
  };
  
  return (
    <div className="w-full py-4 mb-3">
      <div className="flex items-center mb-2 px-1">
        <h3 className="text-sm font-semibold text-gray-400">Recent Crashes</h3>
        <Badge variant="secondary" className="ml-2 text-xs">
          {history.length}
        </Badge>
      </div>
      
      <div className="flex space-x-2 px-1 overflow-x-auto pb-1 hide-scrollbar">
        {history.map((item, index) => (
          <motion.div 
            key={item.id}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div 
              className={cn(
                "flex items-center justify-center min-w-[62px] h-10 rounded-lg font-medium text-sm border shadow-sm",
              )}
              style={{
                backgroundColor: `${getMultiplierColor(item.multiplier)}15`,
                borderColor: `${getMultiplierColor(item.multiplier)}30`,
                color: getMultiplierColor(item.multiplier)
              }}
            >
              {item.multiplier.toFixed(2)}x
            </div>
          </motion.div>
        ))}
        
        {history.length === 0 && (
          <div className="text-gray-500 w-full text-center py-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            Loading game history...
          </div>
        )}
      </div>
    </div>
  );
};

// Add this to your index.css or create a style block
const styles = document.createElement('style');
styles.innerHTML = `
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}`;
document.head.appendChild(styles);

export default GameHistory;
