import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export default function AuthModal({
  isOpen,
  onClose
}: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const {
    signIn,
    signUp,
    signInWithOtp
  } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (activeTab === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleMagicLink = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      await signInWithOtp(email);
      onClose();
    } catch (error) {
      console.error('Magic link error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#131c29] border-gray-800/40">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-50">
            {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'login' ? 'Sign in to access your account and place bets.' : 'Sign up to start playing and get 1,000 free credits!'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'login' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0a121f]">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email</Label>
                <Input id="email-login" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} required className="border-gray-800/40 bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Password</Label>
                <Input id="password-login" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} required className="border-gray-800/40 bg-slate-50" />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-[#ffc600]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Login
              </Button>
              <div className="text-center">
                <Button variant="link" size="sm" type="button" onClick={handleMagicLink} disabled={isLoading || !email} className="bg-slate-50">
                  Send magic link instead
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input id="email-signup" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} required className="border-gray-800/40 bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Password</Label>
                <Input id="password-signup" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} required minLength={6} className="bg-[#0a121f] border-gray-800/40" />
                <p className="text-xs text-gray-400">Password must be at least 6 characters</p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-center">
          <p className="text-xs text-center text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}