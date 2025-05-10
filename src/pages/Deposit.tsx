
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { DollarSign, ArrowLeft, CreditCard } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

// Define form validation schema
const depositFormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
  amount: z.coerce.number()
    .min(10, { message: 'Minimum deposit is $10.' })
    .max(10000, { message: 'Maximum deposit is $10,000.' })
});

type DepositFormValues = z.infer<typeof depositFormSchema>;

const DepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Initialize form
  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      username: '',
      amount: 100,
    },
  });

  // Handle form submission
  const onSubmit = async (values: DepositFormValues) => {
    try {
      if (!isAuthenticated || !user) {
        toast.error('You must be logged in to make a deposit');
        return;
      }
      
      // Save to pending_deposits table
      const { error } = await supabase.from('pending_deposits').insert({
        username: values.username,
        amount: values.amount,
        user_id: user.id
      });
      
      if (error) {
        console.error('Error saving deposit:', error);
        toast.error('Failed to initiate deposit. Please try again.');
        return;
      }
      
      toast.success('Redirecting to payment page...');
      
      // Redirect to payment page
      window.location.href = 'https://nowpayments.io/pos-terminal/luckpier';
      
    } catch (err) {
      console.error('Deposit error:', err);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/wallet')}
          className="mb-6 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 -ml-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Wallet
        </Button>
        
        <Card className="bg-gradient-to-br from-[#131c29] to-[#192336] border-blue-500/20 shadow-xl overflow-hidden">
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
              Enter your details below to add funds to your LuckPier account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your LuckPier username" 
                          className="bg-[#0d1420] border-blue-500/20 focus:border-blue-400/40 py-6"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Amount in USD</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">$</span>
                          <Input 
                            type="number" 
                            placeholder="100" 
                            className="pl-7 bg-[#0d1420] border-blue-500/20 focus:border-blue-400/40 py-6" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-none transition-all duration-300 shadow-lg hover:shadow-blue-900/30"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>Processing...</>
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
      </div>
    </div>
  );
};

export default DepositPage;
