// The "Gear updates" workflow (.github/workflows/gear-updates.yml, README "Editing gear lists"):
// reads the gear edits sent from the editor on /gear/<list> (kept on Netlify by /api/gear/submit),
// keeps only those the owner signed (netlify/lib/gearToken.mjs), applies them in the order they
// were sent to data/gear/<list>.json on the gear-updates branch, and opens or updates one pull
// request for them. Edits it has dealt with are deleted from the site, so each lands once.
//
// No stored secret: the run signs in to the site (/api/gear/pending) with GitHub Actions' own
// token for this workflow on main (netlify/lib/githubOidc.mjs), and the site checks each edit's
// signature itself (/api/gear/verify), since the key that signs edits never leaves Netlify. Needs
// the workflow's `id-token: write` permission and its own GITHUB_TOKEN. Run anywhere else (no
// GitHub Actions token to ask for), it says so and stops.
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { hasInventory } from '../data/inventory.mjs'
import { applyOps, describeOp, serializeList, validateOps } from '../utils/gearEdits.mjs'

export const BRANCH = 'gear-updates'
const PR_TITLE = 'Gear updates'
// Overridable for a dry run against a stand-in server
const GITHUB_API = process.env.GITHUB_API_URL ?? 'https://api.github.com'
const SITE = process.env.GEAR_SITE ?? 'https://www.hanselwei.dev'
// What the site expects the token to be for (GEAR_AUDIENCE in netlify/functions/gear-pending.mjs)
const AUDIENCE = 'hanselwei.dev/gear-updates'
const MAX_OPS_TEXT = 256 * 1024

// Sorts submissions into the ones to apply (oldest first), the ones to drop (with why), and the ones
// to leave for the next run (the site couldn't be asked). Nothing from a submission is trusted until
// `verify` confirms it was signed by an owner for exactly its list and changes.
export const checkSubmissions = async (submissions, { verify }) => {
  const valid = []
  const invalid = []
  const later = []
  for (const submission of submissions) {
    const data = submission?.data ?? {}
    const list = typeof data.list === 'string' ? data.list : ''
    const opsText = typeof data.ops === 'string' ? data.ops : ''
    const at = Date.parse(submission?.created_at)
    const reject = reason => invalid.push({ id: submission?.id, reason })
    if (!hasInventory(list)) {
      reject('unknown list')
      continue
    }
    if (!opsText || opsText.length > MAX_OPS_TEXT || !Number.isFinite(at)) {
      reject('missing or oversize changes')
      continue
    }
    let signed
    try {
      signed = await verify({ list, ops: opsText, token: typeof data.token === 'string' ? data.token : '', at: new Date(at).toISOString() })
    } catch {
      later.push({ id: submission?.id })
      continue
    }
    if (!signed) {
      reject('not signed by an owner for these changes (forged, expired, or for other changes)')
      continue
    }
    let parsed
    try {
      parsed = JSON.parse(opsText)
    } catch {
      reject('changes are not valid JSON')
      continue
    }
    const checked = validateOps(parsed)
    if (checked.error) {
      reject(checked.error)
      continue
    }
    valid.push({ id: submission.id, at, list, ops: checked.ops })
  }
  valid.sort((a, b) => a.at - b.at || String(a.id).localeCompare(String(b.id)))
  return { valid, invalid, later }
}

// Asks the site whether a submission is genuine: true or false, or throws when it can't tell
const verifyWithSite = async submission => {
  const res = await fetch(`${SITE}/api/gear/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'hanselwei.dev gear-updates' },
    body: JSON.stringify(submission)
  })
  if (res.ok) return true
  if (res.status === 403 || res.status === 400 || res.status === 413) return false
  throw new Error(`verify answered ${res.status}`)
}

// The commit for one submission: what changed, in plain lines
export const commitMessage = ({ list, title, ops, skipped, id, at }) =>
  [
    `Gear: ${title}: ${ops.length} change${ops.length === 1 ? '' : 's'}`,
    '',
    ...ops.map(op => `- ${op.line}`),
    ...(skipped.length ? ['', 'Skipped:', ...skipped.map(s => `- ${s.line} (${s.reason})`)] : []),
    '',
    `From the editor on /gear/${list} (submission ${id}, ${new Date(at).toISOString()}).`
  ].join('\n')

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()
const gitOk = (...args) => {
  try {
    git(...args)
    return true
  } catch {
    return false
  }
}

// GitHub Actions' sign-in token for this run, for the site's audience (null outside Actions or
// without the workflow's id-token permission)
const actionsToken = async () => {
  const { ACTIONS_ID_TOKEN_REQUEST_URL: url, ACTIONS_ID_TOKEN_REQUEST_TOKEN: bearer } = process.env
  if (!url || !bearer) return null
  const res = await fetch(`${url}&audience=${encodeURIComponent(AUDIENCE)}`, { headers: { authorization: `Bearer ${bearer}` } })
  if (!res.ok) throw new Error(`GitHub's sign-in token: ${res.status}`)
  return (await res.json()).value
}

const site = async (token, options = {}) => {
  const res = await fetch(`${SITE}/api/gear/pending`, {
    ...options,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'hanselwei.dev gear-updates' }
  })
  if (!res.ok) throw new Error(`Site ${options.method ?? 'GET'} /api/gear/pending: ${res.status}`)
  return res.json()
}

// The pending edits in the shape checkSubmissions reads
export const asSubmissions = pending => pending.map(p => ({ id: p.key, created_at: p.at, data: { list: p.list, ops: p.ops, token: p.token } }))

const github = async (path, options = {}) => {
  const res = await fetch(`${GITHUB_API}/repos/${process.env.GITHUB_REPOSITORY}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'user-agent': 'hanselwei.dev gear-updates'
    }
  })
  if (!res.ok) throw new Error(`GitHub ${options.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`)
  return res.json()
}

const prBody = log =>
  [
    'Gear list edits from the editor on the gear pages (README "Editing gear lists"), collected by the **Gear updates** workflow. It runs weekly and whenever a pull request merges into main, and adds new edits to this pull request until it is merged.',
    '',
    '## Changes',
    log || '_None yet._',
    '',
    'Merge it to publish them. Each edit was signed by a signed-in owner when it was sent.',
    '',
    '🤖 Opened by the Gear updates workflow'
  ].join('\n')

const main = async () => {
  const token = await actionsToken()
  if (!token) {
    console.log('[gear-updates] Not in GitHub Actions with id-token: write (no sign-in token for the site); nothing to do.')
    return
  }

  const { submissions: pending } = await site(token)
  const { valid, invalid, later } = await checkSubmissions(asSubmissions(pending), { verify: verifyWithSite })
  for (const bad of invalid) console.log(`[gear-updates] Dropping submission ${bad.id}: ${bad.reason}`)
  console.log(`[gear-updates] ${valid.length} edit(s) to apply, ${invalid.length} dropped, ${later.length} left for the next run (the site didn't answer)`)

  git('config', 'user.name', 'github-actions[bot]')
  git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com')
  git('fetch', '--quiet', 'origin', 'main')
  const branchExists = gitOk('fetch', '--quiet', 'origin', `${BRANCH}:refs/remotes/origin/${BRANCH}`)
  git('checkout', '--quiet', '-B', BRANCH, branchExists ? `origin/${BRANCH}` : 'origin/main')
  // Keep the branch current with main (a merge commit; nothing on it is ever rewritten)
  if (branchExists && !gitOk('merge', '--quiet', '--no-edit', 'origin/main')) {
    gitOk('merge', '--abort')
    throw new Error(`${BRANCH} conflicts with main; resolve it in the pull request, then run the workflow again`)
  }

  for (const edit of valid) {
    const path = `data/gear/${edit.list}.json`
    const before = JSON.parse(await readFile(path, 'utf8'))
    const { list, skipped } = applyOps(before, edit.ops)
    const skippedOps = new Set(skipped.map(s => s.op))
    const applied = edit.ops.filter(op => !skippedOps.has(op))
    // Each line describes the change against the list as it stood just before it
    let current = before
    const lines = []
    for (const op of edit.ops) {
      lines.push({ op, line: describeOp(op, current) })
      current = applyOps(current, [op]).list
    }
    const lineFor = op => lines.find(l => l.op === op).line
    await writeFile(path, serializeList(list))
    git('add', path)
    if (gitOk('diff', '--cached', '--quiet')) {
      console.log(`[gear-updates] Submission ${edit.id} changes nothing`)
      continue
    }
    const message = commitMessage({
      list: edit.list,
      title: before.title,
      ops: applied.map(op => ({ line: lineFor(op) })),
      skipped: skipped.map(s => ({ line: lineFor(s.op), reason: s.reason })),
      id: edit.id,
      at: edit.at
    })
    execFileSync('git', ['commit', '--quiet', '-F', '-'], { input: message, stdio: ['pipe', 'inherit', 'inherit'] })
  }

  const ahead = Number(git('rev-list', '--count', `origin/main..${BRANCH}`))
  const changed = !branchExists || git('rev-parse', 'HEAD') !== git('rev-parse', `origin/${BRANCH}`)
  if (ahead > 0 && changed) {
    // The same tests Netlify runs before every build
    execFileSync('npm', ['test'], { stdio: 'inherit' })
    git('push', '--quiet', 'origin', BRANCH)
  }

  if (ahead > 0) {
    const owner = process.env.GITHUB_REPOSITORY.split('/')[0]
    const log = git('log', '--reverse', '--no-merges', '--format=### %s%n%n%b', `origin/main..${BRANCH}`, '--', 'data/gear')
    const open = await github(`/pulls?state=open&head=${owner}:${BRANCH}`)
    if (open.length) await github(`/pulls/${open[0].number}`, { method: 'PATCH', body: JSON.stringify({ body: prBody(log) }) })
    else await github('/pulls', { method: 'POST', body: JSON.stringify({ title: PR_TITLE, head: BRANCH, base: 'main', body: prBody(log) }) })
  }

  // Only now that the edits are pushed: each one is dealt with once. A fresh token, in case the
  // run took longer than the first one lasts.
  const done = [...valid, ...invalid].map(e => e.id).filter(Boolean)
  for (let i = 0; i < done.length; i += 500) await site(await actionsToken(), { method: 'DELETE', body: JSON.stringify({ keys: done.slice(i, i + 500) }) })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`[gear-updates] ${error.message}`)
    process.exit(1)
  })
}
