export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  const entry = (await getPosts('feed')).find(p => p.slug === slug)
  if (!entry) throw createError({ statusCode: 404, statusMessage: 'Entry not found' })

  const { content, ...meta } = entry
  return { ...meta, html: renderMarkdown(content) }
})
