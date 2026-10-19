<template>
  <nav class="app-nav bg-neutral text-neutral-content" aria-label="Main">
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

/* Installed as an app (html.is-installed, plugins/pwa.client.js): the status bar and Dynamic
   Island sit over the page, so the nav gets more room under them and between its rows */
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
