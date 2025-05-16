
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ChartBar, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GameStatisticsProps {
  lastUpdate?: Date;
}

// Game statistics that encourage betting
const GameStatistics: React.FC<GameStatisticsProps> = ({ 
  lastUpdate = new Date() 
}) => {
  const [stats, setStats] = useState({
    avgMultiplier: 2.87,
    playersWon: 627,
    totalWinnings: 142870,
    highestMultiplier: 18.42,
    lastHourWinRate: 68
  });
  
  // Format time since last update
  const getUpdateTime = () => {
    return formatDistanceToNow(lastUpdate, { addSuffix: true });
  };

  // Simulate hourly stats update
  useEffect(() => {
    // This would normally fetch from an API, but we're generating positive data
    const hourlyUpdateInterval = 60 * 60 * 1000; // 1 hour
    
    const updateStats = () => {
      setStats({
        // Generate slightly variable but always positive statistics
        avgMultiplier: 2 + Math.random() * 1.5, // Between 2.0 and 3.5
        playersWon: 550 + Math.floor(Math.random() * 200), // Between 550-750
        totalWinnings: 120000 + Math.floor(Math.random() * 50000), // Between 120k-170k
        highestMultiplier: 15 + Math.random() * 10, // Between 15-25
        lastHourWinRate: 65 + Math.floor(Math.random() * 10) // Between 65-75%
      });
    };
    
    const timer = setInterval(updateStats, hourlyUpdateInterval);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full py-3 mb-3 bg-[#131c29] rounded-lg border border-gray-800">
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center">
          <ChartBar className="w-4 h-4 text-green-400 mr-1.5" />
          <h3 className="text-sm font-medium text-gray-300">Game Statistics</h3>
          <Badge variant="outline" className="ml-2 text-xs bg-blue-900/20 text-blue-400 border-blue-900/40">
            Live
          </Badge>
        </div>
        
        <motion.div
          className="flex items-center text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Clock className="w-3 h-3 mr-1" /> 
          <span>Updated {getUpdateTime()}</span>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4">
        {/* Average Multiplier */}
        <motion.div 
          className="bg-green-900/10 border border-green-900/20 rounded-lg p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs text-gray-400 mb-1">Average Win Multiplier</div>
          <div className="text-lg font-semibold text-green-400">{stats.avgMultiplier.toFixed(2)}x</div>
        </motion.div>
        
        {/* Players Won Today */}
        <motion.div 
          className="bg-blue-900/10 border border-blue-900/20 rounded-lg p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="text-xs text-gray-400 mb-1">Players Won Today</div>
          <div className="text-lg font-semibold text-blue-400">{stats.playersWon}</div>
        </motion.div>
        
        {/* Total Winnings */}
        <motion.div 
          className="bg-violet-900/10 border border-violet-900/20 rounded-lg p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="text-xs text-gray-400 mb-1">Total Winnings Today</div>
          <div className="text-lg font-semibold text-violet-400">${stats.totalWinnings.toLocaleString()}</div>
        </motion.div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between mt-3 px-4 pt-2 border-t border-gray-800">
        <div className="flex items-center mb-2 md:mb-0">
          <TrendingUp className="w-3 h-3 text-amber-400 mr-1" />
          <span className="text-xs text-gray-400">Win rate last hour: </span>
          <span className="text-xs font-medium text-amber-400 ml-1">{stats.lastHourWinRate}%</span>
        </div>
        
        <motion.div 
          className="flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-xs text-gray-400">Highest win today: </span>
          <span className="text-xs font-medium text-green-400 ml-1">{stats.highestMultiplier.toFixed(2)}x</span>
        </motion.div>
      </div>
      
      <div className="text-center text-xs text-gray-500 mt-3 px-4">
        Join the winners! Place your bet now!
      </div>
    </div>
  );
};

export default GameStatistics;
