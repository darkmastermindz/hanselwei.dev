<template>
  <!-- A little octopus-cat that looks like Hansel (black messy hair, glasses, stubble, his blue
       hoodie) pops out of a hole 🕳️ under Go now and presses it for you, in one of several
       personalities (utils/octoHelper.mjs). It's drawn here, not GitHub's own Octocat artwork. -->
  <div
    class="octo-pit"
    :class="`octo-pit--${personality.id}`"
    :style="{ '--octo-ms': `${personality.ms}ms` }"
    role="img"
    :aria-label="`A little octopus cat that looks like Hansel pops out of a hole and presses Go now: “${personality.line}”`"
  >
    <span class="octo-pit__hole" />
    <div class="octo-pit__rise">
      <div class="octo">
        <svg class="octo__svg" viewBox="0 0 120 124" aria-hidden="true">
          <!-- Tentacles, in the hoodie's blue; the right one is the arm that waves -->
          <g class="octo__legs" fill="none" stroke="#3f3d9e" stroke-width="9" stroke-linecap="round">
            <path d="M38 92 C32 104 24 110 16 108" />
            <path d="M50 96 C48 108 44 116 38 118" />
            <path d="M70 96 C72 108 76 116 82 118" />
          </g>
          <g class="octo__arm" fill="none" stroke="#3f3d9e" stroke-width="9" stroke-linecap="round">
            <path d="M84 90 C94 98 102 96 106 86" />
          </g>
          <!-- Head: a cat's, ears and all -->
          <path d="M18 60 C16 40 20 22 28 10 L44 27 C52 24 68 24 76 27 L92 10 C100 22 104 40 102 60 C102 84 84 96 60 96 C36 96 18 84 18 60 Z" fill="#3f3d9e" />
          <path d="M30 18 L40 29 L32 33 Z M90 18 L80 29 L88 33 Z" fill="#c084fc" opacity="0.6" />
          <!-- Face -->
          <ellipse cx="60" cy="66" rx="31" ry="23" fill="#f0c8a0" />
          <!-- Stubble along the jaw and chin -->
          <g fill="#6b4f3f" opacity="0.45">
            <circle cx="44" cy="78" r="0.9" /><circle cx="48" cy="82" r="0.9" /><circle cx="53" cy="84" r="0.9" />
            <circle cx="58" cy="85" r="0.9" /><circle cx="63" cy="85" r="0.9" /><circle cx="68" cy="83" r="0.9" />
            <circle cx="72" cy="80" r="0.9" /><circle cx="76" cy="77" r="0.9" /><circle cx="51" cy="80" r="0.9" />
            <circle cx="56" cy="81" r="0.9" /><circle cx="61" cy="82" r="0.9" /><circle cx="66" cy="80" r="0.9" />
          </g>
          <!-- Black, messy hair falling over the forehead -->
          <path d="M28 56 C28 40 40 30 56 32 C62 26 74 28 78 34 C88 34 94 44 92 56 C88 50 84 47 80 46 C80 50 76 52 72 50 C70 46 64 44 60 46 C58 50 52 52 48 48 C44 50 38 50 36 46 C32 48 30 52 28 56 Z" fill="#1b1b2a" />
          <!-- Eyes behind rectangular glasses -->
          <g class="octo__eyes" fill="#1b1b2a">
            <ellipse cx="47" cy="65" rx="2.6" ry="3" />
            <ellipse cx="73" cy="65" rx="2.6" ry="3" />
          </g>
          <g fill="rgba(255,255,255,0.18)" stroke="#9db4ff" stroke-width="2.2">
            <rect x="37" y="58" width="20" height="13" rx="3" />
            <rect x="63" y="58" width="20" height="13" rx="3" />
          </g>
          <path d="M57 63 H63 M37 62 L30 60 M83 62 L90 60" stroke="#9db4ff" stroke-width="2.2" />
          <!-- A small, slightly lopsided smile -->
          <path d="M53 79 Q60 83 68 78" fill="none" stroke="#7a3b3b" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>
    </div>
    <span class="octo-pit__lip" />
    <p class="octo-pit__line" aria-hidden="true">{{ personality.line }}</p>
  </div>
</template>

<script setup>
import { REDUCED } from '~/utils/octoHelper.mjs'

// personality: one of utils/octoHelper.mjs's PERSONALITIES
const props = defineProps({ personality: { type: Object, required: true } })
const emit = defineEmits(['press', 'done'])

let timers = []
onMounted(() => {
  const { pressAt, ms } = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? REDUCED : props.personality
  timers = [setTimeout(() => emit('press'), pressAt), setTimeout(() => emit('done'), ms)]
})
onBeforeUnmount(() => timers.forEach(clearTimeout))
</script>

<style scoped>
/* Under the Go now button: the hole, and the space above it the helper rises into */
.octo-pit {
  position: absolute;
  top: calc(100% + 0.2rem);
  left: 50%;
  width: 4.5rem;
  height: 4.6rem;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 2;
}

.octo-pit__hole,
.octo-pit__lip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.9rem;
  border-radius: 50%;
}

.octo-pit__hole {
  background: radial-gradient(ellipse at 50% 40%, #000 55%, #2b1a3d 75%, #653496);
  animation: octo-hole-open 0.25s ease-out both;
}

/* The near rim, over the helper as it climbs out */
.octo-pit__lip {
  height: 0.45rem;
  border-radius: 0 0 50% 50% / 0 0 100% 100%;
  border-bottom: 2px solid #653496;
  animation: octo-hole-open 0.25s ease-out both;
}

@keyframes octo-hole-open {
  from { transform: scaleX(0); }
}

/* Only what's below the hole is hidden: it can leap as high as it likes */
.octo-pit__rise {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.45rem;
  height: 3.9rem;
  clip-path: inset(-14rem -8rem 0 -8rem);
}

.octo {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 3.5rem;
  transform: translate(-50%, 100%);
  transform-origin: 50% 100%;
  /* Each personality names its own keyframes below (a name written out, so Vue's scoped styles
     can match it to theirs) */
  animation-duration: var(--octo-ms);
  animation-fill-mode: both;
}

.octo__svg {
  display: block;
  width: 100%;
}

.octo__arm {
  transform-origin: 84px 90px;
}

/* What it says, beside it */
.octo-pit__line {
  position: absolute;
  left: calc(100% + 0.2rem);
  top: 0.6rem;
  width: max-content;
  max-width: 9rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.6rem;
  background: #eee;
  color: #1b1b2a;
  font-size: 0.75rem;
  line-height: 1.3;
  animation: octo-line calc(var(--octo-ms) * 0.8) ease-out both;
}

@keyframes octo-line {
  0%, 25% { opacity: 0; transform: translateY(4px); }
  35%, 100% { opacity: 1; transform: none; }
}

/* Boop: straight up, a bump into the button, done */
.octo-pit--boop .octo { animation-name: octo-boop; }
@keyframes octo-boop {
  0% { transform: translate(-50%, 100%); animation-timing-function: var(--spring-bouncy, ease-out); }
  35% { transform: translate(-50%, 0); }
  52% { transform: translate(-50%, 3%); }
  60% { transform: translate(-50%, -22%); }
  72%, 100% { transform: translate(-50%, 0); }
}

/* Leap: out of the hole, up high, and down onto the button */
.octo-pit--leap .octo { animation-name: octo-leap; }
@keyframes octo-leap {
  0% { transform: translate(-50%, 100%); }
  25% { transform: translate(-50%, 0); }
  38% { transform: translate(-50%, 4%) scaleY(0.85); }
  54% { transform: translate(-50%, -230%) rotate(-18deg); }
  69% { transform: translate(-50%, -162%) rotate(0); }
  75% { transform: translate(-50%, -162%) scale(1.08, 0.85); }
  82%, 100% { transform: translate(-50%, -162%); }
}

/* Sneak: just the eyes over the rim, a look around, then a quick poke */
.octo-pit--sneak .octo { animation-name: octo-sneak; }
.octo-pit--sneak .octo__eyes { animation: octo-look var(--octo-ms) both; }
@keyframes octo-sneak {
  0% { transform: translate(-50%, 100%); }
  25%, 58% { transform: translate(-50%, 42%); }
  70% { transform: translate(-50%, 0); }
  77% { transform: translate(-50%, -22%); }
  86%, 100% { transform: translate(-50%, 0); }
}
@keyframes octo-look {
  0%, 28% { transform: none; }
  36%, 44% { transform: translateX(-3px); }
  50%, 56% { transform: translateX(3px); }
  62%, 100% { transform: none; }
}

/* Drill: spins its way up and out */
.octo-pit--drill .octo { animation-name: octo-drill; }
@keyframes octo-drill {
  0% { transform: translate(-50%, 100%) rotate(0); }
  50% { transform: translate(-50%, 8%) rotate(720deg); }
  57% { transform: translate(-50%, 0) rotate(720deg); }
  65% { transform: translate(-50%, -22%) rotate(720deg); }
  78%, 100% { transform: translate(-50%, 0) rotate(720deg); }
}

/* Wave: out, a wave hello, then the press */
.octo-pit--wave .octo { animation-name: octo-wave; }
.octo-pit--wave .octo__arm { animation: octo-arm var(--octo-ms) both; }
@keyframes octo-wave {
  0% { transform: translate(-50%, 100%); animation-timing-function: var(--spring-bouncy, ease-out); }
  25%, 66% { transform: translate(-50%, 0); }
  75% { transform: translate(-50%, -22%); }
  85%, 100% { transform: translate(-50%, 0); }
}
@keyframes octo-arm {
  0%, 25% { transform: none; }
  32% { transform: rotate(-35deg); }
  39% { transform: rotate(10deg); }
  46% { transform: rotate(-35deg); }
  53% { transform: rotate(10deg); }
  60%, 100% { transform: none; }
}

/* With reduced motion it's simply there, out of the hole, for a moment */
@media (prefers-reduced-motion: reduce) {
  .octo,
  .octo__eyes,
  .octo__arm,
  .octo-pit__hole,
  .octo-pit__lip,
  .octo-pit__line {
    animation: none !important;
  }

  .octo {
    transform: translate(-50%, 0);
  }
}
</style>
