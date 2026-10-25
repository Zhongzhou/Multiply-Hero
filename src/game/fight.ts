import { gameConfig, type LevelId } from '../config/gameConfig.ts'
import { sameDifficulty } from './difficulty.ts'
import { factKey, type Fact } from './facts.ts'
import { applyAnswerToFact, applyLevelEndToTable, recordAttemptTime } from './progress.ts'
import { createSearch, applySearchAnswer, type SearchState } from './search.ts'

export interface FightState {
  level: LevelId
  avatarHp: number
  bossHp: number
  maxAvatarHp: number
  maxBossHp: number
  search: SearchState
  facts: Fact[]
  question: Fact
  over: boolean
  outcome: 'win' | 'lose' | null
  /** Fact recorded on the previous attempt. The next attempt of this same fact is not recorded. */
  lastAnsweredKey: string | null
}

export function factsAtDifficulty(facts: readonly Fact[], difficulty: number): Fact[] {
  return facts
    .filter((fact) => sameDifficulty(fact.difficulty, difficulty))
    .slice()
    .sort((left, right) => left.a - right.a || left.b - right.b)
}

export function pickFact(
  facts: readonly Fact[],
  difficulty: number,
  avoidKey?: string,
  rng: () => number = Math.random,
): Fact {
  const pool = factsAtDifficulty(facts, difficulty)
  if (pool.length === 0) {
    throw new Error('No multiplication facts are available.')
  }
  const choices =
    avoidKey && pool.length > 1
      ? pool.filter((fact) => factKey(fact.a, fact.b) !== avoidKey)
      : pool
  const usable = choices.length > 0 ? choices : pool
  const index = Math.min(usable.length - 1, Math.floor(rng() * usable.length))
  const picked = usable[index]
  if (!picked) throw new Error('No multiplication facts are available.')
  return picked
}

export function startFight(
  level: LevelId,
  facts: readonly Fact[],
  rng: () => number = Math.random,
): FightState {
  const settings = gameConfig.levels[level]
  const table = facts.map((fact) => ({ ...fact }))
  const search = createSearch(
    settings.startDifficulty,
    table.map((fact) => fact.difficulty),
  )
  return {
    level,
    avatarHp: settings.avatarHp,
    bossHp: settings.bossHp,
    maxAvatarHp: settings.avatarHp,
    maxBossHp: settings.bossHp,
    search,
    facts: table,
    question: pickFact(table, search.difficulty, undefined, rng),
    over: false,
    outcome: null,
    lastAnsweredKey: null,
  }
}

function acceptedElapsed(elapsedMs: number | undefined): number | null {
  if (elapsedMs === undefined || !Number.isFinite(elapsedMs) || elapsedMs < 0) return null
  return elapsedMs
}

export function commitAnswer(
  state: FightState,
  raw: string,
  rng: () => number = Math.random,
  elapsedMs?: number,
): { state: FightState; correct: boolean; product: number; accepted: boolean } {
  const product = state.question.a * state.question.b
  if (state.over || !/^\d{1,2}$/.test(raw)) {
    return { state, correct: false, product, accepted: false }
  }
  const correct = Number(raw) === product
  const key = factKey(state.question.a, state.question.b)
  const elapsed = acceptedElapsed(elapsedMs)
  const repeated = state.lastAnsweredKey === key
  const answered = repeated
    ? state.facts
    : state.facts.map((fact) => {
        if (factKey(fact.a, fact.b) !== key) return fact
        const updated = applyAnswerToFact(fact, correct)
        return elapsed === null ? updated : recordAttemptTime(updated, elapsed)
      })
  const occupied = state.facts.map((fact) => fact.difficulty)
  const search = applySearchAnswer(state.search, correct, occupied)
  const avatarHp = correct ? state.avatarHp : state.avatarHp - 1
  const bossHp = correct ? state.bossHp - 1 : state.bossHp
  const over = avatarHp <= 0 || bossHp <= 0
  const facts = over ? applyLevelEndToTable(answered) : answered
  const outcome = !over ? null : bossHp <= 0 ? 'win' : 'lose'
  return {
    accepted: true,
    correct,
    product,
    state: {
      ...state,
      avatarHp,
      bossHp,
      search,
      facts,
      question: over ? state.question : pickFact(facts, search.difficulty, key, rng),
      over,
      outcome,
      lastAnsweredKey: key,
    },
  }
}
