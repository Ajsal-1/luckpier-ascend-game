
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
  hash?: string;
  timestamp: string;
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

// Multiplayer crash game hook return type
export interface MultiplayerCrashGameHook {
  gameState: GAME_STATE;
  countdownTimer: number | null;
  currentMultiplier: number;
  crashPoint: number | null;
  isRoundActive: boolean;
  userBalance: number;
  playerBet: number | null;
  playerWin: number | null;
  isBetPlaced: boolean;
  gameHistory: HistoryItem[];
  players: Player[];
  isAuthenticated: boolean;
  currentRound: any;
  handlePlaceBet: (amount: number, autoCashout?: number | null) => Promise<void>;
  handleCashout: () => Promise<void>;
}
