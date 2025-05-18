
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Settings, TrendingUp, DollarSign } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';

export const Navbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const {
    isAuthenticated,
    signOut,
    wallet
  } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: null
    },
    {
      name: 'My Bets',
      path: '/my-bets',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      name: 'Wallet',
      path: '/wallet',
      icon: <Wallet className="w-4 h-4" />
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />
    }
  ];

  return (
    <>
      <div className="w-full bg-[#000057] backdrop-blur-md border-b border-gray-800/50 fixed top-0 left-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex justify-between items-center h-16 bg-[#000057]">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center">
                <img src="/lovable-uploads/15ec73a8-3b8d-4601-b910-7fc23b9933a2.png" alt="Luckpier LP" className="h-10 sm:h-12 md:h-14 object-contain" />
                <img src="/lovable-uploads/7f3111c9-56fc-4534-9f51-fb533255647f.png" alt="Luckpier" className={`h-7 sm:h-9 md:h-11 ml-2 sm:ml-3 object-contain ${isMobile ? 'max-w-[160px]' : ''}`} />
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              {navItems.map(item => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${location.pathname === item.path ? 'text-luckpier-gold font-medium bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center bg-gradient-to-r from-blue-900/40 to-indigo-900/40 px-3 py-1.5 rounded-lg font-medium border border-blue-500/20 shadow-sm overflow-hidden group hover:border-blue-400/30 transition-all">
                    <DollarSign className="w-3.5 h-3.5 text-blue-300 mr-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-blue-100 font-medium">
                      {wallet.balance.toFixed(2)}
                    </span>
                  </div>
                  
                  <Button 
                    onClick={() => signOut()} 
                    variant="outline" 
                    size="sm" 
                    className="hidden sm:flex bg-blue-500 hover:bg-blue-400"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    variant="outline" 
                    size="sm" 
                    className="hidden sm:flex bg-[#fef00a]"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    size="sm" 
                    className="hidden sm:flex"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Navbar;
