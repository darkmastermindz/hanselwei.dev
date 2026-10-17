<template>
  <main class="page">
    <h1 class="page-title text-[#00b8ff]">GitHub Projects</h1>
    <div class="projects">
      <article v-for="project in githubProjects" :key="project.id" class="project">
        <h2>
          <a target="_blank" rel="noopener" :href="project.html_url">{{ project.name }}</a>
        </h2>
        <p class="meta">
          <span class="stars">🌟 {{ project.stargazers_count }}</span>
          <span v-if="project.language">· {{ project.language }}</span>
        </p>
        <p v-if="project.description">{{ project.description }}</p>
        <a v-if="project.homepage" class="homepage" :href="project.homepage" target="_blank" rel="noopener">
          {{ project.homepage }}
        </a>
      </article>
    </div>
  </main>
</template>

<script setup>
import { useProjectsStore } from '~/stores/projects'

useHead({ title: 'Projects · hanselwei.dev' })

const store = useProjectsStore()

await callOnce(() => store.fetchGithubProjects())

const githubProjects = computed(() => store.githubProjects)
</script>

<style lang="scss" scoped>
.projects {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
}

.project {
  background: #eee;
  color: #171515;
  padding: 1.25rem;
  border-radius: 0.5rem;
  overflow-wrap: anywhere;

  h2 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: #7e22ce;

    a {
      color: inherit;
      text-decoration: none;
    }
    a:hover {
      color: #16a34a;
    }
  }

  p {
    margin-top: 0.4rem;
  }
}

.meta {
  font-size: 0.9rem;
  color: #555;
}

.stars {
  color: orangered;
}

.homepage {
  display: inline-block;
  margin-top: 0.5rem;
  color: #0369a1;
  font-size: 0.9rem;
}
</style>
