import { describe, expect, it } from 'vitest'
import { STARTER_JOURNEYS } from '../data/demo'
import {
  BackupFormatError,
  SETTINGS_KEY,
  STORAGE_KEY,
  clearJourneys,
  loadJourneys,
  loadSettings,
  mergeJourneys,
  parseBackup,
  saveJourneys,
  saveSettings,
  type StorageLike,
} from './storage'
import type { Journey } from '../types'

// サンプルと同じ形の、利用者自身の記録
const ownJourney = (id: string, startedAt: string, source: Journey = STARTER_JOURNEYS[0]): Journey => ({
  ...source,
  id,
  source: 'gps',
  name: `記録 ${id}`,
  startedAt,
  endedAt: startedAt,
})
const RECORDS = [
  ownJourney('a1b2', '2026-10-20T01:00:00.000Z'),
  ownJourney('c3d4', '2026-10-18T01:00:00.000Z', STARTER_JOURNEYS[2]),
]

class MemoryStorage implements StorageLike {
  values = new Map<string, string>()
  shouldThrow = false

  getItem(key: string) {
    if (this.shouldThrow) throw new Error('storage unavailable')
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    if (this.shouldThrow) throw new Error('quota exceeded')
    this.values.set(key, value)
  }

  removeItem(key: string) {
    if (this.shouldThrow) throw new Error('storage unavailable')
    this.values.delete(key)
  }
}

describe('journey storage', () => {
  it('round-trips a versioned, validated journey list', () => {
    const storage = new MemoryStorage()
    expect(saveJourneys(RECORDS, storage)).toBe(true)
    expect(storage.values.get(STORAGE_KEY)).toContain('"version":1')
    expect(loadJourneys(storage)).toEqual(RECORDS)
  })

  it('filters invalid records from parsed storage', () => {
    const storage = new MemoryStorage()
    storage.values.set(
      STORAGE_KEY,
      JSON.stringify({ version: 1, journeys: [RECORDS[0], { id: 'bad', mode: 'plane' }] }),
    )

    expect(loadJourneys(storage)).toEqual([RECORDS[0]])
  })

  it('drops sample routes that older versions saved alongside real records', () => {
    const storage = new MemoryStorage()
    saveJourneys([RECORDS[0], ...STARTER_JOURNEYS], storage)
    expect(loadJourneys(storage)).toEqual([RECORDS[0]])
  })

  it('fails closed when JSON is corrupt or storage throws', () => {
    const storage = new MemoryStorage()
    storage.values.set(STORAGE_KEY, '{not valid json')
    expect(loadJourneys(storage)).toEqual([])

    storage.shouldThrow = true
    expect(loadJourneys(storage)).toEqual([])
    expect(saveJourneys(STARTER_JOURNEYS, storage)).toBe(false)
    expect(clearJourneys(storage)).toBe(false)
  })

  it('remembers whether sample routes are shown', () => {
    const storage = new MemoryStorage()
    expect(loadSettings(storage)).toBeNull()
    expect(saveSettings({ showSamples: false }, storage)).toBe(true)
    expect(loadSettings(storage)).toEqual({ showSamples: false })

    storage.values.set(SETTINGS_KEY, '{"version":1,"showSamples":"yes"}')
    expect(loadSettings(storage)).toBeNull()
  })
})

describe('backup import', () => {
  it('reads the exported backup format and skips samples and broken records', () => {
    const exported = JSON.stringify({
      app: 'みちログ',
      version: 1,
      exportedAt: '2026-10-25T00:00:00.000Z',
      journeys: [...RECORDS, STARTER_JOURNEYS[1], { id: 'x', mode: 'plane' }],
    })
    expect(parseBackup(exported)).toEqual({ journeys: RECORDS, invalidCount: 1 })
  })

  it('also accepts a bare array of journeys', () => {
    expect(parseBackup(JSON.stringify(RECORDS)).journeys).toEqual(RECORDS)
  })

  it('rejects files that are not michilog backups', () => {
    expect(() => parseBackup('not json')).toThrow(BackupFormatError)
    expect(() => parseBackup('{"name":"something else"}')).toThrow(BackupFormatError)
  })

  it('adds only new journeys and keeps the newest first', () => {
    const older = ownJourney('e5f6', '2026-10-01T01:00:00.000Z')
    const newer = ownJourney('g7h8', '2026-10-24T01:00:00.000Z')
    const result = mergeJourneys(RECORDS, [RECORDS[0], older, newer])

    expect(result.added).toBe(2)
    expect(result.duplicates).toBe(1)
    expect(result.journeys.map((journey) => journey.id)).toEqual(['g7h8', 'a1b2', 'c3d4', 'e5f6'])
  })
})
