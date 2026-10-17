export default defineEventHandler(async event => {
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return buildRss({
    title: 'Curiosity Feed · hanselwei.dev',
    description: 'Short notes, links and things Hansel Wei is curious about',
    path: '/blog',
    home: '/blog/feed',
    posts: (await getPosts()).filter(post => post.series)
  })
})
