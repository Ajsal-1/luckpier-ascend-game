
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CrashEffectsProps {
  isCrashed: boolean;
  crashEffectActive: boolean;
}

const CrashEffects: React.FC<CrashEffectsProps> = ({ isCrashed, crashEffectActive }) => {
  return (
    <>
      {/* Crash effect overlay - Stronger and longer-lasting */}
      <AnimatePresence>
        {isCrashed && crashEffectActive && (
          <motion.div 
            className="absolute inset-0 bg-red-500/50 z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.9, 0.7, 0.5, 0.3, 0.2],
              scale: [0.8, 1.1, 1.05, 1]
            }}
            transition={{ 
              duration: 4.0,  // Extended duration
              times: [0, 0.1, 0.3, 0.6, 0.8, 1]
            }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Enhanced shockwave effect */}
      <AnimatePresence>
        {isCrashed && crashEffectActive && (
          <>
            {/* First shockwave - fast */}
            <motion.div
              className="absolute inset-0 rounded-full border-[6px] border-red-500/80 z-10 pointer-events-none"
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
                duration: 1.0,
                ease: "easeOut"
              }}
              exit={{ opacity: 0 }}
            />
            
            {/* Second shockwave - delayed */}
            <motion.div
              className="absolute inset-0 rounded-full border-[3px] border-red-500/60 z-10 pointer-events-none"
              style={{ 
                width: 10, 
                height: 10,
                left: '50%',
                top: '50%',
                margin: '-5px 0 0 -5px'
              }}
              initial={{ width: 10, height: 10, opacity: 0, marginLeft: -5, marginTop: -5 }}
              animate={{ 
                width: [10, 400], 
                height: [10, 400],
                marginLeft: [-5, -200],
                marginTop: [-5, -200],
                opacity: [0, 0.8, 0]
              }}
              transition={{ 
                duration: 2.0,
                delay: 0.3,
                ease: "easeOut"
              }}
              exit={{ opacity: 0 }}
            />
            
            {/* Third shockwave - very delayed */}
            <motion.div
              className="absolute inset-0 rounded-full border-[2px] border-red-500/40 z-10 pointer-events-none"
              style={{ 
                width: 10, 
                height: 10,
                left: '50%',
                top: '50%',
                margin: '-5px 0 0 -5px'
              }}
              initial={{ width: 10, height: 10, opacity: 0, marginLeft: -5, marginTop: -5 }}
              animate={{ 
                width: [10, 500], 
                height: [10, 500],
                marginLeft: [-5, -250],
                marginTop: [-5, -250],
                opacity: [0, 0.6, 0]
              }}
              transition={{ 
                duration: 3.0,
                delay: 0.6,
                ease: "easeOut"
              }}
              exit={{ opacity: 0 }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CrashEffects;
