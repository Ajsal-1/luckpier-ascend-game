
import React from 'react';

interface Player {
  id: string;
  name: string;
  amount: number;
  multiplier: number | null;
}

interface LeaderboardProps {
  players: Player[];
}

const LeaderBoard: React.FC<LeaderboardProps> = ({ players }) => {
  return (
    <div className="card-glass p-4 w-full animate-fade-in overflow-hidden">
      <h2 className="text-lg font-medium mb-3">Live Bets</h2>
      
      <div className="overflow-y-auto max-h-[300px] pr-1 -mr-1">
        <table className="w-full">
          <thead className="text-gray-400 text-xs">
            <tr className="border-b border-gray-800">
              <th className="py-2 text-left">Player</th>
              <th className="py-2 text-right">Bet Amount</th>
              <th className="py-2 text-right">Multiplier</th>
              <th className="py-2 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {players.map((player) => {
              const profit = player.multiplier ? (player.amount * player.multiplier) - player.amount : 0;
              const isWaiting = player.multiplier === null;
              
              return (
                <tr 
                  key={player.id} 
                  className="hover:bg-white/5 transition-colors text-sm animate-slide-up"
                >
                  <td className="py-3 truncate max-w-[100px]">{player.name}</td>
                  <td className="py-3 text-right">${player.amount.toFixed(2)}</td>
                  <td className="py-3 text-right">
                    {isWaiting ? (
                      <span className="text-luckpier-blue">Playing...</span>
                    ) : (
                      <span className={profit > 0 ? "text-green-400" : "text-red-400"}>
                        {player.multiplier?.toFixed(2)}x
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {isWaiting ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      <span className={profit > 0 ? "text-green-400" : "text-red-400"}>
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
