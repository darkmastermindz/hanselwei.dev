// Writes assets/css/springs.css (SwiftUI's spring presets as CSS easings) from utils/spring.mjs.
// The file is checked in; tests/app/spring.test.mjs fails if it falls out of step.
import { writeFile, mkdir } from 'node:fs/promises'
import { springCss } from '../utils/spring.mjs'

const root = new URL('../', import.meta.url)
await mkdir(new URL('assets/css/', root), { recursive: true })
await writeFile(new URL('assets/css/springs.css', root), springCss())
console.log('[build-springs] wrote assets/css/springs.css')
