
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_STATE } from '@/hooks/game/types';

interface CountdownDisplayProps {
  gameState: GAME_STATE | string;
  displayValue: string;
  probablyFairHash?: string;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ 
  gameState, 
  displayValue,
  probablyFairHash
}) => {
  const isCountdown = gameState === GAME_STATE.COUNTDOWN;
  const countdownValue = isCountdown ? Math.ceil(parseFloat(displayValue)) : '';

  return (
    <AnimatePresence>
      {isCountdown && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20 rounded-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-6xl md:text-8xl font-bold text-amber-400"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.9, 1.1, 1], 
              opacity: 1,
            }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ 
              duration: 0.5,
              repeat: countdownValue === "1" ? 0 : Infinity,
              repeatType: "reverse"
            }}
            key={displayValue} // Force re-animation on value change
          >
            {countdownValue}
          </motion.div>
          
          <motion.div 
            className="mt-2 text-lg text-white font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Place your bets now!
          </motion.div>
          
          {probablyFairHash && (
            <motion.div
              className="mt-4 text-xs text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Round Hash: {probablyFairHash.substring(0, 8)}...
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CountdownDisplay;
