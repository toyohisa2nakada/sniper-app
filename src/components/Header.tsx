import { useImperativeHandle, forwardRef, useRef } from 'react';
import type { GameState } from '../models/game';

export interface HeaderHandle {
    updateGameState: (gameState: GameState) => void;
}

export const Header = forwardRef<HeaderHandle>((_, ref) => {
    const hitCountRef = useRef<HTMLSpanElement>(null);
    const remainingBulletsRef = useRef<HTMLSpanElement>(null);
    useImperativeHandle(ref, () => ({
        updateGameState: (gameState: GameState) => {
            if(!hitCountRef.current || !remainingBulletsRef.current){
                return;
            }
            hitCountRef.current.textContent = gameState.hitCount.toString();
            remainingBulletsRef.current.textContent = gameState.remainingBullets.toString();
            return;
        }
    }));
    return (
        <header className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 border-b border-slate-700">
            <h1 className="text-xl font-bold tracking-widest">SNIPER</h1>
            <div className="flex gap-6 text-sm font-mono text-right">
                <div>HITS: <span ref={hitCountRef} className="text-yellow-400">0</span></div>
                <div>BULLETS: <span ref={remainingBulletsRef} className="text-red-400">10</span></div>
            </div>
        </header>
    );
});
Header.displayName = 'Header';
export default Header;