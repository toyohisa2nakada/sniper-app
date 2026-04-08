import type { GameState, Bullet, Enemy } from '../models/game';
import { GAME_CONFIG } from '../models/game';

export const AGENT_TYPES_ARRAY = ["manual", "random", "linear", "ai"];
export type AGENT_TYPES = (typeof AGENT_TYPES_ARRAY)[number];

function getNextManualBullet(state: GameState, mouseEvent: MouseEvent): number {
  return Math.atan2(mouseEvent.offsetY - state.player.y, mouseEvent.offsetX - state.player.x);
}

function getNextRandomBullet(): number {
  return -Math.PI / 2 + (Math.random() * 2 - 1) * Math.PI / 6;
}
function getLinearPredictiveBullet(state: GameState, enemy: Enemy): number {
  const v_bt = GAME_CONFIG.BULLET_SPEED;
  const v_em = Math.sqrt(Math.pow(enemy.vx, 2) + Math.pow(enemy.vy, 2));
  const seta2 = Math.atan2(enemy.vy, enemy.vx);
  const dx0 = enemy.x - state.player.x;
  const dy0 = enemy.y - state.player.y;

  const a = Math.pow(v_bt, 2) - Math.pow(v_em, 2);
  const b = -2 * dx0 * v_em * Math.cos(seta2) - 2 * dy0 * v_em * Math.sin(seta2);
  const c = -Math.pow(dx0, 2) - Math.pow(dy0, 2);
  const t1 = (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
  const t2 = (-b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
  const t = Math.max(t1, t2);
  const dx1 = dx0 + v_em * t * Math.cos(seta2);
  const dy1 = dy0 + v_em * t * Math.sin(seta2);

  const seta1 = Math.atan2(dy1, dx1);

  return seta1;
}

export const getNextBullet = (agentType: AGENT_TYPES, state: GameState, enemy: Enemy, mouseEvent: MouseEvent | null): Bullet | null => {
  let direction = null;
  if (agentType === "linear") {
    direction = getLinearPredictiveBullet(state, enemy);
  } else if (agentType === "random") {
    direction = getNextRandomBullet();
  } else if (agentType === "manual" && mouseEvent !== null) {
    direction = getNextManualBullet(state, mouseEvent);
  }
  if (direction === null) {
    return null;
  }
  return {
    id: 0,
    x: state.player.x,
    y: state.player.y,
    direction,
    speed: GAME_CONFIG.BULLET_SPEED,
    size: GAME_CONFIG.BULLET_SIZE,
    color: GAME_CONFIG.BULLET_COLOR,
    enemySnapshot: { ...enemy },
  };
}
