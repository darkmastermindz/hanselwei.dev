import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newGame, step, scoreText, WIN_SCORE } from '../../utils/foldPaddleBall.mjs'

const court = { length: 900, breadth: 600 }
const run = (state, seconds, input) => {
  for (let t = 0; t < seconds; t += 1 / 60) state = step(state, 1 / 60, input)
  return state
}

test('a new game: ball in the middle, paddles centred, 0–0, a short wait before the serve', () => {
  const g = newGame(court)
  assert.equal(g.ball.u, 450)
  assert.equal(g.ball.v, 300)
  assert.equal(g.you.v, 300)
  assert.deepEqual(g.score, { you: 0, cpu: 0 })
  assert.ok(g.wait > 0)
  assert.ok(g.ball.du > 0, 'the first serve goes toward the computer')
  // Nothing moves until the serve
  const later = step(g, 0.1)
  assert.equal(later.ball.u, g.ball.u)
})

test('the ball bounces off the sides of the court', () => {
  let g = { ...newGame(court), wait: 0 }
  g = { ...g, ball: { ...g.ball, u: 450, v: 15, du: 0, dv: -300 } }
  g = step(g, 0.05)
  assert.ok(g.ball.dv > 0, 'turned back')
  assert.ok(g.ball.v >= g.ball.r)
})

test('your paddle sends the ball back, angled by where it hits', () => {
  let g = { ...newGame(court), wait: 0 }
  g = { ...g, ball: { ...g.ball, u: 30, v: 330, du: -500, dv: 0 } }
  const hitOff = step(g, 0.05)
  assert.ok(hitOff.ball.du > 0, 'back toward the computer')
  assert.ok(hitOff.ball.dv > 0, 'below centre sends it down')
  assert.ok(Math.hypot(hitOff.ball.du, hitOff.ball.dv) > 500, 'a little faster')
})

test('missing the ball gives the computer the point, and the ball is served again', () => {
  let g = { ...newGame(court), wait: 0 }
  g = { ...g, ball: { ...g.ball, u: 20, v: 30, du: -900, dv: 0 }, you: { ...g.you, v: 500 } }
  g = run(g, 0.2)
  assert.deepEqual(g.score, { you: 0, cpu: 1 })
  assert.equal(g.ball.u, 450)
  assert.ok(g.wait > 0)
})

test('your paddle follows where you point, but only so fast, and stays on the court', () => {
  const g = newGame(court)
  const moved = step(g, 0.05, { target: 600 })
  assert.ok(moved.you.v > 300 && moved.you.v < 600)
  const there = run(g, 2, { target: 10_000 })
  assert.equal(there.you.v, 600 - there.you.size / 2)
})

test("the computer can't keep up with a fast, sharp shot: you can win", () => {
  let g = { ...newGame(court), wait: 0 }
  g = { ...g, ball: { ...g.ball, u: 600, v: 40, du: 1200, dv: 0 }, cpu: { ...g.cpu, v: 560 } }
  g = run(g, 0.5)
  assert.equal(g.score.you, 1)
})

test('first to WIN_SCORE wins, and the game stops there', () => {
  let g = newGame(court)
  g = { ...g, score: { you: WIN_SCORE - 1, cpu: 2 }, wait: 0, ball: { ...g.ball, u: 880, v: 20, du: 1200, dv: 0 }, cpu: { ...g.cpu, v: 560 } }
  g = run(g, 0.5)
  assert.equal(g.winner, 'you')
  assert.equal(scoreText(g), `You win ${WIN_SCORE}–2! 🎉`)
  assert.equal(step(g, 1, { target: 0 }), g, 'nothing moves once it is over')
})

test('a long frame (a hidden tab) never moves the ball more than a short one would', () => {
  let g = { ...newGame(court), wait: 0 }
  g = { ...g, ball: { ...g.ball, u: 450, v: 300, du: 400, dv: 0 } }
  assert.ok(step(g, 5).ball.u - 450 <= 400 * 0.05 + 1e-9)
})

test('the score reads in plain words', () => {
  assert.equal(scoreText(newGame(court)), 'You 0 – 0 Computer')
})
