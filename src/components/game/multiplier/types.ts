export interface ChartDataPoint {
  x: number;
  y: number;
}

export interface MultiplierProps {
  isPlaying: boolean;
  isCrashed: boolean;
  winValue: number | null;
  crashValue: number | null;
  onCrash: (value: number) => void;
  currentMultiplier: number;
  onMultiplierUpdate: (multiplier: number) => void;
  gameState: string;
  remainingTime: number | null;
}
