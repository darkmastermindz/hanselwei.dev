// GET /api/credits -> the open-source software this site uses, for the /credits page.
// The list is every package in package.json (at the version package-lock.json installs, plus
// the libraries bundled inside Nuxt); licenses, copyright lines, GitHub links and descriptions
// come from the npm registry and jsDelivr, so the page stays current without hand edits.
import pkg from '../../package.json' with { type: 'json' }
import lock from '../../package-lock.json' with { type: 'json' }
import { buildCredits } from '../../utils/credits.mjs'
import { jsdelivrLicense, registryInfo } from '../lib/creditsSources.mjs'

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
    const credits = await buildCredits({ pkg, lock, packageInfo: registryInfo(fetchImpl), licenseText: jsdelivrLicense(fetchImpl) })
    cached = { at: now, body: JSON.stringify({ ...credits, updated: new Date(now).toISOString() }) }
  }
  return new Response(cached.body, { headers })
}

export const resetCreditsCache = () => (cached = null)

export default async req => {
  if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
  return creditsResponse()
}

export const config = { path: '/api/credits' }
