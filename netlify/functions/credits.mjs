// GET /api/credits -> the open-source software this site uses, for the /credits page.
// The list is every package in the project's package.json, read from GitHub (main) so merged
// dependency changes show up without a deploy, at the version its package-lock.json installs,
// plus the libraries bundled inside Nuxt. Licenses, copyright lines, GitHub links and
// descriptions come from the npm registry and jsDelivr. If GitHub can't be read, the copies
// bundled at deploy are used.
import bundledPkg from '../../package.json' with { type: 'json' }
import bundledLock from '../../package-lock.json' with { type: 'json' }
import { buildCredits } from '../../utils/credits.mjs'
import { githubManifests, jsdelivrLicense, registryInfo } from '../lib/creditsSources.mjs'

export const headers = {
  'content-type': 'application/json; charset=utf-8',
  // Netlify's CDN keeps it for a day and refreshes it in the background after that
  'cache-control': 'public, max-age=3600',
  'netlify-cdn-cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
  'x-robots-tag': 'noindex'
}

const CACHE_MS = 60 * 60 * 1000
let cached = null // { at, body } for warm invocations

export const creditsResponse = async (fetchImpl = fetch, now = Date.now()) => {
  if (!cached || now - cached.at > CACHE_MS) {
    let source = 'github'
    const { pkg, lock } = await githubManifests(fetchImpl).catch(() => {
      source = 'bundled'
      return { pkg: bundledPkg, lock: bundledLock }
    })
    const credits = await buildCredits({ pkg, lock, packageInfo: registryInfo(fetchImpl), licenseText: jsdelivrLicense(fetchImpl) })
    cached = { at: now, body: JSON.stringify({ ...credits, source, updated: new Date(now).toISOString() }) }
  }
  return new Response(cached.body, { headers })
}

export const resetCreditsCache = () => (cached = null)

export default async req => {
  if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
  return creditsResponse()
}

export const config = { path: '/api/credits' }
