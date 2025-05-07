
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Settings, TrendingUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const Navbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const navItems = [{
    name: 'Home',
    path: '/',
    icon: null
  }, {
    name: 'My Bets',
    path: '/my-bets',
    icon: <TrendingUp className="w-4 h-4" />
  }, {
    name: 'Wallet',
    path: '/wallet',
    icon: <Wallet className="w-4 h-4" />
  }, {
    name: 'Settings',
    path: '/settings',
    icon: <Settings className="w-4 h-4" />
  }];
  
  return <div className="w-full bg-[#050A3A] backdrop-blur-md border-b border-gray-800/50 fixed top-0 left-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex justify-between items-center h-16 bg-[#050A3A]">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/15ec73a8-3b8d-4601-b910-7fc23b9933a2.png" 
                alt="Luckpier LP" 
                className="h-8 sm:h-9 md:h-10 object-contain" 
              />
              <img 
                src="/lovable-uploads/7f3111c9-56fc-4534-9f51-fb533255647f.png" 
                alt="Luckpier" 
                className={`h-7 sm:h-9 md:h-11 ml-2 sm:ml-3 object-contain ${isMobile ? 'max-w-[160px]' : ''}`}
              />
            </div>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            {navItems.map(item => <Link key={item.path} to={item.path} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-colors ${location.pathname === item.path ? 'text-luckpier-gold font-medium bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                {item.icon && <span>{item.icon}</span>}
                <span>{item.name}</span>
              </Link>)}
          </nav>
          
          <div className="flex items-center">
            <div className="text-white bg-[#1c2533] px-4 py-1.5 rounded font-medium border border-gray-700/30">
              <span className="text-gray-400 mr-1">$</span>10,000.00
            </div>
          </div>
        </div>
      </div>
    </div>;
};

export default Navbar;
