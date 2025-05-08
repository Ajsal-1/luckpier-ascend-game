
import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiplierProps {
  isPlaying: boolean;
  isCrashed: boolean;
  winValue: number | null;
  crashValue: number | null;
  onCrash: (value: number) => void;
}

const Multiplier: React.FC<MultiplierProps> = ({
  isPlaying,
  isCrashed,
  winValue,
  crashValue,
  onCrash,
}) => {
  const [multiplier, setMultiplier] = useState(1);
  const [displayValue, setDisplayValue] = useState("1.00x");
  const [chartData, setChartData] = useState<{x: number, y: number}[]>([]);
  const [crashEffectActive, setCrashEffectActive] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Constants to control the multiplier growth curve
  const growthFactor = 0.06; // Adjust for faster/slower growth
  
  const formatMultiplier = (value: number): string => {
    return value.toFixed(2) + "x";
  };

  const animateMultiplier = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const newMultiplier = 1 + Math.pow(elapsed * growthFactor / 1000, 1.5);
    
    // Update chart data with new point
    setChartData(prev => {
      // Keep a rolling window of points for performance
      const newData = [...prev, { x: elapsed / 1000, y: newMultiplier }];
      // Only keep the most recent 200 points for performance
      if (newData.length > 200) {
        return newData.slice(newData.length - 200);
      }
      return newData;
    });
    
    // Simulating random crash
    // In a real implementation, this would be determined by server
    if (crashValue && newMultiplier >= crashValue) {
      setCrashEffectActive(true);
      onCrash(newMultiplier);
      return;
    }
    
    setMultiplier(newMultiplier);
    setDisplayValue(formatMultiplier(newMultiplier));
    
    animationRef.current = requestAnimationFrame(animateMultiplier);
  };

  useEffect(() => {
    if (isPlaying && !isCrashed && !winValue) {
      startTimeRef.current = null;
      setChartData([{ x: 0, y: 1 }]); // Initialize with starting point
      animationRef.current = requestAnimationFrame(animateMultiplier);
      setCrashEffectActive(false); // Reset crash effect
    } else if (isCrashed && crashValue) {
      setMultiplier(crashValue);
      setDisplayValue(formatMultiplier(crashValue));
      setCrashEffectActive(true); // Activate crash effect
      
      // Reset crash effect after animation completes
      const resetTimer = setTimeout(() => {
        setCrashEffectActive(false);
      }, 3000);
      
      return () => clearTimeout(resetTimer);
    } else if (winValue) {
      setMultiplier(winValue);
      setDisplayValue(formatMultiplier(winValue));
    } else {
      setMultiplier(1);
      setDisplayValue("1.00x");
      setChartData([]); // Clear chart when not playing
      setCrashEffectActive(false); // Reset crash effect
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isCrashed, winValue, crashValue]);

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center w-full h-full min-h-[240px] md:min-h-[320px]",
        (isCrashed || winValue) ? "animate-pulse-win" : ""
      )}
    >
      {/* Chart Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {(isPlaying || isCrashed || winValue) && chartData.length > 0 && (
          <motion.div 
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <defs>
                  <linearGradient id="colorMultiplier" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isCrashed ? "#FF4F6F" : "#000057"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isCrashed ? "#FF4F6F" : "#000057"} stopOpacity={0} />
                  </linearGradient>
                  {/* Glow effect for the chart line */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation={isCrashed ? "8" : "4"} result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  
                  {/* Crash effect filters */}
                  <filter id="glitch" x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  
                  <filter id="shockwave" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                    <feBlend in="SourceGraphic" in2="goo" />
                  </filter>
                </defs>
                <XAxis 
                  dataKey="x" 
                  hide={true}
                />
                <YAxis 
                  dataKey="y" 
                  hide={true}
                  domain={['dataMin', 'dataMax']}
                />
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke={isCrashed ? "#FF4F6F" : winValue ? "#FFD700" : "#000057"}
                  strokeWidth={isCrashed ? 5 : 3}
                  fill="url(#colorMultiplier)"
                  filter={isCrashed && crashEffectActive ? "url(#glitch)" : "url(#glow)"}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

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

      {/* Floating multiplier label that tracks the tip of the line */}
      <motion.div
        className={cn(
          "absolute text-white font-bold text-xl",
          "filter drop-shadow-lg"
        )}
        style={{
          right: 20,
          top: isCrashed || winValue 
            ? '50%' 
            : `${Math.max(20, Math.min(80, 100 - (multiplier - 1) * 10))}%`,
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
      
      {/* Big central multiplier display */}
      <motion.div 
        className={cn(
          "text-7xl sm:text-8xl font-bold z-10",
          isPlaying && !isCrashed && !winValue ? "text-white" : "",
          isCrashed ? "multiplier-crashed" : "",
          winValue ? "multiplier-win" : "",
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
          className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-pink-500 text-xl font-bold tracking-wider"
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
          className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-luckpier-gold text-xl font-bold tracking-wider"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          CASHED OUT
        </motion.div>
      )}
    </div>
  );
};

export default Multiplier;
