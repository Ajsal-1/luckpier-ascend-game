
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

// Define form validation schema
const withdrawalFormSchema = z.object({
  network: z.string().min(1, { message: 'Please select a network' }),
  wallet_address: z.string().min(10, { message: 'Please enter a valid wallet address' }),
  amount: z.coerce
    .number()
    .min(10, { message: 'Minimum withdrawal is $10' })
    .refine((val) => val > 0, { message: 'Amount must be greater than 0' })
});

type WithdrawalFormValues = z.infer<typeof withdrawalFormSchema>;

type WithdrawalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
};

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, currentBalance }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshWalletBalance } = useAuth();
  
  // Initialize form with default values
  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      network: '',
      wallet_address: '',
      amount: 10
    }
  });

  // Handle form submission
  const onSubmit = async (values: WithdrawalFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Check if amount is more than available balance
      if (values.amount > currentBalance) {
        toast.error('Insufficient balance for this withdrawal');
        return;
      }

      if (!user) {
        toast.error('You must be logged in to withdraw funds');
        return;
      }

      // Create withdrawal request
      const { error } = await supabase.from('pending_deposits').insert({
        username: user.email?.split('@')[0] || 'user',
        amount: -values.amount, // Negative to represent withdrawal
        user_id: user.id,
        status: 'pending_withdrawal',
        network: values.network,
        wallet_address: values.wallet_address
      });

      if (error) {
        console.error('Error creating withdrawal request:', error);
        toast.error('Failed to process withdrawal. Please try again.');
        return;
      }

      // Update user balance (subtract the amount)
      const { error: balanceError } = await supabase
        .functions.invoke("update_user_balance", {
          body: { 
            user_id: user.id, 
            delta_amount: -values.amount // Negative amount for withdrawal
          }
        });

      if (balanceError) {
        console.error('Error updating balance:', balanceError);
        toast.error('Failed to update balance. Please contact support.');
        return;
      }

      // Refresh wallet balance
      await refreshWalletBalance();
      
      toast.success('Withdrawal request submitted successfully! It will be processed within 24 hours.');
      form.reset();
      onClose();
      
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-[#131c29] to-[#192336] border-blue-500/20 text-white max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Withdraw Funds
          </DialogTitle>
          <DialogDescription className="text-center text-gray-300">
            Enter your withdrawal details below
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="network"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Network</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-[#0d1420] border-blue-500/20 focus:border-blue-400/40 py-6">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#0d1420] border-blue-500/20">
                      <SelectItem value="ethereum">Ethereum (ETH)</SelectItem>
                      <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="solana">Solana (SOL)</SelectItem>
                      <SelectItem value="tron">Tron (TRX)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wallet_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200">Wallet Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your wallet address"
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
                  <FormLabel className="text-gray-200">Amount (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">$</span>
                      <Input
                        type="number"
                        placeholder="10"
                        className="pl-7 py-6 bg-[#0d1420] border-blue-500/20 focus:border-blue-400/40"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-blue-300 mt-1">
                    Available balance: ${currentBalance.toFixed(2)}
                  </p>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit Withdrawal Request'
                )}
              </Button>
            </div>
          </form>
        </Form>
        
        <div className="text-xs text-center text-gray-400 mt-2">
          Withdrawals are typically processed within 24 hours.
          <br />
          Minimum withdrawal amount is $10.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalModal;
