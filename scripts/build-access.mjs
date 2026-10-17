// Builds the sign-in allow-list from .github/CODEOWNERS plus [access] in config.toml,
// and writes it to netlify/lib/access.mjs (git-ignored) for the Identity functions.
// Runs before every build (pregenerate/prebuild) and fails it on a bad entry, so a
// code owner can't silently end up locked out.
import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'smol-toml'
import { accessModule, buildAllowList } from './lib/access.mjs'

const root = new URL('../', import.meta.url)
const read = async path => readFile(new URL(path, root), 'utf8').catch(() => '')

const { emails, owners, additional, problems } = buildAllowList({
  codeowners: await read('.github/CODEOWNERS'),
  config: parse((await read('config.toml')) || '')
})

if (problems.length) {
  console.error(`[build-access] Can't build the sign-in allow-list:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}

await writeFile(new URL('netlify/lib/access.mjs', root), accessModule(emails))
console.log(`[build-access] ${emails.length} account(s) can sign in, from ${owners} code owner(s) and ${additional} additional`)
