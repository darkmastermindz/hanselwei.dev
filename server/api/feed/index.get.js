// Feed entries are short, so the stream ships each one fully rendered
export default defineEventHandler(async () => {
  const entries = await getPosts('feed')
  return entries.map(({ content, ...meta }) => ({ ...meta, html: renderMarkdown(content) }))
})
