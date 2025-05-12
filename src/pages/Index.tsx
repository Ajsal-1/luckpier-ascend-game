
import React from 'react';
import ProvablyCrashGame from '@/components/game/ProvablyCrashGame';

const Index = () => {
  return <div className="container mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Provably Fair Crash Game</h1>
      <p className="text-gray-400 mb-6">Place your bets during the countdown, watch the multiplier rise, and cash out before it crashes!</p>
      <ProvablyCrashGame />
    </div>;
};

export default Index;
