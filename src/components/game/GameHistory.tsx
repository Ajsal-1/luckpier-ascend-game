
import React from 'react';
import { cn } from '@/lib/utils';
import { HistoryItem } from '@/hooks/game/types';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, Star } from 'lucide-react';

interface GameHistoryProps {
  history: HistoryItem[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ history }) => {
  // Function to determine the color based on the multiplier value - now with more positive colors
  const getMultiplierColor = (value: number) => {
    if (value < 1.5) return "rgb(255, 152, 0)";    // Orange
    if (value < 2.5) return "rgb(80, 170, 255)";   // Blue
    return "rgb(0, 201, 134)";                     // Green
  };
  
  // Find the highest multiplier in history
  const highestMultiplier = history.length > 0 ? 
    Math.max(...history.map(item => item.multiplier)) : 0;
  
  return (
    <div className="w-full py-3 mb-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center">
          <TrendingUp className="w-4 h-4 text-green-400 mr-1.5" />
          <h3 className="text-sm font-medium text-gray-300">Recent Wins</h3>
          <Badge variant="outline" className="ml-2 text-xs bg-green-900/20 text-green-400 border-green-900/40">
            {history.length}
          </Badge>
        </div>
        
        {highestMultiplier > 2 && (
          <motion.div 
            className="flex items-center text-xs text-amber-400"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Star className="w-3 h-3 mr-1 fill-amber-400" /> 
            <span>Highest: {highestMultiplier.toFixed(2)}x</span>
          </motion.div>
        )}
      </div>
      
      <div className="flex space-x-2 px-1 overflow-x-auto pb-2 hide-scrollbar">
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
                "flex items-center justify-center min-w-[64px] h-10 rounded-lg font-medium text-sm border shadow-sm",
                item.multiplier > 3 ? "animate-pulse-subtle" : ""
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
          <div className="text-gray-500 w-full text-center py-3 bg-gray-800/30 rounded-lg border border-green-900/20">
            Loading previous wins...
          </div>
        )}
      </div>
      
      {history.length > 0 && (
        <motion.div 
          className="text-center text-xs text-gray-500 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Join others who just won! Place your bet now!
        </motion.div>
      )}
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
}
.animate-pulse-subtle {
  animation: pulse-subtle 2s infinite;
}
@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}`;
document.head.appendChild(styles);

export default GameHistory;
