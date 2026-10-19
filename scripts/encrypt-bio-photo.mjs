// Encrypts the Bio page photo for netlify/functions/bio-photo.mjs:
//   BIO_PHOTO_KEY=<32 bytes, base64> node scripts/encrypt-bio-photo.mjs photo.jpg
// Give it an already reduced copy (about 640px wide, quality ~60, no metadata, watermarked).
// Writes netlify/lib/bioPhoto.sealed.mjs (safe to commit: ciphertext only). Make a new key with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
import { readFileSync, writeFileSync } from 'node:fs'
import { encryptPhoto } from '../netlify/lib/bioPhoto.mjs'

const [file] = process.argv.slice(2)
if (!file || !process.env.BIO_PHOTO_KEY) {
  console.error('Usage: BIO_PHOTO_KEY=<base64 key> node scripts/encrypt-bio-photo.mjs photo.jpg')
  process.exit(1)
}
const sealed = encryptPhoto(readFileSync(file), process.env.BIO_PHOTO_KEY)
writeFileSync(
  new URL('../netlify/lib/bioPhoto.sealed.mjs', import.meta.url),
  `// The Bio page photo, encrypted (scripts/encrypt-bio-photo.mjs). Decrypted with BIO_PHOTO_KEY.\nexport default ${JSON.stringify(sealed)}\n`
)
console.log('Wrote netlify/lib/bioPhoto.sealed.mjs')
