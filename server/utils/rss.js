const SITE = 'https://www.hanselwei.dev'

const escape = s =>
  String(s ?? '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])

// RSS 2.0 for a list of posts from getPosts(); `path` is where the items live (e.g. /blog),
// `home` the page the channel links to (defaults to `path`)
export const buildRss = ({ title, description, path, home = path, posts }) => {
  const items = posts
    .map(post => ({ post, url: escape(`${SITE}${path}/${encodeURIComponent(post.slug)}`) }))
    .map(
      ({ post, url }) => `    <item>
      <title>${escape(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      ${post.date ? `<pubDate>${new Date(post.date).toUTCString()}</pubDate>` : ''}
      <description>${escape(post.description)}</description>
    </item>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escape(title)}</title>
    <link>${escape(`${SITE}${home}`)}</link>
    <description>${escape(description)}</description>
${items}
  </channel>
</rss>
`
}
