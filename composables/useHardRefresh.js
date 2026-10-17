// The in-app pull-down "hard refresh": starts the home page token over (spins, best
// hold, discovered facts) and hides Sign in until the hold-spin + tap gesture again,
// without reloading the page. A browser refresh does the same (utils/pageLoad.js).
export const useHardRefresh = () => {
  const resetAt = useState('token:resetAt', () => 0)
  const { hide } = useOwnerGate()
  const { error, notice } = useAuth()

  return () => {
    resetAt.value = Date.now()
    hide()
    error.value = ''
    notice.value = ''
    navigator.vibrate?.(10)
  }
}
