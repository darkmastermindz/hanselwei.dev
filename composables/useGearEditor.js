// The owner's gear editor on /gear/[list] (README "Editing gear lists"). Changes collect here
// as operations (utils/gearEdits.mjs), shown on the page as they'd look, and kept in this
// browser until they're sent. Sending asks /api/gear/token to sign them, then posts them to the
// "gear-edit" Netlify Form; the Gear updates workflow adds them to the "Gear updates" pull request.
import { applyOps, describeOp, validateOps } from '~/utils/gearEdits.mjs'

const storageKey = id => `gear-edits:${id}`

const loadPending = id => {
  try {
    const checked = validateOps(JSON.parse(localStorage.getItem(storageKey(id)) ?? '[]'))
    return checked.ops ?? []
  } catch {
    return []
  }
}

const savePending = (id, ops) => {
  try {
    if (ops.length) localStorage.setItem(storageKey(id), JSON.stringify(ops))
    else localStorage.removeItem(storageKey(id))
  } catch {}
}

// Which pending "add" made each new item, so changing or removing an item that isn't saved yet
// edits that add instead of piling a second change on it
export const addsById = (list, ops) => {
  const byId = new Map()
  let current = list
  ops.forEach((op, index) => {
    const before = new Set(current.items.map(i => i.id))
    current = applyOps(current, [op]).list
    if (op.op === 'add') {
      const added = current.items.find(i => !before.has(i.id))
      if (added) byId.set(added.id, index)
    }
  })
  return byId
}

export const useGearEditor = (id, inventory) => {
  const editing = ref(false)
  const pending = ref([])
  const sending = ref(false)
  const sent = ref(false)
  const problem = ref('')

  onMounted(() => (pending.value = loadPending(id)))
  watch(pending, ops => savePending(id, ops), { deep: true })

  // The list as it will read once the pending changes are in
  const preview = computed(() => (pending.value.length ? applyOps(inventory.value, pending.value).list : inventory.value))
  const changes = computed(() => {
    let current = inventory.value
    return pending.value.map(op => {
      const line = describeOp(op, current)
      current = applyOps(current, [op]).list
      return line
    })
  })

  const change = ops => {
    sent.value = false
    problem.value = ''
    pending.value = ops
  }

  const add = item => change([...pending.value, { op: 'add', item }])

  const update = (itemId, item) => {
    const madeBy = addsById(inventory.value, pending.value).get(itemId)
    if (madeBy !== undefined) change(pending.value.map((op, i) => (i === madeBy ? { op: 'add', item } : op)))
    else change([...pending.value, { op: 'update', id: itemId, item }])
  }

  const remove = itemId => {
    const madeBy = addsById(inventory.value, pending.value).get(itemId)
    if (madeBy !== undefined) change(pending.value.filter((_, i) => i !== madeBy))
    else change([...pending.value, { op: 'remove', id: itemId }])
  }

  const undo = index => change(pending.value.filter((_, i) => i !== index))
  const discard = () => change([])

  const send = async () => {
    if (!pending.value.length || sending.value) return
    sending.value = true
    problem.value = ''
    try {
      const res = await fetch('/api/gear/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: id, ops: pending.value })
      })
      const signed = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(signed.error ?? 'Couldn\'t sign the changes')
      const form = await fetch('/', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'form-name': 'gear-edit', list: id, ops: signed.ops, token: signed.token, 'bot-field': '' })
      })
      if (!form.ok) throw new Error('Netlify didn\'t take the changes')
      pending.value = []
      sent.value = true
      editing.value = false
    } catch (error) {
      problem.value = `${error.message}. Your changes are still here; try again.`
    } finally {
      sending.value = false
    }
  }

  return { editing, pending, preview, changes, sending, sent, problem, add, update, remove, undo, discard, send }
}
