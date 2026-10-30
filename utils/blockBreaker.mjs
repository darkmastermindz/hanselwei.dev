// Block Breaker (components/LostArcade.vue, on the 404 page): knock out every brick with the ball,
// bouncing it off your paddle along the bottom. Three lives.
//
// Like utils/foldPong.mjs, everything is in CSS pixels and seconds on a plain court (x across,
// y down, the screen's own), and step() is pure: same state, same result.

export const LIVES = 3
const ROWS = 5
const TOP = 64 // room for the score above the bricks
const GAP = 4
const LAUNCH_DELAY = 0.8 // seconds the ball sits on the paddle before it goes
const START_SPEED = 0.55 // court heights per second
const MAX_SPEED = 1.1
const SPEED_UP = 1.015 // per brick
const PADDLE_SPEED = 2.2 // court widths per second, toward where you point
const MAX_ANGLE = Math.PI / 3 // how sharply a hit off the paddle's edge goes (from straight up)

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// The ball back on the paddle, waiting to go
const onPaddle = state => ({
  ...state,
  ball: { ...state.ball, x: state.paddle.x, y: state.paddle.y - state.ball.r, dx: 0, dy: 0 },
  wait: LAUNCH_DELAY
})

export function newGame({ width, height }) {
  const cols = clamp(Math.floor(width / 72), 5, 12)
  const brickW = (width - GAP * (cols + 1)) / cols
  const brickH = clamp(height * 0.035, 14, 24)
  const bricks = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < cols; col++) {
      bricks.push({ x: GAP + col * (brickW + GAP), y: TOP + row * (brickH + GAP), w: brickW, h: brickH, row })
    }
  }
  return onPaddle({
    width,
    height,
    paddle: { x: width / 2, y: height - 40, w: clamp(width * 0.18, 64, 150), h: 10 },
    ball: { r: clamp(Math.min(width, height) * 0.016, 6, 10) },
    bricks,
    score: 0,
    lives: LIVES,
    winner: null,
    wait: 0
  })
}

const launch = state => {
  const speed = START_SPEED * state.height
  // A little to one side, so the first shot isn't straight back down onto the paddle
  return { ...state, ball: { ...state.ball, dx: speed * 0.35, dy: -speed * Math.sqrt(1 - 0.35 ** 2) } }
}

// Off the paddle: back up, angled by where it hit, at the same speed
const offPaddle = (ball, paddle) => {
  const offset = clamp((ball.x - paddle.x) / (paddle.w / 2), -1, 1)
  const speed = Math.hypot(ball.dx, ball.dy)
  const angle = offset * MAX_ANGLE
  return { ...ball, y: paddle.y - ball.r, dx: Math.sin(angle) * speed, dy: -Math.cos(angle) * speed }
}

const touches = (ball, b) => {
  const nx = clamp(ball.x, b.x, b.x + b.w)
  const ny = clamp(ball.y, b.y, b.y + b.h)
  return (ball.x - nx) ** 2 + (ball.y - ny) ** 2 <= ball.r ** 2
}

// One frame. input.target: where you're pointing across the court (null: stay put)
export function step(state, dt, input = {}) {
  if (state.winner) return state
  dt = clamp(dt, 0, 0.05) // a long frame (a hidden tab) doesn't teleport the ball
  const { width, height } = state

  let paddle = state.paddle
  if (input.target != null) {
    const half = paddle.w / 2
    const goal = clamp(input.target, half, width - half)
    const move = PADDLE_SPEED * width * dt
    paddle = { ...paddle, x: paddle.x + clamp(goal - paddle.x, -move, move) }
  }

  if (state.wait > 0) {
    const wait = Math.max(0, state.wait - dt)
    const next = { ...state, paddle, ball: { ...state.ball, x: paddle.x }, wait }
    return wait ? next : launch(next)
  }

  let ball = { ...state.ball, x: state.ball.x + state.ball.dx * dt, y: state.ball.y + state.ball.dy * dt }

  // Off the sides and the top
  if (ball.x < ball.r) ball = { ...ball, x: 2 * ball.r - ball.x, dx: Math.abs(ball.dx) }
  if (ball.x > width - ball.r) ball = { ...ball, x: 2 * (width - ball.r) - ball.x, dx: -Math.abs(ball.dx) }
  if (ball.y < ball.r) ball = { ...ball, y: 2 * ball.r - ball.y, dy: Math.abs(ball.dy) }

  // The paddle
  if (ball.dy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h && Math.abs(ball.x - paddle.x) <= paddle.w / 2 + ball.r) {
    ball = offPaddle(ball, paddle)
  }

  // A brick: knocked out, and the ball turns back the way it came in (across or up and down,
  // whichever way it went in least)
  let { bricks, score } = state
  const brick = bricks.find(b => touches(ball, b))
  if (brick) {
    bricks = bricks.filter(b => b !== brick)
    score += ROWS - brick.row
    const inX = Math.min(ball.x + ball.r - brick.x, brick.x + brick.w - (ball.x - ball.r))
    const inY = Math.min(ball.y + ball.r - brick.y, brick.y + brick.h - (ball.y - ball.r))
    ball = inX < inY ? { ...ball, dx: -ball.dx } : { ...ball, dy: -ball.dy }
    const speed = Math.hypot(ball.dx, ball.dy)
    const faster = Math.min(speed * SPEED_UP, MAX_SPEED * height) / speed
    ball = { ...ball, dx: ball.dx * faster, dy: ball.dy * faster }
    if (!bricks.length) return { ...state, paddle, ball, bricks, score, winner: 'you' }
  }

  // Missed: a life lost
  if (ball.y - ball.r > height) {
    const lives = state.lives - 1
    const next = { ...state, paddle, ball, bricks, score, lives }
    return lives ? onPaddle(next) : { ...next, winner: 'lost' }
  }

  return { ...state, paddle, ball, bricks, score }
}

export const scoreText = ({ score, lives, winner }) =>
  winner === 'you'
    ? `All the bricks! Score ${score} 🎉`
    : winner === 'lost'
      ? `Game over · Score ${score}`
      : `Score ${score} · ${lives} ${lives === 1 ? 'life' : 'lives'}`
