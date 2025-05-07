
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Settings, TrendingUp, Home } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: <Home className="w-5 h-5" />,
    },
    {
      name: 'My Bets',
      path: '/my-bets',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      name: 'Wallet',
      path: '/wallet',
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a101a]/95 backdrop-blur-md border-t border-gray-800/40 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center space-y-1 w-full h-full ${
              location.pathname === item.path
                ? 'text-luckpier-gold'
                : 'text-gray-400'
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
