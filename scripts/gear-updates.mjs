// The "Gear updates" workflow (.github/workflows/gear-updates.yml, README "Editing gear lists"):
// reads the gear edits sent from the editor on /gear/<list> through the "gear-edit" Netlify Form,
// keeps only those the owner signed (netlify/lib/gearToken.mjs), applies them in the order they
// were sent to data/gear/<list>.json on the gear-updates branch, and opens or updates one pull
// request for them. Submissions it has dealt with are deleted from Netlify, so each lands once.
//
// Needs NETLIFY_API_TOKEN, NETLIFY_SITE_ID and GEAR_EDIT_KEY (GitHub Actions secrets), plus the
// workflow's own GITHUB_TOKEN. Without the first three it says so and stops (the workflow
// stays green until editing is set up).
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { hasInventory } from '../data/inventory.mjs'
import { applyOps, describeOp, serializeList, validateOps } from '../utils/gearEdits.mjs'
import { gearKey, readGearToken } from '../netlify/lib/gearToken.mjs'

export const FORM_NAME = 'gear-edit'
export const BRANCH = 'gear-updates'
const PR_TITLE = 'Gear updates'
// Overridable for a dry run against a stand-in server
const NETLIFY_API = process.env.NETLIFY_API_URL ?? 'https://api.netlify.com/api/v1'
const GITHUB_API = process.env.GITHUB_API_URL ?? 'https://api.github.com'
const MAX_OPS_TEXT = 256 * 1024

// Sorts submissions into the ones to apply (oldest first) and the ones to drop, with why.
// Nothing from a submission is trusted until its token checks out for exactly its list and changes.
export const checkSubmissions = (submissions, { key, isOwner }) => {
  const valid = []
  const invalid = []
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
    const signer = readGearToken(data.token, { list, opsText }, key, at)
    if (!signer) {
      reject('token missing, forged, expired or not for these changes')
      continue
    }
    if (!isOwner(signer.email)) {
      reject('signed by someone who is no longer an owner')
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
  return { valid, invalid }
}

// The commit for one submission: what changed, in plain lines
export const commitMessage = ({ list, title, ops, skipped, id, at }) =>
  [
    `Gear: ${title}: ${ops.length} change${ops.length === 1 ? '' : 's'}`,
    '',
    ...ops.map(op => `- ${op.line}`),
    ...(skipped.length ? ['', 'Skipped:', ...skipped.map(s => `- ${s.line} (${s.reason})`)] : []),
    '',
    `From the editor on /gear/${list} (form submission ${id}, ${new Date(at).toISOString()}).`
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

const netlify = async (path, options = {}) => {
  const res = await fetch(`${NETLIFY_API}${path}`, {
    ...options,
    headers: { authorization: `Bearer ${process.env.NETLIFY_API_TOKEN}`, 'user-agent': 'hanselwei.dev gear-updates' }
  })
  if (!res.ok) throw new Error(`Netlify ${options.method ?? 'GET'} ${path.replace(/\/[0-9a-f]{24}/g, '/…')}: ${res.status}`)
  return res.status === 204 ? null : res.json()
}

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

const allSubmissions = async formId => {
  const all = []
  for (let page = 1; ; page++) {
    const batch = await netlify(`/forms/${formId}/submissions?per_page=100&page=${page}`)
    all.push(...batch)
    if (batch.length < 100) return all
  }
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
  const key = gearKey(process.env)
  if (!process.env.NETLIFY_API_TOKEN || !process.env.NETLIFY_SITE_ID || !key) {
    console.log('[gear-updates] Not set up yet (NETLIFY_API_TOKEN, NETLIFY_SITE_ID and GEAR_EDIT_KEY secrets); nothing to do.')
    return
  }
  const { isOwner } = await import('../netlify/lib/owners.mjs')

  const forms = await netlify(`/sites/${process.env.NETLIFY_SITE_ID}/forms`)
  const form = forms.find(f => f.name === FORM_NAME)
  const submissions = form ? await allSubmissions(form.id) : []
  const { valid, invalid } = checkSubmissions(submissions, { key, isOwner })
  for (const bad of invalid) console.log(`[gear-updates] Dropping submission ${bad.id}: ${bad.reason}`)
  console.log(`[gear-updates] ${valid.length} edit(s) to apply, ${invalid.length} dropped`)

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

  // Only now that the edits are pushed: each submission is dealt with once
  for (const { id } of [...valid, ...invalid]) if (id) await netlify(`/submissions/${id}`, { method: 'DELETE' })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`[gear-updates] ${error.message}`)
    process.exit(1)
  })
}
