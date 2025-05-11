
import React from 'react';
import CrashGame from '@/components/game/CrashGame';

// Home page (Crash Game)
const Index = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">LuckPier Multiplayer Crash Game</h1>
      <p className="text-gray-400 mb-4">Play with others in real-time! Bet, watch the multiplier rise, and cash out before it crashes.</p>
      <CrashGame />
    </div>
  );
};

export default Index;
