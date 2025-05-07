
import React from 'react';
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
            {players.map((player) => {
              const profit = player.multiplier ? (player.amount * player.multiplier) - player.amount : 0;
              const isWaiting = player.multiplier === null;
              
              return (
                <tr 
                  key={player.id} 
                  className="hover:bg-gray-800/30 transition-colors text-sm"
                >
                  <td className="max-w-[100px] truncate">
                    <span className={player.name === "You" ? "font-medium text-white" : "text-gray-300"}>
                      {player.name}
                    </span>
                  </td>
                  <td className="text-right">${player.amount.toFixed(2)}</td>
                  <td className="text-right">
                    {isWaiting ? (
                      <span className="text-blue-400">Playing...</span>
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
            
            {players.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  No active bets
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderBoard;
