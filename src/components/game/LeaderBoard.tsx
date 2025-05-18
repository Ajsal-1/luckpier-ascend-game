
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Player {
  id: string;
  name: string;
  amount: number;
  multiplier: number | null;
}

interface LeaderBoardProps {
  players: Player[];
}

const LeaderBoard: React.FC<LeaderBoardProps> = ({ players }) => {
  // Sort and limit players for better performance
  const displayedPlayers = useMemo(() => {
    // First, separate real players (represented by "You") and other players
    const realPlayers = players.filter(p => p.name === "You");
    const otherPlayers = players.filter(p => p.name !== "You");
    
    // Sort other players by bet amount (descending) and take top 50
    const sortedOthers = otherPlayers
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 50);
    
    // Combine and return
    return [...realPlayers, ...sortedOthers];
  }, [players]);
  
  return (
    <div className="bg-[#131c29] border border-gray-800/40 rounded-md h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/40">
        <h2 className="text-base font-medium">Players</h2>
        <span className="text-xs text-gray-400">{players.length} active</span>
      </div>
      
      <div className="overflow-y-auto max-h-[400px] scrollbar-thin">
        <table className="game-table">
          <thead className="sticky top-0 bg-[#131c29] z-10">
            <tr>
              <th>Player</th>
              <th className="text-right">Bet</th>
              <th className="text-right">Multiplier</th>
              <th className="text-right">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/20">
            {displayedPlayers.map((player) => {
              const profit = player.multiplier ? (player.amount * player.multiplier) - player.amount : 0;
              const isWaiting = player.multiplier === null;
              const isLost = player.multiplier === 0;
              
              return (
                <tr 
                  key={player.id} 
                  className={cn(
                    "transition-all duration-300",
                    isLost ? "opacity-60 hover:bg-gray-800/20" : "hover:bg-gray-800/30",
                    player.id.startsWith('fake-') ? "animate-fade-in" : ""
                  )}
                >
                  <td className="max-w-[100px] truncate">
                    <span className={cn(
                      player.name === "You" ? "font-medium text-white" : "text-gray-300",
                      isLost && "text-gray-500"
                    )}>
                      {player.name}
                    </span>
                  </td>
                  <td className={cn(
                    "text-right",
                    isLost && "text-gray-500"
                  )}>
                    ${player.amount.toFixed(2)}
                  </td>
                  <td className="text-right">
                    {isWaiting ? (
                      <span className="text-blue-400 inline-flex items-center">
                        Playing
                        <span className="animate-pulse">...</span>
                      </span>
                    ) : isLost ? (
                      <span className="text-pink-500 font-medium">0.00x</span>
                    ) : (
                      <span 
                        className={cn(
                          "font-medium",
                          profit > 0 ? "text-green-500" : "text-pink-500"
                        )}
                      >
                        {player.multiplier?.toFixed(2)}x
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    {isWaiting ? (
                      <span className="text-gray-500">-</span>
                    ) : isLost ? (
                      <span className="text-pink-500 font-medium">
                        -{player.amount.toFixed(2)}
                      </span>
                    ) : (
                      <span 
                        className={cn(
                          "font-medium",
                          profit > 0 ? "text-green-500" : "text-pink-500"
                        )}
                      >
                        {profit > 0 ? "+" : ""}{profit.toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {displayedPlayers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  No active bets
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {players.length > 50 && (
        <div className="px-4 py-2 text-center text-xs text-gray-400 border-t border-gray-800/40">
          Showing top 50 players of {players.length} total
        </div>
      )}
    </div>
  );
};

export default LeaderBoard;
