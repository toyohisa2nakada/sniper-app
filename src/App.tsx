import './App.css'
import { useRef } from 'react';
import Header, { type HeaderHandle } from './components/Header';
import { type GameState } from './models/game';
import GameCanvas from './components/GameCanvas';

function App() {
  const headerHandleRef = useRef<HeaderHandle>(null)
  function onGameStateChange(gameState: GameState) {
    headerHandleRef.current?.updateGameState(gameState);
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
      <Header ref={headerHandleRef} />
      <main className="flex-1 flex items-center justify-center p-4">
        <GameCanvas onGameStateChange={onGameStateChange} />
      </main>
    </div>
  );
}

export default App
