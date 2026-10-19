// The open-source software credits page (/credits). Nothing here is a hand-kept list: every
// package in package.json is credited, at the version package-lock.json installs. Its license,
// copyright line, GitHub link and description come from the package itself: from the npm registry
// and jsDelivr in the /api/credits Netlify function (netlify/functions/credits.mjs), or from
// node_modules for the copy built into the page (scripts/build-credits.mjs).
import { safeUrl } from './safeUrl.js'

export const NPM_NAME = /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*$/
export const VERSION = /^\d+\.\d+\.\d+[\w.+-]*$/

// Not in package.json (they come with Nuxt and its Tailwind module), but the site is made with
// them: credited by name too, in their group
export const INCLUDED = { vue: 'site', 'vue-router': 'site', '@unhead/vue': 'site', tailwindcss: 'build' }

// What a package does on this site, where its own npm description doesn't say (optional)
export const USES = {
  nuxt: 'The framework the site is built and prerendered with',
  vue: 'Components and reactivity',
  'vue-router': 'Page routing',
  '@unhead/vue': 'Page titles and meta tags',
  pinia: 'Shared state (the projects page)',
  daisyui: 'Badges, buttons and form styles',
  marked: 'Markdown for the blog and bio',
  'sanitize-html': 'Keeping rendered Markdown safe',
  'smol-toml': 'Reading the site config (config.toml)',
  tailwindcss: 'Styling'
}

// Fonts loaded from Google Fonts
export const CREDITED_FONTS = [
  {
    name: 'Nova Mono',
    author: 'wmk69',
    license: 'OFL-1.1',
    url: 'https://fonts.google.com/specimen/Nova+Mono',
    licenseUrl: 'https://openfontlicense.org/',
    use: 'Headings'
  }
]

// A package.json "repository" (a string or { url }) as an https://github.com/owner/repo link,
// or null. Handles "owner/repo", "github:owner/repo", "git+https://….git", "git://…", "git@github.com:…"
export const repoUrl = repository => {
  const raw = typeof repository === 'string' ? repository : repository?.url
  if (typeof raw !== 'string') return null
  let url = raw.trim()
  if (/^[\w.-]+\/[\w.-]+$/.test(url)) url = `github:${url}`
  url = url
    .replace(/^github:/, 'https://github.com/')
    .replace(/^git\+/, '')
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/^(git|ssh|http):\/\/(git@)?/, 'https://')
    .replace(/#.*$/, '')
    .replace(/\.git$/, '')
  const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/.exec(url)
  if (!match) return null
  return safeUrl(`https://github.com/${match[1]}/${match[2]}`)
}

// The package's own folder in a monorepo, when package.json says so
export const packageUrl = (repository, repo) => {
  const directory = typeof repository === 'object' ? repository?.directory : null
  if (!repo || typeof directory !== 'string' || !/^[\w./-]+$/.test(directory) || directory.includes('..')) return repo
  return safeUrl(`${repo}/tree/HEAD/${directory.replace(/^\/+|\/+$/g, '')}`)
}

// SPDX-style license id, or null for anything that doesn't look like one
export const licenseId = license => {
  const id = typeof license === 'string' ? license : license?.type
  return typeof id === 'string' && /^[\w.+() -]{1,60}$/.test(id) ? id : null
}

// The first "Copyright ..." line of a license file, trimmed to one plain line
export const copyrightLine = text => {
  if (typeof text !== 'string') return null
  const line = text.split(/\r?\n/).map(l => l.trim()).find(l => /^(copyright|\(c\)|©)/i.test(l) && /\w{3,}/.test(l))
  return line ? line.replace(/\s+/g, ' ').slice(0, 200) : null
}

// Plain, one-line, length-limited text (npm descriptions are outside input)
export const plainText = (text, max = 160) => {
  if (typeof text !== 'string') return null
  // No angle brackets at all (stripping tags one pass at a time can leave one: <scr<script>ipt>)
  const plain = text.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
  return plain || null
}

// What to credit: package.json dependencies ("site": the site runs on them) and devDependencies
// ("build": the site is built with them), plus INCLUDED, each at its installed version and
// license from package-lock.json
export const creditTargets = (pkg, lock) => {
  const seen = new Set()
  const targets = []
  const add = (name, group) => {
    if (seen.has(name) || !NPM_NAME.test(name)) return
    seen.add(name)
    const entry = lock?.packages?.[`node_modules/${name}`]
    targets.push({
      name,
      group,
      version: VERSION.test(entry?.version ?? '') ? entry.version : null,
      license: licenseId(entry?.license)
    })
  }
  const names = deps => Object.keys(deps && typeof deps === 'object' ? deps : {})
  const included = group => Object.keys(INCLUDED).filter(name => INCLUDED[name] === group)
  for (const name of [...names(pkg?.dependencies), ...included('site')].sort()) add(name, 'site')
  for (const name of [...names(pkg?.devDependencies), ...included('build')].sort()) add(name, 'build')
  return targets
}

const settle = async promise => {
  try {
    return await promise
  } catch {
    return null
  }
}

// The credits list. packageInfo(target) gives the package's package.json (or registry entry)
// and licenseText(target) its license file; either may fail, leaving the lockfile's details.
export const buildCredits = async ({ pkg, lock, packageInfo, licenseText }) => {
  const packages = await Promise.all(
    creditTargets(pkg, lock).map(async target => {
      const [info, text] = await Promise.all([settle(packageInfo(target)), settle(licenseText(target))])
      const repo = repoUrl(info?.repository)
      return {
        name: target.name,
        group: target.group,
        version: target.version,
        license: licenseId(info?.license) ?? target.license,
        copyright: copyrightLine(text),
        url: packageUrl(info?.repository, repo) ?? safeUrl(`https://www.npmjs.com/package/${target.name}`),
        use: USES[target.name] ?? plainText(info?.description)
      }
    })
  )
  return { packages, fonts: CREDITED_FONTS }
}
