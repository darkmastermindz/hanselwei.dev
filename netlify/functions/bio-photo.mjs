// GET /api/bio-photo: the Bio page photo, only for the site's own page (see netlify/lib/bioPhoto.mjs)
import sealed from '../lib/bioPhoto.sealed.mjs'
import { allowPhotoRequest, decryptPhoto, PHOTO_HEADERS } from '../lib/bioPhoto.mjs'

const refuse = status => new Response(null, { status, headers: PHOTO_HEADERS })

export default async req => {
  if (req.method !== 'GET') return refuse(405)
  if (!allowPhotoRequest(req.headers, req.url)) return refuse(403)
  const photo = decryptPhoto(sealed, process.env.BIO_PHOTO_KEY)
  if (!photo) return refuse(404)
  return new Response(photo, { headers: { ...PHOTO_HEADERS, 'content-type': 'image/jpeg' } })
}

export const config = { path: '/api/bio-photo' }
