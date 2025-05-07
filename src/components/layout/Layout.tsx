
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileNav from './MobileNav';

const Layout = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <Navbar />
      <main className="w-full px-0 pt-20 pb-20 md:pb-8">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
