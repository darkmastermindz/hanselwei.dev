<template>
  <div class="app-shell">
    <TopoBackground />
    <AppNav />
    <PullToRefresh />
    <slot />
    <SiteFooter />
    <BookPager />
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

/* Foldables (README "Foldables"). The page head script (utils/foldMode.mjs) sets
   <html data-fold="tabletop|book|flat"> for how the screen is folded, and where the fold is:
   --fold-top-end and --fold-bottom-start (a crease across), or --fold-left-end and
   --fold-right-start (a crease down the middle), with --crease kept clear on both sides. Nothing
   important sits on the fold. Without data-fold (closed, any other phone, tablet or computer)
   nothing here applies. */
:root[data-fold] {
  --fold-paper: #1d232a; /* the page colour, for the parts that cover what scrolls under them */
}

/* Tabletop (a crease across, the top half tilted back like a laptop): reading on the top half,
   the menu on the bottom half like a keyboard (components/AppNav.vue). Pages scroll above it. */
:root[data-fold='tabletop'] {
  --fold-nav-h: calc(env(safe-area-inset-bottom, 0px) + 4rem); /* the home page's one-row menu */
  --fold-below: calc(100dvh - var(--fold-top-end) + var(--crease)); /* the fold and bottom half */
  scroll-padding-bottom: var(--fold-below);
}

@media (max-width: 639px) {
  :root[data-fold='tabletop'] {
    --fold-nav-h: calc(env(safe-area-inset-bottom, 0px) + 6.5rem); /* two rows on a narrow phone */
  }
}

:root[data-fold='tabletop'] .app-shell {
  padding-bottom: var(--fold-below);
}

:root[data-fold='tabletop'] .app-shell:has(.app-nav--home) {
  padding-bottom: var(--fold-nav-h);
}

/* Book (a crease down the middle): the menu has the left page (components/AppNav.vue); reading
   and the footer go on the right page */
:root[data-fold='book'] {
  --fold-nav-h: calc(env(safe-area-inset-top, 0px) + 7.5rem); /* the home page's two-row menu */
}

:root[data-fold='book'] .page,
:root[data-fold='book'] .site-footer {
  width: auto;
  max-width: none;
  margin-left: calc(var(--fold-right-start) + var(--crease));
  margin-right: max(env(safe-area-inset-right), 0px);
}

:root[data-fold='book'] .page {
  padding-left: 0;
}

/* Turning the page (plugins/pageTurn.client.js): in book, going to another page turns the right
   page over onto the left, like a book, and going back turns the left one back. The two pages
   are named only while turning, so nothing else changes. */
:root[data-page-turn] .home__hero,
:root[data-page-turn] .app-nav:not(.app-nav--home) {
  view-transition-name: book-left;
}

:root[data-page-turn] .home__deck,
:root[data-page-turn] .page {
  view-transition-name: book-right;
}

:root[data-page-turn]::view-transition-old(root),
:root[data-page-turn]::view-transition-new(root),
:root[data-page-turn]::view-transition-group(book-left),
:root[data-page-turn]::view-transition-group(book-right) {
  animation: none;
}

:root[data-page-turn]::view-transition-image-pair(book-left),
:root[data-page-turn]::view-transition-image-pair(book-right) {
  perspective: 1800px;
}

:root[data-page-turn]::view-transition-image-pair(book-left) {
  perspective-origin: right center; /* the spine */
}

:root[data-page-turn]::view-transition-image-pair(book-right) {
  perspective-origin: left center;
}

:root[data-page-turn]::view-transition-old(book-left),
:root[data-page-turn]::view-transition-new(book-left),
:root[data-page-turn]::view-transition-old(book-right),
:root[data-page-turn]::view-transition-new(book-right) {
  background-color: var(--fold-paper); /* paper, not see-through */
  backface-visibility: hidden;
  animation-name: none; /* still, unless turning (below), not the browser's cross-fade */
  animation-duration: 0.8s;
  animation-fill-mode: both;
}

:root[data-page-turn]::view-transition-old(book-left),
:root[data-page-turn]::view-transition-new(book-left) {
  transform-origin: right center;
}

:root[data-page-turn]::view-transition-old(book-right),
:root[data-page-turn]::view-transition-new(book-right) {
  transform-origin: left center;
}

/* Forward: the right page lifts off the spine and turns over (first half); its back lands as the
   new left page (second half). The new right page is underneath all along; the old left page is
   there until the turning page covers it. */
:root[data-page-turn='forward']::view-transition-old(book-right) {
  z-index: 1;
  animation-name: page-lift-right;
  animation-timing-function: ease-in;
}

:root[data-page-turn='forward']::view-transition-new(book-left) {
  z-index: 1;
  animation-name: page-land-left;
  animation-timing-function: ease-out;
}

:root[data-page-turn='forward']::view-transition-old(book-left),
:root[data-page-turn='back']::view-transition-old(book-right) {
  animation-name: page-covered;
}

/* Back: the same, the other way */
:root[data-page-turn='back']::view-transition-old(book-left) {
  z-index: 1;
  animation-name: page-lift-left;
  animation-timing-function: ease-in;
}

:root[data-page-turn='back']::view-transition-new(book-right) {
  z-index: 1;
  animation-name: page-land-right;
  animation-timing-function: ease-out;
}

@keyframes page-lift-right {
  0% { transform: rotateY(0); filter: brightness(1); }
  50%, 100% { transform: rotateY(-90deg); filter: brightness(0.55); }
}

@keyframes page-land-left {
  0%, 50% { transform: rotateY(90deg); filter: brightness(0.55); }
  100% { transform: rotateY(0); filter: brightness(1); }
}

@keyframes page-lift-left {
  0% { transform: rotateY(0); filter: brightness(1); }
  50%, 100% { transform: rotateY(90deg); filter: brightness(0.55); }
}

@keyframes page-land-right {
  0%, 50% { transform: rotateY(-90deg); filter: brightness(0.55); }
  100% { transform: rotateY(0); filter: brightness(1); }
}

@keyframes page-covered {
  0%, 49.9% { opacity: 1; }
  50%, 100% { opacity: 0; }
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
