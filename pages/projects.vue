<template>
  <main class="page">
    <h1 class="page-title text-[#00b8ff]">GitHub Projects</h1>

    <ContributionGraph />

    <form class="toolbar" role="search" @submit.prevent>
      <label class="toolbar__search">
        <span class="visually-hidden">Search projects</span>
        <input
          v-model="query"
          type="search"
          placeholder="Search name, topic or language"
          autocomplete="off"
          spellcheck="false"
          @keydown.esc="query = ''"
        />
      </label>
      <label class="toolbar__sort">
        <span>Sort</span>
        <select v-model="sort">
          <option value="updated">Recently updated</option>
          <option value="stars">Most stars</option>
          <option value="name">Name</option>
          <option value="featured">Featured first</option>
        </select>
      </label>
    </form>

    <div class="chips" role="group" aria-label="Filter projects">
      <button
        v-for="chip in CHIPS"
        :key="chip.id"
        type="button"
        class="chip"
        :class="{ 'is-on': filter === chip.id }"
        :aria-pressed="filter === chip.id ? 'true' : 'false'"
        @click="store.setFilter(chip.id)"
      >
        {{ chip.label }} <span class="chip__count">{{ counts[chip.id] }}</span>
      </button>
    </div>

    <div v-if="tags.length" class="tags" role="group" aria-label="Filter by tag">
      <button
        v-for="t in tags"
        :key="t"
        type="button"
        class="tag"
        :class="{ 'is-on': tag === t }"
        :aria-pressed="tag === t ? 'true' : 'false'"
        @click="store.setTag(tag === t ? null : t)"
      >
        {{ tagLabel(t) }}
      </button>
    </div>

    <p class="results" aria-live="polite">{{ resultText }}</p>

    <div class="projects">
      <article v-for="project in visible" :key="project.id" class="project">
        <span class="badge" :data-category="project.category">{{ LABELS[project.category] }}</span>
        <h2>
          <a target="_blank" rel="noopener" :href="project.html_url">{{ project.name }}</a>
        </h2>
        <p class="meta">
          <span class="stars">🌟 {{ project.stargazers_count }}</span>
          <span v-if="project.language">· {{ project.language }}</span>
        </p>
        <p v-if="project.description">{{ project.description }}</p>
        <ul v-if="project.tags.length" class="topics" aria-label="Tags">
          <li v-for="t in project.tags" :key="t">{{ tagLabel(t) }}</li>
        </ul>
        <a v-if="project.homepage" class="homepage" :href="project.homepage" target="_blank" rel="noopener">
          {{ project.homepage }}
        </a>
      </article>
    </div>

    <p v-if="loaded && githubProjects.length && !visible.length" class="empty">
      No projects match.
      <button type="button" class="link" @click="reset">Clear search and filters</button>
    </p>
  </main>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '~/stores/projects'
import { tagLabel } from '~/utils/projects.mjs'

useHead({ title: 'Projects · hanselwei.dev' })

const CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'wip', label: 'Work in progress' },
  { id: 'fork', label: 'Forks' }
]
const LABELS = { active: 'Active', wip: 'Work in progress', fork: 'Fork' }

const store = useProjectsStore()
await callOnce(() => store.fetchGithubProjects())

const { githubProjects, filter, tag, query, sort, loaded, counts, visible, tags } = storeToRefs(store)

const resultText = computed(() => {
  if (!loaded.value) return 'Loading projects…'
  const shown = visible.value.length
  return shown === githubProjects.value.length ? `${shown} projects` : `${shown} of ${githubProjects.value.length} projects`
})

const reset = () => {
  query.value = ''
  store.setFilter('all')
  store.setTag(null)
}
</script>

<style lang="scss" scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.toolbar__search {
  flex: 1 1 16rem;
  min-width: 0;

  input {
    width: 100%;
    min-height: 44px;
    padding: 0.5rem 0.85rem;
    border-radius: 0.5rem;
    border: 1px solid #653496;
    background: #23262a;
    color: #eee;
    font-size: 1rem;

    &:focus-visible {
      outline: 2px solid #7cfc00;
      outline-offset: 2px;
    }
  }
}

.toolbar__sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #bbb;
  font-size: 0.9rem;

  select {
    min-height: 44px;
    padding: 0.4rem 0.6rem;
    border-radius: 0.5rem;
    background: #23262a;
    color: #eee;
    border: 1px solid #653496;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag {
  min-height: 36px;
  padding: 0.2rem 0.8rem;
  border-radius: 9999px;
  border: 1px solid #3f3f46;
  background: transparent;
  color: #bbb;
  font-size: 0.85rem;

  &.is-on {
    background: #7cfc00;
    color: #111;
    border-color: #7cfc00;
  }

  &:focus-visible {
    outline: 2px solid #7cfc00;
    outline-offset: 2px;
  }
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.chip {
  min-height: 44px;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid #653496;
  background: transparent;
  color: #ddd;
  font-size: 0.9rem;

  &.is-on {
    background: #653496;
    color: #fff;
    border-color: #a78bfa;
  }

  &:focus-visible {
    outline: 2px solid #7cfc00;
    outline-offset: 2px;
  }
}

.chip__count {
  margin-left: 0.25rem;
  color: #aaa;
  font-variant-numeric: tabular-nums;
}

.results {
  color: #999;
  font-size: 0.85rem;
  margin: 0.25rem 0 1rem;
}

.projects {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
}

.project {
  position: relative;
  background: #eee;
  color: #171515;
  padding: 1.25rem;
  border-radius: 0.5rem;
  overflow-wrap: anywhere;

  h2 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: #7e22ce;

    a {
      color: inherit;
      text-decoration: none;
    }
    a:hover {
      color: #16a34a;
    }
  }

  p {
    margin-top: 0.4rem;
  }
}

.badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  margin-bottom: 0.4rem;
  background: #d1d5db;
  color: #111;

  &[data-category='active'] {
    background: #bbf7d0;
    color: #14532d;
  }
  &[data-category='wip'] {
    background: #fde68a;
    color: #78350f;
  }
  &[data-category='fork'] {
    background: #bfdbfe;
    color: #1e3a8a;
  }
}

.topics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
  list-style: none;
  padding: 0;

  li {
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
    border-radius: 9999px;
    background: #ddd6fe;
    color: #4c1d95;
  }
}

.meta {
  font-size: 0.9rem;
  color: #555;
}

.stars {
  color: orangered;
}

.homepage {
  display: inline-block;
  margin-top: 0.5rem;
  color: #0369a1;
  font-size: 0.9rem;
}

.empty {
  margin-top: 1.5rem;
  color: #bbb;
}

.link {
  color: #7cfc00;
  text-decoration: underline;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
</style>
