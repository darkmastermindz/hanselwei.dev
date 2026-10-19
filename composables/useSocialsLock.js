// One lock shared by the About card (which sets it) and the social links (which pause while
// it's on). See utils/socialsLock.js.
import { createLock } from '~/utils/socialsLock.js'

const locked = ref(false)
const lock = createLock(value => (locked.value = value))

export const useSocialsLock = () => ({
  locked: readonly(locked),
  lockSocials: lock.lock,
  releaseSocials: lock.release,
  unlockSocials: lock.unlock
})
