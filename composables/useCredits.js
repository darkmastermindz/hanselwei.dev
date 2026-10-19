// The open-source credits (/credits): the copy built into the page (scripts/build-credits.mjs),
// refreshed in the browser from the /api/credits Netlify function, which keeps the list, licenses
// and links current from the npm registry.
import builtCredits from '~/data/credits.generated.json'

export const useCredits = () => {
  const credits = ref(builtCredits)
  const live = ref(false)

  onMounted(async () => {
    try {
      const data = await $fetch('/api/credits')
      if (Array.isArray(data?.packages) && data.packages.length) {
        // A live lookup that missed a detail keeps the built one for the same version
        const built = new Map(builtCredits.packages.map(pkg => [`${pkg.name}@${pkg.version}`, pkg]))
        const packages = data.packages.map(pkg => {
          const known = built.get(`${pkg.name}@${pkg.version}`)
          return known ? { ...pkg, copyright: pkg.copyright ?? known.copyright, use: pkg.use ?? known.use } : pkg
        })
        credits.value = { ...data, packages }
        live.value = true
      }
    } catch {
      // Function unavailable (e.g. `nuxt dev`): keep the built copy
    }
  })

  return { credits, live }
}
