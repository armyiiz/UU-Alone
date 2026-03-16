import React from 'react';
import GameBoard from './components/GameBoard';

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 text-white select-none">
      <GameBoard />
    </div>
  );
}

export default App;