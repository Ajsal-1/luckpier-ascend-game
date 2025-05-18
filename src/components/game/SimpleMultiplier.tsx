
import React from 'react';
import { GAME_STATE } from '@/hooks/game/types';
import StatusOverlay from './StatusOverlay';

interface SimpleMultiplierProps {
  currentMultiplier: number;
  gameState: string;
  crashPoint: number | null;
  remainingTime: number | null;
  playerWin: number | null; // Add this to know when player cashed out
}

const SimpleMultiplier: React.FC<SimpleMultiplierProps> = ({
  currentMultiplier,
  gameState,
  crashPoint,
  remainingTime,
  playerWin
}) => {
  // Format multiplier with 2 decimal places
  const formatMultiplier = (value: number): string => {
    return value.toFixed(2) + 'x';
  };
  
  // Determine what to display based on game state
  const getDisplayText = () => {
    if (gameState === GAME_STATE.COUNTDOWN) {
      return `Starting in ${remainingTime?.toFixed(1) || '0.0'}s`;
    } else if (gameState === GAME_STATE.PLAYING) {
      return formatMultiplier(currentMultiplier);
    } else if (gameState === GAME_STATE.CRASHED && crashPoint) {
      // Fixed: Always show the actual crash point, not the currentMultiplier
      return `CRASHED AT ${formatMultiplier(crashPoint)}`;
    } else {
      return 'WAITING';
    }
  };
  
  // Determine text color based on game state
  const getTextColorClass = () => {
    if (gameState === GAME_STATE.PLAYING) {
      return 'text-green-500';
    } else if (gameState === GAME_STATE.CRASHED) {
      return 'text-red-500';
    } else {
      return 'text-blue-400';
    }
  };
  
  // Determine when to show crash or cashout overlays
  const isCrashed = gameState === GAME_STATE.CRASHED;
  const isCashedOut = playerWin !== null && gameState === GAME_STATE.PLAYING;
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative">
      {/* Status overlay - shows crash or cashout images */}
      <StatusOverlay isCrashed={isCrashed} isCashedOut={isCashedOut} />
      
      {/* Original multiplier display */}
      <div className={`text-4xl md:text-5xl lg:text-6xl font-bold ${getTextColorClass()} z-10`}>
        {getDisplayText()}
      </div>
      
      {gameState === GAME_STATE.COUNTDOWN && (
        <p className="text-gray-400 mt-2 z-10">Get ready to play!</p>
      )}
      
      {gameState === GAME_STATE.CRASHED && (
        <p className="text-gray-400 mt-2 z-10">Next round starting soon</p>
      )}
    </div>
  );
};

export default SimpleMultiplier;
