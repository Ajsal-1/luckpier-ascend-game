
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the context types
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOtp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  wallet: {
    balance: number;
    loading: boolean;
  };
  refreshWalletBalance: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cleanup auth state helper
const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({ balance: 0, loading: true });

  // Fetch wallet balance
  const fetchWalletBalance = async (userId: string) => {
    try {
      setWallet(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching wallet:', error);
        return;
      }
      
      if (data) {
        setWallet({
          balance: data.balance,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error in fetchWalletBalance:', error);
    } finally {
      setWallet(prev => ({ ...prev, loading: false }));
    }
  };

  // Refresh wallet balance
  const refreshWalletBalance = async () => {
    if (user) {
      await fetchWalletBalance(user.id);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      // Clean up existing state first
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      const { error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      toast.success('Verification email sent! Check your inbox.', { position: 'top-center' });
    } catch (error: any) {
      toast.error(`Sign up error: ${error.message}`, { position: 'top-center' });
      throw error;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing state first
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      toast.success('Logged in successfully!', { position: 'top-center' });
    } catch (error: any) {
      toast.error(`Login error: ${error.message}`, { position: 'top-center' });
      throw error;
    }
  };

  // Sign in with magic link
  const signInWithOtp = async (email: string) => {
    try {
      // Clean up existing state first
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      const { error } = await supabase.auth.signInWithOtp({ 
        email
      });
      
      if (error) throw error;
      
      toast.success('Magic link sent! Check your email.', { position: 'top-center' });
    } catch (error: any) {
      toast.error(`Login error: ${error.message}`, { position: 'top-center' });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Clean up auth state
      cleanupAuthState();
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) throw error;
      
      // Reset wallet
      setWallet({ balance: 0, loading: false });
      
      toast.success('Logged out successfully!', { position: 'top-center' });
    } catch (error: any) {
      toast.error(`Logout error: ${error.message}`, { position: 'top-center' });
    }
  };

  // Initialize auth state & set up listener
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            // If we have a user and session, fetch their wallet
            if (event === 'SIGNED_IN' && newSession?.user) {
              // Use setTimeout to prevent deadlocks
              setTimeout(() => {
                fetchWalletBalance(newSession.user.id);
              }, 0);
            }
          }
        );
        
        // THEN check for existing session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // If we have a session, fetch wallet
        if (currentSession?.user) {
          await fetchWalletBalance(currentSession.user.id);
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Prepare the context value
  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithOtp,
    signOut,
    wallet,
    refreshWalletBalance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
