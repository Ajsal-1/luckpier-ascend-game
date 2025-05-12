
/**
 * Crash Game Engine
 * Implements a provably fair crash game with consistent behavior
 */

// Game states
export enum GameState {
  WAITING = 'waiting',      // Waiting between rounds
  COUNTDOWN = 'countdown',  // Countdown to start
  PLAYING = 'playing',      // Game is running
  CRASHED = 'crashed'       // Game has crashed
}

// Round history interface
export interface RoundHistory {
  id: string;
  crashPoint: number;
  timestamp: Date;
}

// Player bet interface
export interface PlayerBet {
  userId: string;
  username: string;
  amount: number;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
}

/**
 * Calculate the current multiplier based on elapsed time
 * Formula: multiplier = 1 + (timeElapsedInSeconds)^1.3
 */
export const calculateMultiplier = (elapsedTimeInSeconds: number): number => {
  // Apply the formula exactly as specified: 1 + (timeElapsedInSeconds)^1.3
  const multiplier = 1 + Math.pow(elapsedTimeInSeconds, 1.3);
  
  // Round to 2 decimal places for display consistency
  return Math.floor(multiplier * 100) / 100;
};

/**
 * Generate a crash point using a deterministic algorithm
 * Using simple algorithm: 1.01 + (random * 10) as specified
 */
export const generateCrashPoint = (): number => {
  const randomValue = Math.random(); // 0 to 1
  const crashPoint = 1.01 + (randomValue * 10); // 1.01 to 11.01
  
  // Round to 2 decimal places for consistency
  return Math.floor(crashPoint * 100) / 100;
};

/**
 * Format a multiplier for display with consistent decimal places
 */
export const formatMultiplier = (value: number): string => {
  return value.toFixed(2) + 'x';
};

/**
 * Check if the current multiplier has reached or exceeded the crash point
 */
export const hasCrashed = (currentMultiplier: number, crashPoint: number): boolean => {
  return currentMultiplier >= crashPoint;
};
