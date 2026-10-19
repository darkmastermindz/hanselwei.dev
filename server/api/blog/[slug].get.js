export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  const post = (await getPosts()).find(p => p.slug === slug)
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  const { content, ...meta } = post
  return { ...meta, html: renderMarkdown(content) }
})
