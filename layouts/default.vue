<template>
  <div class="app-shell">
    <TopoBackground />
    <AppNav />
    <PullToRefresh />
    <slot />
    <SiteFooter />
  </div>
</template>

<script setup>
</script>


<style>
html {
  font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  background-color: #2c2f33;
  overflow-x: hidden;
}

body {
  overflow-x: hidden;
}

/* The in-app pull-down (components/PullToRefresh.vue) handles pulling at the top,
   instead of the browser's own pull-to-refresh where it can be turned off */
html,
body {
  overscroll-behavior-y: contain;
}

/* Focus ring for keyboard and controller users only (plugins/navigation.client.js sets
   data-input from what was used last); components with their own focus look keep it */
html[data-input='keyboard'] :focus-visible,
html[data-input='gamepad'] :focus {
  outline: 3px solid #7cfc00;
  outline-offset: 3px;
}

/* Keep focused controls clear of the screen edges and the nav when they scroll into view */
:focus {
  scroll-margin: 5rem 1rem;
}

/* Controller focus: a sparkling gradient border instead of the outline
   (plugins/navigation.client.js places .focus-sparkle over the focused control) */
html[data-input='gamepad'] :focus {
  outline: none !important; /* over the components' own focus outlines too */
}

@property --sparkle-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.focus-sparkle {
  position: fixed;
  z-index: 60;
  pointer-events: none;
  transition: left 0.12s ease, top 0.12s ease, width 0.12s ease, height 0.12s ease;
}

.focus-sparkle[hidden] {
  display: none;
}

/* A turning gradient that shows only in a 3px ring: the content box is masked out */
.focus-sparkle__ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 3px;
  background: conic-gradient(from var(--sparkle-angle), #c084fc, #7cfc00, #ffd700, #41b883, #00b8ff, #c084fc);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  filter: drop-shadow(0 0 6px rgba(124, 252, 0, 0.7));
  animation: sparkle-spin 2.4s linear infinite;
}

/* Twinkling stars on the corners */
.focus-sparkle__star {
  position: absolute;
  font-size: 0.8rem;
  line-height: 1;
  color: #ffd700;
  text-shadow: 0 0 6px currentColor;
  animation: sparkle-twinkle 1.1s ease-in-out infinite;
}

.focus-sparkle__star:nth-child(2) { top: -0.45rem; left: -0.35rem; }
.focus-sparkle__star:nth-child(3) { top: -0.45rem; right: -0.35rem; color: #fff; animation-delay: 0.28s; }
.focus-sparkle__star:nth-child(4) { bottom: -0.45rem; right: -0.35rem; color: #7cfc00; animation-delay: 0.55s; }
.focus-sparkle__star:nth-child(5) { bottom: -0.45rem; left: -0.35rem; color: #c084fc; animation-delay: 0.83s; }

@keyframes sparkle-spin {
  to { --sparkle-angle: 360deg; }
}

@keyframes sparkle-twinkle {
  0%, 100% { transform: scale(0.5) rotate(0); opacity: 0.35; }
  50% { transform: scale(1.15) rotate(90deg); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .focus-sparkle,
  .focus-sparkle__ring,
  .focus-sparkle__star {
    animation: none;
    transition: none;
  }
}

.app-shell {
  display: flex;
  flex-direction: column; /* the footer sits at the bottom of the screen on short pages */
  min-height: 100vh;
  min-height: 100dvh;
  /* Room for the home indicator when installed as an app */
  padding-bottom: env(safe-area-inset-bottom);
}

/* Shared responsive content panel used by the inner pages */
.page {
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .page {
    padding: 2rem;
  }
}

.page-title {
  color: #eee;
  font-weight: 300;
  font-size: clamp(1.75rem, 6vw, 2.75rem);
  padding: 1rem 1.25rem;
  background: #23262a;
  box-shadow: 5px 5px currentColor;
  margin-bottom: 1.5rem;
  overflow-wrap: anywhere;
}

h1,
h2,
h3 {
  font-family: "Nova Mono", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  font-weight: normal;
  color: #eee;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}

.button--green {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #00ff9f;
  color: #00ff9f;
  text-decoration: none;
  padding: 10px 30px;
  margin: 5px;
}

.button--green:hover {
  color: #fff;
  background-color: #00ff9f;
}

.button--grey {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #fff;
  color: #fff;
  text-decoration: none;
  padding: 10px 30px;
  margin: 5px;
}

.button--grey:hover {
  border: 1px solid #171515;
  color: #fff;
  background-color: #171515;
}

.button--blue {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #0072b1;
  color: #0072b1;
  text-decoration: none;
  padding: 10px 30px;
  margin: 5px;
}

.button--blue:hover {
  border: 1px solid #0072b1;
  color: #fff;
  background-color: #0072b1;
}
</style>
