
export const SCREEN_WIDTH = 360;
export const SCREEN_HEIGHT = 640;

export type GameState = {
    hitCount: number;
    remainingBullets: number;
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
    id: string;
    x: number;
    y: number;
    direction: number;
    speed: number;
    size: number;
};
