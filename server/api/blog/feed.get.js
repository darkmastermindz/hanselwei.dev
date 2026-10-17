// The Curiosity Feed: posts that belong to a series, rendered in full for the stream
export default defineEventHandler(async () => {
  const posts = await getPosts()
  return posts.filter(post => post.series).map(({ content, ...meta }) => ({ ...meta, html: renderMarkdown(content) }))
})
