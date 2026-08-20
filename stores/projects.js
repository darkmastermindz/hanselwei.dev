import { defineStore } from 'pinia'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    githubProjects: []
  }),
  actions: {
    async fetchGithubProjects() {
      if (this.githubProjects.length) return

      try {
        let githubProjects = await fetch(
          'https://api.github.com/users/darkmastermindz/repos?page=1&per_page=100'
        ).then(res => res.json())

        githubProjects = githubProjects
          .filter(
            el =>
              el.fork === false ||
              el.name === 'HackNC2019' || el.name === 'iole-python'
          )
          .map(
            ({
              id,
              name,
              languages,
              license,
              description,
              stargazers_count,
              homepage,
              html_url
            }) => ({
              id,
              name,
              languages,
              license,
              description,
              stargazers_count,
              homepage,
              html_url
            })
          )

        this.githubProjects = githubProjects
      } catch (err) {
        console.error(err)
      }
    }
  }
})
