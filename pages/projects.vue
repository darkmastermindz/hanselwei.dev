<template>
  <main>
    <section>
      <h1>Projects</h1>
      <div v-for="project in githubProjects" :key="project.id" class="project">
        <h3 class="text-purple-500 hover:text-green-300">
          <a target="_blank" :href="project.html_url">{{project.name}}</a>
        </h3>
        <p class="stars">🌟 {{ project.stargazers_count }}</p>
        <p>{{ project.homepage }}</p>
        <p>{{ project.description }}</p>
      </div>
    </section>
    <aside></aside>
  </main>
</template>

<script>
import { mapState } from "vuex";

export default {
  computed: {
    ...mapState(["githubProjects"])
  },
  mounted() {
    this.$store.dispatch("getGithubProjects");
  }
};
</script>

<style lang="scss" scoped>
main {
  width: 80vw;
  margin: 2% 5%;
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr;
  grid-column-gap: 50px;
  grid-row-gap: 0px;

  section {
    grid-area: 1 / 1 / 2 / 2;
    color: black;
    padding: 30px;
    background: #eee;
  }

  aside {
    grid-area: 1 / 2 / 2 / 3;
  }

  h1 {
    color: #00b8ff;
    font-weight: 300;
    padding: 25px;
    background: #2c2f33;
    box-shadow: 5px 5px;
  }
}

.stars {
  color: orangered;
}

.project {
  padding: 30px;
  color: #171515;

  h3 {
    a {
      text-decoration: none;
    }
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    font-size: 35px;
  }
  p {
    font-size: 25px;
  }
}
</style>