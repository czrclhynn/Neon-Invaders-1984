export type GameStatus = 'MENU' | 'PLAYING' | 'PAUSED' | 'WAVE_CLEAR' | 'GAME_OVER';

export interface Point {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  isAlive: boolean;
  respawnTimer: number;
  shootCooldown: number;
}

export type InvaderType = 'squid' | 'crab' | 'octopus';

export interface Invader {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: InvaderType;
  points: number;
  isAlive: boolean;
  frame: number;
}

export interface UFO {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: 1 | -1;
  isActive: boolean;
  points: number;
  nextSpawnTime: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isPlayer: boolean;
  color: string;
}

export interface BunkerPixel {
  active: boolean;
  colorIndex: number;
}

export interface Bunker {
  x: number;
  y: number;
  width: number;
  height: number;
  cols: number;
  rows: number;
  grid: BunkerPixel[][];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  lives: number;
  shotsFired: number;
  aliensDefeated: number;
}
