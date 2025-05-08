
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FloatingMultiplierProps {
  displayValue: string;
  currentMultiplier: number;
  isCrashed: boolean;
  winValue: number | null;
  crashEffectActive: boolean;
}

const FloatingMultiplier: React.FC<FloatingMultiplierProps> = ({ 
  displayValue, 
  currentMultiplier, 
  isCrashed, 
  winValue,
  crashEffectActive
}) => {
  return (
    <motion.div
      className={cn(
        "absolute text-white font-bold text-xl",
        "filter drop-shadow-lg"
      )}
      style={{
        right: 20,
        top: isCrashed || winValue 
          ? '50%' 
          : `${Math.max(20, Math.min(80, 100 - (currentMultiplier - 1) * 10))}%`,
        transform: 'translate(0, -50%)',
      }}
      animate={{
        y: isCrashed && crashEffectActive ? [0, -5, 5, -3, 3, 0] : 0
      }}
      transition={{
        duration: isCrashed ? 0.5 : 0.2,
        ease: "easeInOut"
      }}
    >
      <div 
        className={cn(
          "px-3 py-1.5 rounded-full",
          isCrashed 
            ? "bg-pink-500 animate-pulse" 
            : winValue 
              ? "bg-amber-400 animate-pulse" 
              : "bg-[#000057]"
        )}
      >
        {displayValue}
      </div>
    </motion.div>
  );
};

export default FloatingMultiplier;
