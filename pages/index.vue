<template>
  <main class="outer home">
    <!-- Pull down from the top, at or above the name, to start the coin over -->
    <PullToRefresh zone=".home__name" />
    <!-- Two plain groups (no change to the usual layout) that foldables split across the fold:
         the hero and, below it, the deck (see the "Foldables" styles) -->
    <div class="home__hero">
      <DuoLaptopLid />
      <div class="home__coin flex justify-center pt-6 pb-4">
        <Bitmoji @spin="addSpin" @release="onRelease" />
      </div>
      <div class="home__intro">
        <p class="hint">
          <template v-if="loaded && count">
            🪙 <strong>{{ count }}</strong> {{ count === 1 ? 'spin' : 'spins' }}
            · best hold {{ best }}
            · {{ seenCount }}/{{ total }} discovered
          </template>
          <template v-else><span class="hint__touch">tap</span><span class="hint__mouse">click</span> the coin · discover a new fact</template>
        </p>
        <!-- iPhone Duo only (<html data-device>, utils/foldMode.mjs): a little celebration -->
        <p class="duo-badge">✨ Hello, iPhone Duo</p>
        <h1 class="home__name title text-4xl md:text-5xl lg:text-6xl">
          <strong>Hansel Wei</strong>
        </h1>
        <ContactCardButton :unlocked="humanVerified" />
        <FoldPaddleBall />
      </div>
    </div>

    <div class="home__deck">
      <AboutCard :fact="current" :reveal-count="reveals" />

      <Socials />

      <div class="flex flex-wrap justify-center gap-3 px-4 pt-10 pb-12">
        <NuxtLink to="/blog" class="button--green">Read the blog 📰</NuxtLink>
        <NuxtLink to="/gear" class="button--grey">Browse my gear lists 🏔️</NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup>
import eventSettings from '~/data/coinBubble.generated.mjs'
import { bubbleActive } from '~/utils/coinBubble.mjs'

// The home page title is Hansel's name, or during an event (config.toml [coin_bubble] home_title)
// the event title, which names him too
const eventTitle = ref(bubbleActive(eventSettings) ? eventSettings.homeTitle : null)
onMounted(() => {
  if (!bubbleActive(eventSettings)) eventTitle.value = null
})
useHead({ title: () => eventTitle.value ?? 'Hansel Wei' })

const { loaded, count, best, current, total, seenCount, addSpin, reveal } = useSpinStats()

// Spinning the token (with real input) proves there's a human here, which
// unlocks the contact card. Deliberately not persisted: every visit re-checks.
const humanVerified = ref(false)
const reveals = ref(0)
// A 3-second spin, then a tap, also reveals the nav's owner Sign in
const { onTokenRelease } = useOwnerGate()
const onRelease = (spins, heldMs) => {
  reveal(spins)
  reveals.value++
  humanVerified.value = true
  onTokenRelease(spins, heldMs)
}
</script>

<style lang="scss" scoped>
.title {
  font-family: "Roboto Mono", "Quicksand", "Source Sans Pro", -apple-system,
    BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  display: block;
  color: #eee;
  letter-spacing: 1px;
}

.hint {
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
  font-variant-numeric: tabular-nums;

  strong {
    color: #9dff5c;
  }
}
.outer {
  text-align: center;
}

/* Foldables (<html data-fold>, utils/foldMode.mjs; the --fold-* variables, layouts/default.vue).
   Open flat on a near-square screen, two columns. Folded part-way, the hero and the deck each
   get one half and nothing sits on the fold. The page re-flows the moment it's folded. */

/* Open flat: an unfolded Android foldable, or iPhone Duo's inner screen held sideways. Two
   columns (an even number, as Apple's iPhone Duo guidelines suggest), clear of the camera. */
:root[data-fold='flat'] .home {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  align-items: center;
  column-gap: 1.5rem;
  min-height: calc(100vh - 5rem);
  min-height: calc(100dvh - 5rem); /* iOS: 100vh is taller than the page while Safari's bars show */
  padding: 0 max(1rem, env(safe-area-inset-right)) 0 max(1rem, env(safe-area-inset-left));
}

/* iPhone Duo open flat still has its hinge down the middle: two even columns with the gap between
   them on it, kept clear as Apple suggests. The same margin both sides (whichever side the camera
   or Safari's bars are on) keeps that gap in the middle. */
:root[data-fold='flat'][data-device='iphone-duo'] .home {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  column-gap: 4rem;
  padding-right: max(1rem, env(safe-area-inset-left), env(safe-area-inset-right));
  padding-left: max(1rem, env(safe-area-inset-left), env(safe-area-inset-right));
}

/* The hero stays beside the card and links as they scroll, centred on the screen below the menu */
:root[data-fold='flat'] .home__hero {
  position: sticky;
  top: 4rem;
  align-self: start;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: calc(100vh - 5rem);
  min-height: calc(100dvh - 5rem);
}

/* Open flat or in book, the coin fits short screens too (iPhone Duo sideways is 600px tall) */
:root[data-fold='flat'] .home__hero :deep(.token),
:root[data-fold='book'] .home__hero :deep(.token) {
  --size: clamp(120px, 34vh, 230px);
}

/* Tabletop (a crease across, the top half tilted back like a laptop): the top half is the
   screen (coin and name), the bottom half the keyboard (the card, links and, along the bottom,
   the menu: components/AppNav.vue). The hero stays put and covers the fold; the deck scrolls
   under it, so nothing ever scrolls onto the fold. */
:root[data-fold='tabletop'] .home {
  --fold-hero-h: calc(var(--fold-top-end) - var(--crease) - env(safe-area-inset-top, 0px));
  display: block;
  min-height: 0;
  padding: 0;
}

:root[data-fold='tabletop'] .home__hero {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 15; /* over the deck, under the menu and pull-to-refresh */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(var(--fold-bottom-start) + var(--crease));
  /* The hero itself is in the top half; the rest covers the fold */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: calc(var(--fold-bottom-start) - var(--fold-top-end) + 2 * var(--crease));
  overflow: hidden;
  background: var(--fold-paper);
}

:root[data-fold='tabletop'] .home__coin {
  padding: 0 0 0.5rem;
}

/* The coin shrinks to fit the top half */
:root[data-fold='tabletop'] .home__hero :deep(.token) {
  --size: clamp(80px, calc(var(--fold-hero-h) * 0.5), 200px);
}

:root[data-fold='tabletop'] .home__intro .title {
  font-size: 2rem;
  line-height: 1.2;
}

/* Wide enough: coin beside the name, like a laptop screen */
@media (min-width: 640px) {
  :root[data-fold='tabletop'] .home__hero {
    flex-direction: row;
    gap: 2rem;
  }

  :root[data-fold='tabletop'] .home__hero :deep(.token) {
    --size: clamp(80px, calc(var(--fold-hero-h) * 0.7), 240px);
  }

  :root[data-fold='tabletop'] .home__coin {
    padding: 0;
  }
}

/* The deck starts just below the fold */
:root[data-fold='tabletop'] .home__deck {
  margin-top: calc(var(--fold-bottom-start) + var(--crease));
}

/* Book (a crease down the middle): the hero on the left page, the deck on the right */
:root[data-fold='book'] .home {
  display: grid;
  grid-template-columns: calc(var(--fold-left-end) - var(--crease)) minmax(0, 1fr);
  column-gap: calc(var(--fold-right-start) - var(--fold-left-end) + 2 * var(--crease));
  align-items: start;
  min-height: 0;
  padding: 0;
}

/* Stays in view on the left page while the right page scrolls */
:root[data-fold='book'] .home__hero {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
  height: 100dvh;
  padding-top: var(--fold-nav-h); /* below the menu (components/AppNav.vue) */
  padding-left: env(safe-area-inset-left); /* iPhone Duo sideways: clear of the camera */
}

:root[data-fold='book'] .home__deck {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 1rem max(1rem, env(safe-area-inset-right)) 0 0; /* room for the card's shadow */
}

/* iPhone Duo's own badge: a rainbow edge that slowly turns, like Apple's own launch colours */
.duo-badge {
  display: none;
}

:root[data-device^='iphone-duo']:not([data-fold='tabletop'], [data-fold='book']) .duo-badge {
  --duo-angle: 0deg;
  display: inline-block;
  margin: 0 auto 0.6rem;
  padding: 0.25rem 0.8rem;
  border: 2px solid transparent;
  border-radius: 9999px;
  background:
    linear-gradient(#23262a, #23262a) padding-box,
    conic-gradient(from var(--duo-angle), #c084fc, #7cfc00, #ffd700, #00b8ff, #c084fc) border-box;
  color: #eee;
  font-size: 0.8rem;
  animation: duo-badge-turn 6s linear infinite;
}

@property --duo-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@keyframes duo-badge-turn {
  to { --duo-angle: 360deg; }
}

@media (prefers-reduced-motion: reduce) {
  :root[data-device^='iphone-duo'] .duo-badge {
    animation: none;
  }
}

/* Phones say "tap"; a mouse says "click" (the same rule as the About card hint) */
.hint__mouse {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .hint__touch {
    display: none;
  }

  .hint__mouse {
    display: inline;
  }
}
</style>
