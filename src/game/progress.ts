import { gameConfig } from '../config/gameConfig.ts'
import { clampDifficulty } from './difficulty.ts'
import type { Fact } from './facts.ts'

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

/** One difficulty move from the streak at the end of a finished level. */
export function applyLevelEndUpdate(fact: Fact): Fact {
  if (fact.wrongStreak > 0) return applyWrongStreakUpdate(fact)
  return applyCorrectStreakUpdate(fact)
}

export function applyLevelEndToTable(facts: readonly Fact[]): Fact[] {
  return facts.map((fact) => applyLevelEndUpdate(fact))
}
