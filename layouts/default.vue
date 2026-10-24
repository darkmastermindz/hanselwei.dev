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
  /* The in-app pull-down (components/PullToRefresh.vue) handles pulling at the top, instead of
     the browser's own pull-to-refresh where it can be turned off. On html only: it's the page's
     scroller, and a stop on anything else can trap a swipe there */
  overscroll-behavior-y: contain;
}

/* No sideways scrolling from anything a little too wide. `clip` cuts it off without making
   html or body a scroll container of their own: with `hidden` on both, body became one, and
   browsers that hand a swipe to it (Samsung Internet) couldn't pass it on to the page, so
   nothing scrolled. Browsers without `clip` fall back to `hidden` on html alone (which goes to
   the viewport, so body still isn't a scroll container). */
html {
  overflow-x: hidden;
  overflow-x: clip;
}

body {
  overflow-x: clip;
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

/* Foldables (see README "Foldables"). Folded part-way, the browser reports the screen as two
   segments with the fold between them (the Viewport Segments API, Chromium 138+): a physical
   hinge (a gap) or a seamless crease (no gap at all). Nothing important sits on it: everything
   keeps --crease clear of both sides. These are only set while folded, so the layouts that use
   them (here, components/AppNav.vue, pages/index.vue) apply only then. Without the API (Safari,
   Firefox) or unfolded, nothing changes.
   - Stacked segments, a crease across the middle ("tabletop", the top half tilted back like a
     laptop): --fold-top-end is where the top segment ends, --fold-bottom-start where the bottom
     one starts.
   - Side by side, a crease down the middle ("book"): --fold-left-end and --fold-right-start. */
@media (vertical-viewport-segments: 2) {
  :root {
    --fold-top-end: env(viewport-segment-bottom 0 0);
    --fold-bottom-start: env(viewport-segment-top 0 1);
    --crease: 1rem;
    --fold-nav-h: calc(env(safe-area-inset-top, 0px) + 4rem); /* the nav, kept to one row */
  }
}

@media (horizontal-viewport-segments: 2) {
  :root {
    --fold-left-end: env(viewport-segment-right 0 0);
    --fold-right-start: env(viewport-segment-left 1 0);
    --crease: 1rem;
    --fold-nav-h: calc(env(safe-area-inset-top, 0px) + 7.5rem); /* two rows on the home page */
  }

  /* Book: the menu has the left page (components/AppNav.vue); reading and the footer go on the
     right page */
  .page,
  .site-footer {
    width: auto;
    max-width: none;
    margin-left: calc(var(--fold-right-start) + var(--crease));
  }

  .page {
    margin-right: 0;
    padding-left: 0;
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
