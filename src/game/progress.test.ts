import { describe, expect, it } from 'vitest'
import { createFact } from './facts.ts'
import { applyAnswerToFact, applyLevelEndUpdate } from './progress.ts'

function tenths(value: number): number {
  return Math.round(value * 10)
}

describe('end-of-level streak difficulty update', () => {
  it('leaves difficulty unchanged for streak 0 and streak 1', () => {
    const fresh = applyLevelEndUpdate(createFact(8, 7, 0.8))
    expect(tenths(fresh.difficulty)).toBe(8)
    let once = applyAnswerToFact(createFact(3, 4, 0.3), true)
    expect(once.streak).toBe(1)
    expect(once.status).toBe('learning')
    once = applyLevelEndUpdate(once)
    expect(tenths(once.difficulty)).toBe(3)
    expect(once.streak).toBe(1)
  })

  it('decreases difficulty by 0.2 at streak 2 and by 0.3 at streak 3', () => {
    let streakTwo = applyAnswerToFact(createFact(8, 7, 0.8), true)
    streakTwo = applyAnswerToFact(streakTwo, true)
    streakTwo = applyLevelEndUpdate(streakTwo)
    expect(streakTwo.streak).toBe(2)
    expect(tenths(streakTwo.difficulty)).toBe(6)
    expect(streakTwo.moveAppliedForStreak).toBe(2)

    let streakThree = createFact(8, 7, 0.8)
    streakThree = applyAnswerToFact(streakThree, true)
    streakThree = applyAnswerToFact(streakThree, true)
    streakThree = applyAnswerToFact(streakThree, true)
    expect(streakThree.status).toBe('mastered')
    expect(tenths(streakThree.difficulty)).toBe(8)
    streakThree = applyLevelEndUpdate(streakThree)
    expect(tenths(streakThree.difficulty)).toBe(5)
    expect(streakThree.moveAppliedForStreak).toBe(3)
  })

  it('moves a streak of 2 only once while that streak stays 2', () => {
    let fact = applyAnswerToFact(createFact(6, 8, 0.8), true)
    fact = applyAnswerToFact(fact, true)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(6)
    const again = applyLevelEndUpdate(fact)
    expect(tenths(again.difficulty)).toBe(6)
    expect(again.moveAppliedForStreak).toBe(2)
  })

  it('moves a streak of 3 only once while that streak stays 3', () => {
    let fact = createFact(6, 8, 0.8)
    fact = applyAnswerToFact(fact, true)
    fact = applyAnswerToFact(fact, true)
    fact = applyAnswerToFact(fact, true)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(5)
    const again = applyLevelEndUpdate({ ...fact, streak: 3 })
    expect(tenths(again.difficulty)).toBe(5)
    const extraCorrect = applyLevelEndUpdate(applyAnswerToFact(fact, true))
    expect(extraCorrect.streak).toBe(4)
    expect(tenths(extraCorrect.difficulty)).toBe(5)
  })

  it('applies only −0.3 when streak reaches 3 in the same level it passed through 2', () => {
    let fact = createFact(8, 7, 0.8)
    fact = applyAnswerToFact(fact, true)
    fact = applyAnswerToFact(fact, true)
    fact = applyAnswerToFact(fact, true)
    expect(fact.moveAppliedForStreak).toBe(0)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(5)
    expect(fact.moveAppliedForStreak).toBe(3)
  })

  it('applies another −0.3 when a later level reaches streak 3 after a streak-2 move', () => {
    let fact = applyAnswerToFact(createFact(6, 8, 0.8), true)
    fact = applyAnswerToFact(fact, true)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(6)
    fact = applyAnswerToFact(fact, true)
    expect(fact.streak).toBe(3)
    expect(tenths(fact.difficulty)).toBe(6)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(3)
    expect(fact.moveAppliedForStreak).toBe(3)
  })

  it('a single wrong answer does not raise difficulty, and a new streak can move again after a reset', () => {
    let fact = applyAnswerToFact(createFact(6, 8, 0.8), true)
    fact = applyAnswerToFact(fact, true)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(6)

    fact = applyAnswerToFact(fact, false)
    expect(fact.streak).toBe(0)
    expect(fact.wrongStreak).toBe(1)
    expect(fact.status).toBe('learning')
    expect(fact.moveAppliedForStreak).toBe(0)
    expect(tenths(fact.difficulty)).toBe(6)
    expect(tenths(applyLevelEndUpdate(fact).difficulty)).toBe(6)
    expect(fact.wrongCount).toBe(1)

    fact = applyAnswerToFact(fact, true)
    fact = applyAnswerToFact(fact, true)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(4)
    expect(fact.moveAppliedForStreak).toBe(2)
  })

  it('lets a reset streak of 3 move again', () => {
    let fact = applyLevelEndUpdate({
      ...createFact(9, 6, 0.8),
      streak: 3,
      status: 'mastered',
    })
    expect(tenths(fact.difficulty)).toBe(5)
    fact = applyAnswerToFact(fact, false)
    expect(tenths(fact.difficulty)).toBe(5)
    fact = applyAnswerToFact(fact, true)
    fact = applyAnswerToFact(fact, true)
    fact = applyAnswerToFact(fact, true)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(2)
  })

  it('stops a decrease at 0 and keeps the 0.1 grid', () => {
    const low = applyLevelEndUpdate({ ...createFact(2, 3, 0.2), streak: 3, status: 'mastered' })
    expect(low.difficulty).toBe(0)
    const already = applyLevelEndUpdate({ ...createFact(1, 2, 0), streak: 2 })
    expect(already.difficulty).toBe(0)
    let grid = applyAnswerToFact(createFact(3, 6, 0.3), true)
    grid = applyAnswerToFact(grid, true)
    grid = applyLevelEndUpdate(grid)
    expect(grid.difficulty).toBe(0.1)
  })

  it('increases difficulty by 0.2 at wrong streak 2 and by 0.3 at wrong streak 3', () => {
    let streakTwo = applyAnswerToFact(createFact(8, 7, 0.5), false)
    streakTwo = applyAnswerToFact(streakTwo, false)
    expect(tenths(streakTwo.difficulty)).toBe(5)
    streakTwo = applyLevelEndUpdate(streakTwo)
    expect(streakTwo.wrongStreak).toBe(2)
    expect(tenths(streakTwo.difficulty)).toBe(7)
    expect(streakTwo.raiseAppliedForStreak).toBe(2)

    let streakThree = createFact(8, 7, 0.5)
    streakThree = applyAnswerToFact(streakThree, false)
    streakThree = applyAnswerToFact(streakThree, false)
    streakThree = applyAnswerToFact(streakThree, false)
    expect(tenths(streakThree.difficulty)).toBe(5)
    streakThree = applyLevelEndUpdate(streakThree)
    expect(tenths(streakThree.difficulty)).toBe(8)
    expect(streakThree.raiseAppliedForStreak).toBe(3)
  })

  it('raises a wrong streak of 2 only once, then adds 0.3 when a later level reaches 3', () => {
    let fact = applyAnswerToFact(createFact(6, 8, 0.4), false)
    fact = applyAnswerToFact(fact, false)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(6)
    const again = applyLevelEndUpdate(fact)
    expect(tenths(again.difficulty)).toBe(6)
    expect(again.raiseAppliedForStreak).toBe(2)

    fact = applyAnswerToFact(fact, false)
    expect(fact.wrongStreak).toBe(3)
    expect(tenths(fact.difficulty)).toBe(6)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(9)
    expect(fact.raiseAppliedForStreak).toBe(3)
  })

  it('stops an increase at 0.9', () => {
    const high = applyLevelEndUpdate({
      ...createFact(8, 7, 0.8),
      streak: 0,
      wrongStreak: 3,
    })
    expect(high.difficulty).toBe(0.9)
    const capped = applyLevelEndUpdate({
      ...createFact(9, 9, 0.9),
      streak: 0,
      wrongStreak: 2,
    })
    expect(capped.difficulty).toBe(0.9)
  })

  it('clears a wrong streak on a correct answer so the raise can happen again later', () => {
    let fact = applyAnswerToFact(createFact(6, 7, 0.4), false)
    fact = applyAnswerToFact(fact, false)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(6)
    expect(fact.raiseAppliedForStreak).toBe(2)

    fact = applyAnswerToFact(fact, true)
    expect(fact.wrongStreak).toBe(0)
    expect(fact.raiseAppliedForStreak).toBe(0)
    expect(tenths(fact.difficulty)).toBe(6)

    fact = applyAnswerToFact(fact, false)
    fact = applyAnswerToFact(fact, false)
    fact = applyLevelEndUpdate(fact)
    expect(tenths(fact.difficulty)).toBe(8)
    expect(fact.raiseAppliedForStreak).toBe(2)
  })

  it('counts corrects and wrongs without changing difficulty during the answers', () => {
    let fact = createFact(4, 3, 0.3)
    fact = applyAnswerToFact(fact, true)
    fact = applyAnswerToFact(fact, false)
    expect(fact.correctCount).toBe(1)
    expect(fact.wrongCount).toBe(1)
    expect(fact.streak).toBe(0)
    expect(fact.difficulty).toBe(0.3)
  })
})
