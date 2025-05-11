
import React from 'react';
import { cn } from '@/lib/utils';
import MultiplierLogic from './multiplier/MultiplierLogic';
import CrashEffects from './multiplier/CrashEffects';
import CountdownDisplay from './multiplier/CountdownDisplay';
import MultiplierDisplay from './multiplier/MultiplierDisplay';
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
}) => {
  // Simple wrapper that directly passes values to display components
  // Chart data is no longer used, focusing only on the multiplier display
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center w-full h-full min-h-[240px] md:min-h-[320px]",
        (isCrashed || winValue) ? "animate-pulse-win" : ""
      )}
    >
      {/* Crash Effects */}
      <CrashEffects 
        isCrashed={isCrashed}
        crashEffectActive={isCrashed} // Simplified - show effects whenever crashed
      />

      {/* Countdown Display */}
      <CountdownDisplay 
        gameState={gameState as GAME_STATE} 
        displayValue={currentMultiplier.toFixed(2) + "x"} 
      />
      
      {/* Main multiplier display and status messages */}
      <MultiplierDisplay 
        displayValue={currentMultiplier.toFixed(2) + "x"}
        isPlaying={isPlaying}
        isCrashed={isCrashed}
        winValue={winValue}
        crashEffectActive={isCrashed} // Simplified - show effects whenever crashed
      />
    </div>
  );
};

export default Multiplier;
