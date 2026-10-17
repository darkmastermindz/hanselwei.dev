// GET /api/me -> the signed-in owner, checked on the server from the Identity session
// (nf_jwt cookie). 401 when signed out, 403 for anyone who isn't an owner.
import { getUser } from '@netlify/identity'
import { isOwner } from '../lib/owners.mjs'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store' }
  })

export default async () => {
  const user = await getUser()
  if (!user) return json({ error: 'Not signed in' }, 401)
  if (!isOwner(user.email)) return json({ error: 'Not allowed' }, 403)
  return json({ email: user.email, name: user.name, roles: user.roles ?? [], owner: true })
}

export const config = { path: '/api/me' }
