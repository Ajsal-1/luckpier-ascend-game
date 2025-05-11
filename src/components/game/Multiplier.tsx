
import React from 'react';
import { cn } from '@/lib/utils';
import MultiplierLogic from './multiplier/MultiplierLogic';
import MultiplierChart from './multiplier/MultiplierChart';
import CrashEffects from './multiplier/CrashEffects';
import CountdownDisplay from './multiplier/CountdownDisplay';
import FloatingMultiplier from './multiplier/FloatingMultiplier';
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
  return (
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
        <div 
          className={cn(
            "relative flex items-center justify-center w-full h-full min-h-[240px] md:min-h-[320px]",
            (isCrashed || winValue) ? "animate-pulse-win" : ""
          )}
        >
          {/* Chart Container */}
          <div className="absolute inset-0 flex items-center justify-center">
            {(isPlaying || isCrashed || winValue) && chartData.length > 0 && (
              <MultiplierChart
                chartData={chartData}
                isCrashed={isCrashed}
                winValue={winValue}
                crashEffectActive={crashEffectActive}
              />
            )}
          </div>

          {/* Crash Effects */}
          <CrashEffects 
            isCrashed={isCrashed}
            crashEffectActive={crashEffectActive}
          />

          {/* Countdown Display */}
          <CountdownDisplay 
            gameState={gameState as GAME_STATE} 
            displayValue={displayValue} 
          />

          {/* Floating multiplier label */}
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
        </div>
      )}
    </MultiplierLogic>
  );
};

export default Multiplier;
