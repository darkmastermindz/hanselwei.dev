<template>
  <!-- Only on iPhone Duo's inner screen (<html data-device="iphone-duo">): a little game that uses
       the room the fold gives, with the fold itself as the net (utils/foldPaddleBall.mjs) -->
  <div class="fold-paddle-ball">
    <button ref="playButton" type="button" class="fold-paddle-ball__play" @click="start">
      🏓 Play Fold Paddle Ball
    </button>
    <Teleport to="body">
      <div v-if="playing" class="fold-paddle-ball__court" role="dialog" aria-modal="true" aria-label="Fold Paddle Ball">
        <canvas
          ref="canvas"
          class="fold-paddle-ball__canvas"
          @pointerdown="aim"
          @pointermove="aim"
        />
        <p class="fold-paddle-ball__score" aria-live="polite">{{ score }}</p>
        <p class="fold-paddle-ball__how">{{ howTo }}</p>
        <div class="fold-paddle-ball__buttons">
          <button v-if="over" type="button" class="fold-paddle-ball__button" @click="restart">Play again</button>
          <button ref="closeButton" type="button" class="fold-paddle-ball__button" @click="stop">Close</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { newGame, step, scoreText } from '~/utils/foldPaddleBall.mjs'

const playButton = ref(null)
const closeButton = ref(null)
const canvas = ref(null)
const playing = ref(false)
const score = ref('')
const over = ref(false)

// The court: you at the bottom when the phone is upright, on the left held sideways. The net
// is where the fold is (the --fold-* variables while folded, else the middle: iPhone Duo's hinge)
let game = null
let across = false // the net runs across the screen (upright)
let net = 0
let target = null
let keys = 0 // -1, 0 or 1 from the arrow keys
let frame = 0
let last = 0

const howTo = computed(() => (across ? 'Slide along the bottom, or ← →' : 'Slide up and down on the left, or ↑ ↓'))

const foldAt = (w, h) => {
  const css = getComputedStyle(document.documentElement)
  const px = name => parseFloat(css.getPropertyValue(`--${name}`))
  if (across) {
    const a = px('fold-top-end')
    const b = px('fold-bottom-start')
    return Number.isFinite(a) && Number.isFinite(b) ? (a + b) / 2 : h / 2
  }
  const a = px('fold-left-end')
  const b = px('fold-right-start')
  return Number.isFinite(a) && Number.isFinite(b) ? (a + b) / 2 : w / 2
}

const setUp = () => {
  const w = innerWidth
  const h = innerHeight
  across = h > w
  net = foldAt(w, h)
  const el = canvas.value
  const dpr = devicePixelRatio || 1
  el.width = Math.round(w * dpr)
  el.height = Math.round(h * dpr)
  el.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
  return across ? { length: h, breadth: w } : { length: w, breadth: h }
}

// The court's (u along the play, v across it) to the screen's (x, y)
const toScreen = (u, v) => (across ? [v, innerHeight - u] : [u, v])

const draw = () => {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx || !game) return
  const w = innerWidth
  const h = innerHeight
  ctx.fillStyle = '#1d232a'
  ctx.fillRect(0, 0, w, h)
  // The fold, as the net
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.7)'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 10])
  ctx.beginPath()
  if (across) {
    ctx.moveTo(0, net)
    ctx.lineTo(w, net)
  } else {
    ctx.moveTo(net, 0)
    ctx.lineTo(net, h)
  }
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(192, 132, 252, 0.8)'
  ctx.font = '12px "Source Sans Pro", sans-serif'
  ctx.textAlign = 'center'
  if (across) ctx.fillText('the fold', w / 2, net - 8)
  else {
    ctx.save()
    ctx.translate(net - 8, h / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('the fold', 0, 0)
    ctx.restore()
  }
  // Paddles: yours green, the computer's purple
  const paddle = (p, end, colour) => {
    const thick = 10
    const u = end === 'you' ? 4 : game.length - 4 - thick
    const [x, y] = toScreen(across ? u + thick : u, p.v - p.size / 2)
    ctx.fillStyle = colour
    if (across) ctx.fillRect(x, y, p.size, thick)
    else ctx.fillRect(x, y, thick, p.size)
  }
  paddle(game.you, 'you', '#7cfc00')
  paddle(game.cpu, 'cpu', '#c084fc')
  // The ball: a little gold coin
  const [bx, by] = toScreen(game.ball.u, game.ball.v)
  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.arc(bx, by, game.ball.r, 0, Math.PI * 2)
  ctx.fill()
}

const tick = now => {
  const dt = last ? (now - last) / 1000 : 0
  last = now
  if (keys) target = Math.max(0, Math.min(game.breadth, (target ?? game.you.v) + keys * game.breadth * 1.6 * dt))
  game = step(game, dt, { target })
  const text = scoreText(game)
  if (text !== score.value) score.value = text
  over.value = Boolean(game.winner)
  draw()
  if (!game.winner) frame = requestAnimationFrame(tick)
}

const begin = () => {
  game = newGame(setUp())
  target = null
  last = 0
  score.value = scoreText(game)
  over.value = false
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(tick)
}

const start = async () => {
  playing.value = true
  document.documentElement.classList.add('fold-paddle-ball-open')
  // Keys anywhere (focus can leave the buttons when you tap the court)
  addEventListener('keydown', onKey)
  await nextTick()
  begin()
  closeButton.value?.focus()
}

const restart = () => begin()

const stop = () => {
  cancelAnimationFrame(frame)
  removeEventListener('keydown', onKey)
  playing.value = false
  game = null
  document.documentElement.classList.remove('fold-paddle-ball-open')
  nextTick(() => playButton.value?.focus())
}

// A finger (or mouse) anywhere aims your paddle at the same spot along the court's breadth
const aim = event => {
  if (event.type === 'pointermove' && !event.buttons && event.pointerType !== 'mouse') return
  target = across ? event.clientX : event.clientY
}

const onKey = event => {
  if (event.key === 'Escape') return stop()
  const back = across ? 'ArrowLeft' : 'ArrowUp'
  const forward = across ? 'ArrowRight' : 'ArrowDown'
  if (event.key !== back && event.key !== forward) return
  event.preventDefault()
  keys = event.key === back ? -1 : 1
  addEventListener('keyup', () => (keys = 0), { once: true })
}

// Turning or folding the phone mid-game: start a fresh court that fits
const onResize = () => {
  if (playing.value) begin()
}
// Away from the tab: pause (the next frame picks up where it left off)
const onVisibility = () => {
  if (!playing.value || !game || game.winner) return
  cancelAnimationFrame(frame)
  if (!document.hidden) {
    last = 0
    frame = requestAnimationFrame(tick)
  }
}

onMounted(() => {
  addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  removeEventListener('keydown', onKey)
  removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', onVisibility)
  document.documentElement.classList.remove('fold-paddle-ball-open')
})
</script>

<style scoped>
.fold-paddle-ball {
  display: none;
}

/* Open, not part-folded: folded, the hero has only half the screen (pages/index.vue) */
:root[data-device='iphone-duo']:not([data-fold='tabletop'], [data-fold='book']) .fold-paddle-ball {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.fold-paddle-ball__play {
  padding: 0.5rem 1.1rem;
  border: 1px solid #c084fc;
  border-radius: 9999px;
  background: #23262a;
  box-shadow: 3px 3px #7cfc00;
  color: #eee;
  font-size: 0.95rem;
}

.fold-paddle-ball__court {
  position: fixed;
  inset: 0;
  z-index: 100;
  touch-action: none; /* the finger plays, the page doesn't scroll */
}

.fold-paddle-ball__canvas {
  display: block;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
}

.fold-paddle-ball__score {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 0.75rem);
  left: 0;
  right: 0;
  margin: 0;
  text-align: center;
  color: #eee;
  font-family: "Nova Mono", monospace;
  font-size: 1.1rem;
  pointer-events: none;
}

.fold-paddle-ball__how {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom) + 0.75rem);
  left: max(1rem, env(safe-area-inset-left));
  margin: 0;
  color: #bbb;
  font-size: 0.8rem;
  pointer-events: none;
}

.fold-paddle-ball__buttons {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 0.5rem);
  right: max(0.75rem, env(safe-area-inset-right));
  display: flex;
  gap: 0.5rem;
}

.fold-paddle-ball__button {
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
html.fold-paddle-ball-open {
  overflow: hidden;
}
</style>
