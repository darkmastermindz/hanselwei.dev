// Space Invaders (components/LostArcade.vue, on the 404 page): a block of invaders marches side to
// side, stepping down at each edge. Shoot them all before they land; their bombs cost a life.
//
// Like utils/foldPong.mjs, everything is in CSS pixels and seconds (x across, y down, the
// screen's own), and step() is pure: same state, same result. Which invader drops the next bomb
// comes from a seeded random number kept in the state, so a game can be replayed exactly.

export const LIVES = 3
const ROWS = 4
const TOP = 64 // room for the score above the invaders
const START_DELAY = 0.8 // seconds before anything moves, at the start and after a hit
const MARCH_SPEED = 0.06 // court widths per second with all of them left...
const MARCH_SPEED_LAST = 0.45 // ...and with the last one
const SHIP_SPEED = 1.6 // court widths per second, toward where you point
const SHOT_SPEED = 1.3 // court heights per second
const BOMB_SPEED = 0.4
const BOMB_EVERY = 1.1 // seconds between bombs

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// The next seeded random number in [0, 1), and the seed after it (a small linear congruential
// generator: plenty for picking who drops a bomb)
const random = seed => {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return [next / 2 ** 32, next]
}

export function newGame({ width, height }, seed = 1) {
  const cols = clamp(Math.floor(width / 56), 5, 10)
  const cell = Math.min(52, (width * 0.72) / cols)
  const invaders = []
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < cols; col++) invaders.push({ row, col })
  return {
    width,
    height,
    cell,
    total: invaders.length,
    invaders,
    // The block's top-left corner, and which way it's marching
    block: { x: (width - cols * cell) / 2, y: TOP, dir: 1 },
    ship: { x: width / 2, y: height - 44, w: clamp(width * 0.08, 30, 48), h: 16 },
    shot: null,
    bombs: [],
    bombIn: BOMB_EVERY,
    seed: seed >>> 0,
    score: 0,
    lives: LIVES,
    winner: null,
    wait: START_DELAY
  }
}

// Where an invader is on the screen: its box, a little smaller than its cell
export const invaderBox = (state, { row, col }) => {
  const { cell, block } = state
  const w = cell * 0.66
  const h = cell * 0.48
  return { x: block.x + col * cell + (cell - w) / 2, y: block.y + row * cell * 0.75, w, h }
}

const inside = (point, box) => point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h

// One frame. input.target: where you're pointing across the court (null: stay put);
// input.fire: shoot (one shot on the screen at a time, as in the arcade)
export function step(state, dt, input = {}) {
  if (state.winner) return state
  dt = clamp(dt, 0, 0.05) // a long frame (a hidden tab) doesn't teleport anything
  const { width, height, cell } = state

  let ship = state.ship
  if (input.target != null) {
    const half = ship.w / 2
    const goal = clamp(input.target, half, width - half)
    const move = SHIP_SPEED * width * dt
    ship = { ...ship, x: ship.x + clamp(goal - ship.x, -move, move) }
  }

  if (state.wait > 0) return { ...state, ship, wait: Math.max(0, state.wait - dt) }

  // The march: faster as there are fewer of them, down a step and back at each edge
  const left = Math.min(...state.invaders.map(i => i.col))
  const right = Math.max(...state.invaders.map(i => i.col)) + 1
  const speed = (MARCH_SPEED + (MARCH_SPEED_LAST - MARCH_SPEED) * (1 - state.invaders.length / state.total)) * width
  let block = { ...state.block, x: state.block.x + state.block.dir * speed * dt }
  const margin = 8
  if (block.x + left * cell < margin || block.x + right * cell > width - margin) {
    block = { x: state.block.x, y: state.block.y + cell * 0.375, dir: -state.block.dir }
  }
  let next = { ...state, ship, block }

  // Your shot: up the screen, knocking out the first invader it meets
  let shot = state.shot ? { ...state.shot, y: state.shot.y - SHOT_SPEED * height * dt } : null
  if (!shot && input.fire) shot = { x: ship.x, y: ship.y - ship.h }
  let { invaders, score } = state
  if (shot) {
    const hit = invaders.find(i => inside(shot, invaderBox(next, i)))
    if (hit) {
      invaders = invaders.filter(i => i !== hit)
      score += 10 * (ROWS - hit.row)
      shot = null
    } else if (shot.y < 0) shot = null
  }
  next = { ...next, invaders, score, shot }
  if (!invaders.length) return { ...next, winner: 'you' }

  // Landed: the game is over
  const lowest = Math.max(...invaders.map(i => invaderBox(next, i)).map(b => b.y + b.h))
  if (lowest >= ship.y - ship.h) return { ...next, winner: 'lost' }

  // Their bombs: one every so often, from the bottom invader of a column picked at random
  let { bombIn, seed } = state
  let bombs = state.bombs.map(b => ({ ...b, y: b.y + BOMB_SPEED * height * dt })).filter(b => b.y < height)
  bombIn -= dt
  if (bombIn <= 0) {
    const cols = [...new Set(invaders.map(i => i.col))]
    let r
    ;[r, seed] = random(seed)
    const col = cols[Math.floor(r * cols.length)]
    const bottom = invaders.filter(i => i.col === col).reduce((a, b) => (b.row > a.row ? b : a))
    const box = invaderBox(next, bottom)
    bombs = [...bombs, { x: box.x + box.w / 2, y: box.y + box.h }]
    bombIn = BOMB_EVERY
  }
  next = { ...next, bombs, bombIn, seed }

  // A bomb on your ship: a life lost, the sky cleared, a moment to get ready
  const shipBox = { x: ship.x - ship.w / 2, y: ship.y - ship.h, w: ship.w, h: ship.h }
  if (bombs.some(b => inside(b, shipBox))) {
    const lives = state.lives - 1
    next = { ...next, lives, bombs: [], shot: null }
    return lives ? { ...next, wait: START_DELAY } : { ...next, winner: 'lost' }
  }

  return next
}

export const scoreText = ({ score, lives, winner }) =>
  winner === 'you'
    ? `Every invader! Score ${score} 🎉`
    : winner === 'lost'
      ? `Game over · Score ${score}`
      : `Score ${score} · ${lives} ${lives === 1 ? 'life' : 'lives'}`
