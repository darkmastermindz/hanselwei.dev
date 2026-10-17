<template>
  <div class="socials">
    <template v-if="isIPhone">
      <a
        v-if="unlocked"
        href="/connect"
        target="_blank"
        rel="noopener nofollow"
        class="social social--unlocked bg-[#00b489]"
      >Open Apple Contact Card ✨</a>
      <span v-else class="social social--locked" aria-disabled="true">
        🔒 Spin the token to unlock my contact card
      </span>
    </template>
    <div class="socials__grid">
      <a
        v-for="link in links"
        :key="link.label"
        :href="link.href"
        target="_blank"
        rel="noopener"
        :class="['social', link.bg]"
      >{{ link.label }}</a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // Set once the visitor has spun the token, our lightweight human check
  unlocked: { type: Boolean, default: false }
})

// The contact card opens straight into Contacts on iPhone only, so the button is
// added in the browser once we know the device (it's never in the prerendered HTML).
// It links to /connect, which Netlify redirects to the card and robots.txt blocks.
const isIPhone = ref(false)
onMounted(() => {
  isIPhone.value = /iPhone|iPod/.test(navigator.userAgent)
})

const links = [
  { label: 'GitHub', href: 'https://github.com/darkmastermindz', bg: 'bg-[#24292f]' },
  { label: 'Mastodon', href: 'https://hansel.run/mastodon', bg: 'bg-[#563acc]' },
  { label: 'Messenger', href: 'https://m.me/hanselwei', bg: 'bg-blue-600' },
  { label: 'Instagram', href: 'https://hansel.rocks', bg: 'bg-[#c7501a]' },
  { label: 'dev.to', href: 'https://dev.to/hansel', bg: 'bg-black' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/hanselwei', bg: 'bg-[#0a66c2]' },
  { label: 'Send Email', href: 'mailto:Hansel Wei (hanselwei.dev) <hello+hansel@hanselwei.dev>', bg: 'bg-[#008856]' }
]
</script>

<style scoped>
.socials {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin: 1.5rem auto;
  max-width: 48rem;
}

.socials__grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
}

.social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px; /* comfortable touch target */
  padding: 0.5rem 1.4rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  transition: transform 0.15s ease;
}

.social:hover,
.social:focus-visible {
  transform: scale(1.05);
}

.social--locked {
  border-style: dashed;
  color: #aaa;
  font-weight: 400;
  cursor: not-allowed;
}

.social--locked:hover {
  transform: none;
}

.social--unlocked {
  animation: unlock 0.45s cubic-bezier(0.2, 0.8, 0.3, 1.3);
}

@keyframes unlock {
  from {
    transform: scale(0.85);
    opacity: 0.4;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .social--unlocked {
    animation: none;
  }
}

@media (max-width: 480px) {
  .socials__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    padding: 0 0.5rem;
  }

  .socials__grid .social:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
}
</style>
