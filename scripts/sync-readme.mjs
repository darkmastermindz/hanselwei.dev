// Writes content/bio/github-readme.generated.md (the GitHub profile README shown on the Bio
// page) before every build. No token is needed: the README is public. On any error the last
// copy is kept (or an empty one is written) and the build carries on, like sync-contributions.
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseReadme } from '../utils/readme.mjs'

const SOURCE = 'https://raw.githubusercontent.com/darkmastermindz/darkmastermindz/main/README.md'
const OUT = fileURLToPath(new URL('../content/bio/github-readme.generated.md', import.meta.url))

const keepLastOrEmpty = async () => {
  if (!existsSync(OUT)) await writeFile(OUT, '')
}

const fetchReadme = async () => {
  const res = await fetch(SOURCE, { headers: { 'user-agent': 'hanselwei.dev' } })
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`)
  const readme = parseReadme(await res.text())
  if (readme === null) throw new Error('unexpected README format')
  return readme
}

try {
  const readme = await fetchReadme()
  await writeFile(OUT, readme)
  console.log(`[sync-readme] ${readme.length} characters`)
} catch (err) {
  console.warn(`[sync-readme] Skipped, keeping the last README: ${err.message}`)
  await keepLastOrEmpty()
}
