
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
          scale: (isCrashed && crashEffectActive) ? 
            [1, 1.3, 0.9, 1.1, 1] : 
            (winValue) ? 
              [1, 1.1, 1] : 
              1,
          opacity: isPlaying || isCrashed || winValue ? 1 : 0,
          x: (isCrashed && crashEffectActive) ? [0, -15, 15, -8, 8, 0] : 0,
          y: (isCrashed && crashEffectActive) ? [0, -8, 8, -5, 5, 0] : 0
        }}
        transition={{ 
          duration: (isCrashed && crashEffectActive) ? 0.8 : 0.3,
          repeat: (isCrashed && crashEffectActive) ? 1 : (winValue) ? 3 : 0,
          repeatDelay: 0.5
        }}
      >
        {displayValue}
      </motion.div>
      
      {/* Status messages */}
      {isCrashed && (
        <motion.div 
          className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 text-red-500 text-xl md:text-3xl font-bold tracking-wider bg-black/50 px-4 py-1 rounded-md"
          initial={{ opacity: 0, y: 10 }}
          animate={crashEffectActive ? { 
            opacity: 1, 
            y: 0,
            x: [-5, 5, -3, 3, 0]
          } : {
            opacity: 1,
            y: 0
          }}
          transition={{ 
            duration: 0.5, 
            delay: 0.2,
            x: { duration: 0.8 }
          }}
        >
          CRASHED AT {displayValue}
        </motion.div>
      )}
      
      {winValue && (
        <motion.div 
          className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 text-amber-400 text-xl md:text-3xl font-bold tracking-wider bg-black/30 px-4 py-1 rounded-md"
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
