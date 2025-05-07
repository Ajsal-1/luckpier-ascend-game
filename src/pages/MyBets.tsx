
import React from 'react';

// Types
interface BetHistoryItem {
  id: string;
  date: string;
  betAmount: number;
  multiplier: number;
  profit: number;
  status: 'won' | 'lost';
}

// Generate sample bet history data
const generateBetHistory = (): BetHistoryItem[] => {
  const history: BetHistoryItem[] = [];
  
  for (let i = 0; i < 20; i++) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * Math.floor(Math.random() * 60));
    
    const betAmount = Math.floor(Math.random() * 1000) / 100 + 10;
    const multiplier = i % 3 === 0 
      ? Math.floor(Math.random() * 100) / 100 + 1 // Lost (< 2)
      : Math.floor(Math.random() * 700) / 100 + 2; // Won (>= 2)
    
    const status = multiplier >= 2 ? 'won' : 'lost';
    const profit = status === 'won' 
      ? betAmount * (multiplier - 1)
      : -betAmount;
    
    history.push({
      id: `bet-${i}`,
      date: date.toLocaleString(),
      betAmount,
      multiplier,
      profit,
      status,
    });
  }
  
  return history;
};

const MyBets = () => {
  const [betHistory] = React.useState<BetHistoryItem[]>(generateBetHistory());
  
  // Calculate total stats
  const totalBets = betHistory.length;
  const wonBets = betHistory.filter(bet => bet.status === 'won').length;
  const totalProfit = betHistory.reduce((sum, bet) => sum + bet.profit, 0);
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">My Bets</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card-glass p-4">
          <h2 className="text-sm text-gray-400 mb-1">Total Bets</h2>
          <p className="text-2xl font-medium">{totalBets}</p>
        </div>
        
        <div className="card-glass p-4">
          <h2 className="text-sm text-gray-400 mb-1">Win Rate</h2>
          <p className="text-2xl font-medium">{Math.round(wonBets / totalBets * 100)}%</p>
        </div>
        
        <div className="card-glass p-4">
          <h2 className="text-sm text-gray-400 mb-1">Total Profit</h2>
          <p className={`text-2xl font-medium ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="text-left text-gray-400 text-sm">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Bet Amount</th>
                <th className="py-3 px-4 text-right">Multiplier</th>
                <th className="py-3 px-4 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {betHistory.map((bet) => (
                <tr key={bet.id} className="hover:bg-white/5">
                  <td className="py-3 px-4">{bet.date}</td>
                  <td className="py-3 px-4 text-right">${bet.betAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">{bet.multiplier.toFixed(2)}x</td>
                  <td className={`py-3 px-4 text-right ${bet.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {bet.profit >= 0 ? '+' : ''}{bet.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyBets;
