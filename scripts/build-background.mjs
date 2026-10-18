// Writes data/background.generated.mjs from config.toml [background] before every build, and
// fails the build on a bad setting (same as the projects config).
import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'smol-toml'
import { backgroundModule, buildBackgroundConfig } from '../utils/background.mjs'

const root = new URL('../', import.meta.url)
const toml = parse((await readFile(new URL('config.toml', root), 'utf8').catch(() => '')) || '')
const { config, problems } = buildBackgroundConfig(toml)

if (problems.length) {
  console.error(`[build-background] Can't build the background config:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}

await writeFile(new URL('data/background.generated.mjs', root), backgroundModule(config))
console.log(
  `[build-background] ${config.enabled ? 'on' : 'off'}: ${config.contours} contours, ${config.featureSize}px features, ` +
    `index every ${config.indexEvery || 'none'}, ${config.trails} trail(s), ${config.drawSeconds}s to draw, ` +
    `${config.respectDataSaver ? 'skipped' : 'shown'} when saving data`
)
