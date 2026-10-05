import { gameConfig } from '../config/gameConfig.ts'

function scale(): number {
  return Math.round(1 / gameConfig.difficulty.step)
}

export function toStepIndex(value: number): number {
  return Math.round(value * scale())
}

export function fromStepIndex(index: number): number {
  return index / scale()
}

export function clampDifficulty(value: number): number {
  const index = toStepIndex(value)
  const min = toStepIndex(gameConfig.difficulty.min)
  const max = toStepIndex(gameConfig.difficulty.max)
  return fromStepIndex(Math.min(max, Math.max(min, index)))
}

export function sameDifficulty(left: number, right: number): boolean {
  return toStepIndex(left) === toStepIndex(right)
}
