import { useEffect, useRef, useState } from 'react'
import { neighborLevel, type AvatarId, type LevelId } from './config/gameConfig.ts'
import { EndScreen } from './components/EndScreen.tsx'
import { FightScreen } from './components/FightScreen.tsx'
import { HomeScreen } from './components/HomeScreen.tsx'
import { loadGame, saveAvatar } from './db/database.ts'
import type { Fact } from './game/facts.ts'

type Screen =
  | { name: 'loading' }
  | { name: 'error' }
  | { name: 'home' }
  | { name: 'fight'; level: LevelId; battle: number }
  | { name: 'end'; level: LevelId; outcome: 'win' | 'lose' }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'loading' })
  const [facts, setFacts] = useState<Fact[]>([])
  const [avatar, setAvatar] = useState<AvatarId>('penguin')
  const [saveWarning, setSaveWarning] = useState(false)
  const battle = useRef(0)

  useEffect(() => {
    let alive = true
    loadGame()
      .then((saved) => {
        if (!alive) return
        setFacts(saved.facts)
        setAvatar(saved.avatar)
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
                .then((saved) => {
                  setFacts(saved.facts)
                  setAvatar(saved.avatar)
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
      <HomeScreen avatar={avatar} saveWarning={saveWarning} onChoose={chooseAvatar} onStart={begin} />
    )
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
        onFinished={(outcome) => setScreen({ name: 'end', level: screen.level, outcome })}
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
