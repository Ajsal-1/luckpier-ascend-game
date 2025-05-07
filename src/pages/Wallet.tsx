
import React from 'react';

// Types
interface Transaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdraw' | 'game_win' | 'game_loss';
  amount: number;
  status: 'completed' | 'pending';
}

// Generate sample transaction data
const generateTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  
  for (let i = 0; i < 15; i++) {
    const date = new Date();
    date.setHours(date.getHours() - i * Math.floor(Math.random() * 24));
    
    const types = ['deposit', 'withdraw', 'game_win', 'game_loss'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    const amount = Math.floor(Math.random() * 1000) / 100 + (type === 'deposit' ? 50 : 20);
    const status = i === 0 ? 'pending' : 'completed';
    
    transactions.push({
      id: `txn-${i}`,
      date: date.toLocaleString(),
      type,
      amount,
      status,
    });
  }
  
  return transactions;
};

const Wallet = () => {
  const [transactions] = React.useState<Transaction[]>(generateTransactions());
  const [balance] = React.useState<number>(10000);
  
  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdraw': return 'Withdraw';
      case 'game_win': return 'Game Win';
      case 'game_loss': return 'Game Loss';
    }
  };
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Wallet</h1>
      
      <div className="card-glass p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm text-gray-400 mb-1">Your Balance</h2>
            <p className="text-4xl font-bold">${balance.toFixed(2)}</p>
          </div>
          
          <div className="flex gap-3">
            <button className="primary-button px-6 py-2">Deposit</button>
            <button className="game-button bg-gray-800 text-white hover:bg-gray-700 px-6 py-2">Withdraw</button>
          </div>
        </div>
      </div>
      
      <div className="card-glass overflow-hidden">
        <h2 className="p-4 border-b border-gray-800 font-medium">Transaction History</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="text-left text-gray-400 text-sm">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-white/5">
                  <td className="py-3 px-4">{txn.date}</td>
                  <td className="py-3 px-4">{getTypeLabel(txn.type)}</td>
                  <td className={`py-3 px-4 text-right ${
                    txn.type === 'deposit' || txn.type === 'game_win' 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }`}>
                    {txn.type === 'deposit' || txn.type === 'game_win' ? '+' : '-'}${txn.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      txn.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {txn.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
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

export default Wallet;
