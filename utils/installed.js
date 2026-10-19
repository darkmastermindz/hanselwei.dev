// Whether the site is running as the installed home-screen app (standalone), not in a browser
// tab: the display-mode media query, or iOS Safari's older navigator.standalone flag.
export const isInstalled = ({ matchMedia, standalone } = {}) =>
  standalone === true || Boolean(matchMedia?.('(display-mode: standalone)')?.matches)
