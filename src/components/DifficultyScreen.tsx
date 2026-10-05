import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { playClick } from '../audio/sounds.ts'
import { seedDifficulty } from '../config/gameConfig.ts'
import { saveFacts } from '../db/database.ts'
import { toStepIndex } from '../game/difficulty.ts'
import { createSeedFacts, factKey, type Fact } from '../game/facts.ts'

const FACTORS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function formatDifficulty(value: number): string {
  return (toStepIndex(value) / 10).toFixed(1)
}

export function DifficultyScreen({
  facts,
  onFacts,
  onBack,
}: {
  facts: Fact[]
  onFacts: (facts: Fact[]) => void
  onBack: () => void
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [pinnedKey, setPinnedKey] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetNotice, setResetNotice] = useState(false)
  const [saveWarning, setSaveWarning] = useState(false)
  const cellRefs = useRef(new Map<string, HTMLButtonElement>())
  const tipRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const resetButtonRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)
  const difficultyByKey = new Map(facts.map((fact) => [factKey(fact.a, fact.b), fact.difficulty]))

  let easy = 0
  let hard = 0
  for (const a of FACTORS) {
    for (const b of FACTORS) {
      const step = toStepIndex(difficultyByKey.get(factKey(a, b)) ?? seedDifficulty(a, b))
      if (step === 0) easy += 1
      if (step >= 6) hard += 1
    }
  }

  const active = activeKey?.split('x').map(Number) ?? null
  const activeDifficulty =
    active && active.length === 2
      ? (difficultyByKey.get(factKey(active[0] ?? 0, active[1] ?? 0)) ??
        seedDifficulty(active[0] ?? 1, active[1] ?? 1))
      : null

  useLayoutEffect(() => {
    const tip = tipRef.current
    if (!tip || !activeKey) return
    function place() {
      const button = activeKey ? cellRefs.current.get(activeKey) : null
      if (!button || !tip) return
      const rect = button.getBoundingClientRect()
      const width = tip.offsetWidth
      const height = tip.offsetHeight
      let left = rect.left + rect.width / 2 - width / 2
      let top = rect.top - height - 10
      if (top < 8) top = rect.bottom + 10
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
      tip.style.left = `${left}px`
      tip.style.top = `${top}px`
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [activeKey, activeDifficulty])

  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
    else if (wasConfirming.current) resetButtonRef.current?.focus()
    wasConfirming.current = confirming
  }, [confirming])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (confirming) {
        setConfirming(false)
        return
      }
      setPinnedKey(null)
      setActiveKey(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirming])

  function difficultyAt(a: number, b: number): number {
    return difficultyByKey.get(factKey(a, b)) ?? seedDifficulty(a, b)
  }

  function hideTip(key: string) {
    setPinnedKey(null)
    setActiveKey((current) => (current === key ? null : current))
  }

  async function confirmReset() {
    if (resetting) return
    playClick()
    setResetting(true)
    const next = createSeedFacts()
    try {
      await saveFacts(next)
      onFacts(next)
      setResetNotice(true)
      setSaveWarning(false)
      setConfirming(false)
    } catch {
      setSaveWarning(true)
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <div className="screen difficulty-screen" data-testid="difficulty" inert={confirming}>
        <header>
          <button
            type="button"
            className="text-button difficulty-back"
            onClick={() => {
              playClick()
              onBack()
            }}
          >
            Back
          </button>
          <h1>Fact difficulty</h1>
          <p className="difficulty-lede">
            Each square is one fact, from 1×1 to 9×9. Lighter is easier. Point at a square, or tap it,
            to see the fact. The difficulties are updated after playing one level, and reflect the
            user's current level of mastery.
          </p>
        </header>
        <section className="panel" aria-labelledby="map-title">
          <h2 id="map-title" className="sr-only">
            Difficulty of each multiplication fact
          </h2>
          <div className="fact-legend">
            <p className="fact-legend-end">Easier</p>
            <div className="fact-swatches">
              {SCALE.map((step) => (
                <div key={step} className="fact-swatch">
                  <i className={`d${step}`} />
                  <span>{step % 2 === 0 ? (step / 10).toFixed(1) : ''}</span>
                </div>
              ))}
            </div>
            <p className="fact-legend-end">Harder</p>
          </div>
          <p className="fact-note">
            Colors run from 0 to 1. Saved facts move in steps of 0.1 and stop at 0.9.
          </p>
          <table className="fact-table">
            <caption className="sr-only">
              Difficulty of each fact from 1 times 1 to 9 times 9. The row is the first number and the
              column is the second.
            </caption>
            <colgroup>
              <col className="fact-label-col" />
              {FACTORS.map((factor) => (
                <col key={factor} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th scope="col">×</th>
                {FACTORS.map((factor) => (
                  <th key={factor} scope="col">
                    {factor}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTORS.map((a) => (
                <tr key={a}>
                  <th scope="row">{a}</th>
                  {FACTORS.map((b) => {
                    const key = factKey(a, b)
                    const difficulty = difficultyAt(a, b)
                    return (
                      <td key={key}>
                        <button
                          type="button"
                          className={`fact-cell d${toStepIndex(difficulty)}${activeKey === key ? ' is-active' : ''}`}
                          data-testid={`fact-${key}`}
                          aria-label={`${a} times ${b}, difficulty ${formatDifficulty(difficulty)}`}
                          ref={(node) => {
                            if (node) cellRefs.current.set(key, node)
                            else cellRefs.current.delete(key)
                          }}
                          onPointerEnter={(event) => {
                            if (event.pointerType === 'mouse') setActiveKey(key)
                          }}
                          onPointerLeave={(event) => {
                            if (event.pointerType === 'mouse' && pinnedKey !== key) hideTip(key)
                          }}
                          onFocus={() => setActiveKey(key)}
                          onBlur={() => {
                            if (pinnedKey !== key) hideTip(key)
                          }}
                          onClick={() => {
                            if (pinnedKey === key) {
                              setPinnedKey(null)
                              setActiveKey(null)
                              return
                            }
                            setPinnedKey(key)
                            setActiveKey(key)
                          }}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fact-summary" role="status">
            {resetNotice ? 'Every fact is back to its starting difficulty. ' : ''}
            {easy} facts are at 0.0. {hard} facts are 0.6 or higher.
          </p>
          {saveWarning ? <p className="save-warning">Couldn't save the reset on this tablet.</p> : null}
        </section>
        <div className="difficulty-actions">
          <button
            type="button"
            className="sticker sticker-warn"
            data-testid="reset-facts"
            ref={resetButtonRef}
            onClick={() => {
              playClick()
              setPinnedKey(null)
              setActiveKey(null)
              setConfirming(true)
            }}
          >
            Reset all facts
          </button>
        </div>
        {active && activeDifficulty !== null ? (
          <div className="fact-tip" ref={tipRef} role="tooltip">
            <p className="fact-tip-eq">
              {active[0]} × {active[1]}
            </p>
            <p className="fact-tip-level">Difficulty {formatDifficulty(activeDifficulty)}</p>
          </div>
        ) : null}
      </div>
      {confirming ? (
        <div className="leave-layer" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="panel leave-card">
            <h2 id="reset-title">Reset all facts?</h2>
            <p id="reset-copy">
              Do you want to reset the difficulty of all facts to the initial setting of the game? (Your
              current practice data will be lost)
            </p>
            <button
              type="button"
              className="sticker sticker-green"
              ref={cancelRef}
              onClick={() => {
                playClick()
                setConfirming(false)
              }}
            >
              Keep these
            </button>
            <button
              type="button"
              className="sticker sticker-warn"
              data-testid="confirm-reset"
              disabled={resetting}
              onClick={() => {
                void confirmReset()
              }}
            >
              Reset facts
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
