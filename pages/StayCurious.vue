<template>
  <main class="page">
    <h1 class="page-title text-[#41b883]">Notes</h1>
    <section class="notes">
      <h2>Awesome Dev References</h2>
      <ul>
        <li><a href="https://devhints.io" target="_blank" rel="noopener">devhints.io</a></li>
        <li><a href="https://crontab.guru" target="_blank" rel="noopener">crontab.guru</a></li>
      </ul>

      <h2>Gear</h2>
      <ul>
        <li><NuxtLink to="/gear/outdoor">🏔️ My outdoor gear</NuxtLink></li>
        <li><NuxtLink to="/gear/video">🎥 My video gear</NuxtLink></li>
      </ul>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.notes {
  background: #41b883;
  color: #fff;
  padding: 1.25rem;
  box-shadow: 5px 5px #1d5c3f;

  h2 {
    font-size: 1.3rem;
    margin: 0.5rem 0;
  }

  ul {
    margin-bottom: 1rem;
    padding-left: 1.25rem;
    list-style: disc;
  }

  a {
    color: #fff;
    text-decoration: underline;
  }
}
</style>
