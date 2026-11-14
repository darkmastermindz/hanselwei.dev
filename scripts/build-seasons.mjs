// Writes data/seasons.generated.mjs from config.toml [seasons] before every build, and fails the
// build on a bad setting (same as the other config sections).
import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'smol-toml'
import { buildSeasonsConfig, seasonsModule, themeFor } from '../utils/seasons.mjs'
import { dayIn } from '../utils/coinBubble.mjs'

const root = new URL('../', import.meta.url)
const toml = parse((await readFile(new URL('config.toml', root), 'utf8').catch(() => '')) || '')
const { config, problems } = buildSeasonsConfig(toml)

if (problems.length) {
  console.error(`[build-seasons] Can't build the seasons config:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}

await writeFile(new URL('data/seasons.generated.mjs', root), seasonsModule(config))
const today = themeFor(config, dayIn(new Date()))
console.log(
  `[build-seasons] ${config.enabled ? `${config.weeks.length} weekly themes, ${config.events.length} event(s); today: ${today?.name ?? 'none'}` : 'off'}`
)
