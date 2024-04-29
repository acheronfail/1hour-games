const canvas = <HTMLCanvasElement>document.getElementById('screen');
const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');

const { width, height } = canvas;

/* types */

type Position = [number, number];
type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface Particle {
  color: string;
  blinking: boolean;
  position: Position;
}

enum ParticleBehaviour {
  Still,
  Down,
}

interface Player {
  shots: Position[];
  position: Position;
}

interface Enemy {
  // TODO: not color, but `kind`
  color: string;
  row: number;
  col: number;
  position: Position;
}

enum EnemyBehaviour {
  Sway,
  Expand,
}

/* utils */

function randomBetween(low: number, high: number): number {
  const length = high - low + 1;
  return high - Math.floor(Math.random() * length);
}
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isInBounds([x, y]: Position): boolean {
  if (x < 0 || x > width) return false;
  if (y < 0 || y > height) return false;
  return true;
}

function movePosition(pos: Position, [dx, dy]: Position) {
  let [x, y] = pos;
  x += dx;
  y += dy;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x > width) x = width;
  if (y > height) y = height;
  pos[0] = x;
  pos[1] = y;
}

function enemyPosition(row: number, col: number): Position {
  const xPadding = width * 0.1;
  const x = xPadding;
  const y = 0;
  const w = width - xPadding * 2;
  const h = height / 2;
  return [Math.floor((w / 10) * (col + 1) + x), Math.floor((h / 5) * (row + 1) + y)];
}

function rectSquare([x, y]: Position, size: number): Rect {
  const half = size / 2;
  return {
    x: x - half,
    y: y - half,
    width: size,
    height: size,
  };
}

function rectCollision(r1: Rect, r2: Rect): boolean {
  return !(r1.x + r1.width < r2.x || r1.x > r2.x + r2.width || r1.y + r1.height < r2.y || r1.y > r2.y + r2.height);
}

/* state */

let counter4 = 0;
let counter8 = 0;
let counter16 = 0;
let paused = false;

let particleBehaviour: ParticleBehaviour = ParticleBehaviour.Down;
const particleSize = 3;
const particles: Particle[] = new Array(100).fill(0).map((x) => ({
  color: randomFrom(['#ff0000', '#ffaa00', '#ffff00', '#ff00ff', '#00ffff', '#0000ff']),
  blinking: Boolean(randomBetween(0, 1)),
  position: [randomBetween(0, width), randomBetween(0, height)],
}));

const shotSize = 10;
const shotLimit = 2;
const shotSpeed = 5;
let shotFired = false;

const playerSize = 30;
const playerSpeed = 2;
const player: Player = {
  shots: [],
  position: [Math.floor(width / 2), height - playerSize],
};

const enemySize = 30;
const enemyBehaviour: EnemyBehaviour = EnemyBehaviour.Sway;
const enemies: Enemy[] = [
  ...[3, 4, 5, 6].map((x) => ({ color: '#aaff00', position: enemyPosition(0, x), row: 0, col: x })),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((x) => ({ color: '#ff0000', position: enemyPosition(1, x), row: 0, col: x })),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((x) => ({ color: '#ff0000', position: enemyPosition(2, x), row: 0, col: x })),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => ({ color: '#00aaff', position: enemyPosition(3, x), row: 0, col: x })),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => ({ color: '#00aaff', position: enemyPosition(4, x), row: 0, col: x })),
];

/* events */

const keysPressed: { [key: string]: true } = {};
window.addEventListener('keydown', (event) => {
  keysPressed[event.key] = true;
  if (event.key === 'p') paused = !paused;
});
window.addEventListener('keyup', (event) => {
  delete keysPressed[event.key];
  if (event.key === ' ' && shotFired) shotFired = false;
});
window.addEventListener('blur', () => (paused = true));

/* game loop */

function tick() {
  if (paused) return;

  // particles
  if (particleBehaviour === ParticleBehaviour.Down) {
    for (const particle of particles) {
      if (particle.position[1]++ >= height) particle.position[1] = -1;
    }
  }

  // enemies
  for (const enemy of enemies) {
    if (enemyBehaviour === EnemyBehaviour.Sway) {
      if (counter16 % 128 == 0) {
        const dir = counter16 + 128 <= 256 ? -1 : 1;
        movePosition(enemy.position, [dir * 10, 0]);
      }
    }
  }

  // player movement
  const { ArrowLeft, ArrowRight, [' ']: space } = keysPressed;
  if (ArrowLeft && !ArrowRight) movePosition(player.position, [-playerSpeed, 0]);
  if (!ArrowLeft && ArrowRight) movePosition(player.position, [+playerSpeed, 0]);

  // player shots
  for (let i = player.shots.length; i >= 0; --i) {
    const playerShot = player.shots[i];
    if (!playerShot) continue;
    playerShot[1] += -shotSpeed;
    for (let j = 0; j < enemies.length; ++j) {
      if (rectCollision(rectSquare(playerShot, shotSize), rectSquare(enemies[j].position, enemySize))) {
        player.shots.splice(i, 1);
        enemies.splice(j, 1);
        break;
      }
    }

    if (!isInBounds(playerShot)) player.shots.splice(i, 1);
  }

  // player fire
  if (space && shotFired === false && player.shots.length < shotLimit) {
    player.shots.push(player.position.slice() as Position);
    shotFired = true;
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  // particles
  for (const particle of particles) {
    if (particle.blinking && counter4 < 64) continue;
    const [x, y] = particle.position;
    ctx.fillStyle = particle.color;
    ctx.fillRect(x, y, particleSize, particleSize);
  }

  // player
  {
    const offset = playerSize / 2;
    // TODO: sprite
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.position[0] - offset, player.position[1] - offset, playerSize, playerSize);

    {
      const offset = shotSize / 2;
      for (const [x, y] of player.shots) {
        // TODO: sprite
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - offset, y - offset, shotSize, shotSize);
      }
    }
  }

  // enemies
  for (const enemy of enemies) {
    const offset = enemySize / 2;
    const [x, y] = enemy.position;
    // TODO: sprite
    ctx.fillStyle = enemy.color;
    ctx.fillRect(x - offset, y - offset, enemySize, enemySize);
  }

  // pause
  if (paused) {
    ctx.fillStyle = '#ff0000';
    ctx.fillText('PAUSED', width / 2, height / 2);
  }

  // update game state
  tick();
  if (++counter4 === 128) counter4 = 0;
  if (++counter8 === 256) counter8 = 0;
  if (++counter16 === 512) counter16 = 0;
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
