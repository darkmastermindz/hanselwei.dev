<template>
  <div v-if="isIPhone" class="contact-card">
    <a
      v-if="unlocked"
      href="/connect"
      target="_blank"
      rel="noopener nofollow"
      class="contact-card__button contact-card__button--unlocked liquid-glass liquid-glass-prominent liquid-glass-interactive"
    >Open Apple Contact Card ✨</a>
    <span v-else class="contact-card__button contact-card__button--locked liquid-glass" aria-disabled="true">
      🔒 Spin the token to unlock my contact card
    </span>
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
</script>

<style scoped>
.contact-card {
  display: flex;
  justify-content: center;
  margin: 1rem auto 0;
  padding: 0 1rem;
}

.contact-card__button {
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
}

/* Liquid Glass buttons (packages/tailwind-ios-glass): unlocked, tinted green glass that responds
   to a press, like SwiftUI's .glassProminent; locked, plain glass */
.contact-card__button--unlocked {
  --glass-accent: 0 180 137;
  border: 0;
  animation: unlock var(--spring-bouncy-duration) var(--spring-bouncy);
}

.contact-card__button--locked {
  border-style: dashed;
  color: #aaa;
  font-weight: 400;
  cursor: not-allowed;
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
  .contact-card__button--unlocked {
    animation: none;
  }
}
</style>
