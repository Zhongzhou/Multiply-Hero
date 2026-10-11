import { useEffect, useRef, useState } from 'react'
import { neighborLevel, type AvatarId, type LevelId } from './config/gameConfig.ts'
import { DifficultyScreen } from './components/DifficultyScreen.tsx'
import { EndScreen } from './components/EndScreen.tsx'
import { FightScreen } from './components/FightScreen.tsx'
import { HomeScreen } from './components/HomeScreen.tsx'
import { VictoryAlbumScreen } from './components/VictoryAlbumScreen.tsx'
import { loadGame, loadWinDays, recordWin, saveAvatar } from './db/database.ts'
import type { Fact } from './game/facts.ts'
import { addWin, emptyWins, localDateKey, type DayWins } from './game/wins.ts'

type Screen =
  | { name: 'loading' }
  | { name: 'error' }
  | { name: 'home' }
  | { name: 'difficulty' }
  | { name: 'album' }
  | { name: 'fight'; level: LevelId; battle: number }
  | { name: 'end'; level: LevelId; outcome: 'win' | 'lose' }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'loading' })
  const [facts, setFacts] = useState<Fact[]>([])
  const [avatar, setAvatar] = useState<AvatarId>('penguin')
  const [winsByDay, setWinsByDay] = useState<Record<string, DayWins>>({})
  const [saveWarning, setSaveWarning] = useState(false)
  const battle = useRef(0)

  useEffect(() => {
    let alive = true
    loadGame()
      .then(async (saved) => {
        const wins = await loadWinDays()
        if (!alive) return
        setFacts(saved.facts)
        setAvatar(saved.avatar)
        setWinsByDay(wins)
        setScreen({ name: 'home' })
      })
      .catch(() => {
        if (!alive) return
        setScreen({ name: 'error' })
      })
    return () => {
      alive = false
    }
  }, [])

  function noteWin(level: LevelId) {
    const key = localDateKey(new Date())
    setWinsByDay((prev) => ({
      ...prev,
      [key]: addWin(prev[key] ?? emptyWins(), level),
    }))
    void recordWin(level).catch(() => {
      setWinsByDay((prev) => {
        const current = prev[key] ?? emptyWins()
        return { ...prev, [key]: { ...current, [level]: Math.max(0, current[level] - 1) } }
      })
    })
  }

  function begin(level: LevelId) {
    battle.current += 1
    setScreen({ name: 'fight', level, battle: battle.current })
  }

  function chooseAvatar(next: AvatarId) {
    setAvatar(next)
    void saveAvatar(next)
      .then(() => setSaveWarning(false))
      .catch(() => setSaveWarning(true))
  }

  if (screen.name === 'loading') {
    return (
      <div className="screen center-screen">
        <p className="loading-copy">Getting your facts ready…</p>
      </div>
    )
  }

  if (screen.name === 'error') {
    return (
      <div className="screen center-screen">
        <div className="panel narrow-panel">
          <h1>This tablet couldn't open the saved game.</h1>
          <p>Check that the browser can store data, then try again.</p>
          <button
            type="button"
            className="sticker sticker-green"
            onClick={() => {
              setScreen({ name: 'loading' })
              loadGame()
                .then(async (saved) => {
                  const wins = await loadWinDays()
                  setFacts(saved.facts)
                  setAvatar(saved.avatar)
                  setWinsByDay(wins)
                  setScreen({ name: 'home' })
                })
                .catch(() => setScreen({ name: 'error' }))
            }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (screen.name === 'home') {
    return (
      <HomeScreen
        avatar={avatar}
        saveWarning={saveWarning}
        onChoose={chooseAvatar}
        onStart={begin}
        onDifficulty={() => setScreen({ name: 'difficulty' })}
        onAlbum={() => setScreen({ name: 'album' })}
      />
    )
  }

  if (screen.name === 'difficulty') {
    return <DifficultyScreen facts={facts} onFacts={setFacts} onBack={() => setScreen({ name: 'home' })} />
  }

  if (screen.name === 'album') {
    return <VictoryAlbumScreen winsByDay={winsByDay} onBack={() => setScreen({ name: 'home' })} />
  }

  if (screen.name === 'fight') {
    return (
      <FightScreen
        key={`${screen.level}-${screen.battle}`}
        level={screen.level}
        avatar={avatar}
        facts={facts}
        onFacts={setFacts}
        onStop={() => setScreen({ name: 'home' })}
        onFinished={(outcome) => {
          if (outcome === 'win') noteWin(screen.level)
          setScreen({ name: 'end', level: screen.level, outcome })
        }}
      />
    )
  }

  const easier = neighborLevel(screen.level, -1)
  const harder = neighborLevel(screen.level, 1)
  return (
    <EndScreen
      level={screen.level}
      outcome={screen.outcome}
      avatar={avatar}
      onAgain={() => begin(screen.level)}
      onEasier={() => {
        if (easier) begin(easier)
      }}
      onHarder={() => {
        if (harder) begin(harder)
      }}
      onHome={() => setScreen({ name: 'home' })}
    />
  )
}
