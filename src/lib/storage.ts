import type { Journey, JourneyMode, JourneySource, TrackPoint } from '../types'

export const STORAGE_KEY = 'michilog:journeys:v1'
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

const isMode = (value: unknown): value is JourneyMode => value === 'road' || value === 'rail'
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
    return parsed.journeys.filter(isJourney)
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

