export default defineEventHandler(async event => {
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return buildRss({
    title: 'Blog · hanselwei.dev',
    description: 'Long-form posts by Hansel Wei',
    path: '/blog',
    posts: await getPosts('blog')
  })
})
