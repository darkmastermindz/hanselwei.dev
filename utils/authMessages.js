// What the sign-in menu says. The callback only reports a fixed reason in the URL hash
// (#auth_error=denied or #auth_error=failed); anything else gets the generic message,
// so no text from a crafted link is ever shown.
export const NOT_INVITED = "That account isn't on the invite list for this site."
export const SIGN_IN_FAILED = "Sign-in didn't complete. Please try again."
export const SESSION_ENDED = 'Your session ended. Sign in again to continue.'
export const IDLE_SIGNED_OUT = 'You were signed out after 1 hour of inactivity.'

export const explainAuthError = reason => (reason === 'denied' ? NOT_INVITED : SIGN_IN_FAILED)
