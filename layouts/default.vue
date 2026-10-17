<template>
  <div class="app-shell">
    <AppNav />
    <PullToRefresh />
    <slot />
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

.app-shell {
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
