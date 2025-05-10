import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, Info, Loader2, RefreshCw } from 'lucide-react';
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
      <div className="container mx-auto py-8 px-4">
        <Card className="bg-[#131c29] border-gray-800/40">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Wallet</CardTitle>
            <CardDescription>
              Sign in to access your wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-400 mb-4">
              You need to be signed in to view and manage your wallet
            </p>
            <Button onClick={() => setIsAuthModalOpen(true)}>
              Sign In
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
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#131c29] border-gray-800/40 md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold">Wallet Balance</CardTitle>
                <CardDescription>
                  Your current balance and transaction history
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefreshBalance}
                disabled={isRefreshing}
              >
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 mb-4">
              <div className="text-gray-400 text-sm mb-2">Available Balance</div>
              <div className="text-3xl font-bold flex items-center">
                <span className="text-gray-400 mr-2">$</span>
                {wallet.loading ? '...' : wallet.balance.toFixed(2)}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
              {/* Will be implemented in a future update */}
              <div className="text-center py-8 text-gray-400">
                <p>Transaction history will be available soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#131c29] border-gray-800/40">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
            <CardDescription>
              Manage your funds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/deposit" className="w-full">
              <Button className="w-full justify-between">
                <span>Deposit Funds</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button className="w-full justify-between" variant="outline" disabled>
              <span>Withdraw Funds</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardContent>
          <CardFooter className="flex items-center justify-center text-xs text-gray-400">
            <Info className="h-3 w-3 mr-1" />
            <span>Withdraw functionality coming soon</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
