
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeposits = () => {
  const { user, isAuthenticated, refreshWalletBalance } = useAuth();
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [isLoadingDeposits, setIsLoadingDeposits] = useState(false);

  // Fetch pending deposits
  const fetchPendingDeposits = useCallback(async () => {
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
  }, [user]);

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
  }, [fetchPendingDeposits, isAuthenticated, refreshWalletBalance]);

  return {
    pendingDeposits,
    isLoadingDeposits,
    fetchPendingDeposits,
    refreshWalletBalance
  };
};
