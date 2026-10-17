// Whether this page load is a refresh (pull-to-refresh on a phone, or the reload
// button), as opposed to normal navigation, back/forward or a sign-in redirect.
// Browsers report both refresh kinds the same way, so they can't be told apart.
export const isReload = () => {
  try {
    return performance.getEntriesByType('navigation')[0]?.type === 'reload'
  } catch {
    return false
  }
}

// The navigation entry says "reload" for the whole visit, including later in-app page
// changes, so each thing a refresh resets asks once: true only the first time per key
const handled = new Set()
export const resetOnReload = key => {
  if (handled.has(key)) return false
  handled.add(key)
  return isReload()
}
