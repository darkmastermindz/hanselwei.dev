// Where the /api/credits function reads: the project's own package.json and package-lock.json
// from GitHub (main), then each package's details from the npm registry and its license file
// from jsDelivr. Each request is time-limited and size-limited; a failure falls back (to the
// copies bundled at deploy, or to the lockfile's details; utils/credits.mjs buildCredits).
const TIMEOUT_MS = 5000
const MAX_TEXT = 50_000
const MAX_MANIFEST = 5_000_000 // package-lock.json is about 0.5 MB

// The repository whose dependencies the credits page lists
export const PROJECT_REPO = 'darkmastermindz/hanselwei.dev'
export const PROJECT_BRANCH = 'main'

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

// The project's package.json and package-lock.json as they are on GitHub now, so the list
// follows merged dependency changes without waiting for a deploy. Throws if either can't be read.
export const githubManifests = async fetchImpl => {
  const read = async file => {
    const response = await get(`https://raw.githubusercontent.com/${PROJECT_REPO}/${PROJECT_BRANCH}/${file}`, fetchImpl)
    const text = await response.text()
    if (text.length > MAX_MANIFEST) throw new Error(`${file} too large`)
    const json = JSON.parse(text)
    if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error(`${file} is not an object`)
    return json
  }
  const [pkg, lock] = await Promise.all([read('package.json'), read('package-lock.json')])
  return { pkg, lock }
}
