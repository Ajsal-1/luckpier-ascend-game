
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Settings, TrendingUp } from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: null,
    },
    {
      name: 'My Bets',
      path: '/my-bets',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      name: 'Wallet',
      path: '/wallet',
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-full bg-gray-900/80 backdrop-blur-md border-b border-gray-800 fixed top-0 left-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-luckpier-blue">Luckpier</span>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'text-luckpier-blue font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.icon && item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center">
            <div className="text-white bg-gradient-blue px-4 py-1.5 rounded-lg font-medium">
              $10,000.00
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
