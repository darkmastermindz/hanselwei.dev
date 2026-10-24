<template>
  <nav :class="['app-nav bg-neutral text-neutral-content', { 'app-nav--home': route.path === '/' }]" aria-label="Main">
    <div class="app-nav__links">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :class="['btn btn-ghost btn-sm md:btn-md normal-case dim', link.color, { 'is-current': isCurrent(link.to) }]"
        :aria-current="isCurrent(link.to) ? 'page' : undefined"
        :aria-label="link.label"
      >
        <span>{ {{ link.emoji }} {{ link.label }} }</span>
      </NuxtLink>
      <!-- Hidden until the owner gesture on the home page token (or already signed in) -->
      <Transition name="reveal">
        <AuthButton v-if="showSignIn" />
      </Transition>
    </div>
  </nav>
</template>

<script setup>
// Highlight a section for its own pages too (e.g. Blog on /blog/feed/…),
// which router-link-active misses because those pages aren't nested routes
const route = useRoute()
const isCurrent = to => (to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(`${to}/`))

// Sign in only appears after the secret token gesture, or for a signed-in owner (so
// they can sign out), or when coming back from a refused or ended sign-in (to say why)
const { revealed, restore } = useOwnerGate()
const { user, error, notice } = useAuth()
const showSignIn = computed(() => revealed.value || Boolean(user.value) || Boolean(error.value) || Boolean(notice.value))
onMounted(restore)

const links = [
  { to: '/', label: 'Home', emoji: '🏠', color: 'white' },
  { to: '/projects', label: 'Projects', emoji: '👨🏻‍💻', color: 'blue' },
  { to: '/blog', label: 'Blog', emoji: '📰', color: 'purple' },
  { to: '/gear', label: 'Gear Lists', emoji: '🏔️', color: 'green' },
  { to: '/bio', label: 'Bio', emoji: '👋', color: 'yellow' }
]
</script>

<style lang="scss" scoped>
.app-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  /* Keep clear of the notch / status bar when installed as an app */
  padding: calc(env(safe-area-inset-top) + 0.5rem) max(env(safe-area-inset-right), 0.5rem) 0.5rem
    max(env(safe-area-inset-left), 0.5rem);
}

/* Installed as an app: a little more room around the nav and between its rows. The media query
   applies from the first paint; html.is-installed (plugins/pwa.client.js) also covers iOS
   versions that only report navigator.standalone */
@media (display-mode: standalone) {
  .app-nav {
    padding: calc(env(safe-area-inset-top) + 0.75rem) max(env(safe-area-inset-right), 0.75rem) 0.75rem
      max(env(safe-area-inset-left), 0.75rem);
  }

  .app-nav__links {
    row-gap: 0.5rem;
  }
}

:global(html.is-installed .app-nav) {
  padding: calc(env(safe-area-inset-top) + 0.75rem) max(env(safe-area-inset-right), 0.75rem) 0.75rem
    max(env(safe-area-inset-left), 0.75rem);
}

:global(html.is-installed .app-nav__links) {
  row-gap: 0.5rem;
}

.app-nav__links {
  display: flex;
  flex-wrap: wrap; /* wraps onto a second line on small screens, like before */
  gap: 0.25rem;

  a {
    flex: 0 0 auto;
    white-space: nowrap;
    /* No scale "pop" on the links: iOS (above all the installed app) can leave scaled text
       rasterized and blurry in the sticky nav */
    animation: none;
    transform: none;
  }

  .is-current {
    background-color: rgba(255, 255, 255, 0.08);
  }
}

/* Foldables, folded part-way (the --fold-* variables, layouts/default.vue; README "Foldables").
   Nothing in the menu ever sits on the fold. */

/* Tabletop (a crease across the middle): on the home page, one row along the top, so the page
   knows exactly where its top half starts (pages/index.vue) */
@media (vertical-viewport-segments: 2) {
  .app-nav--home {
    display: flex;
    align-items: center;
    height: var(--fold-nav-h);
    padding-top: calc(env(safe-area-inset-top) + 0.25rem);
    padding-bottom: 0.25rem;

    .app-nav__links {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    }
  }

  /* Other pages: the menu fills the top half and the fold, so the page itself reads in the bottom
     half (it scrolls up under the menu, never onto the fold) */
  .app-nav:not(.app-nav--home) {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(var(--fold-bottom-start) + var(--crease));
    padding-bottom: calc(var(--fold-bottom-start) - var(--fold-top-end) + 2 * var(--crease));

    .app-nav__links {
      justify-content: center;
      gap: 0.5rem;
    }
  }
}

/* Book (a crease down the middle): the menu keeps to the left page. On the home page it's one
   row above the coin; on other pages a column down the left page, beside the reading */
@media (horizontal-viewport-segments: 2) {
  .app-nav {
    position: fixed;
    left: 0;
    width: calc(var(--fold-left-end) - var(--crease));
  }

  /* Half a screen is too narrow for one row: two centred rows (--fold-nav-h is taller in book) */
  .app-nav--home {
    display: flex;
    align-items: center;
    height: var(--fold-nav-h);
    padding-top: calc(env(safe-area-inset-top) + 0.25rem);
    padding-bottom: 0.25rem;

    .app-nav__links {
      justify-content: center;
      gap: 0.25rem 0.5rem;
    }
  }

  .app-nav:not(.app-nav--home) {
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .app-nav__links {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
  }
}

/* Sign in appears in line with the other buttons with a little shimmer */
.reveal-enter-active {
  animation: reveal-in 0.7s cubic-bezier(0.2, 0.8, 0.3, 1.3);
}

.reveal-leave-active {
  transition: opacity 0.2s ease;
}

.reveal-leave-to {
  opacity: 0;
}

@keyframes reveal-in {
  0% {
    opacity: 0;
    transform: scale(0.6) rotate(-8deg);
    filter: drop-shadow(0 0 0 #fbbf24);
  }
  60% {
    opacity: 1;
    transform: scale(1.12) rotate(2deg);
    filter: drop-shadow(0 0 10px #fbbf24);
  }
  100% {
    transform: none;
    filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal-enter-active {
    animation: none;
  }
}

.blue {
  color: #00b8ff;
}

.green {
  color: #41b883;
}

.purple {
  color: #c084fc;
}

.yellow {
  color: #fbbf24;
}
</style>
