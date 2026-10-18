// Writes data/projects.generated.mjs from config.toml [projects] before every build, and
// fails the build on a bad entry (same as the sign-in allow-list).
import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'smol-toml'
import { buildProjectConfig, projectsModule } from '../utils/projects.mjs'

const root = new URL('../', import.meta.url)
const toml = parse((await readFile(new URL('config.toml', root), 'utf8').catch(() => '')) || '')
const { wip, forks, problems } = buildProjectConfig(toml)

if (problems.length) {
  console.error(`[build-projects] Can't build the projects config:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}

await writeFile(new URL('data/projects.generated.mjs', root), projectsModule({ wip, forks }))
console.log(`[build-projects] ${wip.size} work in progress, ${forks.size} fork(s) listed`)
