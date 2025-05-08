
// Game states enum
export enum GAME_STATE {
  WAITING = 'waiting',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  CRASHED = 'crashed'
}

// History item
export interface HistoryItem {
  id: string;
  multiplier: number;
}

// Player interface
export interface Player {
  id: string;
  name: string;
  amount: number;
  multiplier: number | null;
}

// Game state interface
export interface GameState {
  gameState: GAME_STATE;
  countdownTimer: number | null;
  crashPoint: number | null;
  currentMultiplier: number;
  playerBet: number | null;
  playerAutoCashout: number | null;
  playerWin: number | null;
  isBetPlaced: boolean;
}

// Player state interface
export interface PlayerState {
  userBalance: number;
  playerBet: number | null;
  playerAutoCashout: number | null;
  playerWin: number | null;
  isBetPlaced: boolean;
}

// Game history interface
export interface GameHistory {
  gameHistory: HistoryItem[];
  players: Player[];
}

// Hook return type
export interface CrashGameHook {
  userBalance: number;
  gameState: string;
  countdownTimer: number | null;
  crashPoint: number | null;
  currentMultiplier: number;
  playerWin: number | null;
  isBetPlaced: boolean;
  gameHistory: HistoryItem[];
  players: Player[];
  handlePlaceBet: (amount: number, autoCashout: number | null) => void;
  handleCashout: () => void;
  handleCrash: (value: number) => void;
  setCurrentMultiplier: React.Dispatch<React.SetStateAction<number>>;
}
