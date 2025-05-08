
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CrashEffectsProps {
  isCrashed: boolean;
  crashEffectActive: boolean;
}

const CrashEffects: React.FC<CrashEffectsProps> = ({ isCrashed, crashEffectActive }) => {
  return (
    <>
      {/* Crash effect overlay */}
      <AnimatePresence>
        {isCrashed && crashEffectActive && (
          <motion.div 
            className="absolute inset-0 bg-red-500/30 z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              scale: [0.9, 1.05, 1]
            }}
            transition={{ 
              duration: 0.5,
              times: [0, 0.2, 1]
            }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Shockwave effect */}
      <AnimatePresence>
        {isCrashed && crashEffectActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-[3px] border-red-500/80 z-10 pointer-events-none"
            style={{ 
              width: 10, 
              height: 10,
              left: '50%',
              top: '50%',
              margin: '-5px 0 0 -5px'
            }}
            initial={{ width: 10, height: 10, opacity: 1, marginLeft: -5, marginTop: -5 }}
            animate={{ 
              width: [10, 300], 
              height: [10, 300],
              marginLeft: [-5, -150],
              marginTop: [-5, -150],
              opacity: [1, 0]
            }}
            transition={{ 
              duration: 0.5,
              ease: "easeOut"
            }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CrashEffects;
