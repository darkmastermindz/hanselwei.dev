import { listSummaries, queryInventory } from '~/data/inventory.mjs'

// Gear inventories: rendered from the bundled data at build time, then refreshed
// in the browser from the Netlify function (/api/inventory) so edits deployed
// to the function show up without depending on a page rebuild.
export const useInventoryLists = () => {
  const lists = ref(listSummaries())
  const live = ref(false)

  onMounted(async () => {
    try {
      const data = await $fetch('/api/inventory')
      if (Array.isArray(data?.lists)) {
        lists.value = data.lists
        live.value = true
      }
    } catch {
      // Function unavailable (e.g. `nuxt dev`): keep bundled data
    }
  })

  return { lists, live }
}

export const useInventory = id => {
  const inventory = ref(queryInventory(id))
  const live = ref(false)

  onMounted(async () => {
    try {
      const data = await $fetch(`/api/inventory/${encodeURIComponent(id)}`)
      if (Array.isArray(data?.items)) {
        inventory.value = data
        live.value = true
      }
    } catch {
      // Function unavailable: keep bundled data
    }
  })

  return { inventory, live }
}
