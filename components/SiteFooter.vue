<template>
  <footer class="site-footer">
    <p>©️ 2026 hanselwei.dev • Designed and created with &lt;3 by Hansel Wei</p>
    <p><NuxtLink to="/terms">Terms of Service</NuxtLink></p>
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

.site-footer a {
  color: #c084fc;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.site-footer a:hover {
  color: #7cfc00;
}
</style>
