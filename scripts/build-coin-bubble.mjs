// Writes data/coinBubble.generated.mjs from config.toml [coin_bubble] before every build, and
// fails the build on a bad setting (same as the other config sections).
import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'smol-toml'
import { buildCoinBubbleConfig, coinBubbleModule } from '../utils/coinBubble.mjs'
import { qrPath } from '../utils/coinQr.mjs'

const root = new URL('../', import.meta.url)
const toml = parse((await readFile(new URL('config.toml', root), 'utf8').catch(() => '')) || '')
const { config, problems } = buildCoinBubbleConfig(toml)

if (problems.length) {
  console.error(`[build-coin-bubble] Can't build the coin bubble config:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}

// The tails-side QR as an SVG path, so the page needs no QR library
const qr = config.qr ? qrPath(config.qr) : null
await writeFile(new URL('data/coinBubble.generated.mjs', root), coinBubbleModule({ ...config, qrSize: qr?.size ?? 0, qrPath: qr?.path ?? '' }))
console.log(
  `[build-coin-bubble] ${config.enabled ? `on through ${config.until}: ${JSON.stringify(config.text)}` : 'off'}` +
    (config.link ? `, ${JSON.stringify(config.linkText)} -> ${config.link}` : '') +
    (qr ? `, QR ${qr.size}×${qr.size} -> ${config.qr}` : '')
)
