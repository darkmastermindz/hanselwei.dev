// GET /api/inventory              -> available inventory lists
// GET /api/inventory/:list        -> items in a list (e.g. /api/inventory/climbing)
//     ?category=Harness&tag=Belay&q=black diamond
import { listSummaries, queryInventory } from '../../data/inventory.mjs'

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'public, max-age=60, s-maxage=300'
}

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers })

export default async (req, context) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const { list } = context.params ?? {}
  if (!list) return json({ lists: listSummaries() })

  const { searchParams } = new URL(req.url)
  const result = queryInventory(list, {
    category: searchParams.get('category') ?? undefined,
    tag: searchParams.get('tag') ?? undefined,
    q: searchParams.get('q') ?? undefined
  })

  return result ? json(result) : json({ error: `Unknown inventory list "${list}"` }, 404)
}

export const config = {
  path: ['/api/inventory', '/api/inventory/:list']
}
