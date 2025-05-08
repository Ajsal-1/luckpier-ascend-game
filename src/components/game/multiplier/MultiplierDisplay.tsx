
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MultiplierDisplayProps {
  displayValue: string;
  isPlaying: boolean;
  isCrashed: boolean;
  winValue: number | null;
  crashEffectActive: boolean;
}

const MultiplierDisplay: React.FC<MultiplierDisplayProps> = ({
  displayValue,
  isPlaying,
  isCrashed,
  winValue,
  crashEffectActive,
}) => {
  return (
    <>
      {/* Big central multiplier display */}
      <motion.div 
        className={cn(
          "text-7xl sm:text-8xl font-bold z-10",
          isPlaying && !isCrashed && !winValue ? "text-white" : "",
          isCrashed ? "text-red-500" : "",
          winValue ? "text-amber-400" : "",
        )}
        animate={{ 
          scale: (isCrashed && crashEffectActive) ? [1, 1.2, 0.9, 1.05, 1] : (winValue) ? [1, 1.05, 1] : 1,
          opacity: isPlaying || isCrashed || winValue ? 1 : 0,
          x: (isCrashed && crashEffectActive) ? [0, -10, 10, -5, 5, 0] : 0,
          y: (isCrashed && crashEffectActive) ? [0, -5, 5, -3, 3, 0] : 0
        }}
        transition={{ 
          duration: (isCrashed && crashEffectActive) ? 0.5 : 0.3,
          repeat: (isCrashed && crashEffectActive) ? 0 : (winValue) ? 3 : 0
        }}
      >
        {displayValue}
      </motion.div>
      
      {/* Status messages */}
      {isCrashed && (
        <motion.div 
          className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 text-red-500 text-xl md:text-2xl font-bold tracking-wider"
          initial={{ opacity: 0, y: 10 }}
          animate={crashEffectActive ? { 
            opacity: 1, 
            y: 0,
            x: [-3, 3, -2, 2, 0]
          } : {
            opacity: 1,
            y: 0
          }}
          transition={{ 
            duration: 0.3, 
            delay: 0.2,
            x: { duration: 0.5 }
          }}
        >
          CRASHED AT {displayValue}
        </motion.div>
      )}
      
      {winValue && (
        <motion.div 
          className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 text-amber-400 text-xl md:text-2xl font-bold tracking-wider"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          CASHED OUT
        </motion.div>
      )}
    </>
  );
};

export default MultiplierDisplay;
