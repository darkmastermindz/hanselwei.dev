// The commit a build was made from, for the owner-only "Build abc1234" line in the footer
// (components/SiteFooter.vue). Netlify sets COMMIT_REF, GitHub Actions GITHUB_SHA; a local
// build asks git. Only a full commit hash counts, so nothing else from the environment ever
// reaches the page.
const REPO_COMMIT_URL = 'https://github.com/darkmastermindz/hanselwei.dev/commit/'

const asCommit = value => {
  if (typeof value !== 'string') return null
  const sha = value.trim().toLowerCase()
  return /^[0-9a-f]{40}$/.test(sha) ? sha : null
}

export const buildCommit = (env = {}, readGit) => {
  const fromEnv = asCommit(env.COMMIT_REF) || asCommit(env.GITHUB_SHA)
  if (fromEnv) return fromEnv
  try {
    return asCommit(readGit?.())
  } catch {
    return null
  }
}

export const commitUrl = sha => (asCommit(sha) ? REPO_COMMIT_URL + asCommit(sha) : null)
