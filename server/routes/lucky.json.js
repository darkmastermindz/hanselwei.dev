// /lucky.json: everything I'm Feeling Lucky can land on (utils/lucky.mjs), prerendered with the
// site. Built from the data alone: the blog posts, the home page facts and the glossary, never
// from the components that show them. luckyPool() leaves out anything that doesn't look right,
// and the blog, read from storage, sits the draw out if it can't be read.
import { hobbyFacts } from '~/data/hobbyFacts.mjs'
import { glossary } from '~/data/glossary.js'
import { luckyPool } from '~/utils/lucky.mjs'

export default defineEventHandler(async event => {
  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  const posts = await getPosts().catch(() => [])
  return luckyPool({ posts, facts: hobbyFacts, glossary })
})
