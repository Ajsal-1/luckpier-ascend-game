
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { DollarSign, ArrowLeft, CreditCard, RefreshCw, Loader2, CheckCircle, AlertCircle, Wallet, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

// Define form validation schema
const depositFormSchema = z.object({
  amount: z.coerce.number().min(10, {
    message: 'Minimum deposit is $10.'
  }).max(10000, {
    message: 'Maximum deposit is $10,000.'
  })
});
type DepositFormValues = z.infer<typeof depositFormSchema>;

const DepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshWalletBalance } = useAuth();
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form
  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: 100
    }
  });

  // Fetch pending deposits
  const fetchPendingDeposits = async () => {
    if (!user) return;
    
    setIsLoadingDeposits(true);
    try {
      const { data, error } = await supabase
        .from('pending_deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPendingDeposits(data || []);
    } catch (err) {
      console.error('Error fetching deposits:', err);
      toast.error('Failed to load deposit history');
    } finally {
      setIsLoadingDeposits(false);
    }
  };

  // Set up auto refresh
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingDeposits();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchPendingDeposits();
        refreshWalletBalance();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Handle form submission
  const onSubmit = async (values: DepositFormValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      if (!isAuthenticated || !user) {
        toast.error('You must be logged in to make a deposit');
        return;
      }

      // Get user profile to get username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setErrorMessage('Could not fetch your profile information');
        toast.error('Could not fetch your profile information');
        return;
      }
      
      // Generate order ID
      const orderId = `LP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Save to pending_deposits table
      const { error } = await supabase.from('pending_deposits').insert({
        username: profile?.username || user.email,
        amount: values.amount,
        user_id: user.id,
        status: 'pending',
        order_id: orderId
      });
      
      if (error) {
        console.error('Error saving deposit:', error);
        setErrorMessage(`Failed to initiate deposit: ${error.message}`);
        toast.error(`Failed to initiate deposit: ${error.message}`);
        return;
      }
      
      toast.success('Redirecting to payment page...');
      
      // Refresh the deposits list
      fetchPendingDeposits();

      // Short delay to ensure toast is seen before redirecting
      setTimeout(() => {
        // Redirect to payment page with order ID
        window.location.href = `https://nowpayments.io/pos-terminal/luckpier?pay_amount=${values.amount}&order_id=${orderId}`;
      }, 1500);
      
    } catch (err: any) {
      console.error('Deposit error:', err);
      setErrorMessage(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    switch(status) {
      case 'pending':
        return (
          <div className="flex items-center text-amber-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            <span>Pending</span>
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex items-center text-emerald-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            <span>Confirmed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            <span>{status}</span>
          </div>
        );
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-12 px-4 min-h-[80vh] flex items-center justify-center">
        <Card className="bg-gradient-to-br from-[#131c29] to-[#192336] border-blue-500/20 shadow-xl w-full max-w-md">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              Please Sign In
            </CardTitle>
            <CardDescription className="text-center">
              You need to be logged in to make deposits
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={() => navigate('/wallet')}
            >
              Go to Wallet
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 min-h-[80vh] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj4KICA8cGF0aCBkPSJNNTguNSA0OC41TDU1IDUybDMuNSAzLjVMNTUgNTkgNDguNSA1MS41IDQ1IDU1IDMxIDQxbC0uMjUuMjVjMy4wMiAzIDQuOTIgNi41NSA0Ljk1IDEwLjUuMDMgMy45NS0xLjggNy41LTQuNyAxMC4wNS0yLjkgMi41NS02LjgwNSA0LjAzLTEwLjc1IDQuMkMxNi4wNTUgNjYuMTcgMTIuMyA2NSA5LjI1IDYyLjVzLTUuNDUtNi4wNS02LjItMTBjLS43NS0zLjk1LS4zLTguMDUgMS44LTExLjc1czUuNC02Ljc1IDkuMy04LjI1YzMuOS0xLjUgOC4xLTEuNSAxMi0uMTVMNDEgMThsLTMuNS0zLjVMNDEgMTFsNi41IDYuNUw1MiAxNGwzLjUgMy41TDUyIDIxbC0zLjUtMy41TDM0IDMyYzEuNCAxLjQgMi42NSAyLjk1IDMuNyA0LjYuNSAyLjUuMzUgNS4xNS0uNDUgNy41NUw1MiAzNGwzLjUgMy41TDUyIDQxbDYuNSA3LjV6Ii8+Cjwvc3ZnPgo=')]">
      <div className="max-w-4xl mx-auto backdrop-blur-sm">
        <Button variant="ghost" onClick={() => navigate('/wallet')} className="mb-6 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 -ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Wallet
        </Button>
        
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Deposit Funds</h1>
        
        {/* Deposit Form */}
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
              {errorMessage && (
                <div className="bg-red-900/30 border border-red-500/30 px-4 py-3 rounded-lg mb-4 text-red-300 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="bg-blue-900/20 px-5 py-4 rounded-lg border border-blue-500/20 mb-5 backdrop-blur-md">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-500/30 flex items-center justify-center mr-3">
                        <Wallet className="h-4 w-4 text-blue-300" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-300 font-medium">LOGGED IN AS</p>
                        <p className="text-sm font-semibold text-white">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200 font-medium">Amount in USD</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-bold">$</span>
                            <Input 
                              type="number" 
                              placeholder="100" 
                              className="pl-8 py-6 bg-white text-gray-800 border-blue-500/30 focus-visible:ring-blue-500/50 text-xl font-semibold tracking-wide rounded-lg shadow-inner" 
                              {...field} 
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                              {[50, 100, 500].map((amount) => (
                                <button 
                                  key={amount}
                                  type="button"
                                  className="text-xs px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded border border-blue-500/30"
                                  onClick={() => form.setValue('amount', amount)}
                                >
                                  ${amount}
                                </button>
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  /> 
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full py-7 text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 border-none transition-all duration-300 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 rounded-lg font-medium"
                      disabled={isLoading || form.formState.isSubmitting}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <>Continue to Payment</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex flex-col text-xs text-gray-400 bg-blue-900/20 px-6 py-4 border-t border-blue-500/20 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-3 w-3 text-blue-400" />
                <p>Secure payments processed by NOW Payments</p>
              </div>
            </CardFooter>
          </Card>
          
          {/* Recent Deposits */}
          <Card className="bg-[rgba(19,28,41,0.85)] backdrop-blur-lg border-blue-500/20 shadow-xl h-fit relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-70"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.1),transparent_70%)]"></div>
            
            <CardHeader className="pb-3 relative z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                    <History className="h-3 w-3 text-blue-300" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">Recent Deposits</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-blue-500/20" 
                  onClick={fetchPendingDeposits}
                  disabled={isLoadingDeposits}
                >
                  {isLoadingDeposits ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  ) : (
                    <RefreshCw className="h-4 w-4 text-blue-400 hover:text-blue-300" />
                  )}
                </Button>
              </div>
              <CardDescription className="text-gray-400 mt-1">
                Your deposit history
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 relative z-10">
              {pendingDeposits.length > 0 ? (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-xs text-blue-300 font-medium">Amount</TableHead>
                        <TableHead className="text-xs text-blue-300 font-medium">Status</TableHead>
                        <TableHead className="text-xs text-blue-300 font-medium">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDeposits.map((deposit) => (
                        <TableRow key={deposit.id} className="border-gray-800/50 hover:bg-blue-900/10">
                          <TableCell className="text-sm font-medium text-white">${deposit.amount}</TableCell>
                          <TableCell className="text-xs">{formatStatus(deposit.status)}</TableCell>
                          <TableCell className="text-xs text-gray-400">{formatDate(deposit.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 px-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-900/30 mb-4">
                    <History className="h-6 w-6 text-blue-300 opacity-70" />
                  </div>
                  <p className="text-gray-300 mb-1 font-medium">No deposit history</p>
                  <p className="text-xs text-gray-400">Your recent deposits will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <Card className="bg-[rgba(19,28,41,0.75)] backdrop-blur-sm border-blue-500/10 shadow-xl mt-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_70%)]"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <DollarSign className="h-3 w-3 text-blue-300" />
              </div>
              How Deposits Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium">1</div>
                  <p>Enter the amount you want to deposit and click "Continue to Payment"</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium">2</div>
                  <p>You'll be redirected to our payment processor where you can complete your payment</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium">3</div>
                  <p>Once payment is confirmed, your balance will update automatically</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium">4</div>
                  <p>The process typically takes just a few minutes, but may take longer depending on the payment method</p>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
              <p className="text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                <span>Need help? Contact our support team at <a href="mailto:support@luckpier.com" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">support@luckpier.com</a></span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepositPage;
