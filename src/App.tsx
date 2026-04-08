import './App.css'
import GameCanvas from './components/GameCanvas';

function App() {

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
      <GameCanvas />
    </div>
  );
}

export default App
