<template>
  <footer class="site-footer">
    <p class="site-footer__line">Designed &amp; created with &lt;3 by Hansel Wei • ©️ 2026 hanselwei.dev</p>
    <p><NuxtLink to="/terms">Terms of Service</NuxtLink> • <NuxtLink to="/credits">Open source software &lt;3</NuxtLink></p>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: auto; /* the bottom of the screen on short pages (.app-shell is a column) */
  padding: 1.5rem 1rem 1.75rem;
  border-top: 1px solid #3a3d42;
  text-align: center;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #999;
}

/* One line: the text shrinks a little on phones instead of wrapping. Only the smallest screens
   (under 340px), where it would be too small to read, let it wrap. */
.site-footer__line {
  font-size: clamp(0.6rem, calc((100vw - 2rem) / 34), 0.8rem); /* the line is about 34 font-sizes wide */
}

@media (min-width: 340px) {
  .site-footer__line {
    white-space: nowrap;
  }
}

.site-footer a {
  color: #c084fc;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.site-footer a:hover {
  color: #7cfc00;
}
</style>
