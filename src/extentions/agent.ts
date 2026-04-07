import type { GameState, Bullet } from '../models/game';
import { GAME_CONFIG } from '../models/game';

const AGENT_TYPE = "linear";

function getNextRandomBullet(state: GameState): Bullet | null {
  return {
    id: Math.random().toString(),
    x: state.player.x,
    y: state.player.y,
    direction: -Math.PI / 2 + (Math.random() * 2 - 1) * Math.PI / 6,
    speed: GAME_CONFIG.BULLET_SPEED,
    size: GAME_CONFIG.BULLET_SIZE,
    color: GAME_CONFIG.BULLET_COLOR,
  };
}
function getLinearPredictiveBullet(state: GameState): Bullet | null {
  if (state.enemies.length === 0) {
    return null;
  }
  const enemy = state.enemies[0];
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

  return {
    id: Math.random().toString(),
    x: state.player.x,
    y: state.player.y,
    direction: seta1,
    speed: GAME_CONFIG.BULLET_SPEED,
    size: GAME_CONFIG.BULLET_SIZE,
    color: GAME_CONFIG.BULLET_COLOR,
  };
}

export const getNextBullet = (state: GameState): Bullet | null => {
  if (AGENT_TYPE === "linear") {
    return getLinearPredictiveBullet(state);
  } else if (AGENT_TYPE === "random") {
    return getNextRandomBullet(state);
  }
  return null;
}
