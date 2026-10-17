const SITE = 'https://www.hanselwei.dev'

const escape = s =>
  String(s ?? '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])

export default defineEventHandler(async event => {
  const posts = await getPosts()
  const items = posts
    .map(
      post => `    <item>
      <title>${escape(post.title)}</title>
      <link>${SITE}/blog/${post.slug}</link>
      <guid>${SITE}/blog/${post.slug}</guid>
      ${post.date ? `<pubDate>${new Date(post.date).toUTCString()}</pubDate>` : ''}
      <description>${escape(post.description)}</description>
    </item>`
    )
    .join('\n')

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>hanselwei.dev blog</title>
    <link>${SITE}/blog</link>
    <description>Notes, dev logs and posts by Hansel Wei</description>
${items}
  </channel>
</rss>
`
})
