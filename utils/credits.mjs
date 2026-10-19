// The open-source software credits page (/credits). The list of what to credit is here; each
// package's version, license, copyright line and GitHub link are read from its installed copy at
// build time (scripts/build-credits.mjs), so they stay accurate after updates.
import { safeUrl } from './safeUrl.js'

// What this site uses, and what for (in the order shown)
export const CREDITED_PACKAGES = [
  ['nuxt', 'The framework the site is built and prerendered with'],
  ['vue', 'Components and reactivity'],
  ['vue-router', 'Page routing'],
  ['@unhead/vue', 'Page titles and meta tags'],
  ['pinia', 'Shared state (the projects page)'],
  ['@pinia/nuxt', 'Pinia for Nuxt'],
  ['tailwindcss', 'Styling'],
  ['@nuxtjs/tailwindcss', 'Tailwind CSS for Nuxt'],
  ['@tailwindcss/typography', 'Blog and bio text styles'],
  ['daisyui', 'Badges, buttons and form styles'],
  ['tachyons', 'Utility styles'],
  ['sass', 'Stylesheets'],
  ['postcss', 'CSS processing'],
  ['autoprefixer', 'CSS browser prefixes'],
  ['marked', 'Markdown for the blog and bio'],
  ['sanitize-html', 'Keeping rendered Markdown safe'],
  ['smol-toml', 'Reading the site config (config.toml)'],
  ['@netlify/functions', 'The site’s serverless functions']
]

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
