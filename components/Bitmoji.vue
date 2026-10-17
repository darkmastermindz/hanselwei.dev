<template>
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
</template>

<script setup>
// A collectible-style token: it spins (and speeds up) while it is held down,
// then settles on whichever face it is closest to when released.
const MAX_SPEED = 24 // degrees per frame
const angle = ref(0)
const pressed = ref(false)
const intro = ref(true)
const transition = ref('none')

let speed = 0
let frame = null
let reducedMotion = false

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  setTimeout(() => (intro.value = false), 1600)
})

onBeforeUnmount(() => cancelAnimationFrame(frame))

const spin = () => {
  speed = Math.min(MAX_SPEED, speed + 0.6)
  angle.value += speed
  frame = requestAnimationFrame(spin)
}

const press = event => {
  if (pressed.value) return
  if (event?.pointerId !== undefined) event.currentTarget.setPointerCapture(event.pointerId)
  pressed.value = true
  intro.value = false
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
  if (reducedMotion) return

  // Coast to the next face, taking longer the faster it was spinning
  const target = Math.ceil((angle.value + speed * 6) / 180) * 180
  transition.value = `transform ${0.5 + speed / 30}s cubic-bezier(0.2, 0.8, 0.3, 1.2)`
  angle.value = target
  speed = 0
  navigator.vibrate?.([8, 40, 8])
}
</script>

<style lang="scss" scoped>
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

@media (prefers-reduced-motion: reduce) {
  .token.is-intro .token__coin,
  .token__shine {
    animation: none;
  }
}
</style>
