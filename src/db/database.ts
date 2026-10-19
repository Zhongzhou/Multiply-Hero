import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AvatarId, LevelId } from '../config/gameConfig.ts'
import { clampDifficulty } from '../game/difficulty.ts'
import {
  createSeedFacts,
  factKey,
  meanAttemptMs,
  normalizeAttemptMs,
  sanitizeAttemptMs,
  type Fact,
  type FactStatus,
} from '../game/facts.ts'
import { addWin, localDateKey, normalizeWins, type DayWins } from '../game/wins.ts'

interface AvatarSetting {
  avatar: AvatarId
}

interface MultiplyDB extends DBSchema {
  facts: {
    key: string
    value: Fact
  }
  settings: {
    key: string
    value: AvatarSetting
  }
  wins: {
    key: string
    value: DayWins
  }
}

export interface SavedGame {
  facts: Fact[]
  avatar: AvatarId
}

const DB_NAME = 'multiply-heroes'
const DB_VERSION = 2

let databasePromise: Promise<IDBPDatabase<MultiplyDB>> | null = null
let loadPromise: Promise<SavedGame> | null = null

function database(): Promise<IDBPDatabase<MultiplyDB>> {
  if (!databasePromise) {
    databasePromise = openDB<MultiplyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('facts')) db.createObjectStore('facts')
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings')
        if (!db.objectStoreNames.contains('wins')) db.createObjectStore('wins')
      },
    })
  }
  return databasePromise
}

function isAvatar(value: unknown): value is AvatarId {
  return value === 'penguin' || value === 'koala'
}

function isStatus(value: unknown): value is FactStatus {
  return value === 'unseen' || value === 'learning' || value === 'mastered'
}

function normalizeFact(fact: Fact): Fact {
  const recentAttemptMs = normalizeAttemptMs(fact.recentAttemptMs)
  return {
    a: fact.a,
    b: fact.b,
    difficulty: clampDifficulty(fact.difficulty),
    streak: fact.streak ?? 0,
    status: isStatus(fact.status) ? fact.status : 'unseen',
    correctCount: fact.correctCount ?? 0,
    wrongCount: fact.wrongCount ?? 0,
    wrongStreak: fact.wrongStreak ?? 0,
    moveAppliedForStreak: fact.moveAppliedForStreak ?? 0,
    raiseAppliedForStreak: fact.raiseAppliedForStreak ?? 0,
    recentAttemptMs,
    averageAttemptMs: meanAttemptMs(recentAttemptMs),
    pendingAttemptMs: sanitizeAttemptMs(fact.pendingAttemptMs),
  }
}

function compareFacts(left: Fact, right: Fact): number {
  return left.a - right.a || left.b - right.b
}

async function writeFacts(facts: readonly Fact[]): Promise<void> {
  const db = await database()
  const tx = db.transaction('facts', 'readwrite')
  await Promise.all([
    ...facts.map((fact) => tx.store.put(normalizeFact(fact), factKey(fact.a, fact.b))),
    tx.done,
  ])
}

async function readGame(): Promise<SavedGame> {
  const db = await database()
  const stored = await db.getAll('facts')
  const facts =
    stored.length === 0
      ? createSeedFacts()
      : stored.map((fact) => normalizeFact(fact)).sort(compareFacts)
  if (stored.length === 0) await writeFacts(facts)
  const settings = await db.get('settings', 'avatar')
  const avatar = settings && isAvatar(settings.avatar) ? settings.avatar : 'penguin'
  return { facts, avatar }
}

export function loadGame(): Promise<SavedGame> {
  if (!loadPromise) {
    loadPromise = readGame().catch((error: unknown) => {
      loadPromise = null
      throw error
    })
  }
  return loadPromise
}

export async function saveFacts(facts: readonly Fact[]): Promise<void> {
  await writeFacts(facts)
}

export async function saveAvatar(avatar: AvatarId): Promise<void> {
  const db = await database()
  await db.put('settings', { avatar }, 'avatar')
}

export async function loadWinDays(): Promise<Record<string, DayWins>> {
  const db = await database()
  const tx = db.transaction('wins')
  const keys = await tx.store.getAllKeys()
  const values = await tx.store.getAll()
  await tx.done
  const days: Record<string, DayWins> = {}
  keys.forEach((key, index) => {
    days[key] = normalizeWins(values[index])
  })
  return days
}

export async function recordWin(level: LevelId, when = new Date()): Promise<void> {
  const db = await database()
  const key = localDateKey(when)
  const tx = db.transaction('wins', 'readwrite')
  const current = normalizeWins(await tx.store.get(key))
  await tx.store.put(addWin(current, level), key)
  await tx.done
}
