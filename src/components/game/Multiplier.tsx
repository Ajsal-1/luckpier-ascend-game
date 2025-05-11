
import React from 'react';
import { cn } from '@/lib/utils';
import CrashEffects from './multiplier/CrashEffects';
import CountdownDisplay from './multiplier/CountdownDisplay';
import MultiplierDisplay from './multiplier/MultiplierDisplay';
import MultiplierChart from './multiplier/MultiplierChart';
import MultiplierLogic from './multiplier/MultiplierLogic';
import FloatingMultiplier from './multiplier/FloatingMultiplier';
import { MultiplierProps } from './multiplier/types';
import { GAME_STATE } from '@/hooks/game/types';

const Multiplier: React.FC<MultiplierProps> = ({
  isPlaying,
  isCrashed,
  winValue,
  crashValue,
  onCrash,
  currentMultiplier,
  onMultiplierUpdate,
  gameState,
  remainingTime,
}) => {
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center w-full h-full min-h-[240px] md:min-h-[320px]",
        (isCrashed || winValue) ? "animate-pulse-win" : ""
      )}
    >
      <MultiplierLogic
        isPlaying={isPlaying}
        isCrashed={isCrashed}
        winValue={winValue}
        crashValue={crashValue}
        onCrash={onCrash}
        currentMultiplier={currentMultiplier}
        onMultiplierUpdate={onMultiplierUpdate}
      >
        {({ displayValue, chartData, crashEffectActive }) => (
          <>
            {/* Background multiplier chart */}
            <div className="absolute inset-0 z-0 opacity-30">
              <MultiplierChart 
                chartData={chartData}
                isCrashed={isCrashed}
                winValue={winValue}
                crashEffectActive={crashEffectActive}
              />
            </div>
            
            {/* Crash Effects */}
            <CrashEffects 
              isCrashed={isCrashed}
              crashEffectActive={crashEffectActive}
            />

            {/* Countdown Display - Using server-provided countdown */}
            <CountdownDisplay 
              gameState={gameState as GAME_STATE} 
              displayValue={displayValue}
              remainingTime={remainingTime}
            />
            
            {/* Floating multiplier indicator showing the current value */}
            <FloatingMultiplier
              displayValue={displayValue}
              currentMultiplier={currentMultiplier}
              isCrashed={isCrashed}
              winValue={winValue}
              crashEffectActive={crashEffectActive}
            />
            
            {/* Main multiplier display and status messages */}
            <MultiplierDisplay 
              displayValue={displayValue}
              isPlaying={isPlaying}
              isCrashed={isCrashed}
              winValue={winValue}
              crashEffectActive={crashEffectActive}
            />
          </>
        )}
      </MultiplierLogic>
    </div>
  );
};

export default Multiplier;
