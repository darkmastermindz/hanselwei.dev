// Writes data/credits.generated.json: the open-source credits built into the /credits page, from
// package.json, package-lock.json and each package in node_modules. The page then refreshes it
// from the /api/credits Netlify function, which reads the same details from the npm registry.
import { readFile, readdir } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'
import { buildCredits } from '../utils/credits.mjs'

const root = new URL('../', import.meta.url)
const readJson = async url => JSON.parse(await readFile(url, 'utf8'))
const dirOf = ({ name }) => new URL(`node_modules/${name}/`, root)

const credits = await buildCredits({
  pkg: await readJson(new URL('package.json', root)),
  lock: await readJson(new URL('package-lock.json', root)).catch(() => ({})),
  packageInfo: target => readJson(new URL('package.json', dirOf(target))),
  licenseText: async target => {
    const files = await readdir(dirOf(target))
    const name = files.find(file => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(file))
    return name ? readFile(new URL(name, dirOf(target)), 'utf8') : null
  }
})

await writeFile(new URL('data/credits.generated.json', root), `${JSON.stringify(credits, null, 2)}\n`)
console.log(`[build-credits] ${credits.packages.length} packages, ${credits.fonts.length} font(s)`)
