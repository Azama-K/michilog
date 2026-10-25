import type { Journey, JourneyMode, JourneySource, TrackPoint } from '../types'

export const STORAGE_KEY = 'michilog:journeys:v1'
export const SETTINGS_KEY = 'michilog:settings:v1'
const STORAGE_VERSION = 1

interface JourneyStore {
  version: typeof STORAGE_VERSION
  journeys: Journey[]
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isMode = (value: unknown): value is JourneyMode => value === 'road' || value === 'walk' || value === 'rail'
const isSource = (value: unknown): value is JourneySource => value === 'gps' || value === 'demo'

function isTrackPoint(value: unknown): value is TrackPoint {
  if (!value || typeof value !== 'object') return false
  const point = value as Record<string, unknown>
  return (
    isFiniteNumber(point.latitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    isFiniteNumber(point.longitude) &&
    point.longitude >= -180 &&
    point.longitude <= 180 &&
    isFiniteNumber(point.timestamp)
  )
}

export function isJourney(value: unknown): value is Journey {
  if (!value || typeof value !== 'object') return false
  const journey = value as Record<string, unknown>
  return (
    typeof journey.id === 'string' &&
    journey.id.length > 0 &&
    typeof journey.name === 'string' &&
    journey.name.length > 0 &&
    isMode(journey.mode) &&
    isSource(journey.source) &&
    typeof journey.startedAt === 'string' &&
    !Number.isNaN(Date.parse(journey.startedAt)) &&
    typeof journey.endedAt === 'string' &&
    !Number.isNaN(Date.parse(journey.endedAt)) &&
    isFiniteNumber(journey.distanceMeters) &&
    journey.distanceMeters >= 0 &&
    isFiniteNumber(journey.durationSeconds) &&
    journey.durationSeconds >= 0 &&
    Array.isArray(journey.points) &&
    journey.points.every(isTrackPoint)
  )
}

/** サンプル経路のIDは `sample-` で始まる。記録のIDはUUIDなので重ならない。 */
export const isSampleJourneyId = (id: string) => id.startsWith('sample-')

function getBrowserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function loadJourneys(storage: StorageLike | null = getBrowserStorage()): Journey[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<JourneyStore>
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.journeys)) return []
    // 旧版ではサンプル経路が記録と一緒に保存されることがあったため、読み込み時に取り除く
    return parsed.journeys.filter(isJourney).filter((journey) => !isSampleJourneyId(journey.id))
  } catch {
    return []
  }
}

export function saveJourneys(
  journeys: Journey[],
  storage: StorageLike | null = getBrowserStorage(),
): boolean {
  if (!storage) return false
  try {
    const payload: JourneyStore = { version: STORAGE_VERSION, journeys }
    storage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function clearJourneys(storage: StorageLike | null = getBrowserStorage()): boolean {
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export interface AppSettings {
  showSamples: boolean
}

interface SettingsStore extends AppSettings {
  version: 1
}

/** 保存された設定を読む。まだ一度も保存していなければ null。 */
export function loadSettings(storage: StorageLike | null = getBrowserStorage()): AppSettings | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(SETTINGS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SettingsStore>
    if (parsed.version !== 1 || typeof parsed.showSamples !== 'boolean') return null
    return { showSamples: parsed.showSamples }
  } catch {
    return null
  }
}

export function saveSettings(settings: AppSettings, storage: StorageLike | null = getBrowserStorage()): boolean {
  if (!storage) return false
  try {
    const payload: SettingsStore = { version: 1, showSamples: settings.showSamples }
    storage.setItem(SETTINGS_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

/** 読み込めるバックアップファイルの上限。数年分の記録でも十分収まる大きさにしている。 */
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024

export interface ParsedBackup {
  journeys: Journey[]
  /** 形式が正しくなかったため読み飛ばした記録の数 */
  invalidCount: number
}

export class BackupFormatError extends Error {}

/**
 * みちログのバックアップJSON（書き出し形式・端末保存形式・記録の配列）を読み、検証済みの記録を返す。
 * サンプル経路は取り込まない。
 */
export function parseBackup(text: string): ParsedBackup {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new BackupFormatError('JSONとして読み込めませんでした。みちログで書き出したファイルか確認してください。')
  }

  const candidates = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { journeys?: unknown }).journeys)
      ? (parsed as { journeys: unknown[] }).journeys
      : null
  if (!candidates) {
    throw new BackupFormatError('みちログのバックアップ形式ではありません。')
  }

  const journeys: Journey[] = []
  let invalidCount = 0
  for (const candidate of candidates) {
    if (!isJourney(candidate)) {
      invalidCount += 1
      continue
    }
    if (isSampleJourneyId(candidate.id)) continue
    journeys.push(candidate)
  }
  return { journeys, invalidCount }
}

export interface MergeResult {
  journeys: Journey[]
  added: number
  duplicates: number
}

/** 既存の記録を残したまま、まだない記録だけを追加する。新しい順に並べる。 */
export function mergeJourneys(existing: Journey[], incoming: Journey[]): MergeResult {
  const knownIds = new Set(existing.map((journey) => journey.id))
  const additions: Journey[] = []
  let duplicates = 0
  for (const journey of incoming) {
    if (knownIds.has(journey.id)) {
      duplicates += 1
      continue
    }
    knownIds.add(journey.id)
    additions.push(journey)
  }
  const journeys = [...existing, ...additions].sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  )
  return { journeys, added: additions.length, duplicates }
}
