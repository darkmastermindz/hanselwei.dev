// Whether the browser is on an iPhone, iPad or iPod. iPadOS asks for desktop sites by default and
// then reports itself as a Mac, so a "Mac" with a touch screen counts too.
export const isAppleMobile = ({ userAgent, platform, maxTouchPoints } = {}) =>
  /iPhone|iPad|iPod/.test(typeof userAgent === 'string' ? userAgent : '') ||
  (platform === 'MacIntel' && Number(maxTouchPoints) > 1)
