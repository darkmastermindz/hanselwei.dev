<template>
  <div class="socials">
    <a
      v-if="isIPhone"
      href="https://hansel.run/connect"
      target="_blank"
      rel="noopener"
      class="social bg-[#00b489]"
    >Open Apple Contact Card ✨</a>
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
// The contact card opens straight into Contacts on iPhone only, so the button is
// added in the browser once we know the device (it's never in the prerendered HTML).
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
