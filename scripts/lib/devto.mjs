// Pure helpers for scripts/sync-devto.mjs (tested in tests/security/devto-sync.test.mjs)

// dev.to slugs become file names under content/blog/devto/, so only plain
// lowercase-and-dashes slugs are accepted: no "../", slashes, dots or NULs
export const SLUG = /^[a-z0-9][a-z0-9-]{0,199}$/
export const safeSlug = slug => typeof slug === 'string' && SLUG.test(slug)

// The files this sync owns (and may delete)
export const isMirroredFile = name => name.endsWith('.md') && safeSlug(name.slice(0, -3))

// dev.to liquid tags ({% embed url %}, {% github repo %}, ...) don't render outside dev.to;
// turn the common ones into plain links.
export const convertLiquidTags = markdown =>
  markdown
    .replace(/{%\s*(?:embed|link|twitter|youtube|codepen|github|gist|stackblitz|codesandbox|replit|glitch|instagram|speakerdeck|slideshare)\s+([^\s%]+)[^%]*%}/g, (_, target) => {
      const url = /^https?:\/\//.test(target)
        ? target
        : /^[\w.-]+\/[\w.-]+$/.test(target)
          ? `https://github.com/${target}`
          : /^[\w-]{11}$/.test(target)
            ? `https://www.youtube.com/watch?v=${target}`
            : target
      return `[${url}](${url})`
    })
    .replace(/{%\s*(?:raw|endraw)\s*%}/g, '')
    .replace(/{%[^%]*%}/g, '')

// Values are JSON-encoded, so newlines and quotes stay inside their own line
export const frontMatter = data =>
  `---\n${Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n')}\n---\n\n`
