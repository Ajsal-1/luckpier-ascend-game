
import React from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { ChartDataPoint } from './types';

interface MultiplierChartProps {
  chartData: ChartDataPoint[];
  isCrashed: boolean;
  winValue: number | null;
  crashEffectActive: boolean;
}

const MultiplierChart: React.FC<MultiplierChartProps> = ({
  chartData,
  isCrashed,
  winValue,
  crashEffectActive,
}) => {
  return (
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
  );
};

export default MultiplierChart;
