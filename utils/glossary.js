// Finds the glossary terms (data/glossary.js) in display text, for <TermText> and for rendered
// markdown (README "Glossary terms"). Only the first use of each term in a piece of text is
// marked, so a paragraph doesn't fill up with underlines.
import { glossary } from '../data/glossary.js'

// Every spelling, longest first so "UNC Charlotte" wins over a shorter overlap
const SPELLINGS = Object.entries(glossary)
  .flatMap(([id, entry]) => [entry.term, ...(entry.aliases ?? [])].map(spelling => ({ spelling, id })))
  .sort((a, b) => b.spelling.length - a.spelling.length)

const isWordChar = ch => Boolean(ch) && /[A-Za-z0-9]/.test(ch)

// Splits text into [{ text }, { text, id }, ...]. Terms match exactly (case matters: "SUP" is
// paddleboarding, "sup" isn't) and as whole words. `seen` (a Set of ids) carries "already marked"
// across several pieces of text that read as one.
export const findTerms = (text, seen = new Set()) => {
  const source = typeof text === 'string' ? text : ''
  const parts = []
  let plain = ''
  let i = 0
  while (i < source.length) {
    const hit = isWordChar(source[i - 1])
      ? null
      : SPELLINGS.find(({ spelling, id }) => !seen.has(id) && source.startsWith(spelling, i) && !isWordChar(source[i + spelling.length]))
    if (hit) {
      if (plain) parts.push({ text: plain })
      parts.push({ text: hit.spelling, id: hit.id })
      seen.add(hit.id)
      plain = ''
      i += hit.spelling.length
    } else {
      plain += source[i]
      i++
    }
  }
  if (plain) parts.push({ text: plain })
  return parts
}
