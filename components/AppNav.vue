<template>
  <nav class="app-nav bg-neutral text-neutral-content" aria-label="Main">
    <div class="app-nav__links">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :class="['btn btn-ghost btn-sm md:btn-md normal-case dim', link.color]"
        :aria-label="link.label"
      >
        <span>{ {{ link.emoji }} {{ link.label }} }</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup>
const links = [
  { to: '/', label: 'Home', emoji: '🏠', color: 'white' },
  { to: '/projects', label: 'Projects', emoji: '👨🏻‍💻', color: 'blue' },
  { to: '/blog', label: 'Blog', emoji: '✍️', color: 'purple' },
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
  gap: 0.25rem;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  a {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .router-link-active:not([href='/']),
  .router-link-exact-active {
    background-color: rgba(255, 255, 255, 0.08);
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
</style>
