<template>
  <div class="token-wrap">
    <button
      type="button"
      class="token"
      :class="{ 'is-pressed': pressed, 'is-intro': intro, 'token--spooky': spooky }"
      :data-shape="spooky ? SPOOKY_SHAPES[shape].id : undefined"
      aria-label="Hansel's profile picture. Press and hold to spin the token."
      @pointerdown="press"
      @pointerup="release"
      @pointercancel="release"
      @lostpointercapture="release"
      @keydown.space.enter.prevent="press"
      @keyup.space.enter.prevent="release"
      @contextmenu.prevent
    >
      <span class="token__coin" :style="{ transform: `rotateY(${angle}deg)`, transition }">
        <span class="token__face token__face--front" :data-face="face < 0 ? 'bitmoji' : COIN_FACES[face].id">
          <!-- The first thing anyone sees (the page's largest paint), so it loads first (preloaded below) -->
          <img :src="bitmojiUrl" alt="" draggable="false" fetchpriority="high" />
          <!-- Each heads landing shows the next photo (utils/coinFaces.mjs). They load once the page
               has (a hold takes longer than that), so a switch never flashes and they don't hold up
               the Bitmoji. -->
          <img
            v-for="(photo, i) in photosReady ? COIN_FACES : []"
            :key="photo.id"
            v-bind="photoSources(photo.src, imageCdn)"
            class="token__photo"
            :class="{ 'is-shown': face === i }"
            alt=""
            draggable="false"
            loading="eager"
            decoding="async"
            referrerpolicy="no-referrer"
            @error="dropFace(i)"
          />
          <span class="token__shine" />
        </span>
        <span class="token__face token__face--back" aria-hidden="true">
          <!-- During an event, once the bubble has shown, tails carries an engraved QR to the site -->
          <span v-if="showQr" class="token__qr">
            <svg :viewBox="`0 0 ${bubbleSettings.qrSize} ${bubbleSettings.qrSize}`" shape-rendering="crispEdges">
              <path :d="bubbleSettings.qrPath" />
            </svg>
          </span>
          <!-- Halloween: the shape's own emoji where the monogram goes -->
          <span v-else-if="spooky" class="token__spook">{{ SPOOKY_SHAPES[shape].emoji }}</span>
          <span v-else class="token__monogram">HW</span>
          <span class="token__caption">hanselwei.dev</span>
        </span>
        <span class="token__edge" />
      </span>
    </button>
    <span
      v-for="pop in pops"
      :key="pop.id"
      class="token__pop"
      :style="{ left: `${pop.x}%` }"
      aria-hidden="true"
    >+1</span>
    <!-- An iMessage-style speech bubble under the coin when a hold lands heads up, while an event
         is on (config.toml [coin_bubble]) -->
    <Transition name="bubble">
      <span
        v-if="bubble"
        class="token__bubble"
        :class="{ 'is-typing': bubble === 'typing' }"
        :aria-hidden="bubble === 'typing' || undefined"
        @pointerenter="holdBubble"
        @pointerleave="releaseBubble"
        @focusin="holdBubble"
        @focusout="releaseBubble"
      >
        <span v-if="bubble === 'typing'" class="token__typing"><i /><i /><i /></span>
        <template v-else>{{ parts[0] }}<a v-if="parts[1]" :href="bubbleSettings.link" target="_blank" rel="noopener">{{ parts[1] }}</a>{{ parts[2] }}</template>
      </span>
    </Transition>
    <span class="sr-only" aria-live="polite">{{ bubble === 'message' ? bubbleSettings.text : '' }}</span>
  </div>
</template>

<script setup>
// A collectible-style token: it spins (and speeds up) while it is held down,
// then settles on whichever face it is closest to when released.
// Emits `spin` for every full turn (a quick tap counts as one) and `release`
// with the number of spins in that hold and how long it was held (ms).
// Only real (trusted) input counts.
import bitmojiUrl from '~/assets/hanselbitmoji.svg?url'
import bubbleSettings from '~/data/coinBubble.generated.mjs'
import { COIN_FACES, nextFace, photoSources } from '~/utils/coinFaces.mjs'
import { bubbleActive, bubbleParts, landsHeads } from '~/utils/coinBubble.mjs'
import { springEasing } from '~/utils/spring.mjs'

const emit = defineEmits(['spin', 'release'])
// Photos through Netlify's Image CDN on Netlify builds (utils/coinFaces.mjs)
const imageCdn = useRuntimeConfig().public.imageCdn
useHead({ link: [{ rel: 'preload', as: 'image', href: bitmojiUrl, fetchpriority: 'high' }] })
const photosReady = ref(false)

const MAX_SPEED = 24 // degrees per frame
const angle = ref(0)
// The heads-side picture: -1 is the Bitmoji (the opening face, and again after the pull-down
// reset), otherwise an index into COIN_FACES. A photo that can't load drops out of the rotation.
const face = ref(-1)
let brokenFaces = []
const advanceFace = () => (face.value = nextFace(face.value, COIN_FACES.length, brokenFaces))
const dropFace = i => {
  brokenFaces = [...brokenFaces, i]
  if (face.value === i) face.value = nextFace(i, COIN_FACES.length, brokenFaces)
}
// Halloween (config.toml [seasons.spooky]): the coin is cut into a blinking neon jack-o'-lantern,
// bat or ghost, starting on one at random and turning into the next on each heads landing
const SPOOKY_SHAPES = [
  { id: 'pumpkin', emoji: '🎃' },
  { id: 'bat', emoji: '🦇' },
  { id: 'ghost', emoji: '👻' }
]
const spooky = useSpooky()
const shape = ref(0)
const nextShape = () => {
  if (spooky.value) shape.value = (shape.value + 1) % SPOOKY_SHAPES.length
}

const resetAt = useState('token:resetAt', () => 0)
watch(resetAt, () => {
  face.value = -1
  transition.value = 'transform var(--spring-smooth-duration) var(--spring-smooth)'
  angle.value = Math.round(angle.value / 360) * 360 // back to heads up, on the Bitmoji
})
const pressed = ref(false)
const intro = ref(true)
const transition = ref('none')
const pops = ref([])

let speed = 0
let frame = null
let reducedMotion = false
let springs = false // browsers without CSS linear() get the old fixed curve
let pressStartAngle = 0
let spinsThisHold = 0
let pressStartTime = 0
let popId = 0

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  springs = CSS.supports('transition-timing-function', 'linear(0, 1)')
  shape.value = Math.floor(Math.random() * SPOOKY_SHAPES.length)
  setTimeout(() => (intro.value = false), 1600)
  const loadPhotos = () => setTimeout(() => (photosReady.value = true), 0)
  if (document.readyState === 'complete') loadPhotos()
  else addEventListener('load', loadPhotos, { once: true })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  hideBubble()
})

// The bubble: "typing…" for a moment once the coin settles heads up, then the message, which
// fades after a while (not while it's hovered or focused, so its link can be used). A new press
// clears it. Checked at release, so it stops on its own after the event. Once it has shown, the
// coin's tails side carries the QR code.
const bubble = ref(null) // null, 'typing' or 'message'
const showQr = ref(false)
const parts = bubbleParts(bubbleSettings)
const MESSAGE_MS = 8000
let bubbleTimers = []
const clearBubbleTimers = () => {
  bubbleTimers.forEach(clearTimeout)
  bubbleTimers = []
}
const hideBubble = () => {
  clearBubbleTimers()
  bubble.value = null
}
const showMessage = () => {
  bubble.value = 'message'
  if (bubbleSettings.qrPath) showQr.value = true
}
const showBubble = settleMs => {
  if (!bubbleActive(bubbleSettings)) return
  const typingMs = reducedMotion ? 0 : 900
  bubbleTimers.push(
    setTimeout(() => (typingMs ? (bubble.value = 'typing') : showMessage()), settleMs),
    setTimeout(showMessage, settleMs + typingMs),
    setTimeout(() => (bubble.value = null), settleMs + typingMs + MESSAGE_MS)
  )
}
const holdBubble = () => {
  if (bubble.value === 'message') clearBubbleTimers()
}
const releaseBubble = () => {
  if (bubble.value !== 'message') return
  clearBubbleTimers()
  bubbleTimers.push(setTimeout(() => (bubble.value = null), 3000))
}

const countSpin = () => {
  spinsThisHold++
  emit('spin')
  const pop = { id: popId++, x: 30 + Math.random() * 40 }
  pops.value.push(pop)
  setTimeout(() => (pops.value = pops.value.filter(p => p.id !== pop.id)), 900)
}

const spin = () => {
  speed = Math.min(MAX_SPEED, speed + 0.6)
  angle.value += speed
  if (Math.floor((angle.value - pressStartAngle) / 360) > spinsThisHold) countSpin()
  frame = requestAnimationFrame(spin)
}

const press = event => {
  // Ignore synthetic events (e.g. element.dispatchEvent from a script): the token
  // doubles as a "are you human?" check for the contact card on the home page
  if (pressed.value || !event?.isTrusted) return
  if (event?.pointerId !== undefined) event.currentTarget.setPointerCapture(event.pointerId)
  pressed.value = true
  intro.value = false
  photosReady.value = true // held before the page finished loading
  hideBubble()
  pressStartAngle = angle.value
  pressStartTime = performance.now()
  spinsThisHold = 0
  navigator.vibrate?.(12)

  if (reducedMotion) {
    transition.value = 'transform 0.4s ease'
    angle.value += 180
    return
  }
  transition.value = 'none'
  speed = 4
  frame = requestAnimationFrame(spin)
}

const release = () => {
  if (!pressed.value) return
  pressed.value = false
  cancelAnimationFrame(frame)
  if (!spinsThisHold) countSpin()
  emit('release', spinsThisHold, performance.now() - pressStartTime)
  if (reducedMotion) {
    if (landsHeads(angle.value)) {
      advanceFace()
      nextShape()
      showBubble(400)
    }
    return
  }

  // Coast to the next face, taking longer the faster it was spinning. Like a SwiftUI spring
  // after a fling, it starts at the speed the coin was turning (degrees per frame at 60fps, as
  // whole distances per second) instead of jolting to a fixed curve, and settles with a little wobble.
  const target = Math.ceil((angle.value + speed * 6) / 180) * 180
  const coastSeconds = 0.5 + speed / 30
  const velocity = (speed * 60) / Math.max(target - angle.value, 1)
  if (springs) {
    const { easing, seconds } = springEasing({ duration: coastSeconds, bounce: 0.2, velocity })
    transition.value = `transform ${seconds}s ${easing}`
  } else {
    transition.value = `transform ${coastSeconds}s cubic-bezier(0.2, 0.8, 0.3, 1.2)`
  }
  angle.value = target
  if (landsHeads(target)) {
    advanceFace() // swapped mid-spin, so it never pops on a still coin
    nextShape()
    showBubble(coastSeconds * 1000)
  }
  speed = 0
  navigator.vibrate?.([8, 40, 8])
}
</script>

<style lang="scss" scoped>
.token-wrap {
  position: relative;
  display: inline-block;
  isolation: isolate;
}

.token__pop {
  position: absolute;
  top: 30%;
  z-index: 2;
  font-family: 'Nova Mono', monospace;
  font-size: 1.6rem;
  font-weight: bold;
  color: #fff;
  -webkit-text-stroke: 1px #3d1f5c;
  text-shadow: 0 2px 0 #3d1f5c, 0 0 10px #7cfc00;
  pointer-events: none;
  animation: pop-up 0.9s ease-out forwards;
}

@keyframes pop-up {
  from {
    transform: translate(-50%, 0) scale(0.6);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -64px) scale(1.2);
    opacity: 0;
  }
}

.token {
  --size: clamp(170px, 55vw, 230px);
  width: var(--size);
  height: var(--size);
  perspective: 900px;
  border-radius: 50%;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
  cursor: grab;
  transition: transform 0.2s ease, filter 0.2s ease;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.45));

  &:focus-visible {
    outline: 3px dashed #7cfc00;
    outline-offset: 6px;
  }

  &.is-pressed {
    cursor: grabbing;
    transform: scale(1.06);
    filter: drop-shadow(0 0 22px rgba(124, 252, 0, 0.55));
  }

  &.is-intro .token__coin {
    animation: intro-flip 1.4s cubic-bezier(0.3, 0.7, 0.4, 1) both;
  }
}

.token__coin {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.token__face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border: 7px solid #7cfc00;
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.25), inset 0 -10px 30px rgba(0, 0, 0, 0.35);

  img {
    width: 96%;
    height: 96%;
    pointer-events: none;
  }
}

.token__face--front {
  transform: translateZ(2px);
  /* The original bitmoji backdrop pattern */
  background-color: #653496;
  background-image: linear-gradient(11893deg, #fff 22%, #653496, 23%, #7cfc00 77%, #fff 50.5%, #fff 77%, #653496 77%, #7b52ae);
  background-size: 40px 40px;
}

/* The photos sit over the Bitmoji and fill the face; only the current one shows */
.token__face .token__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  opacity: 0;
}

.token__face .token__photo.is-shown {
  opacity: 1;
}

.token__face--back {
  transform: rotateY(180deg) translateZ(2px);
  background: radial-gradient(circle at 70% 30%, #9dff5c, #41b883 55%, #1d5c3f);
  color: #2c2f33;
}

.token__monogram {
  font-family: 'Nova Mono', monospace;
  font-size: calc(var(--size) * 0.36);
  line-height: 1;
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.4);
}

.token__caption {
  font-family: 'Nova Mono', monospace;
  font-size: calc(var(--size) * 0.07);
  letter-spacing: 1px;
  margin-top: 0.4em;
}

/* Core between the two faces so the coin has some thickness when edge-on */
.token__edge {
  position: absolute;
  inset: 1%;
  border-radius: 50%;
  background: #4c8f1f;
}

.token__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.45) 48%, transparent 60%);
  transform: translateX(-120%);
  animation: shine 4s ease-in-out 2s infinite;
  pointer-events: none;
}

@keyframes intro-flip {
  from {
    transform: rotateY(-720deg) scale(0.6);
  }
  to {
    transform: rotateY(0) scale(1);
  }
}

@keyframes shine {
  0%,
  70% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}

/* The engraved QR on tails: dark modules cut into a light plate */
.token__qr {
  display: block;
  width: 60%;
  aspect-ratio: 1;
  padding: 9%; /* the quiet zone: about 3 modules of plain plate around the code, so it scans */
  border-radius: 10%;
  background: #eaffdc;
  box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.4), inset 0 -2px 0 rgba(255, 255, 255, 0.6), 0 1px 0 rgba(255, 255, 255, 0.35);

  svg {
    display: block;
    width: 100%;
    height: 100%;
    fill: #10251a;
  }
}

.token__qr + .token__caption {
  margin-top: 0.3em;
}

/* An iMessage-blue speech bubble under the coin, its tail pointing up at it. Centered on the coin
   without a transform (the pop-in animation uses transform) */
.token__bubble {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  right: 0;
  z-index: 3;
  width: max-content;
  max-width: min(18rem, 88vw);
  margin: 0 auto;
  padding: 0.5rem 0.9rem;
  border-radius: 1.15rem;
  background: #0a84ff;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
  font-size: 0.95rem;
  line-height: 1.3;
  text-align: center;
  overflow-wrap: anywhere;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  transform-origin: top center;

  /* The tail */
  &::before {
    content: '';
    position: absolute;
    top: -0.3rem;
    left: 50%;
    width: 0.9rem;
    height: 0.9rem;
    margin-left: -0.45rem;
    border-radius: 0.15rem;
    background: inherit;
    transform: rotate(45deg);
  }

  a {
    color: #fff;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  a:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
    border-radius: 2px;
  }
}

.token__bubble.is-typing {
  background: #3a3a3c;
}

/* A foldable in tabletop (a crease across, <html data-fold>, pages/index.vue): the coin sits just
   above the fold, so the bubble rises over its lower half instead of hanging down onto the fold */
:root[data-fold='tabletop'] .token__bubble {
  top: auto;
  bottom: 0.5rem;
  transform-origin: bottom center;

  &::before {
    display: none;
  }
}

.token__typing {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.3rem 0.1rem;

  i {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: #8e8e93;
    animation: typing 1s ease-in-out infinite;
  }

  i:nth-child(2) {
    animation-delay: 0.15s;
  }

  i:nth-child(3) {
    animation-delay: 0.3s;
  }
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.4;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.bubble-enter-active {
  transition: opacity 0.25s ease, transform var(--spring-bouncy-duration) var(--spring-bouncy);
}

.bubble-leave-active {
  transition: opacity 0.4s ease;
}

.bubble-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.6);
}

.bubble-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .token__typing i,
  .bubble-enter-active {
    animation: none;
    transition: opacity 0.25s ease;
  }

  .bubble-enter-from {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .token.is-intro .token__coin,
  .token__shine {
    animation: none;
  }

  .token__pop {
    animation-name: pop-fade;
  }
}

@keyframes pop-fade {
  from {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 0;
  }
}

/* Halloween (config.toml [seasons.spooky]): the coin is cut into a shape by a mask on each face
   and on its core, and glows like a neon sign that flickers now and then. The glow is on the
   button, so it traces the shape and doesn't flatten the coin's 3D turn. */
.token[data-shape='pumpkin'] {
  --neon: #ff7a18;
  --spook-front: radial-gradient(circle at 50% 40%, #ffb347, #f97316 55%, #9a3412);
  --spook-back: radial-gradient(circle at 50% 35%, #fdba74, #ea580c 60%, #7c2d12);
  --spook-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='30' cy='60' rx='26' ry='35'/%3E%3Cellipse cx='70' cy='60' rx='26' ry='35'/%3E%3Cellipse cx='50' cy='59' rx='30' ry='38'/%3E%3Crect x='45' y='5' width='10' height='20' rx='3' transform='rotate(12 50 15)'/%3E%3C/svg%3E");
}

.token[data-shape='bat'] {
  --neon: #c026ff;
  --spook-front: radial-gradient(circle at 50% 45%, #a855f7, #581c87 60%, #1e0533);
  --spook-back: radial-gradient(circle at 50% 40%, #7e22ce, #3b0764 60%, #12001f);
  --spook-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='54' r='31'/%3E%3Cpath d='M30 34 L33 10 L45 27 Z M70 34 L67 10 L55 27 Z M26 42 L0 26 L7 46 L0 64 L13 59 L17 75 L28 64 Z M74 42 L100 26 L93 46 L100 64 L87 59 L83 75 L72 64 Z'/%3E%3C/svg%3E");
}

.token[data-shape='ghost'] {
  --neon: #67e8f9;
  --spook-front: radial-gradient(circle at 50% 35%, #f8fafc, #cbd5e1 60%, #64748b);
  --spook-back: radial-gradient(circle at 50% 35%, #ffffff, #e2e8f0 55%, #94a3b8);
  --spook-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M14 97 L14 47 A36 36 0 0 1 86 47 L86 97 L74 86 L62 97 L50 86 L38 97 L26 86 Z'/%3E%3C/svg%3E");
}

.token--spooky {
  filter: drop-shadow(0 0 1px #fff) drop-shadow(0 0 6px var(--neon)) drop-shadow(0 0 16px var(--neon));
  animation: neon-flicker 5s linear infinite;

  &.is-pressed {
    animation: none;
    filter: drop-shadow(0 0 2px #fff) drop-shadow(0 0 10px var(--neon)) drop-shadow(0 0 28px var(--neon));
  }

  .token__face,
  .token__edge {
    -webkit-mask: var(--spook-mask) center / 100% 100% no-repeat;
    mask: var(--spook-mask) center / 100% 100% no-repeat;
    border: 0;
    border-radius: 0;
  }

  .token__face {
    box-shadow: inset 0 -12px 30px rgba(0, 0, 0, 0.45);
  }

  .token__face--front {
    background: var(--spook-front);
  }

  .token__face--back {
    background: var(--spook-back);
  }

  .token__edge {
    inset: 0;
    background: var(--neon);
  }

  .token__photo {
    border-radius: 0;
  }
}

/* The jack-o'-lantern's ribs and an orange cast, over the Bitmoji or photo */
.token[data-shape='pumpkin'] .token__face--front::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 20% 46% at 50% 60%, transparent 86%, rgba(124, 45, 18, 0.55) 93%, transparent 99%),
    radial-gradient(ellipse 40% 45% at 50% 60%, transparent 88%, rgba(124, 45, 18, 0.5) 94%, transparent 99%),
    rgba(249, 115, 22, 0.2);
}

/* The shape's emoji on tails, glowing in the same neon */
.token__spook {
  font-size: calc(var(--size) * 0.42);
  line-height: 1;
  filter: drop-shadow(0 0 6px var(--neon));
}

/* A neon sign: steady, with a quick stutter now and then */
@keyframes neon-flicker {
  0%,
  17%,
  21%,
  24%,
  61%,
  64%,
  100% {
    filter: drop-shadow(0 0 1px #fff) drop-shadow(0 0 6px var(--neon)) drop-shadow(0 0 16px var(--neon));
  }
  19%,
  22.5%,
  62.5% {
    filter: drop-shadow(0 0 0 transparent) drop-shadow(0 0 2px var(--neon)) drop-shadow(0 0 0 transparent);
  }
  40% {
    filter: drop-shadow(0 0 2px #fff) drop-shadow(0 0 9px var(--neon)) drop-shadow(0 0 24px var(--neon));
  }
}

@media (prefers-reduced-motion: reduce) {
  .token--spooky {
    animation: none;
  }
}
</style>
