
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { GAME_STATE, Player } from './types';

interface UsePlayerActionsProps {
  gameState: GAME_STATE;
  currentMultiplier: number;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  startCountdown: () => void;
}

export const usePlayerActions = ({
  gameState,
  currentMultiplier,
  setPlayers,
  startCountdown,
}: UsePlayerActionsProps) => {
  const [userBalance, setUserBalance] = useState<number>(1000);
  const [playerBet, setPlayerBet] = useState<number | null>(null);
  const [playerAutoCashout, setPlayerAutoCashout] = useState<number | null>(null);
  const [playerWin, setPlayerWin] = useState<number | null>(null);
  const [isBetPlaced, setIsBetPlaced] = useState<boolean>(false);

  // Handle bet placement
  const handlePlaceBet = useCallback((amount: number, autoCashout: number | null) => {
    // Only allow placing bets during WAITING or COUNTDOWN states
    if (gameState !== GAME_STATE.WAITING && gameState !== GAME_STATE.COUNTDOWN) {
      toast.error("Round already in progress. Wait for the next round.", { position: 'top-center' });
      return;
    }
    
    if (isBetPlaced) {
      toast.error("You already have a bet placed for this round.", { position: 'top-center' });
      return;
    }
    
    if (amount <= 0) {
      toast.error("Bet amount must be greater than zero.", { position: 'top-center' });
      return;
    }
    
    if (amount > userBalance) {
      toast.error("Insufficient balance for this bet.", { position: 'top-center' });
      return;
    }
    
    // Deduct bet amount from balance
    setUserBalance(prev => prev - amount);
    
    setPlayerBet(amount);
    setPlayerAutoCashout(autoCashout);
    setPlayerWin(null);
    setIsBetPlaced(true);
    
    toast.success("Bet placed successfully!", { position: 'top-center' });
    
    // Add player to the game
    setPlayers(prev => [
      { id: 'player-user', name: 'You', amount, multiplier: null },
      ...prev.filter(p => p.id !== 'player-user')
    ]);
    
    // If no game is in progress, start one
    if (gameState === GAME_STATE.WAITING) {
      startCountdown();
    }
  }, [gameState, startCountdown, isBetPlaced, setPlayers, userBalance]);

  // Handle cashout
  const handleCashout = useCallback(() => {
    if (gameState === GAME_STATE.PLAYING && playerBet !== null && playerWin === null) {
      // Update player status
      setPlayers(prev => 
        prev.map(player => {
          if (player.id === 'player-user') {
            return { ...player, multiplier: currentMultiplier };
          }
          return player;
        })
      );
      
      // Calculate winnings
      const winnings = playerBet * currentMultiplier;
      const profit = winnings - playerBet;
      
      // Update balance
      setUserBalance(prev => prev + winnings);
      
      // Set player win
      setPlayerWin(currentMultiplier);
      
      // Show win notification
      toast.success(
        `You won $${profit.toFixed(2)}! Total: $${winnings.toFixed(2)}`, 
        { position: 'top-center' }
      );
    }
  }, [gameState, playerBet, currentMultiplier, setPlayers, playerWin]);

  return {
    userBalance,
    playerBet,
    playerAutoCashout,
    playerWin,
    isBetPlaced,
    handlePlaceBet,
    handleCashout,
    setPlayerBet,
    setPlayerAutoCashout,
    setPlayerWin,
    setIsBetPlaced,
  };
};
