<template>
  <div
    class="ptr"
    :class="{ 'is-armed': armed || done, 'is-shown': shown }"
    :style="{ '--pull': `${done ? PULL_THRESHOLD : distance}px` }"
    role="status"
    aria-live="polite"
  >
    <span class="ptr__coin" :style="{ '--turn': `${distance * 5}deg` }" aria-hidden="true">🪙</span>
    <span class="ptr__label">{{ done ? 'Reset ✨' : armed ? 'Release to reset' : 'Pull to reset' }}</span>
  </div>
</template>

<script setup>
// App-style pull-down "hard refresh" (touch only, no page reload): drag down from the
// top of the page and let go past the threshold to start the token over and hide
// Sign in (composables/useHardRefresh.js)
import { canStartPull, isPullArmed, pullDistance, pullIntent, PULL_THRESHOLD } from '~/utils/pullGesture.js'

const hardRefresh = useHardRefresh()
const distance = ref(0)
const done = ref(false)
const armed = computed(() => isPullArmed(distance.value))
const shown = computed(() => distance.value > 0 || done.value)

let start = null
let mode = 'idle' // idle | undecided | pull | ignore
let doneTimer = 0

// The touchmove listener can cancel the scroll, so while it's attached Chrome waits on it for
// every move. It's only attached while the page is at the top, where a pull can start, so
// scrolling anywhere further down never waits on the page's scripts.
let watching = false
const watchMoves = () => {
  const on = window.scrollY <= 0
  if (on === watching) return
  watching = on
  if (on) addEventListener('touchmove', onMove, { passive: false })
  else removeEventListener('touchmove', onMove)
}

const stop = () => {
  start = null
  mode = 'idle'
  distance.value = 0
}

const onStart = event => {
  if (event.touches.length !== 1 || !canStartPull(window.scrollY, event.target)) return stop()
  start = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  mode = 'undecided'
}

const onMove = event => {
  if (!start) return
  if (event.touches.length !== 1) return stop()
  const dx = event.touches[0].clientX - start.x
  const dy = event.touches[0].clientY - start.y
  if (mode === 'undecided') mode = pullIntent(dx, dy)
  if (mode === 'ignore' || window.scrollY > 0) return stop()
  if (mode !== 'pull') return
  // Ours now: keep the page (and the browser's own pull-to-refresh) still
  if (event.cancelable) event.preventDefault()
  distance.value = pullDistance(dy)
}

const onEnd = () => {
  if (mode === 'pull' && armed.value) {
    hardRefresh()
    done.value = true
    clearTimeout(doneTimer)
    doneTimer = setTimeout(() => (done.value = false), 900)
  }
  stop()
}

onMounted(() => {
  watchMoves()
  addEventListener('scroll', watchMoves, { passive: true })
  addEventListener('touchstart', onStart, { passive: true })
  addEventListener('touchend', onEnd, { passive: true })
  addEventListener('touchcancel', stop, { passive: true })
})
onBeforeUnmount(() => {
  removeEventListener('touchstart', onStart)
  removeEventListener('scroll', watchMoves)
  removeEventListener('touchmove', onMove)
  removeEventListener('touchend', onEnd)
  removeEventListener('touchcancel', stop)
  clearTimeout(doneTimer)
})
</script>

<style scoped>
.ptr {
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  background: #23262a;
  border: 1px solid #653496;
  box-shadow: 3px 3px #7cfc00;
  color: #bbb;
  font-size: 0.8rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, calc(var(--pull, 0px) - 100%));
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.ptr.is-shown {
  opacity: 1;
  margin-top: env(safe-area-inset-top);
}

.ptr.is-armed {
  color: #7cfc00;
  border-color: #7cfc00;
}

.ptr__coin {
  display: inline-block;
  transform: rotate(var(--turn, 0deg));
}

@media (prefers-reduced-motion: reduce) {
  .ptr,
  .ptr__coin {
    transition: none;
    transform: translate(-50%, 0.5rem);
  }
}
</style>
