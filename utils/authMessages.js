// What the sign-in menu says when a sign-in fails. The raw reason comes from the URL
// (#error_description=...) or the Identity API, so it only picks a fixed message and is
// never shown itself: a crafted link can't put its own words on the site.
export const NOT_INVITED = "That account isn't on the invite list for this site."
export const SIGN_IN_FAILED = "Sign-in didn't complete. Please try again."
export const INVITED = "You're invited. Continue with a provider below to accept."
export const IDLE_SIGNED_OUT = 'You were signed out after 1 hour of inactivity.'

// Netlify refusing a sign-in reads as a 401/403 or "denied"
export const explainAuthError = reason =>
  /\b40[13]\b|denied|not allowed|unauthori[sz]ed|forbidden|invite/i.test(String(reason ?? '').slice(0, 500)) ? NOT_INVITED : SIGN_IN_FAILED
