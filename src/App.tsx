import './App.css'
import Header from './components/Header';
import GameCanvas from './components/GameCanvas';

function App() {

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <GameCanvas />
      </main>
    </div>
  );
}

export default App
