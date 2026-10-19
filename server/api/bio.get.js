// The Bio page: content/bio/bio.md, rendered like a blog post (sanitized markdown), plus the
// GitHub profile README synced at build time (scripts/sync-readme.mjs)
export default defineEventHandler(async () => {
  const storage = useStorage('assets:bio')
  const source = await storage.getItem('bio.md')
  if (!source) throw createError({ statusCode: 404, statusMessage: 'Bio not found' })

  const { data, content } = parseFrontMatter(String(source))
  const readme = String((await storage.getItem('github-readme.generated.md')) ?? '').trim()
  return {
    title: data.title || 'Bio',
    description: data.description || '',
    html: renderMarkdown(content),
    readme: readme ? renderMarkdown(readme) : ''
  }
})
