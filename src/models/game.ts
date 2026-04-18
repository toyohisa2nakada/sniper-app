
export const GAME_CONFIG = {
    SCREEN_WIDTH: 360,
    SCREEN_HEIGHT: 640,
    MAX_BULLETS: 200,

    PLAYER_INIT_X: 180,
    PLAYER_INIT_Y: 512,
    PLAYER_INIT_SIZE: 10,
    PLAYER_INIT_COLOR: 'gray',

    BULLET_SPEED: 0.3,
    BULLET_SIZE: 3,
    BULLET_COLOR: 'red',
    BULLET_INTERVAL_MS: 100,
    BULLET_INTERVAL_MANUAL_MS: 500,

    ENEMY_INIT_X: 0,
    ENEMY_INIT_Y: 150,
    ENEMY_INIT_VX: 0.1,
    ENEMY_INIT_VY: 0,
    ENEMY_INIT_SIZE: 10,
    ENEMY_INIT_COLOR: 'green',
    ENEMY_HIT_COLOR: 'red',
    ENEMY_HIT_COLOR_DURATION: 800,
}

export type Player = {
    x: number;
    y: number;
    size: number;
    color: string;
}
export type Enemy = {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
};
export type Bullet = {
    id: number;
    x: number;
    y: number;
    direction: number;
    speed: number;
    size: number;
    color: string;
    enemySnapshot: Enemy;
};
export type GameState = {
    hitCount: number;
    remainingBullets: number;
    player: Player,
    enemies: Enemy[],
    bullets: Bullet[],
}
