import { gameConfig, seedDifficulty } from '../config/gameConfig.ts'

export type FactStatus = 'unseen' | 'learning' | 'mastered'

export interface Fact {
  a: number
  b: number
  difficulty: number
  streak: number
  status: FactStatus
  correctCount: number
  wrongCount: number
  /** Consecutive wrong answers. A correct answer clears it. */
  wrongStreak: number
  /** Streak milestone already used for a difficulty drop this run: 0, 2, or 3. */
  moveAppliedForStreak: number
  /** Wrong-streak milestone already used for a difficulty raise this run: 0, 2, or 3. */
  raiseAppliedForStreak: number
}

export function factKey(a: number, b: number): string {
  return `${a}x${b}`
}

export function createFact(a: number, b: number, difficulty = seedDifficulty(a, b)): Fact {
  return {
    a,
    b,
    difficulty,
    streak: 0,
    status: 'unseen',
    correctCount: 0,
    wrongCount: 0,
    wrongStreak: 0,
    moveAppliedForStreak: 0,
    raiseAppliedForStreak: 0,
  }
}

export function createSeedFacts(): Fact[] {
  const facts: Fact[] = []
  const { min, max } = gameConfig.factors
  for (let a = min; a <= max; a += 1) {
    for (let b = min; b <= max; b += 1) {
      facts.push(createFact(a, b))
    }
  }
  return facts
}
