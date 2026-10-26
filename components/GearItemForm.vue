<template>
  <!-- One gear item's fields, for the owner's editor on /gear/[list] (README "Editing gear lists") -->
  <form class="gear-form" @submit.prevent="save">
    <label class="gear-form__field gear-form__field--wide">
      <span>Name</span>
      <input ref="nameInput" v-model="draft.name" class="input input-bordered input-sm" required :maxlength="LIMITS.name" />
    </label>
    <label class="gear-form__field">
      <span>Brand</span>
      <input v-model="draft.brand" class="input input-bordered input-sm" :maxlength="LIMITS.brand" />
    </label>
    <label class="gear-form__field gear-form__field--qty">
      <span>Quantity</span>
      <input v-model.number="draft.qty" type="number" class="input input-bordered input-sm" min="0" :max="LIMITS.qty" step="1" required />
    </label>
    <label class="gear-form__field">
      <span>Section</span>
      <input v-model="draft.section" class="input input-bordered input-sm" :list="`${uid}-sections`" required :maxlength="LIMITS.section" />
      <datalist :id="`${uid}-sections`">
        <option v-for="name in sections" :key="name" :value="name" />
      </datalist>
    </label>
    <label class="gear-form__field">
      <span>Category</span>
      <input v-model="draft.category" class="input input-bordered input-sm" :list="`${uid}-categories`" required :maxlength="LIMITS.category" />
      <datalist :id="`${uid}-categories`">
        <option v-for="name in categories" :key="name" :value="name" />
      </datalist>
    </label>
    <label class="gear-form__field">
      <span>Status</span>
      <select v-model="draft.status" class="select select-bordered select-sm">
        <option v-for="key in STATUSES" :key="key" :value="key">{{ statuses[key].emoji }} {{ statuses[key].label }}</option>
      </select>
    </label>
    <label class="gear-form__field gear-form__field--wide">
      <span>Tags <small>(separated by commas)</small></span>
      <input v-model="draft.tags" class="input input-bordered input-sm" :list="`${uid}-tags`" placeholder="Belay, Sport" />
      <datalist :id="`${uid}-tags`">
        <option v-for="tag in tags" :key="tag" :value="tag" />
      </datalist>
    </label>
    <label class="gear-form__field gear-form__field--wide">
      <span>Notes</span>
      <textarea v-model="draft.notes" class="textarea textarea-bordered textarea-sm" rows="2" :maxlength="LIMITS.notes" />
    </label>
    <p v-if="problem" class="gear-form__problem" role="alert">{{ problem }}</p>
    <div class="gear-form__buttons">
      <button type="submit" class="btn btn-sm btn-success">{{ item ? 'Save change' : 'Add item' }}</button>
      <button type="button" class="btn btn-sm btn-ghost" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<script setup>
import { cleanItem, LIMITS, STATUSES } from '~/utils/gearEdits.mjs'
import { statuses } from '~/data/inventory.mjs'

// `item`: the item to change (null to add one); `defaults`: section and category for a new one
const props = defineProps({
  item: { type: Object, default: null },
  defaults: { type: Object, default: () => ({}) },
  sections: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] }
})
const emit = defineEmits(['save', 'cancel'])

const uid = useId()
const nameInput = ref(null)
const problem = ref('')
const start = props.item ?? props.defaults
const draft = reactive({
  name: start.name ?? '',
  brand: start.brand ?? '',
  qty: start.qty ?? 1,
  section: start.section ?? '',
  category: start.category ?? '',
  status: start.status ?? 'owned',
  tags: (start.tags ?? []).join(', '),
  notes: start.notes ?? ''
})

onMounted(() => nameInput.value?.focus())

const save = () => {
  const item = cleanItem({ ...draft, tags: draft.tags.split(',') })
  if (!item) {
    problem.value = 'An item needs a name, a section and a category.'
    return
  }
  emit('save', item)
}
</script>

<style scoped>
.gear-form {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.6rem 0.9rem;
  margin: 0.5rem 0;
  padding: 0.9rem;
  background: #1d232a;
  color: #eee;
  border: 1px solid #41b883;
}

.gear-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
}

.gear-form__field--wide {
  grid-column: 1 / -1;
}

.gear-form__field small {
  color: #cbd5e1;
}

.gear-form__problem {
  grid-column: 1 / -1;
  color: #fca5a5;
  font-size: 0.85rem;
}

.gear-form__buttons {
  grid-column: 1 / -1;
  display: flex;
  gap: 0.5rem;
}
</style>
