
import React from 'react';
import CrashGame from '@/components/game/CrashGame';

const Index = () => {
  return <div className="container mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">LuckPier Crash Game</h1>
      <p className="text-gray-400 mb-6">Place your bets, watch the multiplier rise, and cash out before it crashes! Try to predict the perfect moment to secure your winnings.</p>
      <p className="text-amber-400 mb-6 text-sm font-medium">PRO TIP: You can now place bets during the crash countdown AND after a crash while waiting for the next round!</p>
      <CrashGame />
    </div>;
};

export default Index;
