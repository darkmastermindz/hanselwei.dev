// GET /api/inventory              -> available inventory lists
// GET /api/inventory/:list        -> items in a list (e.g. /api/inventory/outdoor)
//     ?section=Climbing&category=Harness&tag=Belay&status=shipped&q=black diamond
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
  // "climbing" used to be its own list; it is now the Climbing section of "outdoor"
  const legacyClimbing = list === 'climbing'
  const result = queryInventory(legacyClimbing ? 'outdoor' : list, {
    section: (legacyClimbing ? 'Climbing' : searchParams.get('section')) ?? undefined,
    category: searchParams.get('category') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    tag: searchParams.get('tag') ?? undefined,
    q: searchParams.get('q') ?? undefined
  })

  return result ? json(result) : json({ error: `Unknown inventory list "${list}"` }, 404)
}

export const config = {
  path: ['/api/inventory', '/api/inventory/:list']
}
