
import React from 'react';
import CrashGame from '@/components/game/CrashGame';

const Index = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Provably Fair Crash Game</h1>
      <p className="text-gray-400 mb-4">Join thousands of players who are winning big every day! Our provably fair algorithm ensures complete transparency.</p>
      
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
        <p className="text-amber-400 text-sm font-medium">
          HOW TO PLAY: Place your bet during the countdown. Once the round starts, cash out before it crashes to multiply your bet! Thousands of players are winning big every hour!
        </p>
      </div>
      
      <CrashGame />
    </div>
  );
};

export default Index;
