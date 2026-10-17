<template>
  <div class="spin-fact" aria-live="polite">
    <Transition name="card" mode="out-in">
      <figure v-if="fact" :key="fact.id" class="spin-card">
        <figcaption class="spin-card__label">
          <span class="emoji">{{ fact.emoji }}</span>
          {{ fact.label }} · {{ fact.type === 'quote' ? 'Motivation' : 'Fun fact' }}
        </figcaption>
        <blockquote v-if="fact.type === 'quote'">
          “{{ fact.text }}”
          <cite>— {{ fact.author }}</cite>
        </blockquote>
        <p v-else>{{ fact.text }}</p>
      </figure>
    </Transition>
  </div>
</template>

<script setup>
defineProps({ fact: { type: Object, default: null } })
</script>

<style scoped>
.spin-fact {
  max-width: 26rem;
  margin: 0 auto;
  padding: 0 1rem;
}

.spin-card {
  text-align: left;
  padding: 0.9rem 1.1rem;
  border-radius: 0.75rem;
  background: #23262a;
  border: 1px solid #653496;
  box-shadow: 4px 4px #7cfc00;
  color: #eee;
}

.spin-card__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9dff5c;
  margin-bottom: 0.35rem;
}

.emoji {
  font-size: 1rem;
  margin-right: 0.15rem;
}

blockquote {
  font-style: italic;
}

cite {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  font-style: normal;
  color: #c084fc;
}

.card-enter-active,
.card-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

.card-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .card-enter-active,
  .card-leave-active {
    transition: opacity 0.2s ease;
  }
  .card-enter-from,
  .card-leave-to {
    transform: none;
  }
}
</style>
