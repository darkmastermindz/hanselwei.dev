<template>
  <!-- iPhone's slide to unlock, in Liquid Glass (packages/tailwind-ios-glass). Drag the knob to the
       end, or with the keyboard: → steps along, End or Enter goes all the way. Let go early and it
       springs back. -->
  <div
    ref="track"
    class="swipe-unlock liquid-glass rounded-full"
    :class="{ 'swipe-unlock--dragging': dragging, 'swipe-unlock--done': done }"
    :style="{ '--swipe-x': `${x}px`, '--swipe-progress': progress }"
  >
    <span class="swipe-unlock__label" aria-hidden="true">{{ label }}</span>
    <div
      class="swipe-unlock__knob rounded-full"
      role="slider"
      tabindex="0"
      :aria-label="label"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(progress * 100)"
      :aria-valuetext="done ? 'Unlocked' : `${Math.round(progress * 100)}%`"
      @pointerdown="grab"
      @pointermove="drag"
      @pointerup="letGo"
      @pointercancel="letGo"
      @keydown="onKey"
    >
      <span aria-hidden="true">{{ done ? '🔓' : '→' }}</span>
    </div>
  </div>
</template>

<script setup>
import { unlockProgress, UNLOCK_AT } from '~/utils/swipeUnlock.mjs'

defineProps({ label: { type: String, default: 'slide to unlock' } })
const emit = defineEmits(['unlock'])

const track = ref(null)
const x = ref(0)
const dragging = ref(false)
const done = ref(false)
let startX = 0
let startAt = 0

// How far the knob can travel: the track's inside, less the knob
const travel = () => {
  const el = track.value
  if (!el) return 0
  const knob = el.querySelector('.swipe-unlock__knob')
  const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0
  return Math.max(0, el.clientWidth - knob.offsetWidth - pad * 2)
}
const progress = computed(() => unlockProgress(x.value, travel()))

const finish = () => {
  if (done.value) return
  x.value = travel()
  done.value = true
  // A beat at the end, like the phone, before what's behind it shows
  setTimeout(() => emit('unlock'), 350)
}
const setProgress = p => {
  x.value = Math.max(0, Math.min(1, p)) * travel()
  if (unlockProgress(x.value, travel()) >= 1) finish()
}

const grab = event => {
  if (done.value) return
  event.currentTarget.setPointerCapture?.(event.pointerId)
  dragging.value = true
  startX = event.clientX
  startAt = x.value
}
const drag = event => {
  if (!dragging.value) return
  x.value = Math.max(0, Math.min(travel(), startAt + event.clientX - startX))
}
const letGo = () => {
  if (!dragging.value) return
  dragging.value = false
  if (unlockProgress(x.value, travel()) >= UNLOCK_AT) finish()
  else x.value = 0 // springs back
}

const onKey = event => {
  if (done.value) return
  const step = { ArrowRight: 0.25, ArrowUp: 0.25, ArrowLeft: -0.25, ArrowDown: -0.25 }
  if (Object.hasOwn(step, event.key)) setProgress(progress.value + step[event.key])
  else if (event.key === 'Home') setProgress(0)
  else if (['End', 'Enter', ' '].includes(event.key)) setProgress(1)
  else return
  event.preventDefault()
}
</script>

<style scoped>
.swipe-unlock {
  --swipe-knob: 3rem;
  display: flex;
  align-items: center;
  width: min(20rem, 100%);
  height: calc(var(--swipe-knob) + 0.5rem);
  padding: 0.25rem;
  margin: 0 auto;
  user-select: none;
  -webkit-user-select: none;
}

/* The label fades as the knob slides over it, with the shimmer running through it */
.swipe-unlock__label {
  position: absolute;
  inset: 0 0 0 var(--swipe-knob);
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  background: linear-gradient(100deg, #9a9a9a 40%, #fff 50%, #9a9a9a 60%) 0 0 / 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  font-size: 1.05rem;
  opacity: calc(1 - var(--swipe-progress) * 1.6);
  animation: swipe-shimmer 2.4s linear infinite;
  pointer-events: none;
}

@keyframes swipe-shimmer {
  from { background-position: 100% 0; }
  to { background-position: -50% 0; }
}

.swipe-unlock__knob {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: var(--swipe-knob);
  height: var(--swipe-knob);
  background: #eee;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.4);
  color: #23262a;
  font-size: 1.3rem;
  cursor: grab;
  touch-action: none; /* the finger slides the knob, the page doesn't scroll */
  transform: translateX(var(--swipe-x));
  transition: transform var(--spring-bouncy-duration, 0.5s) var(--spring-bouncy, ease-out);
}

.swipe-unlock--dragging .swipe-unlock__knob {
  cursor: grabbing;
  transition: none;
}

.swipe-unlock--done .swipe-unlock__knob {
  background: #7cfc00;
}

@media (prefers-reduced-motion: reduce) {
  .swipe-unlock__label {
    animation: none;
    color: #bbb;
    background: none;
  }

  .swipe-unlock__knob {
    transition: none;
  }
}
</style>
