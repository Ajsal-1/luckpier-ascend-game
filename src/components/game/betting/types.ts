export interface BettingPanelProps {
  isPlaying: boolean;
  isCrashed: boolean;
  hasWon: boolean;
  onPlaceBet: (amount: number, autoCashout: number | null) => void;
  onCashout: () => void;
  remainingTime: number | null;
  balance?: number;
  isBetPlaced?: boolean;
  gameState: any;
  isProcessingBet?: boolean;
  isProcessingCashout?: boolean;
  betError?: string | null;
}

// Add new type for client-side bet processing
export interface ClientBetResult {
  success: boolean;
  error?: string;
  betAmount?: number;
  autoCashout?: number | null;
}
