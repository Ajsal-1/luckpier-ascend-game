
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useDeposits } from '@/hooks/use-deposits';

// Import the new components
import DepositForm from '@/components/deposit/DepositForm';
import DepositHistory from '@/components/deposit/DepositHistory';
import DepositInfoSection from '@/components/deposit/DepositInfoSection';
import LoginPrompt from '@/components/deposit/LoginPrompt';

const DepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { pendingDeposits, isLoadingDeposits, fetchPendingDeposits } = useDeposits();

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <div className="container mx-auto py-12 px-4 min-h-[80vh] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj4KICA8cGF0aCBkPSJNNTguNSA0OC41TDU1IDUybDMuNSAzLjVMNTUgNTkgNDguNSA1MS41IDQ1IDU1IDMxIDQxbC0uMjUuMjVjMy4wMiAzIDQuOTIgNi41NSA0Ljk1IDEwLjUuMDMgMy45NS0xLjggNy41LTQuNyAxMC4wNS0yLjkgMi41NS02LjgwNSA0LjAzLTEwLjc1IDQuMkMxNi4wNTUgNjYuMTcgMTIuMyA2NSA5LjI1IDYyLjVzLTUuNDUtNi4wNS02LjItMTBjLS43NS0zLjk1LS4zLTguMDUgMS44LTExLjc1czUuNC02Ljc1IDkuMy04LjI1YzMuOS0xLjUgOC4xLTEuNSAxMi0uMTVMNDEgMThsLTMuNS0zLjVMNDEgMTFsNi41IDYuNUw1MiAxNGwzLjUgMy41TDUyIDIxbC0zLjUtMy41TDM0IDMyYzEuNCAxLjQgMi42NSAyLjk1IDMuNyA0LjYuNSAyLjUuMzUgNS4xNS0uNDUgNy41NUw1MiAzNGwzLjUgMy41TDUyIDQxbDYuNSA3LjV6Ii8+Cjwvc3ZnPgo=')]">
      <div className="max-w-4xl mx-auto backdrop-blur-sm">
        <Button variant="ghost" onClick={() => navigate('/wallet')} className="mb-6 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 -ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Wallet
        </Button>
        
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Deposit Funds</h1>
        
        {/* Deposit Form and History */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-[rgba(19,28,41,0.85)] backdrop-blur-lg border-blue-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-600/30 to-purple-600/30 p-4 rounded-full shadow-inner border border-blue-500/20 relative">
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse"></div>
                  <CreditCard className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Add Funds to Your Account
              </CardTitle>
              <CardDescription className="text-center text-gray-300 mt-2">
                Enter the amount you want to deposit to your LuckPier account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-6 relative z-10">
              <DepositForm onDepositInitiated={fetchPendingDeposits} />
            </CardContent>
            
            <CardFooter className="flex flex-col text-xs text-gray-400 bg-blue-900/20 px-6 py-4 border-t border-blue-500/20 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="h-3 w-3 text-blue-400" />
                <p>Secure payments processed by NOW Payments</p>
              </div>
            </CardFooter>
          </Card>
          
          {/* Recent Deposits */}
          <DepositHistory 
            pendingDeposits={pendingDeposits}
            isLoading={isLoadingDeposits}
            onRefresh={fetchPendingDeposits}
          />
        </div>

        {/* Information Section */}
        <DepositInfoSection />
      </div>
    </div>
  );
};

export default DepositPage;
