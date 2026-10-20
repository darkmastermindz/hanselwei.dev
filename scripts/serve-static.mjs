// Serves the generated site (.output/public, from `npm run generate`) for the browser tests in
// tests/e2e, the way Netlify does: /bio -> bio/index.html, unknown paths -> 404.html, and the
// Content-Security-Policy from _headers (scripts/build-csp.mjs), so the tests run under the same
// rules as the live site. Usage: node scripts/serve-static.mjs [port]
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../.output/public/', import.meta.url))
const port = Number(process.argv[2] ?? process.env.PORT ?? 4173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
}

// The site's CSP, minus upgrade-insecure-requests (this server is plain http on localhost)
const csp = await readFile(join(root, '_headers'), 'utf8')
  .then(text => /Content-Security-Policy(?:-Report-Only)?:\s*(.+)/.exec(text)?.[1].replace(/;\s*upgrade-insecure-requests/, '') ?? null)
  .catch(() => null)

const isFile = path => stat(path).then(s => s.isFile(), () => false)

// The file for a URL path, kept inside the output folder
const resolve = async pathname => {
  const path = normalize(join(root, decodeURIComponent(pathname)))
  if (!path.startsWith(root)) return null
  for (const candidate of [path, join(path, 'index.html'), `${path}.html`]) {
    if (await isFile(candidate)) return candidate
  }
  return null
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost')
    const file = await resolve(pathname)
    const status = file ? 200 : 404
    const body = await readFile(file ?? join(root, '404.html'))
    const type = TYPES[extname(file ?? '.html')] ?? 'application/octet-stream'
    res.writeHead(status, { 'Content-Type': type, ...(csp && type.startsWith('text/html') && { 'Content-Security-Policy': csp }) })
    res.end(body)
  } catch {
    res.writeHead(500).end()
  }
}).listen(port, () => console.log(`Serving ${root.split(sep).slice(-3).join('/')} on http://localhost:${port}`))
