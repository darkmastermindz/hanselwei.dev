// Writes data/coinBubble.generated.mjs from config.toml [coin_bubble] before every build, and
// fails the build on a bad setting (same as the other config sections).
import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'smol-toml'
import { buildCoinBubbleConfig, coinBubbleModule } from '../utils/coinBubble.mjs'

const root = new URL('../', import.meta.url)
const toml = parse((await readFile(new URL('config.toml', root), 'utf8').catch(() => '')) || '')
const { config, problems } = buildCoinBubbleConfig(toml)

if (problems.length) {
  console.error(`[build-coin-bubble] Can't build the coin bubble config:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}

await writeFile(new URL('data/coinBubble.generated.mjs', root), coinBubbleModule(config))
console.log(`[build-coin-bubble] ${config.enabled ? `on through ${config.until}: ${JSON.stringify(config.text)}` : 'off'}`)
