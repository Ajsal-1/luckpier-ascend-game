
export enum GAME_STATE {
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  CRASHED = 'crashed'
}

export interface Player {
  id: string;
  name: string;
  amount: number;
  multiplier: number | null;
  userId?: string;
}

export interface HistoryItem {
  id: string;
  multiplier: number;
  timestamp: string;
}

export interface RoundData {
  id: string;
  crashPoint: number;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'running' | 'completed';
}

export interface GameState {
  status: 'waiting' | 'countdown' | 'playing' | 'crashed';
  currentMultiplier: number;
  crashPoint?: number;
  roundId?: string;
  countdownRemaining?: number;
  nextRoundStartTime?: string;
}
