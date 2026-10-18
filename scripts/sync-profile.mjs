// Writes data/profile.generated.json (the About me text) before every build, from the public
// GitHub profile bio. GITHUB_TOKEN is optional (it only avoids the anonymous rate limit).
// On any error the last copy is kept (or an empty one is written) and the build carries on,
// like sync-contributions.
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { EMPTY_PROFILE, parseProfile } from '../utils/profile.mjs'

const USER = 'darkmastermindz'
const OUT = fileURLToPath(new URL('../data/profile.generated.json', import.meta.url))

const keepLastOrEmpty = async () => {
  if (!existsSync(OUT)) await writeFile(OUT, JSON.stringify(EMPTY_PROFILE))
}

const fetchProfile = async () => {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'hanselwei.dev' }
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(`https://api.github.com/users/${USER}`, { headers })
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`)
  const profile = parseProfile(await res.json())
  if (!profile) throw new Error('unexpected profile format')
  return profile
}

try {
  const profile = await fetchProfile()
  await writeFile(OUT, JSON.stringify(profile))
  console.log(`[sync-profile] ${profile.lines.length} bio line(s)`)
} catch (err) {
  console.warn(`[sync-profile] Skipped, keeping the last profile: ${err.message}`)
  await keepLastOrEmpty()
}
