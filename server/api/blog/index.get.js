export default defineEventHandler(async () => {
  const posts = await getPosts()
  return posts.map(({ content, ...meta }) => meta)
})
