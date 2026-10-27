import { useEffect, useMemo, useState } from 'react'
import { playClick } from '../audio/sounds.ts'
import { gameConfig, levelLabel, levelOrder, type LevelId } from '../config/gameConfig.ts'
import { bossCast } from '../content/cast.ts'
import {
  daysBetween,
  emptyWins,
  earliestWinDay,
  localDateKey,
  shiftDays,
  startOfLocalDay,
  type DayWins,
} from '../game/wins.ts'
import { CharacterArt } from './Characters.tsx'

function dayTitle(date: Date, today: Date): string {
  const key = localDateKey(date)
  if (key === localDateKey(today)) return 'Today'
  if (key === localDateKey(shiftDays(today, -1))) return 'Yesterday'
  return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date)
}

export function GoldMedal({ id, delay = 0 }: { id: string; delay?: number }) {
  return (
    <svg className="album-medal" style={{ animationDelay: `${delay}ms` }} viewBox="0 0 64 80" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="32%" cy="28%" r="75%">
          <stop offset="0%" stopColor="#fff7c4" />
          <stop offset="42%" stopColor="#ffd34d" />
          <stop offset="100%" stopColor="#e0940c" />
        </radialGradient>
      </defs>
      <path d="M18 3h12l3 20H16z" fill="#f08a8a" />
      <path d="M34 3h12l-2 20H30z" fill="#d64545" />
      <path d="M22 3h20l-2 7H24z" fill="#ffe1e1" />
      <circle cx="32" cy="50" r="22" fill="#c9840a" stroke="#8a5a08" strokeWidth="3" />
      <circle cx="32" cy="50" r="18" fill={`url(#${id})`} stroke="#fff1a8" strokeWidth="2.5" />
      <ellipse cx="25" cy="43" rx="6" ry="3.5" fill="#fff8d0" opacity="0.9" />
      <polygon
        fill="#8a5a08"
        points="32,36 35.2,44.2 44,44.8 37.2,50.4 39.4,59 32,54.2 24.6,59 26.8,50.4 20,44.8 28.8,44.2"
      />
    </svg>
  )
}

function EmptyMedal() {
  return (
    <svg className="album-empty-medal" viewBox="0 0 64 80" aria-hidden="true">
      <circle cx="32" cy="50" r="18" fill="none" stroke="#1e2a3a" strokeWidth="2.5" strokeDasharray="5 5" />
    </svg>
  )
}

export function VictoryAlbumScreen({
  winsByDay,
  onBack,
}: {
  winsByDay: Record<string, DayWins>
  onBack: () => void
}) {
  const today = useMemo(() => startOfLocalDay(new Date()), [])
  const earliest = useMemo(() => earliestWinDay(Object.keys(winsByDay), today), [winsByDay, today])
  const [day, setDay] = useState(today)
  const [turn, setTurn] = useState<'older' | 'newer' | null>(null)

  const dayKey = localDateKey(day)
  const wins = winsByDay[dayKey] ?? emptyWins()
  const total = levelOrder.reduce((sum, level) => sum + wins[level], 0)
  const atToday = dayKey === localDateKey(today)
  const atEarliest = dayKey === localDateKey(earliest)
  const behind = daysBetween(earliest, day)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        turnPage(-1)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        turnPage(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function turnPage(delta: -1 | 1) {
    const next = shiftDays(day, delta)
    if (next > today || next < earliest) return
    playClick()
    setTurn(delta < 0 ? 'older' : 'newer')
    setDay(next)
  }

  let hint = `${behind} older ${behind === 1 ? 'page' : 'pages'} left.`
  if (atToday && atEarliest) hint = total === 0 ? 'Win a battle to hang a medal.' : 'This is the only page so far.'
  else if (atToday) hint = 'Turn back for older days.'
  else if (atEarliest) hint = 'This is the oldest page.'

  return (
    <div className="screen album-screen" data-testid="album">
      <header>
        <button
          type="button"
          className="text-button difficulty-back"
          data-testid="album-back"
          onClick={() => {
            playClick()
            onBack()
          }}
        >
          Back
        </button>
        <h1>Your victory album</h1>
        <p className="album-lede">Each day is a page. Every win is a gold medal.</p>
      </header>

      <AlbumPage
        day={day}
        today={today}
        wins={wins}
        total={total}
        hint={hint}
        turn={turn}
        atToday={atToday}
        atEarliest={atEarliest}
        behind={behind}
        onOlder={() => turnPage(-1)}
        onNewer={() => turnPage(1)}
      />
    </div>
  )
}

function AlbumPage({
  day,
  today,
  wins,
  total,
  hint,
  turn,
  atToday,
  atEarliest,
  behind,
  onOlder,
  onNewer,
}: {
  day: Date
  today: Date
  wins: DayWins
  total: number
  hint: string
  turn: 'older' | 'newer' | null
  atToday: boolean
  atEarliest: boolean
  behind: number
  onOlder: () => void
  onNewer: () => void
}) {
  const dayKey = localDateKey(day)
  const [pointerStart, setPointerStart] = useState<number | null>(null)

  return (
    <div className="album">
      <div className="album-under two" hidden={behind < 2} aria-hidden="true" />
      <div className="album-under one" hidden={behind < 1} aria-hidden="true" />
      <article
        key={dayKey}
        className={`album-page${turn === 'older' ? ' is-turn-older' : ''}${turn === 'newer' ? ' is-turn-newer' : ''}`}
        aria-live="polite"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) {
            setPointerStart(null)
            return
          }
          setPointerStart(event.clientX)
        }}
        onPointerUp={(event) => {
          if (pointerStart == null) return
          const delta = event.clientX - pointerStart
          setPointerStart(null)
          if (delta > 48) onOlder()
          else if (delta < -48) onNewer()
        }}
      >
        <div className="album-nav">
          <button
            type="button"
            className="sticker album-nav-btn"
            data-testid="album-older"
            aria-label="Older day"
            disabled={atEarliest}
            onClick={onOlder}
          >
            ←
          </button>
          <div className="album-day-label">
            <h2 className="album-day-title" data-testid="album-day">
              {dayTitle(day, today)}
            </h2>
            <p className="album-day-date">
              {new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(day)}
            </p>
          </div>
          <button
            type="button"
            className="sticker album-nav-btn"
            data-testid="album-newer"
            aria-label="Newer day"
            disabled={atToday}
            onClick={onNewer}
          >
            →
          </button>
        </div>

        <p className="album-score" data-testid="album-total">
          {total === 0 ? (
            'No gold medals this day'
          ) : (
            <>
              <span className="album-score-num">{total}</span>
              {` gold medal${total === 1 ? '' : 's'}`}
            </>
          )}
        </p>

        <div className="album-levels">
          {levelOrder.map((level) => (
            <LevelRow key={level} level={level} count={wins[level]} dayKey={dayKey} />
          ))}
        </div>
        <p className="album-hint">{hint}</p>
      </article>
    </div>
  )
}

function LevelRow({ level, count, dayKey }: { level: LevelId; count: number; dayKey: string }) {
  const settings = gameConfig.levels[level]
  const boss = bossCast[settings.boss]
  const winLabel = count === 0 ? 'No wins' : `${count} win${count === 1 ? '' : 's'}`
  const medalLabel = count === 0 ? 'No gold medals' : `${count} gold medal${count === 1 ? '' : 's'}`

  return (
    <section className={`album-level level-${level}`} data-testid={`album-level-${level}`}>
      <div className="album-copy">
        <h3>{levelLabel(level)}</h3>
        <p>
          {boss.name} {boss.label}
        </p>
        <p className="album-win-count" data-testid={`album-wins-${level}`}>
          {winLabel}
        </p>
      </div>
      <div className="album-tray" role="img" aria-label={medalLabel}>
        {count === 0 ? (
          <EmptyMedal />
        ) : (
          Array.from({ length: count }, (_, index) => (
            <GoldMedal key={index} id={`medal-${level}-${dayKey}-${index}`} delay={index * 45} />
          ))
        )}
      </div>
      <div className="album-boss" aria-hidden="true">
        <CharacterArt id={settings.boss} expression="hard-cry" motion="fallen" />
      </div>
    </section>
  )
}
