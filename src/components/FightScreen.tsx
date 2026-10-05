import { useEffect, useRef, useState } from 'react'
import { playCorrect, playWrong } from '../audio/sounds.ts'
import { gameConfig, levelLabel, type AvatarId, type LevelId } from '../config/gameConfig.ts'
import { avatarCast, avatarPose, bossCast, bossPose } from '../content/cast.ts'
import { saveFacts } from '../db/database.ts'
import { commitAnswer, startFight, type FightState } from '../game/fight.ts'
import type { Fact } from '../game/facts.ts'
import { CharacterSlot } from './Characters.tsx'
import { HpRow } from './HpRow.tsx'
import { NumberPad } from './NumberPad.tsx'

const REVEAL_MS = 1100
const REACTION_MS = 1300

export function FightScreen({
  level,
  avatar,
  facts,
  onFacts,
  onStop,
  onFinished,
}: {
  level: LevelId
  avatar: AvatarId
  facts: Fact[]
  onFacts: (facts: Fact[]) => void
  onStop: () => void
  onFinished: (outcome: 'win' | 'lose') => void
}) {
  const [fight, setFight] = useState<FightState>(() => startFight(level, facts))
  const [phase, setPhase] = useState<'ask' | 'reveal' | 'react'>('ask')
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; product: number; question: Fact } | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const alive = useRef(true)
  const busy = useRef(false)
  const inputRef = useRef('')
  const fightRef = useRef(fight)
  const timeouts = useRef<number[]>([])
  const submitRef = useRef<(raw: string) => void>(() => {})
  const phaseRef = useRef(phase)
  const leavingRef = useRef(leaving)

  useEffect(() => {
    const ids = timeouts.current
    alive.current = true
    return () => {
      alive.current = false
      for (const id of ids) window.clearTimeout(id)
    }
  }, [])

  function setDigits(next: string) {
    inputRef.current = next
    setInput(next)
  }

  function later(ms: number, fn: () => void) {
    const id = window.setTimeout(() => {
      if (!alive.current) return
      fn()
    }, ms)
    timeouts.current.push(id)
  }

  function showReaction(next: FightState, correct: boolean, product: number, question: Fact) {
    setFight(next)
    setFeedback({ correct, product, question })
    setPhase('react')
    later(REACTION_MS, () => {
      if (next.over && next.outcome) {
        onFinished(next.outcome)
        return
      }
      setPhase('ask')
      setFeedback(null)
      busy.current = false
    })
  }

  function submit(raw: string) {
    if (busy.current || phase !== 'ask' || leaving) return
    if (!/^\d{1,2}$/.test(raw)) return
    const result = commitAnswer(fightRef.current, raw)
    if (!result.accepted) return
    busy.current = true
    setDigits('')
    const question = fightRef.current.question
    void saveFacts(result.state.facts)
      .then(() => {
        if (alive.current) setSaveError(false)
      })
      .catch(() => {
        if (alive.current) setSaveError(true)
      })
    onFacts(result.state.facts)
    if (result.correct) {
      playCorrect()
      showReaction(result.state, true, result.product, question)
      return
    }
    playWrong()
    setFeedback({ correct: false, product: result.product, question })
    setPhase('reveal')
    later(REVEAL_MS, () => {
      showReaction(result.state, false, result.product, question)
    })
  }

  useEffect(() => {
    phaseRef.current = phase
    leavingRef.current = leaving
    fightRef.current = fight
    submitRef.current = (raw: string) => {
      if (busy.current || phase !== 'ask' || leaving) return
      submit(raw)
    }
  })

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat || phaseRef.current !== 'ask' || leavingRef.current) return
      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        if (inputRef.current.length >= 2) return
        setDigits(inputRef.current + event.key)
        return
      }
      if (event.key === 'Backspace') {
        event.preventDefault()
        setDigits(inputRef.current.slice(0, -1))
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        submitRef.current(inputRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const settings = gameConfig.levels[level]
  const hero = avatarCast[avatar]
  const boss = bossCast[settings.boss]
  const shownQuestion = phase === 'ask' || !feedback ? fight.question : feedback.question
  const avatarMoment = phase === 'react' && feedback ? (feedback.correct ? 'tongue' : 'cry') : 'idle'
  const bossMoment = phase === 'react' && feedback ? (feedback.correct ? 'cry' : 'laugh') : 'idle'
  const equation = feedback ? `${feedback.question.a} × ${feedback.question.b} = ${feedback.product}` : ''
  const feedbackText =
    phase === 'ask' || !feedback ? '' : feedback.correct ? `Yes! ${equation}` : `Not quite. ${equation}`

  return (
    <div className="screen fight-screen" data-testid="fight" data-phase={phase}>
      <header className="fight-header">
        <HpRow
          name={hero.name}
          hp={fight.avatarHp}
          max={fight.maxAvatarHp}
          align="start"
          testId="avatar-hp"
        />
        <div className="fight-tools">
          <span className="level-chip">{levelLabel(level)}</span>
          {phase === 'ask' ? (
            <button type="button" className="text-button" data-testid="stop" onClick={() => setLeaving(true)}>
              Stop
            </button>
          ) : null}
        </div>
        <HpRow
          name={boss.name}
          hp={fight.bossHp}
          max={fight.maxBossHp}
          align="end"
          testId="boss-hp"
        />
      </header>
      {saveError ? <p className="save-warning">Couldn't save on this tablet.</p> : null}
      <div className="fight-stage">
        <div className="fight-avatar">
          <CharacterSlot
            id={avatar}
            name={hero.name}
            pose={avatarPose(avatarMoment)}
            testId="fight-avatar"
            side="left"
          />
        </div>
        <div className={`question-card ${phase === 'react' && feedback?.correct ? 'question-yes' : ''} ${feedback && !feedback.correct ? 'question-no' : ''}`}>
          <p className="question-text" data-testid="question">
            {shownQuestion.a} × {shownQuestion.b}
          </p>
          {phase === 'ask' ? (
            <p className="answer-well" data-testid="answer">
              {input || '·'}
            </p>
          ) : (
            <p className="answer-well answer-product" data-testid="answer">
              = {feedback?.product}
            </p>
          )}
          <p className="feedback-line" data-testid="feedback" aria-live="assertive">
            {feedbackText}
          </p>
        </div>
        <div className="fight-boss">
          <CharacterSlot
            id={settings.boss}
            name={boss.name}
            pose={bossPose(bossMoment)}
            testId="fight-boss"
            side="right"
          />
        </div>
      </div>
      <footer className="fight-pad">
        <NumberPad value={input} disabled={phase !== 'ask' || leaving} onChange={setDigits} onEnter={() => submit(inputRef.current)} />
        <p className="pad-hint">Tap Enter when you're ready.</p>
      </footer>
      {leaving ? (
        <div className="leave-layer" role="dialog" aria-modal="true" aria-labelledby="leave-title">
          <div className="panel leave-card">
            <h2 id="leave-title">Leave this fight?</h2>
            <p>Your answers stay saved. This battle will not change how hard the facts are.</p>
            <button type="button" className="sticker sticker-green" onClick={() => setLeaving(false)}>
              Keep playing
            </button>
            <button type="button" className="sticker" data-testid="confirm-leave" onClick={onStop}>
              Leave
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
