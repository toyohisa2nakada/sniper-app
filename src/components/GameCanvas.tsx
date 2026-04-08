import { useEffect, useRef, useState } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import type { GameState } from '../models/game';
import { GAME_CONFIG } from '../models/game';
import { getNextBullet, type AGENT_TYPES } from '../extentions/agent';


export default function GameCanvas() {
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
    const hitCountRef = useRef<HTMLSpanElement>(null);
    const remainingBulletsRef = useRef<HTMLSpanElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [agentType, setAgentType] = useState<AGENT_TYPES>("manual");
    const [datasetName, setDatasetName] = useState<string | null>(null)

    useGameLoop((dt) => {
        updateGame(dt);
        drawGame();
    });

    function onGameStateChange(state: GameState) {
        if (!hitCountRef.current || !remainingBulletsRef.current) {
            return;
        }
        hitCountRef.current.textContent = state.hitCount.toString();
        remainingBulletsRef.current.textContent = state.remainingBullets.toString();
        return;
    }
    function handleAgentTypeChange(event: React.ChangeEvent<HTMLSelectElement>) {
        setAgentType(event.target.value as AGENT_TYPES);
    }
    function handleDatasetNameChange(event: React.ChangeEvent<HTMLSelectElement>) {
        setDatasetName(event.target.value);
    }
    function handleStartLearning() {
        console.log(datasetName);
    }

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
        const emit = (e: MouseEvent | null) => {
            const bullet = getNextBullet(agentType, gameState.current, e);
            if (bullet) {
                gameState.current.bullets.push(bullet);
                gameState.current.remainingBullets -= 1;
                onGameStateChange(gameState.current);
            }
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                emit(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        const handleMouseClick = (e: MouseEvent) => {
            emit(e);
        }
        const canvasRef_bk = canvasRef.current;
        canvasRef_bk?.addEventListener('click', handleMouseClick);

        onGameStateChange(gameState.current);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            canvasRef_bk?.removeEventListener('click', handleMouseClick);
        }
    }, [agentType]);

    return (
        <main className="flex flex-col items-center justify-center p-4">
            <header className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 border-b border-slate-700 gap-4 font-mono text-sm">
                <div className="flex items-center gap-0 bg-inherit">
                    <label htmlFor="agent-select">Player</label>
                    <select
                        id="agent-select"
                        name="agentType"
                        className="bg-inherit"
                        value={agentType}
                        onChange={handleAgentTypeChange}
                    >
                        <option value="manual">manual</option>
                        <option value="linear">linear</option>
                        <option value="random">random</option>
                    </select>
                </div>
                <div className="flex items-center gap-0 bg-inherit">
                    <input id="create-trainingData" type="checkbox" className="px-3 bg-blue-500 text-white rounded hover:bg-blue-600" />
                    <label htmlFor="create-trainingData">学習データ作成</label>
                </div>
                <div className="flex items-center gap-0 bg-inherit">
                    <select
                        id="dataset-select"
                        name="dataset-name"
                        className="bg-inherit"
                        value={datasetName ?? ""}
                        onChange={handleDatasetNameChange}
                    >
                        <option value="null">AIの学習データ</option>
                        <option value="1">AIの学習データ</option>
                    </select>
                    <button onClick={handleStartLearning}>学習</button>
                </div>
                <div>HITS: <span ref={hitCountRef} className="text-yellow-400">0</span></div>
                <div>BULLETS: <span ref={remainingBulletsRef} className="text-red-400">10</span></div>
            </header>
            <canvas
                ref={canvasRef}
                width={GAME_CONFIG.SCREEN_WIDTH}
                height={GAME_CONFIG.SCREEN_HEIGHT}
                className="bg-black w-full max-w-[360px] aspect-[9/16] shadow-2xl touch-none border border-slate-700"
            />
        </main>
    );
}