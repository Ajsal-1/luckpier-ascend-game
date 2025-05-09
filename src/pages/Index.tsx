
import React from 'react';
import CrashGame from '@/components/game/CrashGame';

// Home page (Crash Game)
const Index = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">LuckPier Crash Game</h1>
      <CrashGame />
    </div>
  );
};

export default Index;
