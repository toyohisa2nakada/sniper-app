import * as tf from '@tensorflow/tfjs';
import type { GameState, Bullet, Enemy } from '../models/game';
import { GAME_CONFIG } from '../models/game';

export const AGENT_TYPES_ARRAY = ["manual", "random", "linear", "ai"];
export type AGENT_TYPES = (typeof AGENT_TYPES_ARRAY)[number];

let g_model: tf.Sequential | null = null;

export function modelPredict(enemy: Enemy): number {
  if (g_model === null) {
    return 0;
  }
  const xs = tf.tensor2d([[
    enemy.x / GAME_CONFIG.SCREEN_WIDTH,
    enemy.y / GAME_CONFIG.SCREEN_HEIGHT,
    enemy.vx,
    enemy.vy,
  ]]);
  return (g_model.predict(xs) as tf.Tensor).dataSync()[0] * Math.PI;
}

export async function modelFit(trainingData: Bullet[], onEpochEnd: (currentEpoch: number, totalEpochs: number, logs: tf.Logs) => void) {
  console.log(trainingData)
  const totalEpochs = 1500;
  const learningRate = 0.005;
  const model = tf.sequential();
  model.add(tf.layers.dense({
    inputShape: [4],
    units: 8,
    activation: 'tanh'
  }));
  model.add(tf.layers.dense({
    units: 1,
  }));
  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: tf.losses.meanSquaredError,
  });
  model.summary();

  const xs = tf.tensor2d(trainingData.map(data => ([
    data.enemySnapshot.x / GAME_CONFIG.SCREEN_WIDTH,
    data.enemySnapshot.y / GAME_CONFIG.SCREEN_HEIGHT,
    data.enemySnapshot.vx,
    data.enemySnapshot.vy,
  ])));
  const ys = tf.tensor2d(trainingData.map(data => ([
    data.direction / Math.PI
  ])))
  await model.fit(xs, ys, {
    epochs: totalEpochs,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        onEpochEnd(epoch, totalEpochs, logs ?? {});
      }
    }
  })
  onEpochEnd(totalEpochs, totalEpochs, {});
  console.log("finished");
  g_model = model;
}

function getNextManual(state: GameState, targetPos: { x: number, y: number }): number {
  return Math.atan2(targetPos.y - state.player.y, targetPos.x - state.player.x);
}
function getNextRandom(): number {
  return -Math.PI / 2 + (Math.random() * 2 - 1) * Math.PI / 6;
}
function getNextLinear(state: GameState, enemy: Enemy): number {
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
function getNextAI(enemy: Enemy): number | null {
  return modelPredict(enemy);
}

export const getNextBullet = (agentType: AGENT_TYPES, state: GameState, enemy: Enemy, targetPos: { x: number, y: number }): Bullet | null => {
  let direction = null;
  if (agentType === "linear") {
    direction = getNextLinear(state, enemy);
  } else if (agentType === "random") {
    direction = getNextRandom();
  } else if (agentType === "manual" && targetPos !== null) {
    direction = getNextManual(state, targetPos);
  } else if (agentType === "ai") {
    direction = getNextAI(enemy);
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
