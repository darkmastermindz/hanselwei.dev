<template>
  <div ref="root" class="auth">
    <button
      type="button"
      :class="['btn btn-ghost btn-sm md:btn-md normal-case dim auth__toggle', user ? 'signed-in' : 'signed-out']"
      :aria-expanded="open"
      aria-haspopup="menu"
      :title="user ? 'Account' : 'Invite-only sign-in'"
      @click="open = !open"
    >
      <template v-if="user">
        <img v-if="avatar" :src="avatar" alt="" class="auth__avatar" />
        <span>{ {{ avatar ? '' : '👋 ' }}{{ firstName }} }</span>
      </template>
      <span v-else>{ 🔐 Sign in }</span>
    </button>

    <div v-if="open" class="auth__menu" role="menu">
      <template v-if="user">
        <p class="auth__who">Signed in as<br /><strong>{{ user.email }}</strong></p>
        <button type="button" role="menuitem" class="auth__item" @click="leave">Sign out</button>
      </template>
      <template v-else-if="status === 'ready' && providers.length">
        <p v-if="invite" class="auth__notice auth__notice--top">{{ INVITED }}</p>
        <p class="auth__invite">
          <span class="auth__badge">🔒 Invite only</span>
          Only the site's code owners and invited people can sign in.
        </p>
        <button
          v-for="provider in providers"
          :key="provider.id"
          type="button"
          role="menuitem"
          class="auth__item"
          @click="signIn(provider.id)"
        >
          Continue with {{ provider.label }}
        </button>
      </template>
      <p v-else-if="status === 'idle'" class="auth__who">Checking…</p>
      <p v-else class="auth__invite">
        <span class="auth__badge">🔒 Invite only</span>
        Sign-in isn't switched on for this site yet.
      </p>
      <p v-if="notice && !user" class="auth__notice">{{ notice }}</p>
      <p v-if="error" class="auth__error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
// Nav sign-in for the site owner, through Netlify Identity's single sign-on
// (GitHub/Google/... — whichever providers are enabled in the Identity settings)
// (plugins/auth.client.js starts the session check on page load)
import { INVITED } from '~/utils/authMessages.js'
import { safeUrl } from '~/utils/safeUrl.js'

const { user, providers, status, error, notice, invite, signIn, signOut } = useAuth()
const open = ref(false)
const root = ref(null)

// Coming back from a refused sign-in, signed out for inactivity, or arriving from an
// invite link: open the menu so the reason (or next step) is visible
watch(
  [error, notice, invite],
  ([message, note, invited]) => {
    if (message || note || invited) open.value = true
  },
  { immediate: true }
)

const avatar = computed(() => safeUrl(user.value?.pictureUrl))

const firstName = computed(() => user.value?.name?.split(' ')[0] || user.value?.email?.split('@')[0] || 'Me')

const leave = async () => {
  open.value = false
  await signOut()
}

// Close on a tap/click elsewhere or Escape
const onPointerDown = event => {
  if (open.value && !root.value?.contains(event.target)) open.value = false
}
const onKey = event => {
  if (event.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.auth {
  position: relative;
  flex: 0 0 auto;
}

.auth__toggle {
  white-space: nowrap;
  gap: 0.4rem;
}

.signed-out {
  color: #fbbf24;
}

.signed-in {
  color: #7cfc00;
}

.auth__avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  border: 1px solid #7cfc00;
}

.auth__menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  z-index: 30;
  min-width: 14rem;
  padding: 0.6rem;
  border-radius: 0.75rem;
  background: #23262a;
  border: 1px solid #653496;
  box-shadow: 4px 4px #7cfc00;
  color: #eee;
}

.auth__who {
  font-size: 0.8rem;
  color: #bbb;
  padding: 0.25rem 0.4rem 0.5rem;
  overflow-wrap: anywhere;
}

.auth__invite {
  font-size: 0.8rem;
  color: #bbb;
  padding: 0.25rem 0.4rem 0.6rem;
  line-height: 1.45;
}

.auth__badge {
  display: inline-block;
  margin-bottom: 0.35rem;
  padding: 0.1rem 0.55rem;
  border-radius: 9999px;
  background: #3b2a06;
  border: 1px solid #fbbf24;
  color: #fbbf24;
  font-weight: 700;
  font-size: 0.75rem;
}

.auth__item {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  text-align: left;
  color: #fff;
}

.auth__item:hover,
.auth__item:focus-visible {
  background: #653496;
  outline: none;
}

.auth__notice {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #fbbf24;
}

.auth__notice--top {
  margin: 0 0 0.4rem;
  padding: 0.25rem 0.4rem 0;
}

.auth__error {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #fca5a5;
}
</style>
