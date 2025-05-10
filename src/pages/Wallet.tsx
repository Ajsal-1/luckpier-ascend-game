
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, Info, Loader2, RefreshCw, Wallet as WalletIcon, Clock, ChevronRight, Calendar, CircleDollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AuthModal from '@/components/auth/AuthModal';
import WithdrawalModal from '@/components/wallet/WithdrawalModal';
import { supabase } from '@/integrations/supabase/client';

const Wallet = () => {
  const { isAuthenticated, wallet, refreshWalletBalance, user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions();
      fetchPendingDeposits();
      
      // Set up auto refresh every 30 seconds
      const interval = setInterval(() => {
        refreshWalletBalance();
        fetchTransactions();
        fetchPendingDeposits();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await refreshWalletBalance();
    await fetchTransactions();
    await fetchPendingDeposits();
    setIsRefreshing(false);
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    setIsLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const fetchPendingDeposits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('pending_deposits')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setPendingDeposits(data || []);
    } catch (err) {
      console.error('Error fetching pending deposits:', err);
    }
  };

  const viewTransactionDetails = (transaction: any) => {
    setTransactionDetails(transaction);
    setIsDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpRight className="h-4 w-4 text-green-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 rotate-180 text-red-400" />;
      default:
        return <CircleDollarSign className="h-4 w-4 text-blue-400" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <Card className="bg-gradient-to-br from-[#131c29] to-[#192336] border-gray-800/40 shadow-xl">
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <WalletIcon className="h-6 w-6 text-blue-400" />
              Your Wallet
            </CardTitle>
            <CardDescription className="text-gray-300 text-base">
              Sign in to access your wallet and manage your funds
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-blue-500/10 p-10 rounded-full mb-6">
              <WalletIcon className="h-12 w-12 text-blue-400" />
            </div>
            <p className="text-gray-300 text-lg mb-6 text-center">
              You need to be signed in to view and manage your wallet
            </p>
            <Button 
              onClick={() => setIsAuthModalOpen(true)}
              className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-500 transition-all"
            >
              Sign In to Access Wallet
            </Button>
          </CardContent>
        </Card>
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-white">My Wallet</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#131c29] to-[#192336] border-gray-800/40 shadow-xl md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <WalletIcon className="h-5 w-5 text-blue-400" />
                  Wallet Balance
                </CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  Your current balance and transaction history
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefreshBalance}
                disabled={isRefreshing}
                className="bg-blue-900/30 hover:bg-blue-800/50 border-blue-700/30"
              >
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 rounded-xl p-8 mb-6 border border-blue-500/20 shadow-lg">
              <div className="text-gray-300 text-sm mb-2 flex items-center gap-1">
                <span>Available Balance</span>
                {wallet.loading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
              </div>
              <div className="text-4xl font-bold flex items-center text-white">
                <span className="text-blue-400 mr-2 text-3xl">$</span>
                {wallet.loading ? '...' : wallet.balance.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 mt-2">Last updated: Just now</div>
              
              {pendingDeposits.length > 0 && (
                <div className="mt-4 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-300 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    You have {pendingDeposits.length} pending deposit{pendingDeposits.length > 1 ? 's' : ''}. 
                    The balance will update automatically once confirmed.
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Transaction History
                </h3>
              </div>
              <div className="bg-[#0d1420] rounded-lg border border-gray-800/40">
                {isLoadingTransactions ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-blue-900/10 border-gray-800">
                          <TableHead className="text-gray-400">Type</TableHead>
                          <TableHead className="text-gray-400">Amount</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Date</TableHead>
                          <TableHead className="text-gray-400"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow 
                            key={transaction.id} 
                            className="hover:bg-blue-900/10 border-gray-800 cursor-pointer"
                            onClick={() => viewTransactionDetails(transaction)}
                          >
                            <TableCell className="font-medium flex items-center gap-2">
                              {getTransactionIcon(transaction.type)}
                              <span className="capitalize">{transaction.type}</span>
                            </TableCell>
                            <TableCell className={transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'}>
                              {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount}
                            </TableCell>
                            <TableCell className={getStatusColor(transaction.status)}>
                              <span className="capitalize">{transaction.status}</span>
                            </TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              {formatDate(transaction.created_at)}
                            </TableCell>
                            <TableCell>
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-2">No transactions found</p>
                    <p className="text-xs text-gray-500">Your transaction history will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#131c29] to-[#192336] border-gray-800/40 shadow-xl h-fit">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Quick Actions</CardTitle>
            <CardDescription className="text-gray-300">
              Manage your funds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/deposit" className="w-full">
              <Button className="w-full justify-between bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-6">
                <span className="font-medium">Deposit Funds</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button 
              className="w-full justify-between py-6 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all" 
              variant="outline" 
              onClick={() => setIsWithdrawalModalOpen(true)}
            >
              <span>Withdraw Funds</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardContent>
          <CardFooter className="flex items-center justify-center text-xs text-white bg-blue-900/20 rounded-b-lg py-3">
            <Info className="h-3 w-3 mr-1 text-blue-400" />
            <span>Withdrawal processed within 24 hours</span>
          </CardFooter>
        </Card>
      </div>
      
      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-[#131c29] border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Transaction Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Details for transaction {transactionDetails?.id?.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {transactionDetails && (
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Transaction Type</span>
                <span className="font-medium capitalize">{transactionDetails.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Amount</span>
                <span className={transactionDetails.type === 'deposit' ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  {transactionDetails.type === 'deposit' ? '+' : '-'}${transactionDetails.amount}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Status</span>
                <span className={getStatusColor(transactionDetails.status)}>
                  {transactionDetails.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-400">Date & Time</span>
                <span className="text-sm">{formatDate(transactionDetails.created_at)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Transaction ID</span>
                <span className="text-xs text-gray-300 font-mono">{transactionDetails.id}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        currentBalance={wallet.balance}
      />
    </div>
  );
};

export default Wallet;
