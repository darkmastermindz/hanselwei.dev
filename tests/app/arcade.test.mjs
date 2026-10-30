import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GAMES } from '../../utils/arcade.mjs'
import * as bricks from '../../utils/brickBash.mjs'
import * as aliens from '../../utils/alienAttack.mjs'

const court = { width: 800, height: 600 }
const run = (rules, state, seconds, input) => {
  for (let t = 0; t < seconds; t += 1 / 60) state = rules.step(state, 1 / 60, input)
  return state
}

test('the arcade offers all three games, each with a name and how to play', () => {
  assert.deepEqual(GAMES.map(g => g.id), ['paddle', 'bricks', 'aliens'])
  for (const g of GAMES) assert.ok(g.name && g.emoji && g.howTo, g.id)
})

test('Brick Bash: a new game, the ball on the paddle until it goes', () => {
  const g = bricks.newGame(court)
  assert.ok(g.bricks.length >= 25)
  assert.equal(g.lives, bricks.LIVES)
  assert.equal(g.ball.x, g.paddle.x)
  const moved = bricks.step(g, 0.05, { target: 100 })
  assert.equal(moved.ball.x, moved.paddle.x, 'the ball rides the paddle')
  const launched = run(bricks, g, 1)
  assert.ok(launched.ball.dy < 0, 'then goes up')
  assert.equal(bricks.scoreText(g), 'Score 0 · 3 lives')
})

test('Brick Bash: a brick hit is knocked out, scores, and turns the ball back', () => {
  let g = { ...bricks.newGame(court), wait: 0 }
  const brick = g.bricks.at(-1)
  g = { ...g, ball: { ...g.ball, x: brick.x + brick.w / 2, y: brick.y + brick.h + g.ball.r + 2, dx: 0, dy: -400 } }
  const after = bricks.step(g, 0.02)
  assert.equal(after.bricks.length, g.bricks.length - 1)
  assert.ok(!after.bricks.includes(brick))
  assert.ok(after.score > 0)
  assert.ok(after.ball.dy > 0, 'back down')
})

test('Brick Bash: the paddle sends the ball back up, angled by where it hits', () => {
  let g = { ...bricks.newGame(court), wait: 0 }
  g = { ...g, ball: { ...g.ball, x: g.paddle.x + 20, y: g.paddle.y - g.ball.r - 1, dx: 0, dy: 400 } }
  const after = bricks.step(g, 0.02)
  assert.ok(after.ball.dy < 0)
  assert.ok(after.ball.dx > 0, 'right of centre goes right')
})

test('Brick Bash: a miss costs a life, the last one ends it, and clearing every brick wins', () => {
  let g = { ...bricks.newGame(court), wait: 0 }
  g = { ...g, ball: { ...g.ball, x: 10, y: court.height - 5, dx: 0, dy: 600 }, paddle: { ...g.paddle, x: 700 } }
  const missed = run(bricks, g, 0.2)
  assert.equal(missed.lives, bricks.LIVES - 1)
  assert.ok(missed.wait > 0, 'back on the paddle')
  const last = run(bricks, { ...g, lives: 1 }, 0.2)
  assert.equal(last.winner, 'lost')
  assert.equal(bricks.step(last, 1), last, 'nothing moves once it is over')
  const one = g.bricks[0]
  const won = bricks.step({ ...g, bricks: [one], ball: { ...g.ball, x: one.x + one.w / 2, y: one.y + one.h + g.ball.r - 1, dx: 0, dy: -300 } }, 0.01)
  assert.equal(won.winner, 'you')
  assert.match(bricks.scoreText(won), /^All the bricks!/)
})

test('Alien Attack: the block marches, and steps down and back at the edge', () => {
  const g = { ...aliens.newGame(court), wait: 0 }
  const later = aliens.step(g, 0.05)
  assert.ok(later.block.x > g.block.x)
  const edge = run(aliens, g, 20)
  assert.ok(edge.block.y > g.block.y, 'stepped down')
  assert.equal(edge.winner, null)
})

test('Alien Attack: one shot at a time, and it knocks out the invader it meets', () => {
  let g = { ...aliens.newGame(court), wait: 0, bombIn: 99 }
  const target = g.invaders.at(-1)
  const box = aliens.invaderBox(g, target)
  g = { ...g, ship: { ...g.ship, x: box.x + box.w / 2 } }
  const fired = aliens.step(g, 0.01, { fire: true })
  assert.ok(fired.shot)
  const again = aliens.step(fired, 0.01, { fire: true })
  assert.ok(again.shot.y < fired.shot.y, 'the same shot, further up')
  const hit = aliens.step({ ...g, shot: { x: box.x + box.w / 2, y: box.y + box.h + 2 } }, 0.01)
  assert.equal(hit.invaders.length, g.invaders.length - 1)
  assert.ok(!hit.invaders.includes(target))
  assert.equal(hit.shot, null)
  assert.ok(hit.score > 0)
})

test('Alien Attack: their bombs come from the bottom row and cost a life', () => {
  const g = { ...aliens.newGame(court, 42), wait: 0, bombIn: 0 }
  const bombed = aliens.step(g, 0.01)
  assert.equal(bombed.bombs.length, 1)
  assert.equal(aliens.step(g, 0.01).bombs[0].x, bombed.bombs[0].x, 'the same seed, the same bomb')
  const ship = bombed.ship
  const hit = aliens.step({ ...bombed, bombIn: 99, bombs: [{ x: ship.x, y: ship.y - ship.h - 1 }] }, 0.01)
  assert.equal(hit.lives, aliens.LIVES - 1)
  assert.deepEqual(hit.bombs, [])
  assert.ok(hit.wait > 0)
  const last = aliens.step({ ...bombed, lives: 1, bombIn: 99, bombs: [{ x: ship.x, y: ship.y - ship.h - 1 }] }, 0.01)
  assert.equal(last.winner, 'lost')
})

test('Alien Attack: shooting the last one wins; letting them land loses', () => {
  let g = { ...aliens.newGame(court), wait: 0, bombIn: 99 }
  const one = g.invaders[0]
  const box = aliens.invaderBox(g, one)
  const won = aliens.step({ ...g, invaders: [one], shot: { x: box.x + box.w / 2, y: box.y + box.h } }, 0.001)
  assert.equal(won.winner, 'you')
  assert.match(aliens.scoreText(won), /^Every invader!/)
  const landed = aliens.step({ ...g, block: { ...g.block, y: g.ship.y } }, 0.01)
  assert.equal(landed.winner, 'lost')
})

test('a long frame (a hidden tab) never moves things more than a short one would', () => {
  let b = { ...bricks.newGame(court), wait: 0 }
  b = { ...b, ball: { ...b.ball, x: 400, y: 400, dx: 0, dy: -300 } }
  assert.ok(400 - bricks.step(b, 5).ball.y <= 300 * 0.05 + 1e-9)
  const i = { ...aliens.newGame(court), wait: 0 }
  assert.ok(aliens.step(i, 5).block.x - i.block.x <= 800 * 0.06 * 0.05 + 1e-9)
})

test('the court can start lower, below however much text sits above it', () => {
  const b = bricks.newGame({ ...court, top: 120 })
  assert.equal(Math.min(...b.bricks.map(x => x.y)), 120)
  assert.equal(Math.min(...bricks.newGame(court).bricks.map(x => x.y)), 64, 'the default')
  const a = aliens.newGame({ ...court, top: 120 })
  assert.equal(a.block.y, 120)
  assert.ok(Math.min(...a.invaders.map(i => aliens.invaderBox(a, i).y)) >= 120)
})
