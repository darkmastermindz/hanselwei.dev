<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener"
    class="flip-link"
    :class="{ 'is-spinning': spinning, 'is-galloping': galloping, [`flip-link--${effect}`]: effect }"
    :style="{ '--i': index }"
    :aria-label="label"
    @pointerdown="burst"
    @click="openAfterAnimation"
    @pointerenter="shuffleBack"
    @focus="shuffleBack"
  >
    <span class="flip-link__inner">
      <span :class="['flip-link__face flip-link__face--front', bg]">{{ label }}</span>
      <span :class="['flip-link__face flip-link__face--back', bg]" aria-hidden="true">
        <span class="flip-link__back-text">{{ backText }}</span>
      </span>
    </span>
    <span v-if="effect === 'unicorn'" class="unicorn" aria-hidden="true">
      <span class="unicorn__trail" />
      <span class="unicorn__rider">🦄</span>
    </span>
    <span class="flip-link__twinkles" aria-hidden="true">
      <span v-for="n in 4" :key="n" class="twinkle">✦</span>
    </span>
    <span
      v-for="p in particles"
      :key="p.id"
      class="particle"
      :style="{ left: `${p.x}px`, top: `${p.y}px`, '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--c': p.color, '--s': p.size }"
      aria-hidden="true"
    >{{ p.glyph }}</span>
  </a>
</template>

<script setup>
// A social link that flips over to a glittery back face on hover/focus, and
// throws a burst of sparkles (plus a quick spin) wherever it's tapped.
const OPEN_DELAY = 650 // ms: long enough for the spin and sparkle burst to play

const props = defineProps({
  label: { type: String, required: true },
  back: { type: String, required: true },
  // Optional alternatives for the back face; one is picked at random on every flip
  backs: { type: Array, default: () => [] },
  href: { type: String, required: true },
  bg: { type: String, default: '' },
  index: { type: Number, default: 0 }, // staggers the intro flip wave
  effect: { type: String, default: '' } // optional extra flair, e.g. 'unicorn'
})

const COLORS = ['#7cfc00', '#ffffff', '#c084fc', '#ffd700', '#00b8ff']
const RAINBOW = ['#ff3b3b', '#ff9f1c', '#ffe14d', '#3ddc84', '#3da5ff', '#a259ff']
const GLYPHS = ['✦', '✧', '•', '★', '✶']
const particles = ref([])
const spinning = ref(false)
const galloping = ref(false)
let nextId = 0

// Prerendered HTML always uses `back`; random picks only happen in the browser
const backText = ref(props.back)
const shuffleBack = () => {
  const options = props.backs.filter(text => text !== backText.value)
  if (options.length) backText.value = options[Math.floor(Math.random() * options.length)]
}
onMounted(shuffleBack)

const burst = event => {
  shuffleBack()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const rect = event.currentTarget.getBoundingClientRect()
  // Keyboard activation has no pointer position: burst from the middle
  const x = event.clientX ? event.clientX - rect.left : rect.width / 2
  const y = event.clientY ? event.clientY - rect.top : rect.height / 2

  const palette = props.effect === 'unicorn' ? RAINBOW : COLORS
  const fresh = Array.from({ length: 14 }, () => {
    const angle = Math.random() * Math.PI * 2
    const distance = 30 + Math.random() * 45
    return {
      id: nextId++,
      x,
      y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      color: palette[Math.floor(Math.random() * palette.length)],
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      size: (0.6 + Math.random() * 0.8).toFixed(2)
    }
  })
  particles.value.push(...fresh)
  const ids = new Set(fresh.map(p => p.id))
  setTimeout(() => (particles.value = particles.value.filter(p => !ids.has(p.id))), 800)

  spinning.value = false
  requestAnimationFrame(() => (spinning.value = true))
  setTimeout(() => (spinning.value = false), 650)

  if (props.effect === 'unicorn') {
    galloping.value = false
    requestAnimationFrame(() => (galloping.value = true))
    setTimeout(() => (galloping.value = false), 1300)
  }
}

// Hold the navigation briefly so the tap animation is visible before the
// link opens. Modified clicks (new tab/window shortcuts) behave normally.
const openAfterAnimation = event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  event.preventDefault()
  if (event.detail === 0) burst(event) // keyboard Enter: no pointerdown fired

  setTimeout(() => {
    if (props.href.startsWith('mailto:')) {
      window.location.href = props.href
      return
    }
    // Popup blockers may refuse a delayed window.open; fall back to this tab.
    // ('noopener' as a feature would make window.open always return null, so
    // the opener link is cut by hand instead.)
    const opened = window.open(props.href, '_blank')
    if (opened) opened.opener = null
    else window.location.href = props.href
  }, OPEN_DELAY)
}
</script>

<style lang="scss" scoped>
.flip-link {
  position: relative;
  display: block;
  perspective: 600px;
  text-decoration: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: none;

    .flip-link__face {
      box-shadow: 0 0 0 3px #7cfc00;
    }
  }
}

.flip-link__inner {
  position: relative;
  display: block;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.3, 1.4, 0.5, 1);
  /* One-time flip wave when the page loads, staggered per button */
  animation: intro-flip 1.1s ease-in-out calc(1.6s + var(--i) * 0.12s) backwards;
}

.flip-link__face {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px; /* comfortable touch target */
  min-width: 11.5rem; /* room for the back-face text */
  padding: 0.5rem 1.4rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-link__face--back {
  position: absolute;
  inset: 0;
  padding: 0.5rem 0.6rem;
  overflow: hidden;
  transform: rotateX(180deg);
  border-color: #ffd700;

  /* Glitter: two drifting dot layers */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0 1px, transparent 1.6px),
      radial-gradient(circle, rgba(255, 215, 0, 0.9) 0 1px, transparent 1.6px);
    background-size: 13px 13px, 21px 21px;
    background-position: 0 0, 6px 9px;
    animation: glitter 1.4s linear infinite, twinkle-dots 0.9s ease-in-out infinite alternate;
    pointer-events: none;
  }

  /* Shimmer sweep */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.55) 48%, transparent 66%);
    transform: translateX(-120%);
    animation: shimmer 1.6s ease-in-out infinite;
    pointer-events: none;
  }
}

.flip-link__back-text {
  position: relative;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

@media (hover: hover) {
  .flip-link:hover .flip-link__inner {
    transform: rotateX(180deg);
  }

  .flip-link:hover .twinkle {
    animation-play-state: running;
    opacity: 1;
  }
}

.flip-link:focus-visible .flip-link__inner {
  transform: rotateX(180deg);
}

.flip-link.is-spinning .flip-link__inner {
  animation: tap-spin 0.6s cubic-bezier(0.3, 0.9, 0.4, 1.2);
}

/* Little stars that twinkle around the edges while hovered */
.flip-link__twinkles {
  position: absolute;
  inset: -8px;
  pointer-events: none;
}

.twinkle {
  position: absolute;
  font-size: 0.75rem;
  color: #ffd700;
  opacity: 0;
  animation: twinkle 1s ease-in-out infinite paused;
  transition: opacity 0.2s;

  &:nth-child(1) { top: 0; left: 12%; }
  &:nth-child(2) { top: 10%; right: 4%; animation-delay: 0.25s; color: #fff; }
  &:nth-child(3) { bottom: 0; right: 20%; animation-delay: 0.5s; color: #7cfc00; }
  &:nth-child(4) { bottom: 8%; left: 2%; animation-delay: 0.75s; color: #c084fc; }
}

.particle {
  position: absolute;
  z-index: 3;
  color: var(--c);
  font-size: calc(var(--s) * 1rem);
  line-height: 1;
  pointer-events: none;
  text-shadow: 0 0 6px var(--c);
  animation: burst 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
}

/* GitHub: a unicorn gallops across with a rainbow trail */
.unicorn {
  position: absolute;
  top: -1.1rem;
  left: -60%;
  z-index: 4;
  display: flex;
  align-items: center;
  pointer-events: none;
  opacity: 0;
}

.unicorn__rider {
  font-size: 1.5rem;
  line-height: 1;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
  animation: gallop-bob 0.25s ease-in-out infinite alternate;
}

.unicorn__trail {
  width: 64px;
  height: 10px;
  margin-right: -4px;
  border-radius: 9999px;
  background: linear-gradient(90deg, transparent, #a259ff, #3da5ff, #3ddc84, #ffe14d, #ff9f1c, #ff3b3b);
  opacity: 0.85;
}

.flip-link.is-galloping .unicorn {
  animation: gallop 1.2s linear;
}

@media (hover: hover) {
  .flip-link--unicorn:hover .unicorn {
    animation: gallop 1.2s linear;
  }
}

.flip-link--unicorn .flip-link__face--back {
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow: 0 0 0 2px #ff3b3b, 0 0 0 4px #ffe14d, 0 0 0 6px #3da5ff;
}

@keyframes gallop {
  0% { left: -60%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}

@keyframes gallop-bob {
  from { transform: translateY(0) rotate(-4deg); }
  to { transform: translateY(-5px) rotate(4deg); }
}

@keyframes intro-flip {
  0%, 100% { transform: rotateX(0); }
  35%, 65% { transform: rotateX(180deg); }
}

@keyframes tap-spin {
  from { transform: rotateY(0) scale(1); }
  50% { transform: rotateY(180deg) scale(1.08); }
  to { transform: rotateY(360deg) scale(1); }
}

@keyframes glitter {
  to { background-position: 13px 13px, -21px 21px; }
}

@keyframes twinkle-dots {
  from { opacity: 0.45; }
  to { opacity: 1; }
}

@keyframes shimmer {
  0%, 30% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}

@keyframes twinkle {
  0%, 100% { transform: scale(0.4) rotate(0); opacity: 0.2; }
  50% { transform: scale(1.2) rotate(90deg); opacity: 1; }
}

@keyframes burst {
  from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.2) rotate(180deg); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .flip-link__inner {
    animation: none;
    transition: none;
  }

  .flip-link__face--back::before,
  .flip-link__face--back::after,
  .twinkle,
  .unicorn,
  .unicorn__rider {
    animation: none !important;
  }
}
</style>
