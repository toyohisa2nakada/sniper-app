export default function Header() {
    return (
        <header className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 border-b border-slate-700">
            <h1 className="text-xl font-bold tracking-widest">SNIPER</h1>
            <div className="flex gap-6 text-sm font-mono text-right">
                <div>HITS: <span className="text-yellow-400">0</span></div>
                <div>BULLETS: <span className="text-red-400">10</span></div>
            </div>
        </header>
    );
}