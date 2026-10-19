<template>
  <div class="token-wrap">
    <button
      type="button"
      class="token"
      :class="{ 'is-pressed': pressed, 'is-intro': intro }"
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
        <span class="token__face token__face--front">
          <img src="~/assets/hanselbitmoji.svg" alt="" draggable="false" />
          <span class="token__shine" />
        </span>
        <span class="token__face token__face--back" aria-hidden="true">
          <span class="token__monogram">HW</span>
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
    <!-- An iMessage-style thought bubble when a hold lands heads up, while an event is on (config.toml [coin_bubble]) -->
    <Transition name="bubble">
      <span v-if="bubble" class="token__bubble" :class="{ 'is-typing': bubble === 'typing' }" aria-hidden="true">
        <span class="token__bubble-body">
          <span v-if="bubble === 'typing'" class="token__typing"><i /><i /><i /></span>
          <template v-else>{{ bubbleSettings.text }}</template>
        </span>
        <span class="token__bubble-dot token__bubble-dot--big" />
        <span class="token__bubble-dot token__bubble-dot--small" />
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
import bubbleSettings from '~/data/coinBubble.generated.mjs'
import { bubbleActive, landsHeads } from '~/utils/coinBubble.mjs'

const emit = defineEmits(['spin', 'release'])

const MAX_SPEED = 24 // degrees per frame
const angle = ref(0)
const pressed = ref(false)
const intro = ref(true)
const transition = ref('none')
const pops = ref([])

let speed = 0
let frame = null
let reducedMotion = false
let pressStartAngle = 0
let spinsThisHold = 0
let pressStartTime = 0
let popId = 0

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  setTimeout(() => (intro.value = false), 1600)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  hideBubble()
})

// The bubble: "typing…" for a moment once the coin settles heads up, then the message, then it
// fades. A new press clears it. Checked at release, so it stops on its own after the event.
const bubble = ref(null) // null, 'typing' or 'message'
let bubbleTimers = []
const hideBubble = () => {
  bubbleTimers.forEach(clearTimeout)
  bubbleTimers = []
  bubble.value = null
}
const showBubble = settleMs => {
  if (!bubbleActive(bubbleSettings)) return
  const typingMs = reducedMotion ? 0 : 900
  bubbleTimers.push(
    setTimeout(() => (bubble.value = typingMs ? 'typing' : 'message'), settleMs),
    setTimeout(() => (bubble.value = 'message'), settleMs + typingMs),
    setTimeout(() => (bubble.value = null), settleMs + typingMs + 5000)
  )
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
    if (landsHeads(angle.value)) showBubble(400)
    return
  }

  // Coast to the next face, taking longer the faster it was spinning
  const target = Math.ceil((angle.value + speed * 6) / 180) * 180
  const coastSeconds = 0.5 + speed / 30
  transition.value = `transform ${coastSeconds}s cubic-bezier(0.2, 0.8, 0.3, 1.2)`
  angle.value = target
  if (landsHeads(target)) showBubble(coastSeconds * 1000)
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

/* iMessage blue, with a thought bubble's trail of dots down to the coin */
.token__bubble {
  position: absolute;
  /* Phones: over the coin's upper right, clear of the menu, in the room left to the screen edge
     (the coin is about 55vw wide) */
  bottom: 70%;
  left: 52%;
  z-index: 3;
  width: max-content;
  max-width: min(14rem, 44vw);
  pointer-events: none;

  /* Wider screens: beside the coin */
  @media (min-width: 640px) {
    bottom: 62%;
    left: 90%;
    max-width: 16rem;
  }
}

.token__bubble-body {
  display: block;
  padding: 0.5rem 0.85rem;
  border-radius: 1.15rem;
  background: #0a84ff;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
  font-size: 0.95rem;
  line-height: 1.3;
  text-align: left;
  overflow-wrap: anywhere;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

.token__bubble.is-typing .token__bubble-body {
  background: #3a3a3c;
}

.token__bubble-dot {
  position: absolute;
  border-radius: 50%;
  background: #0a84ff;
}

.token__bubble.is-typing .token__bubble-dot {
  background: #3a3a3c;
}

.token__bubble-dot--big {
  left: 0.3rem;
  bottom: -0.55rem;
  width: 0.7rem;
  height: 0.7rem;
}

.token__bubble-dot--small {
  left: -0.2rem;
  bottom: -1.05rem;
  width: 0.4rem;
  height: 0.4rem;
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
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.2, 0.8, 0.3, 1.3);
}

.bubble-leave-active {
  transition: opacity 0.4s ease;
}

.bubble-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.6);
  transform-origin: bottom left;
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
</style>
