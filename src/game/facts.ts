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
  /** Durations of the last submitted answers, oldest first. Used for the rolling average. */
  recentAttemptMs: number[]
  /** Mean of `recentAttemptMs`, or null when this fact has no timed answers. */
  averageAttemptMs: number | null
  /** Answer durations whose difficulty move has not been applied yet. Cleared when a level finishes. */
  pendingAttemptMs: number[]
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
    recentAttemptMs: [],
    averageAttemptMs: null,
    pendingAttemptMs: [],
  }
}

export function meanAttemptMs(times: readonly number[]): number | null {
  if (times.length === 0) return null
  return times.reduce((sum, ms) => sum + ms, 0) / times.length
}

/** Keeps finite, non-negative durations. */
export function sanitizeAttemptMs(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const times: number[] = []
  for (const item of value) {
    if (typeof item === 'number' && Number.isFinite(item) && item >= 0) times.push(item)
  }
  return times
}

/** Keeps finite, non-negative durations and only the most recent configured attempts. */
export function normalizeAttemptMs(value: unknown): number[] {
  return sanitizeAttemptMs(value).slice(-gameConfig.answerTiming.recentAttempts)
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
