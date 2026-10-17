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
      <AuthButton class="app-nav__auth" />
    </div>
  </nav>
</template>

<script setup>
// Highlight a section for its own pages too (e.g. Blog on /blog/feed/…),
// which router-link-active misses because those pages aren't nested routes
const route = useRoute()
const isCurrent = to => (to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(`${to}/`))

const links = [
  { to: '/', label: 'Home', emoji: '🏠', color: 'white' },
  { to: '/projects', label: 'Projects', emoji: '👨🏻‍💻', color: 'blue' },
  { to: '/blog', label: 'Blog', emoji: '📰', color: 'purple' },
  { to: '/gear', label: 'Gear Lists', emoji: '🏔️', color: 'green' }
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

.app-nav__links {
  display: flex;
  flex-wrap: wrap; /* wraps onto a second line on small screens, like before */
  gap: 0.25rem;

  a {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .is-current {
    background-color: rgba(255, 255, 255, 0.08);
  }
}

/* Sign-in sits at the far end of the nav */
.app-nav__auth {
  margin-left: auto;
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
</style>
