import { gameConfig } from '../config/gameConfig.ts'
import { clampDifficulty, fromStepIndex, toStepIndex } from './difficulty.ts'

export interface SearchState {
  difficulty: number
  correctCount: number
  wrongCount: number
}

function countsByStep(occupied: readonly number[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const difficulty of occupied) {
    const step = toStepIndex(difficulty)
    counts.set(step, (counts.get(step) ?? 0) + 1)
  }
  return counts
}

/** Next occupied difficulty above current, or current when nothing from there through 0.9 has a fact. */
export function scanUp(current: number, occupied: readonly number[]): number {
  const counts = countsByStep(occupied)
  const start = toStepIndex(current)
  const max = toStepIndex(gameConfig.difficulty.max)
  for (let step = start + 1; step <= max; step += 1) {
    if ((counts.get(step) ?? 0) > 0) return fromStepIndex(step)
  }
  return fromStepIndex(start)
}

/** Closest occupied difficulty below current, or current when none exists. */
export function scanDown(current: number, occupied: readonly number[]): number {
  const counts = countsByStep(occupied)
  const start = toStepIndex(current)
  const min = toStepIndex(gameConfig.difficulty.min)
  for (let step = start - 1; step >= min; step -= 1) {
    if ((counts.get(step) ?? 0) > 0) return fromStepIndex(step)
  }
  return fromStepIndex(start)
}

export function resolveStartDifficulty(start: number, occupied: readonly number[]): number {
  const counts = countsByStep(occupied)
  const startStep = toStepIndex(clampDifficulty(start))
  if ((counts.get(startStep) ?? 0) > 0) return fromStepIndex(startStep)
  const raised = scanUp(fromStepIndex(startStep), occupied)
  if (toStepIndex(raised) !== startStep) return raised
  return scanDown(fromStepIndex(startStep), occupied)
}

export function createSearch(startDifficulty: number, occupied: readonly number[]): SearchState {
  return {
    difficulty: resolveStartDifficulty(startDifficulty, occupied),
    correctCount: 0,
    wrongCount: 0,
  }
}

function settled(difficulty: number): SearchState {
  return { difficulty, correctCount: 0, wrongCount: 0 }
}

/**
 * Move the search from one answer.
 * Tallies reset when a raise or lower attempt finishes, including a scan that stays put,
 * so a later pair of answers can still move the other way.
 */
export function applySearchAnswer(
  state: SearchState,
  correct: boolean,
  occupied: readonly number[],
): SearchState {
  const counts = countsByStep(occupied)
  const currentStep = toStepIndex(state.difficulty)
  const available = counts.get(currentStep) ?? 0
  const correctCount = state.correctCount + (correct ? 1 : 0)
  const wrongCount = state.wrongCount + (correct ? 0 : 1)
  const shift = gameConfig.answersToShift
  const here = fromStepIndex(currentStep)

  let direction: 'up' | 'down' | null = null
  if (available === 1) {
    direction = correct ? 'up' : 'down'
  } else if (available > 1) {
    const raise = correctCount >= shift
    const lower = wrongCount >= shift
    if (raise && lower) direction = correct ? 'up' : 'down'
    else if (raise) direction = 'up'
    else if (lower) direction = 'down'
  }

  if (direction === null) {
    return { difficulty: here, correctCount, wrongCount }
  }

  const next = direction === 'up' ? scanUp(here, occupied) : scanDown(here, occupied)
  return settled(next)
}
