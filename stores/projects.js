import { defineStore } from 'pinia'
import projectsConfig from '~/data/projects.generated.mjs'
import { buildProjectConfig, categorize, FILTERS, tagsFor, visibleProjects } from '~/utils/projects.mjs'

// Built from config.toml [projects] at build time (scripts/build-projects.mjs)
const CONFIG = buildProjectConfig(projectsConfig)

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    githubProjects: [],
    filter: 'all',
    tag: null,
    query: '',
    sort: 'updated',
    loaded: false
  }),
  getters: {
    counts: state => {
      const counts = { all: 0, active: 0, wip: 0, fork: 0 }
      for (const project of state.githubProjects) {
        counts.all++
        counts[project.category]++
      }
      return counts
    },
    // Every tag on a shown repo, sorted like the blog's tags
    tags: state => [...new Set(state.githubProjects.flatMap(project => project.tags))].sort(),
    visible: state => visibleProjects(state.githubProjects, state)
  },
  actions: {
    setFilter(filter) {
      if (FILTERS.includes(filter)) this.filter = filter
    },
    setTag(tag) {
      if (tag === null || this.tags.includes(tag)) this.tag = tag
    },
    async fetchGithubProjects() {
      if (this.githubProjects.length) return

      try {
        const repos = await fetch('https://api.github.com/users/darkmastermindz/repos?page=1&per_page=100').then(res => res.json())

        if (!Array.isArray(repos)) {
          throw new Error(repos?.message || 'Unexpected GitHub API response')
        }

        this.githubProjects = repos
          .map(repo => ({
            id: repo.id,
            name: repo.name,
            language: repo.language,
            description: repo.description,
            topics: Array.isArray(repo.topics) ? repo.topics : [],
            stargazers_count: repo.stargazers_count,
            homepage: repo.homepage,
            html_url: repo.html_url,
            updated_at: repo.updated_at,
            category: categorize(repo, CONFIG),
            tags: tagsFor(repo, CONFIG).concat(Array.isArray(repo.topics) ? repo.topics : [])
          }))
          .filter(project => project.category !== null)
          .map(project => ({ ...project, tags: [...new Set(project.tags)] }))
      } catch (err) {
        console.error(err)
      } finally {
        this.loaded = true
      }
    }
  }
})
