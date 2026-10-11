import { describe, expect, it } from 'vitest'
import {
  addWin,
  daysBetween,
  earliestWinDay,
  emptyWins,
  localDateKey,
  normalizeWins,
  parseDayKey,
} from './wins.ts'

describe('victory album days', () => {
  it('writes a local calendar key', () => {
    expect(localDateKey(new Date(2026, 9, 10))).toBe('2026-10-10')
    expect(localDateKey(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('adds one win on the chosen level', () => {
    expect(addWin(emptyWins(), 'hard')).toEqual({ easy: 0, medium: 0, hard: 1 })
    expect(addWin(addWin(emptyWins(), 'easy'), 'easy').easy).toBe(2)
  })

  it('rejects a key that is not a real date', () => {
    expect(parseDayKey('2026-02-31')).toBeNull()
    expect(parseDayKey('nope')).toBeNull()
    expect(localDateKey(parseDayKey('2026-10-08')!)).toBe('2026-10-08')
  })

  it('starts the album at the oldest past day', () => {
    const today = new Date(2026, 9, 10)
    expect(localDateKey(earliestWinDay(['2026-10-12', '2026-10-08', '2026-10-09', 'bad'], today))).toBe(
      '2026-10-08',
    )
  })

  it('stays on today when no earlier day is saved', () => {
    const today = new Date(2026, 9, 10)
    expect(localDateKey(earliestWinDay(['2026-10-11'], today))).toBe('2026-10-10')
  })

  it('counts local days from one page to another', () => {
    expect(daysBetween(new Date(2026, 9, 8), new Date(2026, 9, 10))).toBe(2)
  })

  it('keeps only whole medal counts', () => {
    expect(normalizeWins({ easy: 2.9, medium: -1, hard: '3' })).toEqual({ easy: 2, medium: 0, hard: 0 })
    expect(normalizeWins(null)).toEqual(emptyWins())
  })
})
