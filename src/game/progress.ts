import { gameConfig } from '../config/gameConfig.ts'
import { clampDifficulty } from './difficulty.ts'
import { meanAttemptMs, normalizeAttemptMs, type Fact } from './facts.ts'

export function applyAnswerToFact(fact: Fact, correct: boolean): Fact {
  if (correct) {
    const streak = fact.streak + 1
    return {
      ...fact,
      streak,
      wrongStreak: 0,
      status: streak >= gameConfig.masteredStreak ? 'mastered' : 'learning',
      correctCount: fact.correctCount + 1,
      raiseAppliedForStreak: 0,
    }
  }
  return {
    ...fact,
    streak: 0,
    wrongStreak: fact.wrongStreak + 1,
    status: 'learning',
    wrongCount: fact.wrongCount + 1,
    moveAppliedForStreak: 0,
  }
}

function applyCorrectStreakUpdate(fact: Fact): Fact {
  const deltas = gameConfig.streakDifficultyDelta
  if (fact.streak >= 3) {
    if (fact.moveAppliedForStreak >= 3) return fact
    return {
      ...fact,
      difficulty: clampDifficulty(fact.difficulty + deltas[3]),
      moveAppliedForStreak: 3,
    }
  }
  if (fact.streak === 2) {
    if (fact.moveAppliedForStreak >= 2) return fact
    return {
      ...fact,
      difficulty: clampDifficulty(fact.difficulty + deltas[2]),
      moveAppliedForStreak: 2,
    }
  }
  if (fact.streak === 1 && deltas[1] !== 0) {
    return {
      ...fact,
      difficulty: clampDifficulty(fact.difficulty + deltas[1]),
    }
  }
  return fact
}

function applyWrongStreakUpdate(fact: Fact): Fact {
  const deltas = gameConfig.wrongStreakDifficultyDelta
  if (fact.wrongStreak >= 3) {
    if (fact.raiseAppliedForStreak >= 3) return fact
    return {
      ...fact,
      difficulty: clampDifficulty(fact.difficulty + deltas[3]),
      raiseAppliedForStreak: 3,
    }
  }
  if (fact.wrongStreak === 2) {
    if (fact.raiseAppliedForStreak >= 2) return fact
    return {
      ...fact,
      difficulty: clampDifficulty(fact.difficulty + deltas[2]),
      raiseAppliedForStreak: 2,
    }
  }
  if (fact.wrongStreak === 1 && deltas[1] !== 0) {
    return {
      ...fact,
      difficulty: clampDifficulty(fact.difficulty + deltas[1]),
    }
  }
  return fact
}

/** Remembers one submitted answer. The rolling average keeps the last configured attempts. */
export function recordAttemptTime(fact: Fact, elapsedMs: number): Fact {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return fact
  const recentAttemptMs = normalizeAttemptMs([...fact.recentAttemptMs, elapsedMs])
  return {
    ...fact,
    recentAttemptMs,
    averageAttemptMs: meanAttemptMs(recentAttemptMs),
    pendingAttemptMs: [...fact.pendingAttemptMs, elapsedMs],
  }
}

/** Time move for one answer. Between the two bounds, the time itself does not move difficulty. */
export function attemptDifficultyDelta(elapsedMs: number): number {
  const timing = gameConfig.answerTiming
  const seconds = elapsedMs / 1000
  if (seconds < timing.fastUnderSeconds) return timing.fastDelta
  if (seconds > timing.slowOverSeconds) return timing.slowDelta
  return 0
}

function applyAttemptTimes(fact: Fact, attemptMs: readonly number[]): Fact {
  let difficulty = fact.difficulty
  for (const elapsedMs of attemptMs) {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) continue
    difficulty = clampDifficulty(difficulty + attemptDifficultyDelta(elapsedMs))
  }
  if (difficulty === fact.difficulty) return fact
  return { ...fact, difficulty }
}

/**
 * Streak move, then one time move per answer still waiting.
 * Pending times are cleared here, so a later level does not apply them again.
 * The rolling average keeps its samples.
 */
export function applyLevelEndUpdate(fact: Fact): Fact {
  const moved = fact.wrongStreak > 0 ? applyWrongStreakUpdate(fact) : applyCorrectStreakUpdate(fact)
  const timed = applyAttemptTimes(moved, moved.pendingAttemptMs)
  if (timed.pendingAttemptMs.length === 0) return timed
  return { ...timed, pendingAttemptMs: [] }
}

export function applyLevelEndToTable(facts: readonly Fact[]): Fact[] {
  return facts.map((fact) => applyLevelEndUpdate(fact))
}
