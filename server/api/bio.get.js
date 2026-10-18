// The Bio page: content/bio/bio.md, rendered like a blog post (sanitized markdown)
export default defineEventHandler(async () => {
  const source = await useStorage('assets:bio').getItem('bio.md')
  if (!source) throw createError({ statusCode: 404, statusMessage: 'Bio not found' })

  const { data, content } = parseFrontMatter(String(source))
  return {
    title: data.title || 'Bio',
    description: data.description || '',
    html: renderMarkdown(content)
  }
})
