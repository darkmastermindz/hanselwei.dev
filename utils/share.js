// Share a link: the device's own share sheet where it has one (phones, most desktops), else
// copy the link. Returns what happened: 'shared', 'cancelled' (the sheet was closed), 'copied'
// or 'failed'.
export const shareLink = async ({ title, url }, nav = globalThis.navigator) => {
  if (typeof nav?.share === 'function') {
    try {
      await nav.share({ title, url })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
      // Not allowed here (or not for this link): copy it instead
    }
  }
  try {
    await nav.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
