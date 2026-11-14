// Fold Paddle Ball (components/FoldPaddleBall.vue): a little game for iPhone Duo's inner screen, where the fold
// is the net. You against the computer, first to WIN_SCORE.
//
// The rules work on a plain court, whatever way the phone is held: the ball travels along `u`,
// from your paddle at u = 0 to the computer's at u = length, and the paddles slide along `v`,
// across the court's breadth. The component maps that onto the screen (you on the left or at
// the bottom). Everything is in CSS pixels and seconds, and step() is pure: same state, same
// result.

export const WIN_SCORE = 5
const PADDLE_DEPTH = 14 // how far in from each end the paddles' faces are
const SERVE_DELAY = 0.8 // seconds before the ball is served again after a point
const START_SPEED = 0.55 // court lengths per second
const MAX_SPEED = 1.5
const SPEED_UP = 1.06 // per hit
const YOUR_SPEED = 2.2 // court breadths per second, toward where you point
const CPU_SPEED = 0.62 // slower than you: the computer can be beaten
const MAX_ANGLE = Math.PI / 3.2 // how sharply a hit off a paddle's edge goes

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// serveTo: 1 serves toward the computer, -1 toward you
const serve = (state, serveTo) => {
  const { length, breadth } = state
  const speed = START_SPEED * length
  // A gentle angle, alternating so serves aren't all the same
  const angle = (state.serves % 2 ? 1 : -1) * 0.35
  return {
    ...state,
    ball: { u: length / 2, v: breadth / 2, du: Math.cos(angle) * speed * serveTo, dv: Math.sin(angle) * speed, r: state.ball.r },
    wait: SERVE_DELAY,
    serves: state.serves + 1
  }
}

export function newGame({ length, breadth }) {
  const paddle = clamp(breadth * 0.2, 48, 140)
  return serve(
    {
      length,
      breadth,
      ball: { r: clamp(Math.min(length, breadth) * 0.018, 6, 11) },
      you: { v: breadth / 2, size: paddle },
      cpu: { v: breadth / 2, size: paddle },
      score: { you: 0, cpu: 0 },
      winner: null,
      serves: 0,
      wait: 0
    },
    1
  )
}

// Moves a paddle toward a spot along the breadth, at most `speed` per second
const slide = (paddle, target, speed, dt, breadth) => {
  const half = paddle.size / 2
  const goal = clamp(target, half, breadth - half)
  const step = clamp(goal - paddle.v, -speed * dt, speed * dt)
  return { ...paddle, v: paddle.v + step }
}

// Off a paddle: back the other way, angled by where it hit, a little faster
const hit = (ball, paddle, toward) => {
  const offset = clamp((ball.v - paddle.v) / (paddle.size / 2), -1, 1)
  const speed = Math.hypot(ball.du, ball.dv) * SPEED_UP // capped at MAX_SPEED in step()
  const angle = offset * MAX_ANGLE
  return { ...ball, du: Math.cos(angle) * speed * toward, dv: Math.sin(angle) * speed }
}

// One frame. input.target: where you're pointing along the breadth (null: stay put)
export function step(state, dt, input = {}) {
  if (state.winner) return state
  dt = clamp(dt, 0, 0.05) // a long frame (a hidden tab) doesn't teleport the ball
  const { length, breadth } = state
  const maxSpeed = MAX_SPEED * length

  const you = input.target == null ? state.you : slide(state.you, input.target, YOUR_SPEED * breadth, dt, breadth)
  // The computer follows the ball only while it's coming its way, and drifts back to the middle
  const coming = state.ball.du > 0 && state.wait <= 0
  const cpu = slide(state.cpu, coming ? state.ball.v : breadth / 2, CPU_SPEED * breadth, dt, breadth)

  if (state.wait > 0) return { ...state, you, cpu, wait: Math.max(0, state.wait - dt) }

  let ball = { ...state.ball, u: state.ball.u + state.ball.du * dt, v: state.ball.v + state.ball.dv * dt }

  // Off the sides
  if (ball.v < ball.r) ball = { ...ball, v: 2 * ball.r - ball.v, dv: Math.abs(ball.dv) }
  if (ball.v > breadth - ball.r) ball = { ...ball, v: 2 * (breadth - ball.r) - ball.v, dv: -Math.abs(ball.dv) }

  const reaches = paddle => Math.abs(ball.v - paddle.v) <= paddle.size / 2 + ball.r

  // Your end
  if (ball.du < 0 && ball.u - ball.r <= PADDLE_DEPTH) {
    if (reaches(you)) ball = { ...hit(ball, you, 1), u: PADDLE_DEPTH + ball.r }
    else if (ball.u < -ball.r) return point({ ...state, you, cpu }, 'cpu')
  }
  // The computer's end
  if (ball.du > 0 && ball.u + ball.r >= length - PADDLE_DEPTH) {
    if (reaches(cpu)) ball = { ...hit(ball, cpu, -1), u: length - PADDLE_DEPTH - ball.r }
    else if (ball.u > length + ball.r) return point({ ...state, you, cpu }, 'you')
  }

  // Never faster than MAX_SPEED
  const speed = Math.hypot(ball.du, ball.dv)
  if (speed > maxSpeed) ball = { ...ball, du: (ball.du / speed) * maxSpeed, dv: (ball.dv / speed) * maxSpeed }

  return { ...state, you, cpu, ball }
}

const point = (state, who) => {
  const score = { ...state.score, [who]: state.score[who] + 1 }
  const winner = score[who] >= WIN_SCORE ? who : null
  // The one who lost the point serves... toward the one who won it
  const next = serve({ ...state, score }, who === 'you' ? -1 : 1)
  return winner ? { ...next, winner, wait: 0 } : next
}

export const scoreText = ({ score, winner }) =>
  winner ? (winner === 'you' ? `You win ${score.you}–${score.cpu}! 🎉` : `The computer wins ${score.cpu}–${score.you}`) : `You ${score.you} – ${score.cpu} Computer`
