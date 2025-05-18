
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartBar, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useGameStatistics } from '@/hooks/useGameStatistics';
import { useIsMobile } from '@/hooks/use-mobile';

interface GameStatisticsProps {
  lastUpdate?: Date;
}

const GameStatistics: React.FC<GameStatisticsProps> = ({ 
  lastUpdate: propLastUpdate
}) => {
  // Use our custom hook to get the stats
  const { stats, lastUpdate: hookLastUpdate } = useGameStatistics();
  const isMobile = useIsMobile();
  
  // Use the prop if provided, otherwise use the hook's last update
  const lastUpdate = propLastUpdate || hookLastUpdate;
  
  // Format time since last update - keeping this function even though we're not displaying it
  // in case we want to use it elsewhere later
  const getUpdateTime = () => {
    return formatDistanceToNow(lastUpdate, { addSuffix: true });
  };

  return (
    <div className="w-full py-2 md:py-3 mb-2 md:mb-3 bg-[#131c29] rounded-lg border border-gray-800">
      <div className="flex items-center justify-between px-3 md:px-4 mb-2">
        <div className="flex items-center">
          <ChartBar className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400 mr-1" />
          <h3 className="text-xs md:text-sm font-medium text-gray-300">Game Statistics</h3>
          <Badge variant="outline" className="ml-1.5 md:ml-2 text-[10px] md:text-xs bg-blue-900/20 text-blue-400 border-blue-900/40">
            Live
          </Badge>
        </div>
        
        {/* Removed the "Updated X time ago" element that was here */}
      </div>
      
      <div className={`grid grid-cols-3 gap-1.5 md:gap-3 px-3 md:px-4 ${isMobile ? 'text-center' : ''}`}>
        {/* Average Multiplier */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={`avg-${stats.avgMultiplier.toFixed(2)}`}
            className="bg-green-900/10 border border-green-900/20 rounded-lg p-1.5 md:p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-[9px] md:text-xs text-gray-400 mb-0.5 md:mb-1">Avg Multiplier</div>
            <div className="text-sm md:text-lg font-semibold text-green-400">{stats.avgMultiplier.toFixed(2)}x</div>
          </motion.div>
        </AnimatePresence>
        
        {/* Consecutive Wins Record */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={`streak-${stats.consecutiveWinRecord}`}
            className="bg-blue-900/10 border border-blue-900/20 rounded-lg p-1.5 md:p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="text-[9px] md:text-xs text-gray-400 mb-0.5 md:mb-1">Win Streak</div>
            <div className="text-sm md:text-lg font-semibold text-blue-400">{stats.consecutiveWinRecord}</div>
          </motion.div>
        </AnimatePresence>
        
        {/* Total Winnings */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={`winnings-${stats.totalWinnings}`}
            className="bg-violet-900/10 border border-violet-900/20 rounded-lg p-1.5 md:p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="text-[9px] md:text-xs text-gray-400 mb-0.5 md:mb-1">Total Winnings</div>
            <div className="text-sm md:text-lg font-semibold text-violet-400">
              ${isMobile ? 
                (stats.totalWinnings > 100000 ? (stats.totalWinnings/1000).toFixed(0) + 'K' : stats.totalWinnings.toLocaleString()) : 
                stats.totalWinnings.toLocaleString()}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Show detailed stats in desktop view */}
      {!isMobile && (
        <div className="flex flex-col md:flex-row justify-between mt-3 px-4 pt-2 border-t border-gray-800">
          <div className="flex items-center mb-2 md:mb-0">
            <TrendingUp className="w-3 h-3 text-amber-400 mr-1" />
            <span className="text-xs text-gray-400">Win rate last hour: </span>
            <motion.span 
              key={`rate-${stats.lastHourWinRate}`}
              className="text-xs font-medium text-amber-400 ml-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {stats.lastHourWinRate}%
            </motion.span>
          </div>
          
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-xs text-gray-400">Highest win today: </span>
            <motion.span 
              key={`highest-${stats.highestMultiplier.toFixed(2)}`}
              className="text-xs font-medium text-green-400 ml-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {stats.highestMultiplier.toFixed(2)}x
            </motion.span>
          </motion.div>
        </div>
      )}
      
      {/* Mobile condensed details */}
      {isMobile && (
        <div className="flex justify-between items-center px-3 pt-1.5 mt-1.5 border-t border-gray-800/50 text-[9px]">
          <div className="flex items-center">
            <TrendingUp className="w-2.5 h-2.5 text-amber-400 mr-0.5" />
            <span className="text-gray-400">{stats.lastHourWinRate}% win rate</span>
          </div>
          <div className="text-gray-400">
            Highest: <span className="text-green-400">{stats.highestMultiplier.toFixed(2)}x</span>
          </div>
        </div>
      )}
      
      {/* Only show this message on desktop */}
      {!isMobile && (
        <div className="text-center text-xs text-gray-500 mt-3 px-4">
          Can you beat the {stats.consecutiveWinRecord}-win streak record? Place your bet now!
        </div>
      )}
    </div>
  );
};

export default GameStatistics;
