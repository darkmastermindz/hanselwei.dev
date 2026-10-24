<template>
  <main class="outer home">
    <!-- Two plain groups (no change to the usual layout) that foldables split across the fold:
         the hero and, below it, the deck (see the "Foldables" styles) -->
    <div class="home__hero">
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
        <h1 class="title text-4xl md:text-5xl lg:text-6xl">
          <strong>Hansel Wei</strong>
        </h1>
        <ContactCardButton :unlocked="humanVerified" />
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

/* Foldables (README "Foldables"; the --fold-* variables are in layouts/default.vue). Unfolded
   flat, a near-square screen gets two columns. Folded part-way, the hero and the deck each get
   one half and nothing sits on the fold. Plain media queries, so the page re-flows the moment
   the phone is folded or unfolded. */

/* Flat, unfolded: a near-square touch screen between phone and tablet sizes (no phone, tablet or
   desktop window matches: tests/e2e/foldable.spec.mjs). Works in every browser. */
@media (min-width: 600px) and (max-width: 1100px) and (min-aspect-ratio: 4/5) and (max-aspect-ratio: 5/4) and (pointer: coarse) and (hover: none) {
  .home {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    align-items: center;
    column-gap: 1.5rem;
    min-height: calc(100vh - 5rem);
    padding: 0 1rem;
  }
}

/* Tabletop (a crease across the middle, the top half tilted back like a laptop): the top half is
   the display (coin, name), the bottom half the controls (the card, links). The menu is one row
   (components/AppNav.vue), so the hero is sized to end just above the fold. */
@media (vertical-viewport-segments: 2) {
  .home {
    --fold-hero-h: calc(var(--fold-top-end) - var(--fold-nav-h) - var(--crease));
    display: block;
    min-height: 0;
    padding: 0;
  }

  .home__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: var(--fold-hero-h);
    overflow: hidden;
  }

  .home__coin {
    padding: 0 0 0.5rem;
  }

  /* The coin shrinks to fit the top half */
  .home__hero :deep(.token) {
    --size: clamp(80px, calc(var(--fold-hero-h) * 0.5), 200px);
  }

  .home__intro .title {
    font-size: 2rem;
    line-height: 1.2;
  }

  /* Wide enough: coin beside the name, like a laptop screen */
  @media (min-width: 640px) {
    .home__hero {
      flex-direction: row;
      gap: 2rem;
    }

    .home__hero :deep(.token) {
      --size: clamp(80px, calc(var(--fold-hero-h) * 0.7), 240px);
    }

    .home__coin {
      padding: 0;
    }
  }

  /* The deck starts just below the fold */
  .home__deck {
    margin-top: calc(var(--fold-bottom-start) - var(--fold-top-end) + 2 * var(--crease));
  }
}

/* Book (a crease down the middle): the hero on the left page, the deck on the right */
@media (horizontal-viewport-segments: 2) {
  .home {
    display: grid;
    grid-template-columns: calc(var(--fold-left-end) - var(--crease)) minmax(0, 1fr);
    column-gap: calc(var(--fold-right-start) - var(--fold-left-end) + 2 * var(--crease));
    align-items: start;
    min-height: 0;
    padding: 0;
  }

  /* Stays in view on the left page while the right page scrolls */
  .home__hero {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100vh;
    height: 100dvh;
    padding-top: var(--fold-nav-h); /* below the menu (components/AppNav.vue) */
  }

  .home__deck {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 1rem 1rem 0 0; /* room for the card's shadow */
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
