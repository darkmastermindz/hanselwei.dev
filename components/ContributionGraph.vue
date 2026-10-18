<template>
  <section v-if="weeks.length" class="graph" aria-labelledby="graph-title">
    <h2 id="graph-title" class="graph__title">
      <span class="graph__total">{{ calendar.total.toLocaleString() }}</span> contributions in the last year
    </h2>
    <div class="graph__scroll">
      <div class="graph__body">
        <div class="graph__months" aria-hidden="true">
          <span v-for="(label, w) in months" :key="w" class="graph__month" :style="{ gridColumn: w + 1 }">{{ label }}</span>
        </div>
        <div class="graph__grid" role="img" :aria-label="summary">
          <div v-for="(week, w) in weeks" :key="w" class="graph__week">
            <span
              v-for="day in week"
              :key="day.date"
              class="graph__day"
              :data-level="day.level"
              :title="`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="graph__legend" aria-hidden="true">
      <span>Less</span>
      <span v-for="level in 5" :key="level" class="graph__day" :data-level="level - 1" />
      <span>More</span>
    </div>
  </section>
</template>

<script setup>
// The contribution calendar, built from GitHub at build time (scripts/sync-contributions.mjs)
import calendar from '~/data/contributions.generated.json'

const weeks = computed(() => calendar.weeks ?? [])
const summary = `${calendar.total} contributions in the last year`

// Month label above the first week that starts a month
const months = computed(() => {
  const labels = []
  let last = -1
  weeks.value.forEach(week => {
    const first = week[0]
    if (!first) return labels.push('')
    const month = new Date(`${first.date}T00:00:00Z`).getUTCMonth()
    const startsMonth = month !== last && Number(first.date.slice(8, 10)) <= 7
    labels.push(startsMonth ? new Date(`${first.date}T00:00:00Z`).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) : '')
    if (startsMonth) last = month
  })
  return labels
})
</script>

<style scoped>
.graph {
  --level-0: #2d333b;
  --level-1: #0e4429;
  --level-2: #006d32;
  --level-3: #26a641;
  --level-4: #39d353;
  background: #23262a;
  border: 1px solid #653496;
  border-radius: 0.75rem;
  padding: 1rem;
  margin: 0 0 1.5rem;
  color: #ddd;
}

.graph__title {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.graph__total {
  color: #7cfc00;
  font-weight: 700;
}

.graph__scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.25rem;
}

.graph__body {
  display: inline-grid;
  gap: 0.25rem;
}

.graph__months,
.graph__grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 0.75rem;
  gap: 0.2rem;
  font-size: 0.7rem;
  color: #999;
}

.graph__month {
  white-space: nowrap;
}

.graph__week {
  display: grid;
  gap: 0.2rem;
}

.graph__day {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 2px;
  background: var(--level-0);
}

.graph__day[data-level='1'] { background: var(--level-1); }
.graph__day[data-level='2'] { background: var(--level-2); }
.graph__day[data-level='3'] { background: var(--level-3); }
.graph__day[data-level='4'] { background: var(--level-4); }

.graph__legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: #999;
}
</style>
