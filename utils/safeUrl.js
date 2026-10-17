// Returns `value` if it is safe to put in an href/src: an absolute http(s) URL or a
// site-relative path. Anything else (javascript:, data:, protocol-relative, junk) -> null.
export const safeUrl = value => {
  if (typeof value !== 'string') return null
  const url = value.trim()
  if (!url || /[\u0000-\u001f\u007f<>"'`\\]/.test(url)) return null
  if (url.startsWith('/')) return url.startsWith('//') ? null : url
  try {
    const { protocol, hostname } = new URL(url)
    return (protocol === 'https:' || protocol === 'http:') && hostname ? url : null
  } catch {
    return null
  }
}
