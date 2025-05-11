
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { DollarSign, Loader2, AlertCircle, Wallet } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Define form validation schema
const depositFormSchema = z.object({
  amount: z.coerce.number().min(10, {
    message: 'Minimum deposit is $10.'
  }).max(10000, {
    message: 'Maximum deposit is $10,000.'
  })
});

export type DepositFormValues = z.infer<typeof depositFormSchema>;

interface DepositFormProps {
  onDepositInitiated: () => void;
}

const DepositForm: React.FC<DepositFormProps> = ({ onDepositInitiated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: 100
    }
  });

  // Handle form submission
  const onSubmit = async (values: DepositFormValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      if (!user) {
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
      
      // Call the callback to refresh deposits list
      onDepositInitiated();

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {errorMessage && (
          <div className="bg-red-900/30 border border-red-500/30 px-4 py-3 rounded-lg mb-4 text-red-300 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
        
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
  );
};

export default DepositForm;
