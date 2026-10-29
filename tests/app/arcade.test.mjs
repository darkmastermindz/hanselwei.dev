import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GAMES, pickGame } from '../../utils/arcade.mjs'
import * as blocks from '../../utils/blockBreaker.mjs'
import * as invaders from '../../utils/spaceInvaders.mjs'

const court = { width: 800, height: 600 }
const run = (rules, state, seconds, input) => {
  for (let t = 0; t < seconds; t += 1 / 60) state = rules.step(state, 1 / 60, input)
  return state
}

test('the 404 page picks one of the three games, whatever the random number', () => {
  assert.deepEqual(GAMES.map(g => g.id), ['pong', 'blocks', 'invaders'])
  assert.equal(pickGame(() => 0).id, 'pong')
  assert.equal(pickGame(() => 0.5).id, 'blocks')
  assert.equal(pickGame(() => 0.999).id, 'invaders')
  assert.equal(pickGame(() => 1).id, 'invaders', 'never past the end')
})

test('Block Breaker: a new game, the ball on the paddle until it goes', () => {
  const g = blocks.newGame(court)
  assert.ok(g.bricks.length >= 25)
  assert.equal(g.lives, blocks.LIVES)
  assert.equal(g.ball.x, g.paddle.x)
  const moved = blocks.step(g, 0.05, { target: 100 })
  assert.equal(moved.ball.x, moved.paddle.x, 'the ball rides the paddle')
  const launched = run(blocks, g, 1)
  assert.ok(launched.ball.dy < 0, 'then goes up')
  assert.equal(blocks.scoreText(g), 'Score 0 · 3 lives')
})

test('Block Breaker: a brick hit is knocked out, scores, and turns the ball back', () => {
  let g = { ...blocks.newGame(court), wait: 0 }
  const brick = g.bricks.at(-1)
  g = { ...g, ball: { ...g.ball, x: brick.x + brick.w / 2, y: brick.y + brick.h + g.ball.r + 2, dx: 0, dy: -400 } }
  const after = blocks.step(g, 0.02)
  assert.equal(after.bricks.length, g.bricks.length - 1)
  assert.ok(!after.bricks.includes(brick))
  assert.ok(after.score > 0)
  assert.ok(after.ball.dy > 0, 'back down')
})

test('Block Breaker: the paddle sends the ball back up, angled by where it hits', () => {
  let g = { ...blocks.newGame(court), wait: 0 }
  g = { ...g, ball: { ...g.ball, x: g.paddle.x + 20, y: g.paddle.y - g.ball.r - 1, dx: 0, dy: 400 } }
  const after = blocks.step(g, 0.02)
  assert.ok(after.ball.dy < 0)
  assert.ok(after.ball.dx > 0, 'right of centre goes right')
})

test('Block Breaker: a miss costs a life, the last one ends it, and clearing every brick wins', () => {
  let g = { ...blocks.newGame(court), wait: 0 }
  g = { ...g, ball: { ...g.ball, x: 10, y: court.height - 5, dx: 0, dy: 600 }, paddle: { ...g.paddle, x: 700 } }
  const missed = run(blocks, g, 0.2)
  assert.equal(missed.lives, blocks.LIVES - 1)
  assert.ok(missed.wait > 0, 'back on the paddle')
  const last = run(blocks, { ...g, lives: 1 }, 0.2)
  assert.equal(last.winner, 'lost')
  assert.equal(blocks.step(last, 1), last, 'nothing moves once it is over')
  const one = g.bricks[0]
  const won = blocks.step({ ...g, bricks: [one], ball: { ...g.ball, x: one.x + one.w / 2, y: one.y + one.h + g.ball.r - 1, dx: 0, dy: -300 } }, 0.01)
  assert.equal(won.winner, 'you')
  assert.match(blocks.scoreText(won), /^All the bricks!/)
})

test('Space Invaders: the block marches, and steps down and back at the edge', () => {
  const g = { ...invaders.newGame(court), wait: 0 }
  const later = invaders.step(g, 0.05)
  assert.ok(later.block.x > g.block.x)
  const edge = run(invaders, g, 20)
  assert.ok(edge.block.y > g.block.y, 'stepped down')
  assert.equal(edge.winner, null)
})

test('Space Invaders: one shot at a time, and it knocks out the invader it meets', () => {
  let g = { ...invaders.newGame(court), wait: 0, bombIn: 99 }
  const target = g.invaders.at(-1)
  const box = invaders.invaderBox(g, target)
  g = { ...g, ship: { ...g.ship, x: box.x + box.w / 2 } }
  const fired = invaders.step(g, 0.01, { fire: true })
  assert.ok(fired.shot)
  const again = invaders.step(fired, 0.01, { fire: true })
  assert.ok(again.shot.y < fired.shot.y, 'the same shot, further up')
  const hit = invaders.step({ ...g, shot: { x: box.x + box.w / 2, y: box.y + box.h + 2 } }, 0.01)
  assert.equal(hit.invaders.length, g.invaders.length - 1)
  assert.ok(!hit.invaders.includes(target))
  assert.equal(hit.shot, null)
  assert.ok(hit.score > 0)
})

test('Space Invaders: their bombs come from the bottom row and cost a life', () => {
  const g = { ...invaders.newGame(court, 42), wait: 0, bombIn: 0 }
  const bombed = invaders.step(g, 0.01)
  assert.equal(bombed.bombs.length, 1)
  assert.equal(invaders.step(g, 0.01).bombs[0].x, bombed.bombs[0].x, 'the same seed, the same bomb')
  const ship = bombed.ship
  const hit = invaders.step({ ...bombed, bombIn: 99, bombs: [{ x: ship.x, y: ship.y - ship.h - 1 }] }, 0.01)
  assert.equal(hit.lives, invaders.LIVES - 1)
  assert.deepEqual(hit.bombs, [])
  assert.ok(hit.wait > 0)
  const last = invaders.step({ ...bombed, lives: 1, bombIn: 99, bombs: [{ x: ship.x, y: ship.y - ship.h - 1 }] }, 0.01)
  assert.equal(last.winner, 'lost')
})

test('Space Invaders: shooting the last one wins; letting them land loses', () => {
  let g = { ...invaders.newGame(court), wait: 0, bombIn: 99 }
  const one = g.invaders[0]
  const box = invaders.invaderBox(g, one)
  const won = invaders.step({ ...g, invaders: [one], shot: { x: box.x + box.w / 2, y: box.y + box.h } }, 0.001)
  assert.equal(won.winner, 'you')
  assert.match(invaders.scoreText(won), /^Every invader!/)
  const landed = invaders.step({ ...g, block: { ...g.block, y: g.ship.y } }, 0.01)
  assert.equal(landed.winner, 'lost')
})

test('a long frame (a hidden tab) never moves things more than a short one would', () => {
  let b = { ...blocks.newGame(court), wait: 0 }
  b = { ...b, ball: { ...b.ball, x: 400, y: 400, dx: 0, dy: -300 } }
  assert.ok(400 - blocks.step(b, 5).ball.y <= 300 * 0.05 + 1e-9)
  const i = { ...invaders.newGame(court), wait: 0 }
  assert.ok(invaders.step(i, 5).block.x - i.block.x <= 800 * 0.06 * 0.05 + 1e-9)
})
