
// Formatter for multiplier values
export const formatMultiplier = (value: number): string => {
  return value.toFixed(2) + "x";
};

// Get color for multiplier chart based on game state
export const getMultiplierColor = (isCrashed: boolean, winValue: number | null): string => {
  if (isCrashed) return "#FF4F6F";
  if (winValue) return "#FFD700";
  return "#000057";
};
