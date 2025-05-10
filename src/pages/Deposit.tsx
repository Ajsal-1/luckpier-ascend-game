
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';

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
    <div className="container mx-auto py-8 px-4">
      <Card className="bg-[#131c29] border-gray-800/40 max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-500/20 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-center">Deposit to LuckPier</CardTitle>
          <CardDescription className="text-center">
            Enter your LuckPier username and the amount you want to deposit.
            After confirming, you'll be redirected to the payment page.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your LuckPier username" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount in USD</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          className="pl-7" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full mt-4"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Processing...' : 'Continue to Payment'}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col text-xs text-gray-400">
          <p>Once payment is received, your balance will update automatically.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DepositPage;
