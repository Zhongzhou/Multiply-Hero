import { describe, expect, it } from 'vitest'
import { gameConfig, seedDifficulty } from '../config/gameConfig.ts'
import { createSeedFacts, factKey } from './facts.ts'
import { toStepIndex } from './difficulty.ts'

describe('seed guess', () => {
  it('stores the editable level and streak defaults', () => {
    expect(gameConfig.levels.easy.startDifficulty).toBe(0)
    expect(gameConfig.levels.medium.startDifficulty).toBe(0.3)
    expect(gameConfig.levels.hard.startDifficulty).toBe(0.5)
    expect(gameConfig.levels.easy.avatarHp).toBe(6)
    expect(gameConfig.levels.easy.bossHp).toBe(4)
    expect(gameConfig.levels.medium.avatarHp).toBe(5)
    expect(gameConfig.levels.medium.bossHp).toBe(6)
    expect(gameConfig.levels.hard.avatarHp).toBe(4)
    expect(gameConfig.levels.hard.bossHp).toBe(8)
    expect(gameConfig.streakDifficultyDelta[1]).toBe(0)
    expect(gameConfig.streakDifficultyDelta[2]).toBe(-0.2)
    expect(gameConfig.streakDifficultyDelta[3]).toBe(-0.3)
    expect(gameConfig.wrongStreakDifficultyDelta[1]).toBe(0)
    expect(gameConfig.wrongStreakDifficultyDelta[2]).toBe(0.2)
    expect(gameConfig.wrongStreakDifficultyDelta[3]).toBe(0.3)
  })

  it('follows the seed guess, with 8×7 at 0.8 and separate 3×4 and 4×3 facts', () => {
    const facts = createSeedFacts()
    expect(facts).toHaveLength(81)
    expect(seedDifficulty(8, 7)).toBe(0.8)
    expect(seedDifficulty(1, 1)).toBe(0)
    expect(seedDifficulty(1, 8)).toBe(0)
    expect(seedDifficulty(2, 2)).toBe(0)
    expect(seedDifficulty(3, 3)).toBe(0.3)
    expect(seedDifficulty(4, 4)).toBe(0.3)
    expect(seedDifficulty(5, 5)).toBe(0.3)
    expect(seedDifficulty(9, 9)).toBe(0.5)
    expect(seedDifficulty(2, 8)).toBe(0.1)
    expect(seedDifficulty(6, 4)).toBe(0.3)
    expect(seedDifficulty(6, 8)).toBe(0.8)

    const threeFour = facts.find((fact) => fact.a === 3 && fact.b === 4)
    const fourThree = facts.find((fact) => fact.a === 4 && fact.b === 3)
    expect(threeFour).toBeDefined()
    expect(fourThree).toBeDefined()
    expect(factKey(3, 4)).not.toBe(factKey(4, 3))
    expect(threeFour?.difficulty).toBe(0.3)
    expect(fourThree?.difficulty).toBe(0.3)
    expect(facts.some((fact) => toStepIndex(fact.difficulty) === 9)).toBe(false)
  })

  it('fills the 0.1 grid from the seed rules', () => {
    const counts = new Map<number, number>()
    for (const fact of createSeedFacts()) {
      const step = toStepIndex(fact.difficulty)
      counts.set(step, (counts.get(step) ?? 0) + 1)
    }
    expect(counts.get(0)).toBe(18)
    expect(counts.get(1)).toBe(14)
    expect(counts.get(3)).toBe(33)
    expect(counts.get(5)).toBe(4)
    expect(counts.get(8)).toBe(12)
  })
})
