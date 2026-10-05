import { describe, expect, it } from 'vitest'
import { gameConfig } from '../config/gameConfig.ts'
import { createFact } from './facts.ts'
import { commitAnswer, startFight } from './fight.ts'
import { toStepIndex } from './difficulty.ts'

const zero = () => 0

describe('fight difficulty timing', () => {
  it('keeps difficulties frozen until boss HP hits 0, then applies the streak-3 move once', () => {
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
      expect(state.facts[0]!.streak).toBe(hit + 1)
    }

    const last = commitAnswer(state, '56', zero)
    expect(last.state.outcome).toBe('win')
    expect(last.state.bossHp).toBe(0)
    expect(last.state.facts[0]!.streak).toBe(4)
    expect(toStepIndex(last.state.facts[0]!.difficulty)).toBe(5)
  })

  it('does not change difficulty when the avatar reaches 0 on wrong answers', () => {
    let state = startFight('hard', [createFact(6, 7, 0.8)], zero)
    expect(toStepIndex(state.search.difficulty)).toBe(8)
    const hits = gameConfig.levels.hard.avatarHp
    for (let hit = 0; hit < hits - 1; hit += 1) {
      const step = commitAnswer(state, '0', zero)
      expect(step.correct).toBe(false)
      state = step.state
      expect(state.over).toBe(false)
      expect(state.facts[0]!.streak).toBe(0)
      expect(toStepIndex(state.facts[0]!.difficulty)).toBe(8)
    }
    const last = commitAnswer(state, '0', zero)
    expect(last.state.outcome).toBe('lose')
    expect(last.state.avatarHp).toBe(0)
    expect(toStepIndex(last.state.facts[0]!.difficulty)).toBe(8)
    expect(last.state.facts[0]!.moveAppliedForStreak).toBe(0)
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

  it('raises the search after the only fact at the start difficulty is answered', () => {
    const state = startFight('hard', [createFact(2, 2, 0.5), createFact(8, 7, 0.8)], zero)
    expect(state.question).toMatchObject({ a: 2, b: 2 })
    const step = commitAnswer(state, '4', zero)
    expect(toStepIndex(step.state.search.difficulty)).toBe(8)
    expect(step.state.question).toMatchObject({ a: 8, b: 7 })
    expect(toStepIndex(step.state.facts.find((fact) => fact.a === 2)!.difficulty)).toBe(5)
    expect(step.state.facts.find((fact) => fact.a === 2)!.streak).toBe(1)
  })
})
