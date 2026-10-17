// Netlify Identity event handlers: the server-side lock on site sign-in.
// Netlify calls these on every signup and login (email or GitHub/Google/... SSO).
// Anyone not in OWNER_EMAILS is turned away with a 401; owners get the "owner" role.
// A role change rides in the JWT, so it takes effect on the next login or token refresh.
import { isOwner } from '../lib/owners.mjs'

/** @param {import('@netlify/functions').UserValidateEvent} event */
const userValidate = event => {
  if (!isOwner(event.user.email)) return event.deny()
}

/** @param {import('@netlify/functions').UserSignupEvent} event */
const userSignup = event => {
  if (!isOwner(event.user.email)) return event.deny()
  const roles = new Set([...(event.user.appMetadata?.roles ?? []), 'owner'])
  return { user: { ...event.user, appMetadata: { ...event.user.appMetadata, roles: [...roles] } } }
}

/** @param {import('@netlify/functions').UserLoginEvent} event */
const userLogin = event => {
  if (!isOwner(event.user.email)) return event.deny()
}

export default { userValidate, userSignup, userLogin }
