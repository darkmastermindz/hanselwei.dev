// Writes data/credits.generated.json for the open-source credits page (/credits): each credited
// package's version, license, copyright line and GitHub link, read from node_modules.
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { CREDITED_FONTS, CREDITED_PACKAGES, copyrightLine, licenseId, packageUrl, repoUrl } from '../utils/credits.mjs'

const root = new URL('../', import.meta.url)

const readLicense = async dir => {
  const files = await readdir(dir).catch(() => [])
  const name = files.find(file => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(file))
  return name ? readFile(new URL(name, dir), 'utf8').catch(() => null) : null
}

const packages = []
for (const [name, use] of CREDITED_PACKAGES) {
  const dir = new URL(`node_modules/${name}/`, root)
  const pkg = JSON.parse(await readFile(new URL('package.json', dir), 'utf8').catch(() => 'null'))
  if (!pkg) {
    console.warn(`[build-credits] ${name} isn't installed; skipped`)
    continue
  }
  const repo = repoUrl(pkg.repository)
  packages.push({
    name,
    version: typeof pkg.version === 'string' ? pkg.version : null,
    license: licenseId(pkg.license),
    copyright: copyrightLine(await readLicense(dir)),
    url: packageUrl(pkg.repository, repo),
    use
  })
}

await writeFile(new URL('data/credits.generated.json', root), `${JSON.stringify({ packages, fonts: CREDITED_FONTS }, null, 2)}\n`)
console.log(`[build-credits] ${packages.length} packages, ${CREDITED_FONTS.length} font(s)`)
