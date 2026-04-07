import { useEffect, useRef } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import type { GameState } from '../models/game';
import { GAME_CONFIG } from '../models/game';
import { getNextBullet } from '../extentions/agent';

interface GameCanvasProps {
    onGameStateChange: (gameState: GameState) => void;
}

export default function GameCanvas({ onGameStateChange }: GameCanvasProps) {
    const gameState = useRef<GameState>({
        hitCount: 0,
        remainingBullets: GAME_CONFIG.MAX_BULLETS,
        player: {
            x: GAME_CONFIG.PLAYER_INIT_X,
            y: GAME_CONFIG.PLAYER_INIT_Y,
            size: GAME_CONFIG.PLAYER_INIT_SIZE,
            color: GAME_CONFIG.PLAYER_INIT_COLOR,
        },
        enemies: [{
            id: 'enemy-1',
            x: GAME_CONFIG.ENEMY_INIT_X,
            y: GAME_CONFIG.ENEMY_INIT_Y,
            vx: GAME_CONFIG.ENEMY_INIT_VX,
            vy: GAME_CONFIG.ENEMY_INIT_VY,
            size: GAME_CONFIG.ENEMY_INIT_SIZE,
            color: GAME_CONFIG.ENEMY_INIT_COLOR,
        }],
        bullets: [],
    });
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useGameLoop((dt) => {
        updateGame(dt);
        drawGame();
    });

    const updateGame = (dt: number) => {
        gameState.current.enemies.forEach(enemy => {
            enemy.x += enemy.vx * dt;
            enemy.y += enemy.vy * dt;
            if (enemy.x > GAME_CONFIG.SCREEN_WIDTH - enemy.size) {
                enemy.x = GAME_CONFIG.SCREEN_WIDTH - enemy.size;
                enemy.vx *= -1;
            }
            if (enemy.x < enemy.size) {
                enemy.x = enemy.size;
                enemy.vx *= -1;
            }
        });
        gameState.current.bullets.forEach(bullet => {
            bullet.x += Math.cos(bullet.direction) * bullet.speed * dt;
            bullet.y += Math.sin(bullet.direction) * bullet.speed * dt;
        });

        gameState.current.bullets = gameState.current.bullets.filter(bullet => {
            const isOut = bullet.y < 0 || bullet.y > GAME_CONFIG.SCREEN_HEIGHT || bullet.x < 0 || bullet.x > GAME_CONFIG.SCREEN_WIDTH;
            if (isOut) return false;

            const hitEnemy = gameState.current.enemies.find(enemy => {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < bullet.size + enemy.size;
            });
            if (hitEnemy) {
                gameState.current.hitCount += 1;
                onGameStateChange(gameState.current);
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

        gameState.current.enemies.forEach(enemy => {
            const { x, y, size, color } = enemy;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        });

        gameState.current.bullets.forEach(bullet => {
            const { x, y, size, color } = bullet;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        });

        ctx.beginPath();
        ctx.arc(gameState.current.player.x, gameState.current.player.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                gameState.current.bullets.push(getNextBullet(gameState.current));
                gameState.current.remainingBullets -= 1;
                onGameStateChange(gameState.current);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        onGameStateChange(gameState.current);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [])

    return (
        <canvas
            ref={canvasRef}
            width={GAME_CONFIG.SCREEN_WIDTH}
            height={GAME_CONFIG.SCREEN_HEIGHT}
            className="bg-black w-full max-w-[360px] aspect-[9/16] shadow-2xl touch-none border border-slate-700"
        />
    );
}