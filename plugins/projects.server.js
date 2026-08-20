import { useProjectsStore } from '~/stores/projects'

export default defineNuxtPlugin(async () => {
  const store = useProjectsStore()
  await store.fetchGithubProjects()
})
