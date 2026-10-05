import { describe, expect, it } from 'vitest'
import { applySearchAnswer, createSearch, resolveStartDifficulty } from './search.ts'

function difficulties(state: { difficulty: number }): number {
  return Math.round(state.difficulty * 10)
}

describe('search movement', () => {
  it('raises after the only question at a difficulty is answered correctly', () => {
    const occupied = [0.4, 0.7]
    let state = createSearch(0.4, occupied)
    expect(difficulties(state)).toBe(4)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(7)
    expect(state.correctCount).toBe(0)
  })

  it('lowers after the only question at a difficulty is answered incorrectly', () => {
    const occupied = [0.1, 0.4, 0.8]
    let state = createSearch(0.8, occupied)
    state = applySearchAnswer(state, false, occupied)
    expect(difficulties(state)).toBe(4)
  })

  it('waits for two corrects when more than one fact shares the difficulty', () => {
    const occupied = [0.3, 0.3, 0.5]
    let state = createSearch(0.3, occupied)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(3)
    expect(state.correctCount).toBe(1)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(5)
  })

  it('lowers after two incorrect answers', () => {
    const occupied = [0.2, 0.5, 0.5]
    let state = createSearch(0.5, occupied)
    state = applySearchAnswer(state, false, occupied)
    expect(difficulties(state)).toBe(5)
    state = applySearchAnswer(state, false, occupied)
    expect(difficulties(state)).toBe(2)
  })

  it('leaves the search in place after one correct and one incorrect', () => {
    const occupied = [0.3, 0.3, 0.6]
    let state = createSearch(0.3, occupied)
    state = applySearchAnswer(state, true, occupied)
    state = applySearchAnswer(state, false, occupied)
    expect(difficulties(state)).toBe(3)
    expect(state.correctCount).toBe(1)
    expect(state.wrongCount).toBe(1)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(6)
  })

  it('skips empty difficulties when the search rises', () => {
    const occupied = [0.2, 0.2, 0.5]
    let state = createSearch(0.2, occupied)
    state = applySearchAnswer(state, true, occupied)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(5)
  })

  it('skips an empty gap after a single question is answered correctly', () => {
    const occupied = [0.2, 0.6]
    const state = applySearchAnswer(createSearch(0.2, occupied), true, occupied)
    expect(difficulties(state)).toBe(6)
  })

  it('lowers to the closest difficulty that still has a fact', () => {
    const occupied = [0, 0.4, 0.8]
    const state = applySearchAnswer(createSearch(0.8, occupied), false, occupied)
    expect(difficulties(state)).toBe(4)
  })

  it('stays when an upward scan finds no fact at 0.9 or below', () => {
    const occupied = [0.2, 0.6, 0.6]
    let state = createSearch(0.6, occupied)
    state = applySearchAnswer(state, true, occupied)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(6)
    expect(state.correctCount).toBe(0)
  })

  it('stays at 0.9 when nothing is higher', () => {
    const occupied = [0.9]
    const state = applySearchAnswer(createSearch(0.9, occupied), true, occupied)
    expect(difficulties(state)).toBe(9)
  })

  it('stays when no lower difficulty has a fact', () => {
    const occupied = [0, 0.3]
    const state = applySearchAnswer(createSearch(0, occupied), false, occupied)
    expect(difficulties(state)).toBe(0)
    expect(state.wrongCount).toBe(0)
  })

  it('can lower after a raise is blocked at the top', () => {
    const occupied = [0.4, 0.9, 0.9]
    let state = createSearch(0.9, occupied)
    state = applySearchAnswer(state, true, occupied)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(9)
    state = applySearchAnswer(state, false, occupied)
    expect(difficulties(state)).toBe(9)
    state = applySearchAnswer(state, false, occupied)
    expect(difficulties(state)).toBe(4)
  })

  it('can rise after a drop is blocked at the bottom', () => {
    const occupied = [0, 0.3]
    let state = createSearch(0, occupied)
    state = applySearchAnswer(state, false, occupied)
    expect(difficulties(state)).toBe(0)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(3)
  })

  it('starts the tallies over after the search difficulty changes', () => {
    const occupied = [0.3, 0.3, 0.4, 0.4]
    let state = createSearch(0.3, occupied)
    state = applySearchAnswer(state, true, occupied)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(4)
    expect(state.correctCount).toBe(0)
    state = applySearchAnswer(state, true, occupied)
    expect(difficulties(state)).toBe(4)
    expect(state.correctCount).toBe(1)
  })

  it('uses the level start when that difficulty has a fact', () => {
    expect(difficulties({ difficulty: resolveStartDifficulty(0.5, [0.2, 0.5, 0.8]) })).toBe(5)
  })

  it('scans up from an empty start, then down when nothing is above', () => {
    expect(difficulties({ difficulty: resolveStartDifficulty(0.5, [0.2, 0.8]) })).toBe(8)
    expect(difficulties({ difficulty: resolveStartDifficulty(0.5, [0.1, 0.4]) })).toBe(4)
  })
})
