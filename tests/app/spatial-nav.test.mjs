// Arrow keys and the D-pad move focus to the nearest control in that direction.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickNext } from '../../utils/spatialNav.js'

const box = (left, top, width = 100, height = 40) => ({ left, top, right: left + width, bottom: top + height })

// A nav row on top, a wide button, then a 2-column grid
const nav = [box(0, 0), box(120, 0), box(240, 0)]
const wide = box(0, 100, 340)
const grid = [box(0, 200, 160), box(180, 200, 160), box(0, 260, 160), box(180, 260, 160)]
const all = [...nav, wide, ...grid]

test('left and right move along a row', () => {
  assert.equal(pickNext(nav[1], all, 'right'), 2)
  assert.equal(pickNext(nav[1], all, 'left'), 0)
})

test('up and down move between rows, staying in the column', () => {
  assert.equal(pickNext(nav[0], all, 'down'), 3) // the wide button below
  assert.equal(pickNext(wide, all, 'down'), 4) // nearest of the grid's top row
  assert.equal(pickNext(grid[1], all, 'down'), 7) // straight down, not diagonally
  assert.equal(pickNext(grid[3], all, 'up'), 5)
  assert.equal(pickNext(grid[2], all, 'up'), 4)
})

test('nothing past the edge returns -1, so the page can scroll instead', () => {
  assert.equal(pickNext(nav[2], all, 'right'), -1)
  assert.equal(pickNext(nav[0], all, 'up'), -1)
  assert.equal(pickNext(grid[3], all, 'down'), -1)
})

test('a neighbour in the same row is not "down", and the current control is never picked', () => {
  const row = [box(0, 0), box(120, 3)] // a few pixels lower, same row
  assert.equal(pickNext(row[0], row, 'down'), -1)
  assert.equal(pickNext(row[0], row, 'right'), 1)
  assert.equal(pickNext(nav[1], [nav[1]], 'right'), -1)
})

test('left and right stay in the row instead of jumping to another one', () => {
  const panel = box(400, 200, 500, 300)
  const navLink = box(300, 0) // up and to the left
  assert.equal(pickNext(panel, [navLink], 'left'), -1)
  assert.equal(pickNext(panel, [navLink], 'up'), 0)
})

test('down from a nav link reaches the nearest control below, even off to the side', () => {
  const link = box(130, 8, 133, 48)
  const token = box(525, 88, 230, 230) // just below, centred on the page
  const tab = box(339, 508, 83, 36) // far below, a little closer sideways
  assert.equal(pickNext(link, [tab, token], 'down'), 1)
})
