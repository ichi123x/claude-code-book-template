const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
const scoreEl = /** @type {HTMLElement} */ (document.getElementById('score'));
const livesEl = /** @type {HTMLElement} */ (document.getElementById('lives'));
const levelEl = /** @type {HTMLElement} */ (document.getElementById('level'));
const messageEl = /** @type {HTMLElement} */ (document.getElementById('message'));

const W = canvas.width;
const H = canvas.height;

// ゲーム定数
const PADDLE_W = 80;
const PADDLE_H = 10;
const PADDLE_Y = H - 30;
const BALL_R = 7;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_W = 42;
const BRICK_H = 16;
const BRICK_PAD = 4;
const BRICK_OFFSET_X = (W - (BRICK_COLS * (BRICK_W + BRICK_PAD) - BRICK_PAD)) / 2;
const BRICK_OFFSET_Y = 50;

const ROW_COLORS = ['#ff4d6d', '#ff9f43', '#ffd32a', '#0be881', '#48dbfb'];

// ゲーム状態
let state = 'idle'; // idle | playing | paused | gameover | cleared
let score = 0;
let lives = 3;
let level = 1;
let paddleX = W / 2 - PADDLE_W / 2;
let ballX = 0, ballY = 0, ballDX = 0, ballDY = 0;
/** @type {Array<{x: number, y: number, alive: boolean, color: string, points: number}>} */
let bricks = [];
/** @type {Record<string, boolean>} */
let keys = {};
let frame = 0;

function initBall() {
  ballX = paddleX + PADDLE_W / 2;
  ballY = PADDLE_Y - BALL_R - 1;
  const angle = (Math.random() * 60 + 60) * (Math.PI / 180); // 60〜120度
  const speed = 3.5 + (level - 1) * 0.4;
  ballDX = Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1);
  ballDY = -Math.abs(Math.sin(angle) * speed);
}

function initBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_OFFSET_X + c * (BRICK_W + BRICK_PAD),
        y: BRICK_OFFSET_Y + r * (BRICK_H + BRICK_PAD),
        alive: true,
        color: ROW_COLORS[r],
        points: (BRICK_ROWS - r) * 10,
      });
    }
  }
}

function startGame() {
  score = 0;
  lives = 3;
  level = 1;
  paddleX = W / 2 - PADDLE_W / 2;
  initBricks();
  initBall();
  state = 'playing';
  messageEl.textContent = '';
  updateHUD();
}

function nextLevel() {
  level++;
  paddleX = W / 2 - PADDLE_W / 2;
  initBricks();
  initBall();
  state = 'playing';
  messageEl.textContent = '';
  updateHUD();
}

function updateHUD() {
  scoreEl.textContent = String(score);
  livesEl.textContent = String(lives);
  levelEl.textContent = String(level);
}

// パドル移動速度
const PADDLE_SPEED = 6;

function update() {
  if (state !== 'playing') return;

  // キーボード操作
  if (keys['ArrowLeft'] || keys['a']) paddleX = Math.max(0, paddleX - PADDLE_SPEED);
  if (keys['ArrowRight'] || keys['d']) paddleX = Math.min(W - PADDLE_W, paddleX + PADDLE_SPEED);

  // ボール移動
  ballX += ballDX;
  ballY += ballDY;

  // 左右壁反射
  if (ballX - BALL_R <= 0) { ballX = BALL_R; ballDX = Math.abs(ballDX); }
  if (ballX + BALL_R >= W) { ballX = W - BALL_R; ballDX = -Math.abs(ballDX); }
  // 上壁反射
  if (ballY - BALL_R <= 0) { ballY = BALL_R; ballDY = Math.abs(ballDY); }

  // ボールがパドルに当たる
  if (
    ballDY > 0 &&
    ballY + BALL_R >= PADDLE_Y &&
    ballY + BALL_R <= PADDLE_Y + PADDLE_H &&
    ballX >= paddleX - BALL_R &&
    ballX <= paddleX + PADDLE_W + BALL_R
  ) {
    // 当たった位置に応じて角度変化
    const hit = (ballX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
    const angle = hit * 60 * (Math.PI / 180); // 最大60度
    const speed = Math.hypot(ballDX, ballDY);
    ballDX = Math.sin(angle) * speed;
    ballDY = -Math.abs(Math.cos(angle) * speed);
    ballY = PADDLE_Y - BALL_R - 1;
  }

  // ボールが落ちた
  if (ballY - BALL_R > H) {
    lives--;
    updateHUD();
    if (lives <= 0) {
      state = 'gameover';
      messageEl.textContent = `ゲームオーバー！ スコア: ${score}  [スペース/クリックでリスタート]`;
    } else {
      initBall();
    }
    return;
  }

  // ブロック衝突判定
  for (const b of bricks) {
    if (!b.alive) continue;
    if (
      ballX + BALL_R > b.x &&
      ballX - BALL_R < b.x + BRICK_W &&
      ballY + BALL_R > b.y &&
      ballY - BALL_R < b.y + BRICK_H
    ) {
      b.alive = false;
      score += b.points;
      updateHUD();

      // どの面から当たったか判定
      const overlapLeft  = (ballX + BALL_R) - b.x;
      const overlapRight = (b.x + BRICK_W) - (ballX - BALL_R);
      const overlapTop   = (ballY + BALL_R) - b.y;
      const overlapBottom= (b.y + BRICK_H) - (ballY - BALL_R);
      const minH = Math.min(overlapLeft, overlapRight);
      const minV = Math.min(overlapTop, overlapBottom);
      if (minH < minV) ballDX = -ballDX;
      else ballDY = -ballDY;
      break;
    }
  }

  // 全ブロック消去でクリア
  if (bricks.every(b => !b.alive)) {
    state = 'cleared';
    messageEl.textContent = `レベル ${level} クリア！  [スペース/クリックで次へ]`;
  }
}

function draw() {
  frame++;
  ctx.clearRect(0, 0, W, H);

  // パドル
  ctx.fillStyle = '#a29bfe';
  ctx.beginPath();
  ctx.roundRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 5);
  ctx.fill();

  // ボール（0.1秒≒6フレームごとに七色切り替え）
  if (state === 'playing' || state === 'cleared' || state === 'gameover') {
    const RAINBOW = ['#ff0000','#ff7700','#ffff00','#00cc00','#0088ff','#4400cc','#cc00cc'];
    ctx.fillStyle = RAINBOW[Math.floor(frame / 6) % RAINBOW.length];
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
  }

  // ブロック
  for (const b of bricks) {
    if (!b.alive) continue;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, BRICK_W, BRICK_H, 3);
    ctx.fill();
    // ハイライト
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(b.x + 2, b.y + 2, BRICK_W - 4, 4, 2);
    ctx.fill();
  }

  // アイドル時のオーバーレイ
  if (state === 'idle') {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e0e0ff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ブロック崩し', W / 2, H / 2 - 20);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#aaf';
    ctx.fillText('スペース または クリック でスタート', W / 2, H / 2 + 20);
    ctx.textAlign = 'left';
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// マウス操作
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, mx - PADDLE_W / 2));
});

// タッチ操作
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const tx = e.touches[0].clientX - rect.left;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, tx - PADDLE_W / 2));
}, { passive: false });

// キーボード
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') {
    e.preventDefault();
    if (state === 'idle' || state === 'gameover') startGame();
    else if (state === 'cleared') nextLevel();
  }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// クリック/タップでスタート
canvas.addEventListener('click', () => {
  if (state === 'idle' || state === 'gameover') startGame();
  else if (state === 'cleared') nextLevel();
});

// roundRect のポリフィル（Safari 古いバージョン対策）
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h, /** @type {number} */ r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
  };
}

// 起動
initBricks();
initBall();
loop();
