
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileNav from './MobileNav';

const Layout = () => {
  return (
    <div className="min-h-screen w-full bg-[#0f1621] font-inter text-white">
      <Navbar />
      <main className="w-full px-2 md:px-4 lg:px-6 pt-16 pb-20 md:pb-6 max-w-[1600px] mx-auto">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
