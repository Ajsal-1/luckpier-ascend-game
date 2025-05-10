
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, Info, Loader2, RefreshCw, Wallet as WalletIcon, Clock } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';

const Wallet = () => {
  const { isAuthenticated, wallet, refreshWalletBalance } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await refreshWalletBalance();
    setIsRefreshing(false);
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
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Transaction History
                </h3>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800/40">
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-2">Transaction history will be available soon</p>
                  <p className="text-xs text-gray-500">We're working on this feature</p>
                </div>
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
              disabled
            >
              <span>Withdraw Funds</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardContent>
          <CardFooter className="flex items-center justify-center text-xs text-gray-400 bg-gray-800/20 rounded-b-lg py-3">
            <Info className="h-3 w-3 mr-1" />
            <span>Withdraw functionality coming soon</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
