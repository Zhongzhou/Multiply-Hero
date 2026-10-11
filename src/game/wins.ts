import type { LevelId } from '../config/gameConfig.ts'

export interface DayWins {
  easy: number
  medium: number
  hard: number
}

export function emptyWins(): DayWins {
  return { easy: 0, medium: 0, hard: 0 }
}

export function localDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function shiftDays(date: Date, delta: number): Date {
  const next = startOfLocalDay(date)
  next.setDate(next.getDate() + delta)
  return next
}

/** Whole local days from the earlier date to the later one. */
export function daysBetween(earlier: Date, later: Date): number {
  const start = startOfLocalDay(earlier).getTime()
  const end = startOfLocalDay(later).getTime()
  return Math.round((end - start) / 86_400_000)
}

export function addWin(wins: DayWins, level: LevelId): DayWins {
  return { ...wins, [level]: wins[level] + 1 }
}

export function parseDayKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

function count(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0
  return Math.floor(value)
}

export function normalizeWins(value: unknown): DayWins {
  const record = value && typeof value === 'object' ? (value as Partial<DayWins>) : {}
  return {
    easy: count(record.easy),
    medium: count(record.medium),
    hard: count(record.hard),
  }
}

/** Oldest saved day that is not after today. Today, when nothing earlier is saved. */
export function earliestWinDay(keys: readonly string[], today: Date): Date {
  const todayKey = localDateKey(today)
  let earliest = startOfLocalDay(today)
  for (const key of keys) {
    if (key > todayKey) continue
    const date = parseDayKey(key)
    if (date && date < earliest) earliest = date
  }
  return earliest
}
