// The Bio page photo (netlify/functions/bio-photo.mjs). The repo is public, so it holds only an
// encrypted copy (AES-256-GCM); the key is the BIO_PHOTO_KEY environment variable in Netlify.
// What's encrypted is already a small (640px), lower-quality, watermarked copy without camera
// metadata. Re-encrypt a new photo with scripts/encrypt-bio-photo.mjs.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const keyFrom = keyBase64 => {
  const key = Buffer.from(String(keyBase64 ?? ''), 'base64')
  if (key.length !== 32) throw new Error('BIO_PHOTO_KEY must be 32 bytes, base64')
  return key
}

export const encryptPhoto = (bytes, keyBase64) => {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFrom(keyBase64), iv)
  const data = Buffer.concat([cipher.update(bytes), cipher.final()])
  return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') }
}

// The JPEG bytes, or null when the key is missing or wrong (or the data was tampered with)
export const decryptPhoto = (sealed, keyBase64) => {
  try {
    const decipher = createDecipheriv('aes-256-gcm', keyFrom(keyBase64), Buffer.from(sealed.iv, 'base64'))
    decipher.setAuthTag(Buffer.from(sealed.tag, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(sealed.data, 'base64')), decipher.final()])
  } catch {
    return null
  }
}

// Only the site's own page may load the photo: a script fetch from the same origin. Direct
// visits (typing the URL, "open image in new tab"), other sites (hotlinking, <img> embeds) and
// clients that send none of the browser's fetch metadata are refused. A determined person can
// still forge these headers or screenshot the page; this keeps casual saving and scraping out.
export const allowPhotoRequest = (headers, requestUrl) => {
  const get = name => headers.get(name) ?? ''
  const site = get('sec-fetch-site')
  if (site) {
    return site === 'same-origin' && ['cors', 'same-origin'].includes(get('sec-fetch-mode')) && get('sec-fetch-dest') === 'empty'
  }
  // Older browsers without fetch metadata: the referrer must be this site
  try {
    return new URL(get('referer')).origin === new URL(requestUrl).origin
  } catch {
    return false
  }
}

// Headers on every response: never cached or stored, never indexed, opted out of AI use, and
// unusable from other origins
export const PHOTO_HEADERS = {
  'cache-control': 'private, no-store, max-age=0',
  'x-robots-tag': 'noindex, nofollow, noimageindex, noarchive, nosnippet, noai, noimageai',
  'cross-origin-resource-policy': 'same-origin',
  'content-disposition': 'inline',
  vary: 'Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest, Referer'
}
