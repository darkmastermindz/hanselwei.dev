// GET /api/gear/pending           -> { submissions: [{ key, list, ops, token, at }] }, oldest first
// DELETE /api/gear/pending { keys } -> { deleted }: the ones the workflow has dealt with
//
// For the Gear updates workflow only (.github/workflows/gear-updates.yml, README "Editing gear
// lists"): it shows GitHub Actions' own sign-in token (netlify/lib/githubOidc.mjs) for this
// repository's gear-updates.yml on main, so no secret is stored anywhere. The edits come from
// /api/gear/submit (owners only), and the workflow still has each one verified before applying it.
import { getStore } from '@netlify/blobs'
import { verifyGithubOidc } from '../lib/githubOidc.mjs'

export const GEAR_AUDIENCE = 'hanselwei.dev/gear-updates'
export const GEAR_REPOSITORY = 'darkmastermindz/hanselwei.dev'
export const GEAR_WORKFLOW_REF = `${GEAR_REPOSITORY}/.github/workflows/gear-updates.yml@refs/heads/main`
const KEY = /^pending\/[0-9A-Za-z-]{1,80}$/
const MAX_BODY = 64 * 1024
const MAX_KEYS = 500
const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' }
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } })

const fromWorkflow = (req, verifyToken) => {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return verifyToken(token, {
    audience: GEAR_AUDIENCE,
    expect: { repository: GEAR_REPOSITORY, job_workflow_ref: GEAR_WORKFLOW_REF, ref: 'refs/heads/main' }
  })
}

export const handlePending = async (req, { store, verifyToken = verifyGithubOidc }) => {
  if (req.method !== 'GET' && req.method !== 'DELETE') return json({ error: 'Method not allowed' }, 405, { allow: 'GET, DELETE' })
  if (!(await fromWorkflow(req, verifyToken))) return json({ error: 'Not allowed' }, 401)

  if (req.method === 'GET') {
    const { blobs } = await store.list({ prefix: 'pending/' })
    const keys = blobs.map(b => b.key).filter(k => KEY.test(k)).sort()
    const submissions = []
    for (const key of keys) {
      const data = await store.get(key, { type: 'json' }).catch(() => null)
      if (data && typeof data === 'object') submissions.push({ key, list: data.list, ops: data.ops, token: data.token, at: data.at })
    }
    return json({ submissions })
  }

  const raw = await req.text()
  if (raw.length > MAX_BODY) return json({ error: 'Too large' }, 413)
  let keys
  try {
    keys = JSON.parse(raw)?.keys
  } catch {
    return json({ error: 'Bad request' }, 400)
  }
  if (!Array.isArray(keys) || keys.length > MAX_KEYS || !keys.every(k => typeof k === 'string' && KEY.test(k))) return json({ error: 'Bad keys' }, 400)
  for (const key of keys) await store.delete(key)
  return json({ deleted: keys.length })
}

export default async req => handlePending(req, { store: getStore({ name: 'gear-edits', consistency: 'strong' }) })

export const config = { path: '/api/gear/pending' }
