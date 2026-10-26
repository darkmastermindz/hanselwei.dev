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
      <!-- iPad held sideways: read the site as a book -->
      <BookToggle />
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

  /* The current page: a darker pill, so every link colour keeps WCAG AA contrast on it (a
     lighter one dropped purple and green below 4.5:1) */
  .is-current {
    background-color: rgba(0, 0, 0, 0.25);
  }
}

/* Foldables (<html data-fold>, utils/foldMode.mjs; the --fold-* variables, layouts/default.vue).
   Nothing in the menu ever sits on the fold. */

/* Tabletop (a crease across): the menu goes on the bottom half, like a laptop's keyboard, and
   reading on the top half. Home: one row along the bottom (the card and links have the rest of
   the bottom half, pages/index.vue). Other pages: the menu covers the fold and the bottom half,
   so the page reads on the top half and scrolls up past it, never onto the fold. */
:root[data-fold='tabletop'] .app-nav {
  position: fixed;
  top: auto;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 0.25rem;
  padding-bottom: calc(env(safe-area-inset-bottom) + 0.25rem);

  .app-nav__links {
    justify-content: center;
  }
}

:root[data-fold='tabletop'] .app-nav--home {
  height: var(--fold-nav-h);
}

/* Wide enough for one row (narrower, two centred rows: --fold-nav-h, layouts/default.vue) */
@media (min-width: 640px) {
  :root[data-fold='tabletop'] .app-nav--home .app-nav__links {
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: none;
  }
}

:root[data-fold='tabletop'] .app-nav:not(.app-nav--home) {
  top: calc(var(--fold-top-end) - var(--crease));
  padding-top: calc(var(--fold-bottom-start) - var(--fold-top-end) + 2 * var(--crease));

  .app-nav__links {
    gap: 0.5rem;
  }
}

/* Book (a crease down the middle): the menu keeps to the left page, at the side like iPhone
   Duo's own controls. Home: two rows above the coin. Other pages: a column down the left page,
   beside the reading on the right. */
:root[data-fold='book'] .app-nav {
  position: fixed;
  left: 0;
  width: calc(var(--fold-left-end) - var(--crease));
}

:root[data-fold='book'] .app-nav--home {
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

:root[data-fold='book'] .app-nav:not(.app-nav--home) {
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

/* Sign in appears in line with the other buttons with a little shimmer */
.reveal-enter-active {
  /* The pop is SwiftUI's .bouncy spring (it overshoots on its own); the glow fades on its own curve */
  animation: reveal-in var(--spring-bouncy-duration) var(--spring-bouncy), reveal-glow 0.7s ease;
}

.reveal-leave-active {
  transition: opacity 0.2s ease;
}

.reveal-leave-to {
  opacity: 0;
}

@keyframes reveal-in {
  from {
    opacity: 0;
    transform: scale(0.6) rotate(-8deg);
  }
  to {
    transform: none;
  }
}

@keyframes reveal-glow {
  0% {
    filter: drop-shadow(0 0 0 #fbbf24);
  }
  60% {
    filter: drop-shadow(0 0 10px #fbbf24);
  }
  100% {
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
