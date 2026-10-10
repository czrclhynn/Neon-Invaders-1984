import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameStatus,
  Player,
  Invader,
  UFO,
  Bullet,
  Bunker,
  Particle,
  FloatingText,
  GameStats,
} from './types';
import {
  SQUID_SPRITE,
  CRAB_SPRITE,
  OCTOPUS_SPRITE,
  UFO_SPRITE,
  PLAYER_SPRITE,
  BUNKER_TEMPLATE,
} from './sprites';
import { synthEngine } from '../audio/synthEngine';

interface SpaceInvadersCanvasProps {
  onScoreUpdate?: (score: number, highScore: number) => void;
  isSfxEnabled: boolean;
  scanlines: boolean;
  crtCurve: boolean;
}

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 540;

export const SpaceInvadersCanvas: React.FC<SpaceInvadersCanvasProps> = ({
  onScoreUpdate,
  isSfxEnabled,
  scanlines,
  crtCurve,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High score from storage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('neon_invaders_hi_score');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    wave: 1,
    lives: 3,
    shotsFired: 0,
    aliensDefeated: 0,
  });

  const [gameStatus, setGameStatus] = useState<GameStatus>('MENU');

  // Input states
  const keysRef = useRef<{ left: boolean; right: boolean; shoot: boolean }>({
    left: false,
    right: false,
    shoot: false,
  });

  // Game internal mutable state
  const gameStateRef = useRef<{
    status: GameStatus;
    player: Player;
    invaders: Invader[];
    ufo: UFO;
    bullets: Bullet[];
    bunkers: Bunker[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    stars: { x: number; y: number; speed: number; size: number; alpha: number }[];
    gridOffset: number;
    invaderDirection: number; // 1 or -1
    invaderMoveTimer: number;
    invaderStepTime: number; // dynamically speeds up as invaders die
    invaderStepIndex: number;
    invaderDropDistance: number;
    invaderShootTimer: number;
    nextUfoSpawn: number;
    waveTransitionTimer: number;
    score: number;
    highScore: number;
    wave: number;
    lives: number;
    shotsFired: number;
    aliensDefeated: number;
    screenShake: number;
  }>({
    status: 'MENU',
    player: {
      x: CANVAS_WIDTH / 2 - 16,
      y: CANVAS_HEIGHT - 48,
      width: 36,
      height: 22,
      speed: 4.8,
      isAlive: true,
      respawnTimer: 0,
      shootCooldown: 0,
    },
    invaders: [],
    ufo: {
      x: -60,
      y: 44,
      width: 48,
      height: 21,
      speed: 2.2,
      direction: 1,
      isActive: false,
      points: 100,
      nextSpawnTime: 1200,
    },
    bullets: [],
    bunkers: [],
    particles: [],
    floatingTexts: [],
    stars: [],
    gridOffset: 0,
    invaderDirection: 1,
    invaderMoveTimer: 0,
    invaderStepTime: 40,
    invaderStepIndex: 0,
    invaderDropDistance: 16,
    invaderShootTimer: 0,
    nextUfoSpawn: 1200,
    waveTransitionTimer: 0,
    score: 0,
    highScore: 0,
    wave: 1,
    lives: 3,
    shotsFired: 0,
    aliensDefeated: 0,
    screenShake: 0,
  });

  // Keep ref high score in sync
  useEffect(() => {
    gameStateRef.current.highScore = highScore;
    setStats((prev) => ({ ...prev, highScore }));
  }, [highScore]);

  // Initialize stars once
  useEffect(() => {
    const stars: { x: number; y: number; speed: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        speed: 0.2 + Math.random() * 0.6,
        size: Math.random() > 0.8 ? 2 : 1,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }
    gameStateRef.current.stars = stars;
  }, []);

  // Helper to build bunkers
  const createBunkers = useCallback((): Bunker[] => {
    const bunkers: Bunker[] = [];
    const count = 4;
    const bunkerWidth = 64;
    const bunkerHeight = 42;
    const totalSpacing = CANVAS_WIDTH - count * bunkerWidth;
    const gap = totalSpacing / (count + 1);

    for (let i = 0; i < count; i++) {
      const bx = gap + i * (bunkerWidth + gap);
      const by = CANVAS_HEIGHT - 110;

      const rows = BUNKER_TEMPLATE.length;
      const cols = BUNKER_TEMPLATE[0].length;
      const grid = BUNKER_TEMPLATE.map((row) =>
        row.map((val) => ({
          active: val === 1,
          colorIndex: Math.floor(Math.random() * 2),
        }))
      );

      bunkers.push({
        x: bx,
        y: by,
        width: bunkerWidth,
        height: bunkerHeight,
        cols,
        rows,
        grid,
      });
    }
    return bunkers;
  }, []);

  // Helper to spawn invader swarm
  const createInvaders = useCallback((wave: number): Invader[] => {
    const invaders: Invader[] = [];
    const rows = 5;
    const cols = 11;
    const startY = Math.min(80 + (wave - 1) * 14, 150); // Lower starting Y in later waves
    const startX = 60;
    const spacingX = 48;
    const spacingY = 32;

    let id = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: 'squid' | 'crab' | 'octopus' = 'octopus';
        let points = 10;
        let width = 32;
        let height = 22;

        if (r === 0) {
          type = 'squid';
          points = 30;
          width = 24;
          height = 24;
        } else if (r === 1 || r === 2) {
          type = 'crab';
          points = 20;
          width = 30;
          height = 22;
        } else {
          type = 'octopus';
          points = 10;
          width = 32;
          height = 22;
        }

        invaders.push({
          id: id++,
          row: r,
          col: c,
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          width,
          height,
          type,
          points,
          isAlive: true,
          frame: 0,
        });
      }
    }
    return invaders;
  }, []);

  // Spawn explosion particles
  const spawnExplosion = useCallback((x: number, y: number, color: string, count = 16) => {
    const state = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.5;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 1.5 + Math.random() * 2.5,
        alpha: 1,
        decay: 0.025 + Math.random() * 0.035,
      });
    }
  }, []);

  // Add floating point notice
  const addFloatingText = useCallback((x: number, y: number, text: string, color = '#ff2a85') => {
    gameStateRef.current.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.2,
    });
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    const state = gameStateRef.current;
    state.status = 'PLAYING';
    state.score = 0;
    state.wave = 1;
    state.lives = 3;
    state.shotsFired = 0;
    state.aliensDefeated = 0;
    state.bullets = [];
    state.particles = [];
    state.floatingTexts = [];
    state.player.x = CANVAS_WIDTH / 2 - 16;
    state.player.isAlive = true;
    state.player.respawnTimer = 0;
    state.player.shootCooldown = 0;
    state.invaders = createInvaders(1);
    state.bunkers = createBunkers();
    state.invaderDirection = 1;
    state.invaderStepTime = 42;
    state.invaderMoveTimer = 0;
    state.nextUfoSpawn = 800 + Math.floor(Math.random() * 600);
    state.ufo.isActive = false;

    setGameStatus('PLAYING');
    setStats({
      score: 0,
      highScore: state.highScore,
      wave: 1,
      lives: 3,
      shotsFired: 0,
      aliensDefeated: 0,
    });
    if (onScoreUpdate) onScoreUpdate(0, state.highScore);

    // Auto-start music if not playing yet
    if (!synthEngine.isPlaying) {
      synthEngine.play();
    }
  }, [createInvaders, createBunkers, onScoreUpdate]);

  // Restart after game over
  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  // Advance to next wave
  const startNextWave = useCallback(() => {
    const state = gameStateRef.current;
    state.wave += 1;
    state.status = 'PLAYING';
    state.bullets = [];
    state.particles = [];
    state.player.shootCooldown = 0;
    state.invaders = createInvaders(state.wave);
    state.invaderDirection = 1;
    // Step time gets faster on each wave
    state.invaderStepTime = Math.max(16, 42 - state.wave * 4);
    state.invaderMoveTimer = 0;
    state.nextUfoSpawn = 600 + Math.floor(Math.random() * 500);
    state.ufo.isActive = false;

    setGameStatus('PLAYING');
    setStats((prev) => ({
      ...prev,
      wave: state.wave,
    }));
  }, [createInvaders]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scroll on space / arrows
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Spacebar'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.shoot = true;
        if (gameStateRef.current.status === 'MENU') {
          startGame();
        } else if (gameStateRef.current.status === 'GAME_OVER') {
          restartGame();
        }
      }

      // Pause toggle
      if (e.key === 'p' || e.key === 'P') {
        const state = gameStateRef.current;
        if (state.status === 'PLAYING') {
          state.status = 'PAUSED';
          setGameStatus('PAUSED');
        } else if (state.status === 'PAUSED') {
          state.status = 'PLAYING';
          setGameStatus('PLAYING');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysRef.current.shoot = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startGame, restartGame]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      animId = requestAnimationFrame(loop);
      // Delta time limiter
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;

      const state = gameStateRef.current;

      // 1. UPDATE STATE
      updateGame(state, dt);

      // 2. RENDER CANVAS
      renderGame(ctx, state);
    };

    const updateGame = (state: typeof gameStateRef.current, _dt: number) => {
      // Background star movement
      state.stars.forEach((s) => {
        s.y += s.speed;
        if (s.y > CANVAS_HEIGHT) {
          s.y = 0;
          s.x = Math.random() * CANVAS_WIDTH;
        }
      });
      state.gridOffset = (state.gridOffset + 0.8) % 24;

      // Screen shake decay
      if (state.screenShake > 0) {
        state.screenShake -= 0.5;
        if (state.screenShake < 0) state.screenShake = 0;
      }

      // Update particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
        }
      }

      // Update floating texts
      for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const t = state.floatingTexts[i];
        t.y += t.vy;
        t.alpha -= 0.02;
        if (t.alpha <= 0) {
          state.floatingTexts.splice(i, 1);
        }
      }

      if (state.status === 'PAUSED' || state.status === 'MENU' || state.status === 'GAME_OVER') {
        return;
      }

      if (state.status === 'WAVE_CLEAR') {
        state.waveTransitionTimer--;
        if (state.waveTransitionTimer <= 0) {
          startNextWave();
        }
        return;
      }

      // --- PLAYER UPDATE ---
      const { player } = state;
      if (player.isAlive) {
        if (keysRef.current.left) {
          player.x = Math.max(16, player.x - player.speed);
        }
        if (keysRef.current.right) {
          player.x = Math.min(CANVAS_WIDTH - player.width - 16, player.x + player.speed);
        }

        if (player.shootCooldown > 0) {
          player.shootCooldown--;
        }

        // Shooting player bullet (limit 1 active bullet on screen for authentic tactical retro feel, or max 2)
        const activePlayerBullets = state.bullets.filter((b) => b.isPlayer).length;
        if (keysRef.current.shoot && player.shootCooldown === 0 && activePlayerBullets < 2) {
          state.bullets.push({
            id: Math.random(),
            x: player.x + player.width / 2 - 2,
            y: player.y - 6,
            width: 4,
            height: 14,
            vy: -8.5,
            isPlayer: true,
            color: '#00f0ff',
          });
          player.shootCooldown = 18;
          state.shotsFired++;
          if (isSfxEnabled) {
            synthEngine.playShootSound();
          }
        }
      } else {
        // Player respawn countdown
        player.respawnTimer--;
        if (player.respawnTimer <= 0) {
          if (state.lives > 0) {
            player.isAlive = true;
            player.x = CANVAS_WIDTH / 2 - player.width / 2;
          } else {
            state.status = 'GAME_OVER';
            setGameStatus('GAME_OVER');
            if (isSfxEnabled) synthEngine.playGameOverSound();
          }
        }
      }

      // --- INVADERS SWARM UPDATE ---
      const aliveInvaders = state.invaders.filter((inv) => inv.isAlive);
      if (aliveInvaders.length === 0) {
        // Wave cleared!
        state.status = 'WAVE_CLEAR';
        state.waveTransitionTimer = 90;
        setGameStatus('WAVE_CLEAR');
        const waveBonus = state.wave * 500;
        state.score += waveBonus;
        addFloatingText(CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2, `WAVE CLEAR! +${waveBonus}`, '#00f0ff');
        if (isSfxEnabled) synthEngine.playWaveClearSound();
        checkHighScore(state);
        return;
      }

      // Dynamic march speed: as invaders die, remaining ones move faster
      const aliveRatio = aliveInvaders.length / state.invaders.length;
      const baseStep = Math.max(18, 44 - state.wave * 4);
      const targetStepTime = Math.max(3, Math.floor(baseStep * aliveRatio));

      state.invaderMoveTimer++;
      if (state.invaderMoveTimer >= targetStepTime) {
        state.invaderMoveTimer = 0;
        state.invaderStepIndex++;

        // Determine if hitting boundary
        let hitEdge = false;
        aliveInvaders.forEach((inv) => {
          if (state.invaderDirection === 1 && inv.x + inv.width >= CANVAS_WIDTH - 24) {
            hitEdge = true;
          } else if (state.invaderDirection === -1 && inv.x <= 24) {
            hitEdge = true;
          }
        });

        if (hitEdge) {
          state.invaderDirection *= -1;
          aliveInvaders.forEach((inv) => {
            inv.y += state.invaderDropDistance;
            inv.frame = inv.frame === 0 ? 1 : 0;

            // Invaders reached bunker/player level: Game Over!
            if (inv.y + inv.height >= player.y - 10) {
              state.lives = 0;
              state.status = 'GAME_OVER';
              setGameStatus('GAME_OVER');
              spawnExplosion(player.x + 16, player.y + 10, '#f43f5e', 30);
              if (isSfxEnabled) synthEngine.playGameOverSound();
            }
          });
        } else {
          const moveDelta = 9 * state.invaderDirection;
          aliveInvaders.forEach((inv) => {
            inv.x += moveDelta;
            inv.frame = inv.frame === 0 ? 1 : 0;
          });
        }
      }

      // --- INVADER FIRING ---
      state.invaderShootTimer++;
      const shootInterval = Math.max(25, 75 - state.wave * 6);
      if (state.invaderShootTimer >= shootInterval) {
        state.invaderShootTimer = 0;
        // Group alive invaders by column to find bottom-most invaders
        const colMap = new Map<number, Invader>();
        aliveInvaders.forEach((inv) => {
          const current = colMap.get(inv.col);
          if (!current || inv.row > current.row) {
            colMap.set(inv.col, inv);
          }
        });

        const bottomInvaders = Array.from(colMap.values());
        if (bottomInvaders.length > 0) {
          const shooter = bottomInvaders[Math.floor(Math.random() * bottomInvaders.length)];
          state.bullets.push({
            id: Math.random(),
            x: shooter.x + shooter.width / 2 - 2,
            y: shooter.y + shooter.height + 2,
            width: 4,
            height: 12,
            vy: 3.8 + state.wave * 0.35,
            isPlayer: false,
            color: '#f43f5e',
          });
        }
      }

      // --- UFO UPDATE ---
      const { ufo } = state;
      if (!ufo.isActive) {
        ufo.nextSpawnTime--;
        if (ufo.nextSpawnTime <= 0) {
          ufo.isActive = true;
          ufo.direction = Math.random() > 0.5 ? 1 : -1;
          ufo.x = ufo.direction === 1 ? -ufo.width : CANVAS_WIDTH + ufo.width;
          const mysteryPoints = [50, 100, 150, 200, 300];
          ufo.points = mysteryPoints[Math.floor(Math.random() * mysteryPoints.length)];
          if (isSfxEnabled) synthEngine.playUfoSound();
        }
      } else {
        ufo.x += ufo.speed * ufo.direction;
        if (Math.random() < 0.08 && isSfxEnabled) {
          synthEngine.playUfoSound();
        }
        if ((ufo.direction === 1 && ufo.x > CANVAS_WIDTH + 50) || (ufo.direction === -1 && ufo.x < -80)) {
          ufo.isActive = false;
          ufo.nextSpawnTime = 1000 + Math.floor(Math.random() * 800);
        }
      }

      // --- BULLETS & COLLISIONS ---
      for (let bi = state.bullets.length - 1; bi >= 0; bi--) {
        const bullet = state.bullets[bi];
        bullet.y += bullet.vy;

        // Out of bounds check
        if (bullet.y < 10 || bullet.y > CANVAS_HEIGHT - 10) {
          state.bullets.splice(bi, 1);
          continue;
        }

        // 1. Collision with Bunkers
        let bulletHitBunker = false;
        for (const bunker of state.bunkers) {
          if (
            bullet.x >= bunker.x &&
            bullet.x <= bunker.x + bunker.width &&
            bullet.y >= bunker.y &&
            bullet.y <= bunker.y + bunker.height
          ) {
            // Find grid cell
            const colW = bunker.width / bunker.cols;
            const rowH = bunker.height / bunker.rows;
            const gridCol = Math.floor((bullet.x - bunker.x) / colW);
            const gridRow = Math.floor((bullet.y - bunker.y) / rowH);

            if (gridRow >= 0 && gridRow < bunker.rows && gridCol >= 0 && gridCol < bunker.cols) {
              if (bunker.grid[gridRow][gridCol]?.active) {
                // Erode circular blast area
                erodeBunker(bunker, gridCol, gridRow, 2);
                bulletHitBunker = true;
                spawnExplosion(bullet.x, bullet.y, '#10b981', 6);
                break;
              }
            }
          }
        }
        if (bulletHitBunker) {
          state.bullets.splice(bi, 1);
          continue;
        }

        // 2. Player Bullets -> Invaders & UFO
        if (bullet.isPlayer) {
          // UFO collision
          if (
            ufo.isActive &&
            bullet.x >= ufo.x &&
            bullet.x <= ufo.x + ufo.width &&
            bullet.y >= ufo.y &&
            bullet.y <= ufo.y + ufo.height
          ) {
            ufo.isActive = false;
            ufo.nextSpawnTime = 1200 + Math.floor(Math.random() * 800);
            state.score += ufo.points;
            spawnExplosion(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2, '#fbbf24', 28);
            addFloatingText(ufo.x, ufo.y - 10, `+${ufo.points} UFO!`, '#fbbf24');
            state.bullets.splice(bi, 1);
            if (isSfxEnabled) synthEngine.playAlienExplosionSound();
            checkHighScore(state);
            continue;
          }

          // Invader collision
          let hitInvader = false;
          for (const inv of aliveInvaders) {
            if (
              bullet.x >= inv.x &&
              bullet.x <= inv.x + inv.width &&
              bullet.y >= inv.y &&
              bullet.y <= inv.y + inv.height
            ) {
              inv.isAlive = false;
              state.score += inv.points;
              state.aliensDefeated++;
              hitInvader = true;
              const color = inv.type === 'squid' ? '#f43f5e' : inv.type === 'crab' ? '#a855f7' : '#06b6d4';
              spawnExplosion(inv.x + inv.width / 2, inv.y + inv.height / 2, color, 14);
              addFloatingText(inv.x + 4, inv.y - 6, `+${inv.points}`, color);
              if (isSfxEnabled) synthEngine.playAlienExplosionSound();
              checkHighScore(state);
              break;
            }
          }
          if (hitInvader) {
            state.bullets.splice(bi, 1);
            continue;
          }
        } else {
          // 3. Alien Bullets -> Player Ship
          if (
            player.isAlive &&
            bullet.x >= player.x &&
            bullet.x <= player.x + player.width &&
            bullet.y >= player.y &&
            bullet.y <= player.y + player.height
          ) {
            player.isAlive = false;
            player.respawnTimer = 80;
            state.lives = Math.max(0, state.lives - 1);
            state.screenShake = 12;
            spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00f0ff', 35);
            state.bullets.splice(bi, 1);
            if (isSfxEnabled) synthEngine.playPlayerHitSound();

            setStats((prev) => ({
              ...prev,
              lives: state.lives,
            }));
            continue;
          }
        }
      }

      // Sync stats state periodically
      setStats((prev) => {
        if (
          prev.score !== state.score ||
          prev.lives !== state.lives ||
          prev.wave !== state.wave ||
          prev.aliensDefeated !== state.aliensDefeated
        ) {
          return {
            score: state.score,
            highScore: state.highScore,
            wave: state.wave,
            lives: state.lives,
            shotsFired: state.shotsFired,
            aliensDefeated: state.aliensDefeated,
          };
        }
        return prev;
      });
    };

    const erodeBunker = (bunker: Bunker, c: number, r: number, radius = 2) => {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius + 1) {
            const row = r + dy;
            const col = c + dx;
            if (row >= 0 && row < bunker.rows && col >= 0 && col < bunker.cols) {
              if (Math.random() < 0.85 && bunker.grid[row][col]) {
                bunker.grid[row][col].active = false;
              }
            }
          }
        }
      }
    };

    const checkHighScore = (state: typeof gameStateRef.current) => {
      if (state.score > state.highScore) {
        state.highScore = state.score;
        setHighScore(state.score);
        try {
          localStorage.setItem('neon_invaders_hi_score', state.score.toString());
        } catch {
          // ignore
        }
      }
      if (onScoreUpdate) {
        onScoreUpdate(state.score, state.highScore);
      }
    };

    // --- CANVAS RENDERING ---
    const renderGame = (ctx: CanvasRenderingContext2D, state: typeof gameStateRef.current) => {
      ctx.save();

      // Screen shake translation
      if (state.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * state.screenShake;
        const shakeY = (Math.random() - 0.5) * state.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Deep Space Vaporwave Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#0a0217'); // Dark cosmic indigo
      bgGrad.addColorStop(0.65, '#17062e'); // Deep purple
      bgGrad.addColorStop(1, '#2c0847'); // Neon magenta horizon
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars
      state.stars.forEach((s) => {
        ctx.fillStyle = `rgba(230, 200, 255, ${s.alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Bottom Vaporwave Neon Grid
      drawVaporwaveGrid(ctx, state.gridOffset);

      // 2. Bunkers
      renderBunkers(ctx, state.bunkers);

      // 3. Invaders Swarm
      renderInvaders(ctx, state.invaders);

      // 4. Mystery Saucer (UFO)
      if (state.ufo.isActive) {
        renderUfo(ctx, state.ufo);
      }

      // 5. Bullets
      renderBullets(ctx, state.bullets);

      // 6. Player Ship
      if (state.player.isAlive) {
        renderPlayer(ctx, state.player);
      } else if (state.player.respawnTimer > 0) {
        // Flickering respawn ghost
        if (Math.floor(state.player.respawnTimer / 4) % 2 === 0) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          renderPlayer(ctx, state.player);
          ctx.restore();
        }
      }

      // 7. Particles
      renderParticles(ctx, state.particles);

      // 8. Floating Scores
      renderFloatingTexts(ctx, state.floatingTexts);

      // 9. In-game HUD (Upper Bar)
      renderHud(ctx, state);

      // 10. State Overlays (Menu / Pause / GameOver / WaveClear)
      renderStateOverlays(ctx, state);

      ctx.restore();
    };

    const drawVaporwaveGrid = (ctx: CanvasRenderingContext2D, offset: number) => {
      const horizonY = CANVAS_HEIGHT - 60;
      // Horizon glow line
      ctx.strokeStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(CANVAS_WIDTH, horizonY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Perspective grid lines
      ctx.save();
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.28)';
      ctx.lineWidth = 1;

      // Vertical converging lines
      const vanishingX = CANVAS_WIDTH / 2;
      const numLines = 16;
      for (let i = -numLines; i <= numLines; i++) {
        const bottomX = vanishingX + i * 40;
        ctx.beginPath();
        ctx.moveTo(vanishingX + i * 6, horizonY);
        ctx.lineTo(bottomX, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Horizontal lines with perspective compression
      for (let y = horizonY; y < CANVAS_HEIGHT; y += 12) {
        const animatedY = y + (offset % 12);
        if (animatedY > horizonY && animatedY <= CANVAS_HEIGHT) {
          ctx.beginPath();
          ctx.moveTo(0, animatedY);
          ctx.lineTo(CANVAS_WIDTH, animatedY);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const renderBunkers = (ctx: CanvasRenderingContext2D, bunkers: Bunker[]) => {
      bunkers.forEach((bunker) => {
        const colW = bunker.width / bunker.cols;
        const rowH = bunker.height / bunker.rows;

        for (let r = 0; r < bunker.rows; r++) {
          for (let c = 0; c < bunker.cols; c++) {
            if (bunker.grid[r][c]?.active) {
              const x = bunker.x + c * colW;
              const y = bunker.y + r * rowH;
              // Vaporwave emerald/cyan shield blocks
              ctx.fillStyle = bunker.grid[r][c].colorIndex === 0 ? '#10b981' : '#059669';
              ctx.fillRect(x, y, colW + 0.3, rowH + 0.3);
            }
          }
        }
      });
    };

    const renderInvaders = (ctx: CanvasRenderingContext2D, invaders: Invader[]) => {
      invaders.forEach((inv) => {
        if (!inv.isAlive) return;

        let sprite = SQUID_SPRITE;
        let color = '#f43f5e';
        let glow = '#fb7185';

        if (inv.type === 'squid') {
          sprite = SQUID_SPRITE;
          color = '#f43f5e';
          glow = '#f43f5e';
        } else if (inv.type === 'crab') {
          sprite = CRAB_SPRITE;
          color = '#c084fc';
          glow = '#a855f7';
        } else {
          sprite = OCTOPUS_SPRITE;
          color = '#22d3ee';
          glow = '#06b6d4';
        }

        const matrix = inv.frame === 0 ? sprite.frame0 : sprite.frame1;
        const pixelW = inv.width / sprite.width;
        const pixelH = inv.height / sprite.height;

        ctx.save();
        ctx.shadowColor = glow;
        ctx.shadowBlur = 6;
        ctx.fillStyle = color;

        for (let r = 0; r < sprite.height; r++) {
          for (let c = 0; c < sprite.width; c++) {
            if (matrix[r][c] === 1) {
              ctx.fillRect(inv.x + c * pixelW, inv.y + r * pixelH, pixelW, pixelH);
            }
          }
        }
        ctx.restore();
      });
    };

    const renderUfo = (ctx: CanvasRenderingContext2D, ufo: UFO) => {
      const sprite = UFO_SPRITE;
      const pixelW = ufo.width / sprite.width;
      const pixelH = ufo.height / sprite.height;

      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;

      for (let r = 0; r < sprite.height; r++) {
        for (let c = 0; c < sprite.width; c++) {
          if (sprite.matrix[r][c] === 1) {
            // Flash between red and gold
            ctx.fillStyle = r <= 2 ? '#ff2a85' : '#fbbf24';
            ctx.fillRect(ufo.x + c * pixelW, ufo.y + r * pixelH, pixelW, pixelH);
          }
        }
      }
      ctx.restore();
    };

    const renderPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
      const sprite = PLAYER_SPRITE;
      const pixelW = player.width / sprite.width;
      const pixelH = player.height / sprite.height;

      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#00f0ff';

      for (let r = 0; r < sprite.height; r++) {
        for (let c = 0; c < sprite.width; c++) {
          if (sprite.matrix[r][c] === 1) {
            // Neon accent tip
            if (r <= 2) {
              ctx.fillStyle = '#ff2a85';
            } else {
              ctx.fillStyle = '#00f0ff';
            }
            ctx.fillRect(player.x + c * pixelW, player.y + r * pixelH, pixelW, pixelH);
          }
        }
      }

      // Thruster flame when moving
      if (keysRef.current.left || keysRef.current.right) {
        ctx.fillStyle = '#ff7a00';
        ctx.shadowColor = '#ff7a00';
        const flameHeight = 4 + Math.random() * 5;
        ctx.fillRect(player.x + player.width / 2 - 3, player.y + player.height, 6, flameHeight);
      }

      ctx.restore();
    };

    const renderBullets = (ctx: CanvasRenderingContext2D, bullets: Bullet[]) => {
      bullets.forEach((bullet) => {
        ctx.save();
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = bullet.color;

        if (bullet.isPlayer) {
          // Sleek laser bolt
          ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
          // Core bright white highlight
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bullet.x + 1, bullet.y + 2, bullet.width - 2, bullet.height - 4);
        } else {
          // Alien zigzag bomb
          ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        ctx.restore();
      });
    };

    const renderParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      });
    };

    const renderFloatingTexts = (ctx: CanvasRenderingContext2D, texts: FloatingText[]) => {
      texts.forEach((t) => {
        ctx.save();
        ctx.globalAlpha = t.alpha;
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 6;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      });
    };

    const renderHud = (ctx: CanvasRenderingContext2D, state: typeof gameStateRef.current) => {
      ctx.save();
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#f43f5e';

      // 1UP Score
      ctx.fillText('1UP', 24, 24);
      ctx.fillStyle = '#ffffff';
      const scoreStr = state.score.toString().padStart(6, '0');
      ctx.fillText(scoreStr, 24, 38);

      // HIGH SCORE
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('HIGH-SCORE', CANVAS_WIDTH / 2 - 55, 24);
      ctx.fillStyle = '#ffffff';
      const hiStr = state.highScore.toString().padStart(6, '0');
      ctx.fillText(hiStr, CANVAS_WIDTH / 2 - 32, 38);

      // WAVE
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`WAVE ${state.wave}`, CANVAS_WIDTH - 110, 24);

      // LIVES (Mini ships)
      ctx.fillStyle = '#00f0ff';
      const livesX = CANVAS_WIDTH - 110;
      for (let i = 0; i < state.lives; i++) {
        const lx = livesX + i * 22;
        const ly = 30;
        // Mini player ship icon
        ctx.fillRect(lx + 4, ly, 3, 2);
        ctx.fillRect(lx + 2, ly + 2, 7, 2);
        ctx.fillRect(lx, ly + 4, 11, 4);
      }

      ctx.restore();
    };

    const renderStateOverlays = (ctx: CanvasRenderingContext2D, state: typeof gameStateRef.current) => {
      if (state.status === 'MENU') {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 2, 23, 0.78)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Title
        ctx.textAlign = 'center';
        ctx.font = '28px "Press Start 2P", monospace';
        ctx.fillStyle = '#ff2a85';
        ctx.shadowColor = '#ff2a85';
        ctx.shadowBlur = 14;
        ctx.fillText('SPACE INVADERS', CANVAS_WIDTH / 2, 160);

        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillText('1 9 8 4   E D I T I O N', CANVAS_WIDTH / 2, 195);

        // Score Table
        ctx.shadowBlur = 0;
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('* SCORE ADVANCE TABLE *', CANVAS_WIDTH / 2, 255);

        ctx.fillStyle = '#fbbf24';
        ctx.fillText('UFO  =  ? MYSTERY PTS', CANVAS_WIDTH / 2, 290);
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('SQUID    =  30 PTS', CANVAS_WIDTH / 2, 315);
        ctx.fillStyle = '#c084fc';
        ctx.fillText('CRAB     =  20 PTS', CANVAS_WIDTH / 2, 340);
        ctx.fillStyle = '#22d3ee';
        ctx.fillText('OCTOPUS  =  10 PTS', CANVAS_WIDTH / 2, 365);

        // Blinking Insert Coin
        if (Math.floor(Date.now() / 500) % 2 === 0) {
          ctx.font = '13px "Press Start 2P", monospace';
          ctx.fillStyle = '#fde047';
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 10;
          ctx.fillText('PRESS SPACE OR CLICK START', CANVAS_WIDTH / 2, 440);
        }

        ctx.restore();
      } else if (state.status === 'PAUSED') {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 2, 23, 0.65)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillText('PRESS P TO RESUME MISSION', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
        ctx.restore();
      } else if (state.status === 'WAVE_CLEAR') {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.fillText(`WAVE ${state.wave} CLEARED!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);

        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.fillText('GET READY FOR NEXT WAVE...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.restore();
      } else if (state.status === 'GAME_OVER') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 2, 30, 0.88)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.font = '26px "Press Start 2P", monospace';
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 16;
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 170);

        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillText(`FINAL SCORE: ${state.score}`, CANVAS_WIDTH / 2, 225);
        ctx.fillText(`ALIENS DEFEATED: ${state.aliensDefeated}`, CANVAS_WIDTH / 2, 255);
        ctx.fillText(`WAVE REACHED: ${state.wave}`, CANVAS_WIDTH / 2, 285);

        if (state.score >= state.highScore && state.score > 0) {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.fillText('★ NEW HIGH SCORE RECORD! ★', CANVAS_WIDTH / 2, 330);
        }

        if (Math.floor(Date.now() / 450) % 2 === 0) {
          ctx.font = '12px "Press Start 2P", monospace';
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
          ctx.fillText('PRESS SPACE OR CLICK PLAY AGAIN', CANVAS_WIDTH / 2, 410);
        }
        ctx.restore();
      }
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [createInvaders, createBunkers, isSfxEnabled, onScoreUpdate, startNextWave]);

  // Touch button action helpers
  const handleTouchLeftStart = () => {
    keysRef.current.left = true;
  };
  const handleTouchLeftEnd = () => {
    keysRef.current.left = false;
  };
  const handleTouchRightStart = () => {
    keysRef.current.right = true;
  };
  const handleTouchRightEnd = () => {
    keysRef.current.right = false;
  };
  const handleTouchFire = () => {
    if (gameStateRef.current.status === 'MENU') {
      startGame();
    } else if (gameStateRef.current.status === 'GAME_OVER') {
      restartGame();
    } else {
      keysRef.current.shoot = true;
      setTimeout(() => {
        keysRef.current.shoot = false;
      }, 100);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Arcade Screen Frame */}
      <div
        className={`relative w-full max-w-[760px] rounded-2xl p-2.5 sm:p-4 bg-gradient-to-b from-purple-950/70 via-fuchsia-950/30 to-purple-950/80 border-2 border-fuchsia-500/40 shadow-[0_0_35px_rgba(217,70,239,0.22),inset_0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 ${
          crtCurve ? 'crt-bezel-shadow' : ''
        }`}
      >
        {/* Arcade Cabinet Marquee Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-fuchsia-500/20 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-fuchsia-300 font-bold tracking-wider uppercase">CABINET #1984</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-fuchsia-300/80">
            <span>25¢ / PLAY</span>
            <span className="text-cyan-400 font-bold tracking-wider">1P READY</span>
          </div>
        </div>

        {/* Canvas Container */}
        <div
          className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-black border border-purple-800/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.95)] ${
            crtCurve ? 'crt-screen-curved' : ''
          }`}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain block cursor-crosshair"
            onClick={() => {
              if (gameStateRef.current.status === 'MENU') startGame();
              if (gameStateRef.current.status === 'GAME_OVER') restartGame();
            }}
          />

          {/* Scanline Overlay */}
          {scanlines && (
            <div className="pointer-events-none absolute inset-0 scanline-overlay z-10 opacity-70" />
          )}

          {/* CRT Radial Vignette */}
          <div className="pointer-events-none absolute inset-0 crt-vignette z-10" />
        </div>

        {/* Quick Action Bar under Screen */}
        <div className="mt-3 flex items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-2">
            {gameStatus === 'MENU' && (
              <button
                onClick={startGame}
                className="px-4 py-2 font-mono text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-fuchsia-400 hover:from-cyan-300 hover:to-fuchsia-300 active:scale-95 rounded transition-all shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
              >
                INSERT COIN / START
              </button>
            )}

            {gameStatus === 'PLAYING' && (
              <button
                onClick={() => {
                  gameStateRef.current.status = 'PAUSED';
                  setGameStatus('PAUSED');
                }}
                className="px-3 py-1.5 font-mono text-xs text-fuchsia-200 bg-purple-900/60 hover:bg-purple-800/80 border border-fuchsia-500/40 rounded transition-all cursor-pointer"
              >
                PAUSE [P]
              </button>
            )}

            {gameStatus === 'PAUSED' && (
              <button
                onClick={() => {
                  gameStateRef.current.status = 'PLAYING';
                  setGameStatus('PLAYING');
                }}
                className="px-3 py-1.5 font-mono text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded transition-all cursor-pointer shadow-[0_0_10px_#22d3ee]"
              >
                RESUME [P]
              </button>
            )}

            {gameStatus === 'GAME_OVER' && (
              <button
                onClick={restartGame}
                className="px-4 py-2 font-mono text-xs font-bold text-black bg-gradient-to-r from-fuchsia-400 to-cyan-400 hover:from-fuchsia-300 hover:to-cyan-300 active:scale-95 rounded transition-all shadow-[0_0_14px_rgba(244,63,94,0.4)] cursor-pointer"
              >
                PLAY AGAIN
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-fuchsia-300/70 text-[11px] font-mono">
            <span>[←][→] Move</span>
            <span>[SPACE] Fire</span>
            <span>[P] Pause</span>
          </div>
        </div>

        {/* Mobile / Touch Arcade Controller */}
        <div className="mt-3 pt-3 border-t border-fuchsia-500/20 sm:hidden flex items-center justify-between gap-4 select-none touch-none">
          {/* D-Pad Left/Right */}
          <div className="flex items-center gap-2">
            <button
              onPointerDown={handleTouchLeftStart}
              onPointerUp={handleTouchLeftEnd}
              onPointerLeave={handleTouchLeftEnd}
              className="w-14 h-14 flex items-center justify-center font-bold text-lg text-cyan-300 bg-purple-900/80 active:bg-cyan-500 active:text-black border border-cyan-400/50 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-colors"
              aria-label="Move Left"
            >
              ◀
            </button>
            <button
              onPointerDown={handleTouchRightStart}
              onPointerUp={handleTouchRightEnd}
              onPointerLeave={handleTouchRightEnd}
              className="w-14 h-14 flex items-center justify-center font-bold text-lg text-cyan-300 bg-purple-900/80 active:bg-cyan-500 active:text-black border border-cyan-400/50 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-colors"
              aria-label="Move Right"
            >
              ▶
            </button>
          </div>

          {/* Fire Button */}
          <button
            onPointerDown={handleTouchFire}
            className="flex-1 max-w-[140px] h-14 flex items-center justify-center font-mono font-bold text-sm tracking-widest text-black bg-gradient-to-r from-pink-500 to-fuchsia-500 active:scale-95 active:brightness-125 border border-pink-300 rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all"
          >
            FIRE
          </button>
        </div>
      </div>
    </div>
  );
};
