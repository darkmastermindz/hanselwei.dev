export default defineEventHandler(async event => {
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return buildRss({
    title: 'Blog · hanselwei.dev',
    description: 'Posts and series updates by Hansel Wei',
    path: '/blog',
    posts: await getPosts()
  })
})
