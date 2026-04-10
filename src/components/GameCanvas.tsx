import { useEffect, useRef, useState } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, ComboboxButton } from '@headlessui/react';
import { useGameLoop } from '../hooks/useGameLoop';
import type { GameState, Bullet } from '../models/game';
import { GAME_CONFIG } from '../models/game';
import { getNextBullet, modelFit, AGENT_TYPES_ARRAY, type AGENT_TYPES } from '../extentions/agent';

const DATASET_LOCALSTORAGE_HEADER = 'dataset-';

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
    const collectingTrainingDataRef = useRef<boolean>(false);
    const trainingDataRef = useRef<Bullet[]>([]);
    const [agentType, setAgentType] = useState<AGENT_TYPES>("manual");
    const [datasetItemList, setDatasetItemList] = useState<{ id: number, name: string }[]>(() => {
        const items: { id: number, name: string }[] = [];
        Object.keys(localStorage).filter(key => key.startsWith(DATASET_LOCALSTORAGE_HEADER)).forEach(key => {
            try {
                const datasetStr = localStorage.getItem(key);
                if(!datasetStr) return;
                const dataset = JSON.parse(datasetStr);
                const idStr = key.replace(DATASET_LOCALSTORAGE_HEADER, '');
                let id = Number(idStr);
                if (isNaN(id)) {
                    id = Date.now() + Math.floor(Math.random() * 10000);
                    localStorage.setItem(`${DATASET_LOCALSTORAGE_HEADER}${id}`, datasetStr);
                    localStorage.removeItem(key);
                }
                items.push({ id, name: dataset.name || '' });
            } catch (e) {
                console.error(e);
            }
        });
        return items.sort((a, b) => b.id - a.id);
    });
    // console.log(datasetItemList)
    const [datasetItem, setDatasetItem] = useState<{ id: number, name: string } | null>(datasetItemList.length === 0 ? null : datasetItemList[0]);

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
    function handleCreateTrainingDataChange(checked: boolean) {
        if (checked === false) {
            const timestamp = Date.now();
            const dataset = { id: timestamp, name: "data " + datasetItemList.length };
            const newList = [dataset, ...datasetItemList];
            setDatasetItemList(newList);
            setDatasetItem(dataset);

            localStorage.setItem(`${DATASET_LOCALSTORAGE_HEADER}${timestamp}`, JSON.stringify({ name: dataset.name, data: trainingDataRef.current }));
        }
        trainingDataRef.current = [];
        collectingTrainingDataRef.current = checked;
    }
    function handleStartLearning() {
        console.log(datasetItem);
        if (!datasetItem) return;
        const dataset = JSON.parse(localStorage.getItem(DATASET_LOCALSTORAGE_HEADER + datasetItem.id) ?? "{}");
        if (Object.keys(dataset).length > 0) {
            modelFit(dataset.data);
        }
    }
    function handleDeleteDataset(e: React.MouseEvent, id: number) {
        e.stopPropagation();
        const currentIndex = datasetItemList.findIndex((item) => item.id === id);
        const newList = datasetItemList.filter(datasetItem => datasetItem.id !== id);
        setDatasetItemList(newList);
        if (datasetItem?.id === id) {
            if (newList.length === 0) {
                setDatasetItem(null);
            } else {
                const newIndex = currentIndex < newList.length ? currentIndex : newList.length - 1;
                setDatasetItem(newList[newIndex]);
            }
        }
        localStorage.removeItem(`${DATASET_LOCALSTORAGE_HEADER}${id}`);
    }

    const addTrainingData = (bullet: Bullet) => {
        trainingDataRef.current.push(bullet)
        return;
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
            const isOut = bullet.y < 0 || bullet.y > GAME_CONFIG.SCREEN_HEIGHT ||
                bullet.x < 0 || bullet.x > GAME_CONFIG.SCREEN_WIDTH;
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
                if (collectingTrainingDataRef.current) {
                    addTrainingData(bullet);
                }
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
            const targetEnemy = gameState.current.enemies[0];
            if (targetEnemy === undefined) {
                return;
            }
            const bullet = getNextBullet(agentType, gameState.current, targetEnemy, e);
            if (bullet) {
                bullet.id = gameState.current.remainingBullets;
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
            <header className="h-12 bg-slate-800 text-white flex items-center justify-between px-6 border-b border-slate-700 gap-4 font-mono text-xs">
                <div className="flex flex-col items-center bg-inherit">
                    <label htmlFor="agent-select">Player</label>
                    <select
                        id="agent-select"
                        name="agentType"
                        className="bg-inherit"
                        value={agentType}
                        onChange={handleAgentTypeChange}
                    >
                        {AGENT_TYPES_ARRAY.map((t: string, i: number) => (<option value={t} key={i}>{t}</option>))}
                    </select>
                </div>
                <div className="flex flex-row gap-1 p-1 border bg-inherit">
                    <div className="flex items-center gap-0 bg-inherit">
                        <input
                            id="create-trainingData"
                            type="checkbox"
                            className="px-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onChange={(e) => handleCreateTrainingDataChange(e.target.checked)}
                        />
                        <label htmlFor="create-trainingData">学習データ作成</label>
                    </div>
                    <div className="flex items-center gap-2 bg-inherit">
                        <Combobox value={datasetItem} onChange={setDatasetItem}>
                            <div className="relative">
                                <div className="relative flex items-center">
                                    <ComboboxInput
                                        displayValue={(d: typeof datasetItem) => d?.name ?? ''}
                                        onChange={(e) => {
                                            const newName = e.target.value;
                                            if (datasetItem) {
                                                const updated = { ...datasetItem, name: newName };
                                                setDatasetItem(updated);
                                                setDatasetItemList(prev => prev.map(item => item.id === datasetItem.id ? updated : item));
                                                
                                                const key = `${DATASET_LOCALSTORAGE_HEADER}${datasetItem.id}`;
                                                const existingDataStr = localStorage.getItem(key);
                                                if (existingDataStr) {
                                                    try {
                                                        const existingData = JSON.parse(existingDataStr);
                                                        existingData.name = newName;
                                                        localStorage.setItem(key, JSON.stringify(existingData));
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }
                                            }
                                        }}
                                        className="bg-slate-700 text-white px-2 py-1 pr-8 rounded w-32 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Select dataset"
                                    />
                                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <span className="text-gray-400 text-xs">▼</span>
                                    </ComboboxButton>
                                </div>
                                <ComboboxOptions className="absolute right-0 w-max min-w-full mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm text-black z-50">
                                    {datasetItemList.map((data) => (
                                        <ComboboxOption key={data.id} value={data}
                                            className={({ focus }) => `relative cursor-default select-none py-2 pl-3 pr-9 flex justify-between ${focus ? 'bg-blue-600 text-white' : 'text-gray-900'}`}
                                        >
                                            <span>{data.name}</span>
                                            <button
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleDeleteDataset(e, data.id);
                                                }}
                                                className="text-gray-200 hover:text-red-700 z-10 px-2 py-1 rounded"
                                            >削除</button>
                                        </ComboboxOption>
                                    ))}
                                </ComboboxOptions>
                            </div>
                        </Combobox>
                        <button onClick={handleStartLearning}>学習</button>
                    </div>
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