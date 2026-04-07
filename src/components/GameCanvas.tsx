import { useEffect, useRef } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import type { Enemy, Bullet, GameState } from '../models/game';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../models/game';

interface GameCanvasProps {
    onGameStateChange: (gameState: GameState) => void;
}

export default function GameCanvas({ onGameStateChange }: GameCanvasProps) {
    const gameState: GameState = { hitCount: 0, remainingBullets: 20 };
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const enemiesRef = useRef<Enemy[]>([
        {
            id: 'enemy-1',
            x: 0,
            y: 150,
            vx: 0.1,
            vy: 0,
            size: 10,
            color: 'green',
        }
    ]);
    const bulletsRef = useRef<Bullet[]>([]);
    const sniperPos = { x: SCREEN_WIDTH / 2, y: Math.floor(SCREEN_HEIGHT * 4 / 5) };

    useGameLoop((dt) => {
        updateGame(dt);
        drawGame();
    });

    const updateGame = (dt: number) => {
        enemiesRef.current.forEach(enemy => {
            enemy.x += enemy.vx * dt;
            enemy.y += enemy.vy * dt;
            if (enemy.x > SCREEN_WIDTH - enemy.size) {
                enemy.x = SCREEN_WIDTH - enemy.size;
                enemy.vx *= -1;
            }
            if (enemy.x < enemy.size) {
                enemy.x = enemy.size;
                enemy.vx *= -1;
            }
        });
        bulletsRef.current.forEach(bullet => {
            bullet.x += Math.cos(bullet.direction) * bullet.speed * dt;
            bullet.y += Math.sin(bullet.direction) * bullet.speed * dt;
        });

        bulletsRef.current = bulletsRef.current.filter(bullet => {
            const isOut = bullet.y < 0 || bullet.y > SCREEN_HEIGHT || bullet.x < 0 || bullet.x > SCREEN_WIDTH;
            if (isOut) return false;

            const hitEnemy = enemiesRef.current.find(enemy => {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < bullet.size + enemy.size;
            });
            if (hitEnemy) {
                gameState.hitCount += 1;
                onGameStateChange(gameState);
                hitEnemy.color = 'red';
                return false;
            }
            return true;
        });
    };
    const drawGame = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        enemiesRef.current.forEach(enemy => {
            const { x, y, size, color } = enemy;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        });

        bulletsRef.current.forEach(bullet => {
            const { x, y, size } = bullet;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            ctx.closePath();
        });

        ctx.beginPath();
        ctx.arc(sniperPos.x, sniperPos.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                bulletsRef.current.push({
                    id: Math.random().toString(),
                    x: sniperPos.x,
                    y: sniperPos.y,
                    direction: -Math.PI / 2,
                    speed: 0.3,
                    size: 3,
                });
                gameState.remainingBullets -= 1;
                onGameStateChange(gameState);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        onGameStateChange(gameState);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [])

    return (
        <canvas
            ref={canvasRef}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            className="bg-black w-full max-w-[360px] aspect-[9/16] shadow-2xl touch-none border border-slate-700"
        />
    );
}