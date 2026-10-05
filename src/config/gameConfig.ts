/**
 * Tunable game numbers. This file is the shared starting point.
 * The first launch copies the difficulty guess into IndexedDB.
 * Later play updates that saved table and never writes this file.
 */
export type LevelId = 'easy' | 'medium' | 'hard'
export type BossId = 'pig' | 'whale' | 'gorilla'
export type AvatarId = 'penguin' | 'koala'

export interface LevelSettings {
  startDifficulty: number
  avatarHp: number
  bossHp: number
  boss: BossId
}

export const gameConfig: {
  difficulty: { min: number; max: number; step: number }
  answersToShift: number
  masteredStreak: number
  factors: { min: number; max: number }
  levels: Record<LevelId, LevelSettings>
  streakDifficultyDelta: { 1: number; 2: number; 3: number }
} = {
  difficulty: { min: 0, max: 0.9, step: 0.1 },
  answersToShift: 2,
  masteredStreak: 3,
  factors: { min: 1, max: 9 },
  levels: {
    easy: { startDifficulty: 0, avatarHp: 6, bossHp: 4, boss: 'pig' },
    medium: { startDifficulty: 0.3, avatarHp: 5, bossHp: 6, boss: 'whale' },
    hard: { startDifficulty: 0.5, avatarHp: 4, bossHp: 8, boss: 'gorilla' },
  },
  streakDifficultyDelta: {
    1: 0,
    2: -0.2,
    3: -0.3,
  },
}

export const levelOrder: LevelId[] = ['easy', 'medium', 'hard']

export function levelLabel(level: LevelId): string {
  if (level === 'easy') return 'Easy'
  if (level === 'medium') return 'Medium'
  return 'Hard'
}

export function neighborLevel(level: LevelId, step: -1 | 1): LevelId | null {
  const index = levelOrder.indexOf(level) + step
  if (index < 0 || index >= levelOrder.length) return null
  return levelOrder[index] ?? null
}

/** First-launch difficulty guess. 3×4 and 4×3 are separate facts. */
export function seedDifficulty(a: number, b: number): number {
  if (a === 1 || b === 1 || (a === 2 && b === 2)) return 0
  if (a === 2 || b === 2) return 0.1
  if (a === 3 || a === 4 || a === 5 || b === 3 || b === 4 || b === 5) return 0.3
  if (a === b) return 0.5
  return 0.8
}
