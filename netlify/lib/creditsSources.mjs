// Where the /api/credits function reads package details: the npm registry for package.json
// fields, and jsDelivr for the license file. Each request is time-limited and size-limited;
// a failure leaves the lockfile's details (utils/credits.mjs buildCredits).
const TIMEOUT_MS = 5000
const MAX_TEXT = 50_000

const get = async (url, fetchImpl) => {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: 'application/json, text/plain' } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response
}

// The registry entry for the installed version (name and version are checked by creditTargets)
export const registryInfo = fetchImpl => async ({ name, version }) =>
  (await get(`https://registry.npmjs.org/${name}/${version ?? 'latest'}`, fetchImpl)).json()

// The top-level LICENSE / LICENCE / COPYING file of the published package
export const jsdelivrLicense = fetchImpl => async ({ name, version }) => {
  if (!version) return null
  const listing = await (await get(`https://data.jsdelivr.com/v1/packages/npm/${name}@${version}?structure=flat`, fetchImpl)).json()
  const file = (Array.isArray(listing?.files) ? listing.files : [])
    .map(entry => entry?.name)
    .find(path => typeof path === 'string' && /^\/(licen[cs]e|copying)(\.(md|txt))?$/i.test(path))
  if (!file) return null
  return (await (await get(`https://cdn.jsdelivr.net/npm/${name}@${version}${file}`, fetchImpl)).text()).slice(0, MAX_TEXT)
}
