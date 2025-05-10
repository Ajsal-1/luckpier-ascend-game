
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { DollarSign, ArrowLeft, CreditCard, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
        toast.error('Could not fetch your profile information');
        return;
      }
      
      // Save to pending_deposits table
      const { error } = await supabase.from('pending_deposits').insert({
        username: profile?.username || user.email,
        amount: values.amount,
        user_id: user.id,
        status: 'pending'
      });
      
      if (error) {
        console.error('Error saving deposit:', error);
        toast.error('Failed to initiate deposit. Please try again.');
        return;
      }
      
      toast.success('Redirecting to payment page...');
      
      // Refresh the deposits list
      fetchPendingDeposits();

      // Redirect to payment page
      window.location.href = `https://nowpayments.io/pos-terminal/luckpier?pay_amount=${values.amount}`;
    } catch (err) {
      console.error('Deposit error:', err);
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
          <div className="flex items-center text-yellow-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            <span>Pending</span>
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex items-center text-green-500">
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
    <div className="container mx-auto py-12 px-4 min-h-[80vh]">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/wallet')} className="mb-6 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 -ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Wallet
        </Button>
        
        {/* Deposit Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-[#131c29] to-[#192336] border-blue-500/20 shadow-xl md:col-span-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            
            <CardHeader className="pb-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-tr from-blue-600/30 to-purple-600/30 p-4 rounded-full shadow-inner border border-blue-500/20">
                  <CreditCard className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Deposit Funds
              </CardTitle>
              <CardDescription className="text-center text-gray-300 mt-2">
                Enter the amount you want to deposit to your LuckPier account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="bg-blue-900/20 px-4 py-3 rounded-lg border border-blue-500/20 mb-5">
                    <p className="text-sm text-gray-300">
                      Logged in as: <span className="font-semibold text-white">{user?.email}</span>
                    </p>
                  </div>
                  
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Amount in USD</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">$</span>
                          <Input 
                            type="number" 
                            placeholder="100" 
                            className="pl-7 border-blue-500/20 focus:border-blue-400/40 py-6 bg-[#0d1420]" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )} />
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-none transition-all duration-300 shadow-lg hover:shadow-blue-900/30" 
                      disabled={isLoading || form.formState.isSubmitting}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Continue to Payment</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex flex-col text-xs text-gray-400 bg-blue-900/10 px-6 py-4 border-t border-blue-500/10">
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-3 w-3 text-blue-400" />
                <p>Secure payments processed by NowPayments</p>
              </div>
            </CardFooter>
          </Card>
          
          {/* Recent Deposits */}
          <Card className="bg-gradient-to-br from-[#131c29] to-[#192336] border-gray-800/40 shadow-xl h-fit">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-bold text-white">Recent Deposits</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={fetchPendingDeposits}
                  disabled={isLoadingDeposits}
                >
                  {isLoadingDeposits ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <CardDescription className="text-gray-400">
                Your deposit history
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {pendingDeposits.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-xs text-gray-400">Amount</TableHead>
                        <TableHead className="text-xs text-gray-400">Status</TableHead>
                        <TableHead className="text-xs text-gray-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDeposits.map((deposit) => (
                        <TableRow key={deposit.id} className="border-gray-800">
                          <TableCell className="text-sm font-medium">${deposit.amount}</TableCell>
                          <TableCell className="text-xs">{formatStatus(deposit.status)}</TableCell>
                          <TableCell className="text-xs text-gray-400">{formatDate(deposit.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-2">No deposit history</p>
                  <p className="text-xs">Your recent deposits will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <Card className="bg-gradient-to-br from-[#131c29] to-[#192336] border-gray-800/40 shadow-xl mt-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">How Deposits Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <p>1. Enter the amount you want to deposit and click "Continue to Payment"</p>
            <p>2. You'll be redirected to our payment processor where you can complete your payment</p>
            <p>3. Once payment is confirmed, your balance will update automatically</p>
            <p>4. The process typically takes just a few minutes, but may take longer depending on the payment method</p>
            <p className="text-sm text-gray-400 mt-4">
              Need help? Contact our support team at support@luckpier.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepositPage;
