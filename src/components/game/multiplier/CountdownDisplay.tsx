
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownDisplayProps {
  gameState: string;
  displayValue: string;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ gameState, displayValue }) => {
  return (
    <AnimatePresence>
      {gameState === 'countdown' && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/30 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-6xl md:text-8xl font-bold text-amber-400"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            key={displayValue} // Force re-animation on value change
          >
            {Math.ceil(parseFloat(displayValue))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CountdownDisplay;
