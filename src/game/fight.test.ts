import { describe, expect, it } from 'vitest'
import { gameConfig } from '../config/gameConfig.ts'
import { createFact } from './facts.ts'
import { commitAnswer, pickFact, startFight } from './fight.ts'
import { toStepIndex } from './difficulty.ts'

const zero = () => 0

describe('fight difficulty timing', () => {
  it('keeps difficulty frozen during a win, and does not build a streak from consecutive repeats', () => {
    let state = startFight('easy', [createFact(8, 7, 0.8)], zero)
    expect(toStepIndex(state.search.difficulty)).toBe(8)
    expect(state.question).toMatchObject({ a: 8, b: 7 })
    expect(state.bossHp).toBe(gameConfig.levels.easy.bossHp)

    for (let hit = 0; hit < 3; hit += 1) {
      const step = commitAnswer(state, '56', zero)
      expect(step.correct).toBe(true)
      state = step.state
      expect(state.over).toBe(false)
      expect(toStepIndex(state.facts[0]!.difficulty)).toBe(8)
      expect(state.facts[0]!.streak).toBe(1)
      expect(state.facts[0]!.correctCount).toBe(1)
    }

    const last = commitAnswer(state, '56', zero)
    expect(last.state.outcome).toBe('win')
    expect(last.state.bossHp).toBe(0)
    expect(last.state.facts[0]!.streak).toBe(1)
    expect(toStepIndex(last.state.facts[0]!.difficulty)).toBe(8)
  })

  it('applies the streak-3 move once when the same fact is answered with other facts in between', () => {
    const facts = [createFact(6, 7, 0.8), createFact(6, 8, 0.8)]
    let state = startFight('hard', facts, zero)
    expect(state.question).toMatchObject({ a: 6, b: 7 })

    for (let hit = 0; hit < gameConfig.levels.hard.bossHp - 1; hit += 1) {
      const step = commitAnswer(state, String(state.question.a * state.question.b), zero)
      state = step.state
      expect(state.over).toBe(false)
      for (const fact of state.facts) expect(toStepIndex(fact.difficulty)).toBe(8)
    }

    const last = commitAnswer(state, String(state.question.a * state.question.b), zero)
    expect(last.state.outcome).toBe('win')
    for (const fact of last.state.facts) {
      expect(fact.streak).toBe(4)
      expect(toStepIndex(fact.difficulty)).toBe(5)
      expect(fact.moveAppliedForStreak).toBe(3)
    }
  })

  it('keeps difficulty frozen through a loss, and ignores consecutive misses of the only fact', () => {
    let state = startFight('hard', [createFact(6, 7, 0.8)], zero)
    expect(toStepIndex(state.search.difficulty)).toBe(8)
    const hits = gameConfig.levels.hard.avatarHp
    for (let hit = 0; hit < hits - 1; hit += 1) {
      const step = commitAnswer(state, '0', zero)
      expect(step.correct).toBe(false)
      state = step.state
      expect(state.over).toBe(false)
      expect(state.facts[0]!.streak).toBe(0)
      expect(state.facts[0]!.wrongStreak).toBe(1)
      expect(toStepIndex(state.facts[0]!.difficulty)).toBe(8)
    }
    const last = commitAnswer(state, '0', zero)
    expect(last.state.outcome).toBe('lose')
    expect(last.state.avatarHp).toBe(0)
    expect(last.state.facts[0]!.wrongStreak).toBe(1)
    expect(last.state.facts[0]!.wrongCount).toBe(1)
    expect(toStepIndex(last.state.facts[0]!.difficulty)).toBe(8)
    expect(last.state.facts[0]!.raiseAppliedForStreak).toBe(0)
  })

  it('raises both facts for a miss streak of 3 when the misses are not consecutive', () => {
    const facts = [createFact(6, 7, 0.2), createFact(6, 8, 0.2)]
    let state = startFight('easy', facts, zero)
    const hits = gameConfig.levels.easy.avatarHp
    for (let hit = 0; hit < hits; hit += 1) {
      const step = commitAnswer(state, '0', zero)
      state = step.state
    }
    expect(state.outcome).toBe('lose')
    for (const fact of state.facts) {
      expect(fact.wrongStreak).toBe(3)
      expect(toStepIndex(fact.difficulty)).toBe(5)
      expect(fact.raiseAppliedForStreak).toBe(3)
    }
  })

  it('moves the search with frozen difficulties and leaves an unasked fact alone', () => {
    const facts = [createFact(6, 7, 0.8), createFact(6, 8, 0.8), createFact(6, 9, 0.8)]
    let state = startFight('easy', facts, zero)
    expect(state.question).toMatchObject({ a: 6, b: 7 })

    for (let hit = 0; hit < 3; hit += 1) {
      const step = commitAnswer(state, String(state.question.a * state.question.b), zero)
      state = step.state
      expect(state.over).toBe(false)
      for (const fact of state.facts) expect(toStepIndex(fact.difficulty)).toBe(8)
    }

    const last = commitAnswer(state, String(state.question.a * state.question.b), zero)
    expect(last.state.outcome).toBe('win')
    const untouched = last.state.facts.find((fact) => fact.a === 6 && fact.b === 9)
    const practiced = last.state.facts.find((fact) => fact.a === 6 && fact.b === 7)
    expect(untouched?.streak).toBe(0)
    expect(toStepIndex(untouched!.difficulty)).toBe(8)
    expect(practiced?.streak).toBe(2)
    expect(toStepIndex(practiced!.difficulty)).toBe(6)
  })

  it('raises the search after two answers when the start difficulty has one fact', () => {
    const state = startFight('hard', [createFact(2, 2, 0.5), createFact(8, 7, 0.8)], zero)
    expect(state.question).toMatchObject({ a: 2, b: 2 })
    const first = commitAnswer(state, '4', zero)
    expect(toStepIndex(first.state.search.difficulty)).toBe(5)
    expect(first.state.search.correctCount).toBe(1)
    expect(first.state.question).toMatchObject({ a: 2, b: 2 })
    expect(toStepIndex(first.state.facts.find((fact) => fact.a === 2)!.difficulty)).toBe(5)
    const second = commitAnswer(first.state, '4', zero)
    expect(toStepIndex(second.state.search.difficulty)).toBe(8)
    expect(second.state.question).toMatchObject({ a: 8, b: 7 })
    expect(second.state.facts.find((fact) => fact.a === 2)!.streak).toBe(1)
    expect(second.state.facts.find((fact) => fact.a === 2)!.correctCount).toBe(1)
  })

  it('starts on the nearer lower difficulty when the level start is empty', () => {
    const state = startFight('medium', [createFact(2, 3, 0.2), createFact(8, 7, 0.8)], zero)
    expect(toStepIndex(state.search.difficulty)).toBe(2)
    expect(state.question).toMatchObject({ a: 2, b: 3 })
  })

  it('does not draw a question from another difficulty when the search step is empty', () => {
    expect(() => pickFact([createFact(1, 1, 0)], 0.5, undefined, zero)).toThrow(
      /No multiplication facts are available/,
    )
  })

  it('records the first fast answer and ignores consecutive repeats of that fact', () => {
    let state = startFight('easy', [createFact(8, 7, 0.8)], zero)
    for (let hit = 0; hit < 3; hit += 1) {
      const step = commitAnswer(state, '56', zero, 1000)
      expect(step.state.over).toBe(false)
      expect(toStepIndex(step.state.facts[0]!.difficulty)).toBe(8)
      expect(step.state.facts[0]!.streak).toBe(1)
      expect(step.state.facts[0]!.recentAttemptMs).toEqual([1000])
      expect(step.state.facts[0]!.pendingAttemptMs).toEqual([1000])
      state = step.state
    }

    const last = commitAnswer(state, '56', zero, 9000)
    expect(last.state.outcome).toBe('win')
    expect(last.state.facts[0]!.streak).toBe(1)
    expect(toStepIndex(last.state.facts[0]!.difficulty)).toBe(7)
    expect(last.state.facts[0]!.pendingAttemptMs).toEqual([])
    expect(last.state.facts[0]!.recentAttemptMs).toEqual([1000])
    expect(last.state.facts[0]!.averageAttemptMs).toBe(1000)
  })

  it('keeps the streak and the average when the repeated fact is answered wrong', () => {
    const first = commitAnswer(startFight('easy', [createFact(8, 7, 0.8)], zero), '56', zero, 1000)
    const repeat = commitAnswer(first.state, '0', zero, 12000)
    expect(repeat.correct).toBe(false)
    expect(repeat.state.avatarHp).toBe(first.state.avatarHp - 1)
    expect(repeat.state.facts[0]).toMatchObject({
      streak: 1,
      wrongStreak: 0,
      correctCount: 1,
      wrongCount: 0,
      recentAttemptMs: [1000],
      averageAttemptMs: 1000,
      pendingAttemptMs: [1000],
    })
  })

  it('records the fact again after a different fact is asked', () => {
    let state = startFight('easy', [createFact(6, 7, 0.8), createFact(8, 7, 0.8)], zero)
    expect(state.question).toMatchObject({ a: 6, b: 7 })
    state = commitAnswer(state, '42', zero, 1000).state
    expect(state.question).toMatchObject({ a: 8, b: 7 })
    state = commitAnswer(state, '56', zero, 2000).state
    expect(state.question).toMatchObject({ a: 6, b: 7 })
    state = commitAnswer(state, '42', zero, 4000).state

    const practiced = state.facts.find((fact) => fact.a === 6 && fact.b === 7)
    expect(practiced).toMatchObject({
      streak: 2,
      correctCount: 2,
      recentAttemptMs: [1000, 4000],
      averageAttemptMs: 2500,
    })
  })

  it('applies a fast answer from an unfinished fight when a later level finishes, and does not apply it twice', () => {
    const left = commitAnswer(startFight('easy', [createFact(8, 7, 0.8)], zero), '56', zero, 1000)
    expect(left.state.over).toBe(false)
    expect(toStepIndex(left.state.facts[0]!.difficulty)).toBe(8)
    expect(left.state.facts[0]!.pendingAttemptMs).toEqual([1000])

    let state = startFight('easy', left.state.facts, zero)
    for (let hit = 0; hit < 3; hit += 1) {
      state = commitAnswer(state, '56', zero, 5000).state
      expect(state.over).toBe(false)
      expect(toStepIndex(state.facts[0]!.difficulty)).toBe(8)
    }
    const finished = commitAnswer(state, '56', zero, 5000)
    expect(finished.state.outcome).toBe('win')
    expect(finished.state.facts[0]!.streak).toBe(2)
    expect(toStepIndex(finished.state.facts[0]!.difficulty)).toBe(5)
    expect(finished.state.facts[0]!.pendingAttemptMs).toEqual([])
    expect(finished.state.facts[0]!.recentAttemptMs).toEqual([1000, 5000])

    let again = startFight('easy', finished.state.facts, zero)
    for (let hit = 0; hit < 4; hit += 1) {
      again = commitAnswer(again, '56', zero, 5000).state
    }
    expect(again.outcome).toBe('win')
    expect(again.facts[0]!.streak).toBe(3)
    expect(toStepIndex(again.facts[0]!.difficulty)).toBe(2)
  })

  it('raises difficulty for slow misses that are separated by another fact', () => {
    const facts = [createFact(6, 7, 0.2), createFact(6, 8, 0.2)]
    let state = startFight('easy', facts, zero)
    for (let hit = 0; hit < gameConfig.levels.easy.avatarHp; hit += 1) {
      state = commitAnswer(state, '0', zero, 11000).state
    }
    expect(state.outcome).toBe('lose')
    for (const fact of state.facts) {
      expect(fact.wrongStreak).toBe(3)
      expect(toStepIndex(fact.difficulty)).toBe(8)
      expect(fact.recentAttemptMs).toEqual([11000, 11000, 11000])
      expect(fact.averageAttemptMs).toBe(11000)
      expect(fact.pendingAttemptMs).toEqual([])
    }
  })

  it('does not record a time when the submission is rejected', () => {
    const state = startFight('easy', [createFact(8, 7, 0.8)], zero)
    const step = commitAnswer(state, 'no', zero, 1000)
    expect(step.accepted).toBe(false)
    expect(state.facts[0]!.recentAttemptMs).toEqual([])
    expect(state.facts[0]!.averageAttemptMs).toBeNull()
  })
})
