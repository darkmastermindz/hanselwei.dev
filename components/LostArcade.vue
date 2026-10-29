<template>
  <!-- The 404 page's easter egg: a classic game, picked at random on each visit (utils/arcade.mjs),
       in the same style as Fold Pong (components/FoldPong.vue) -->
  <div class="lost-arcade">
    <!-- Picked once the page is running, so the prerendered page and the visit can differ -->
    <button v-if="game" ref="playButton" type="button" class="lost-arcade__play" @click="start">
      {{ game.emoji }} Play {{ game.name }}
    </button>
    <Teleport to="body">
      <div v-if="playing" class="lost-arcade__court" role="dialog" aria-modal="true" :aria-label="game.name">
        <canvas
          ref="canvas"
          class="lost-arcade__canvas"
          @pointerdown="aim"
          @pointermove="aim"
          @pointerup="release"
          @pointercancel="release"
        />
        <p class="lost-arcade__score" aria-live="polite">{{ score }}</p>
        <p class="lost-arcade__how">{{ game.howTo }}</p>
        <div class="lost-arcade__buttons">
          <button v-if="over" type="button" class="lost-arcade__button" @click="restart">Play again</button>
          <button ref="closeButton" type="button" class="lost-arcade__button" @click="stop">Close</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { pickGame } from '~/utils/arcade.mjs'

// autofocus: put focus on the Play button once it shows (after the 404 page's slide to unlock)
const props = defineProps({ autofocus: { type: Boolean, default: false } })
import * as pong from '~/utils/foldPong.mjs'
import * as blocks from '~/utils/blockBreaker.mjs'
import * as invaders from '~/utils/spaceInvaders.mjs'

const RULES = { pong, blocks, invaders }

const game = ref(null)
const playButton = ref(null)
const closeButton = ref(null)
const canvas = ref(null)
const playing = ref(false)
const score = ref('')
const over = ref(false)

let state = null
let target = null
let firing = false // a finger (or mouse button) down, or Space held
const held = new Set() // arrow keys held
let frame = 0
let last = 0

const rules = () => RULES[game.value.id]

// Colours from Fold Pong: you green, the other side purple, the ball a gold coin
const BG = '#1d232a'
const YOU = '#7cfc00'
const THEM = '#c084fc'
const GOLD = '#ffd700'
const ROW_COLOURS = ['#c084fc', '#a78bfa', '#7cfc00', '#00ff9f', '#ffd700']

const setUp = () => {
  const el = canvas.value
  const dpr = devicePixelRatio || 1
  el.width = Math.round(innerWidth * dpr)
  el.height = Math.round(innerHeight * dpr)
  el.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
  // Pong's court runs along `u` (utils/foldPong.mjs): here up the screen, with you at the bottom,
  // the computer's end below the score and how to play
  return game.value.id === 'pong' ? { length: innerHeight - PONG_TOP - PONG_BOTTOM, breadth: innerWidth } : { width: innerWidth, height: innerHeight }
}

// Where Pong's court ends, from the top and bottom of the screen
const PONG_TOP = 64
const PONG_BOTTOM = 24

const drawPong = ctx => {
  const w = innerWidth
  const end = innerHeight - PONG_BOTTOM // your end, where u = 0
  const net = end - state.length / 2
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 10])
  ctx.beginPath()
  ctx.moveTo(0, net)
  ctx.lineTo(w, net)
  ctx.stroke()
  ctx.setLineDash([])
  const thick = 10
  ctx.fillStyle = YOU
  ctx.fillRect(state.you.v - state.you.size / 2, end - 4 - thick, state.you.size, thick)
  ctx.fillStyle = THEM
  ctx.fillRect(state.cpu.v - state.cpu.size / 2, PONG_TOP + 4, state.cpu.size, thick)
  coin(ctx, state.ball.v, end - state.ball.u, state.ball.r)
}

const drawBlocks = ctx => {
  for (const b of state.bricks) {
    ctx.fillStyle = ROW_COLOURS[b.row % ROW_COLOURS.length]
    ctx.fillRect(b.x, b.y, b.w, b.h)
  }
  const p = state.paddle
  ctx.fillStyle = YOU
  ctx.fillRect(p.x - p.w / 2, p.y, p.w, p.h)
  coin(ctx, state.ball.x, state.ball.y, state.ball.r)
}

const drawInvaders = ctx => {
  for (const i of state.invaders) {
    const b = invaders.invaderBox(state, i)
    ctx.fillStyle = ROW_COLOURS[i.row % ROW_COLOURS.length]
    // A little invader: a body, two eyes cut out, and legs that swap as the block marches
    ctx.fillRect(b.x, b.y, b.w, b.h * 0.7)
    const legs = Math.floor(state.block.x / 12) % 2 ? 0.1 : 0.25
    ctx.fillRect(b.x + b.w * legs, b.y + b.h * 0.7, b.w * 0.15, b.h * 0.3)
    ctx.fillRect(b.x + b.w * (0.85 - legs), b.y + b.h * 0.7, b.w * 0.15, b.h * 0.3)
    ctx.fillStyle = BG
    ctx.fillRect(b.x + b.w * 0.22, b.y + b.h * 0.2, b.w * 0.16, b.h * 0.2)
    ctx.fillRect(b.x + b.w * 0.62, b.y + b.h * 0.2, b.w * 0.16, b.h * 0.2)
  }
  const s = state.ship
  // Blinking while it gets ready after a hit
  if (!(state.wait > 0 && Math.floor(state.wait * 8) % 2)) {
    ctx.fillStyle = YOU
    ctx.fillRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h / 2)
    ctx.fillRect(s.x - s.w / 8, s.y - s.h, s.w / 4, s.h / 2)
  }
  if (state.shot) {
    ctx.fillStyle = YOU
    ctx.fillRect(state.shot.x - 1.5, state.shot.y, 3, 12)
  }
  ctx.fillStyle = GOLD
  for (const bomb of state.bombs) ctx.fillRect(bomb.x - 2, bomb.y - 10, 4, 10)
}

const coin = (ctx, x, y, r) => {
  ctx.fillStyle = GOLD
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

const DRAW = { pong: drawPong, blocks: drawBlocks, invaders: drawInvaders }

const draw = () => {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx || !state) return
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, innerWidth, innerHeight)
  DRAW[game.value.id](ctx)
}

const tick = now => {
  const dt = last ? (now - last) / 1000 : 0
  last = now
  const keys = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0)
  if (keys) target = Math.max(0, Math.min(innerWidth, (target ?? innerWidth / 2) + keys * innerWidth * 1.4 * dt))
  state = rules().step(state, dt, { target, fire: firing })
  const text = rules().scoreText(state)
  if (text !== score.value) score.value = text
  over.value = Boolean(state.winner)
  draw()
  if (!state.winner) frame = requestAnimationFrame(tick)
}

const begin = () => {
  state = game.value.id === 'invaders' ? invaders.newGame(setUp(), Date.now()) : rules().newGame(setUp())
  target = null
  last = 0
  score.value = rules().scoreText(state)
  over.value = false
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(tick)
}

const start = async () => {
  playing.value = true
  document.documentElement.classList.add('lost-arcade-open')
  // Keys anywhere (focus can leave the buttons when you tap the court)
  addEventListener('keydown', onKey)
  addEventListener('keyup', onKeyUp)
  await nextTick()
  begin()
  closeButton.value?.focus()
}

const restart = () => begin()

const stop = () => {
  cancelAnimationFrame(frame)
  removeEventListener('keydown', onKey)
  removeEventListener('keyup', onKeyUp)
  held.clear()
  firing = false
  playing.value = false
  state = null
  document.documentElement.classList.remove('lost-arcade-open')
  nextTick(() => playButton.value?.focus())
}

// A finger (or mouse) anywhere aims at the same spot across the screen; held down, it shoots
const aim = event => {
  if (event.type === 'pointerdown') firing = true
  if (event.type === 'pointermove' && !event.buttons && event.pointerType !== 'mouse') return
  target = event.clientX
}
const release = () => (firing = false)

const onKey = event => {
  if (event.key === 'Escape') return stop()
  // Space shoots in Space Invaders, even with focus on Close (Enter and Escape still work there)
  if (event.key === ' ' && game.value.id === 'invaders') {
    event.preventDefault()
    firing = true
    return
  }
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  held.add(event.key)
}
const onKeyUp = event => {
  if (event.key === ' ') firing = false
  held.delete(event.key)
}

// Turning the phone or resizing the window mid-game: start a fresh court that fits
const onResize = () => {
  if (playing.value) begin()
}
// Away from the tab: pause (the next frame picks up where it left off)
const onVisibility = () => {
  if (!playing.value || !state || state.winner) return
  cancelAnimationFrame(frame)
  if (!document.hidden) {
    last = 0
    frame = requestAnimationFrame(tick)
  }
}

onMounted(() => {
  game.value = pickGame()
  if (props.autofocus) nextTick(() => playButton.value?.focus())
  addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  removeEventListener('keydown', onKey)
  removeEventListener('keyup', onKeyUp)
  removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibility)
  document.documentElement.classList.remove('lost-arcade-open')
})
</script>

<style scoped>
.lost-arcade {
  display: flex;
  justify-content: center;
  min-height: 2.5rem; /* the button arrives once the page is running: no jump when it does */
  margin-top: 1.5rem;
}

.lost-arcade__play {
  padding: 0.5rem 1.1rem;
  border: 1px solid #c084fc;
  border-radius: 9999px;
  background: #23262a;
  box-shadow: 3px 3px #7cfc00;
  color: #eee;
  font-size: 0.95rem;
}

.lost-arcade__court {
  position: fixed;
  inset: 0;
  z-index: 100;
  touch-action: none; /* the finger plays, the page doesn't scroll */
}

.lost-arcade__canvas {
  display: block;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
}

.lost-arcade__score {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 0.75rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0 5.5rem; /* clear of the buttons */
  text-align: center;
  color: #eee;
  font-family: "Nova Mono", monospace;
  font-size: 1.1rem;
  pointer-events: none;
}

.lost-arcade__how {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 2.4rem);
  left: 1rem;
  right: 1rem;
  margin: 0;
  text-align: center;
  color: #bbb;
  font-size: 0.8rem;
  pointer-events: none;
}

.lost-arcade__buttons {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 0.5rem);
  right: max(0.75rem, env(safe-area-inset-right));
  display: flex;
  gap: 0.5rem;
}

.lost-arcade__button {
  padding: 0.35rem 0.8rem;
  border: 1px solid #653496;
  border-radius: 9999px;
  background: #23262a;
  color: #eee;
  font-size: 0.85rem;
}
</style>

<style>
/* While the game is open the page behind it stays put */
html.lost-arcade-open {
  overflow: hidden;
}
</style>
