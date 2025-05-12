
import React from 'react';
import CrashGame from '@/components/game/CrashGame';

const Index = () => {
  return <div className="container mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Provably Fair Crash Game</h1>
      <p className="text-gray-400 mb-6">Place your bets, watch the multiplier rise, and cash out before it crashes! The crash point is determined before each round starts.</p>
      <p className="text-amber-400 mb-6 text-sm font-medium">HOW TO PLAY: Place a bet during the 10-second countdown. Once the round starts, cash out before it crashes to win!</p>
      <CrashGame />
    </div>;
};

export default Index;
