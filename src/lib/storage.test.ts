import { describe, expect, it } from 'vitest'
import { STARTER_JOURNEYS } from '../data/demo'
import { STORAGE_KEY, clearJourneys, loadJourneys, saveJourneys, type StorageLike } from './storage'

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
    expect(saveJourneys(STARTER_JOURNEYS, storage)).toBe(true)
    expect(storage.values.get(STORAGE_KEY)).toContain('"version":1')
    expect(loadJourneys(storage)).toEqual(STARTER_JOURNEYS)
  })

  it('filters invalid records from parsed storage', () => {
    const storage = new MemoryStorage()
    storage.values.set(
      STORAGE_KEY,
      JSON.stringify({ version: 1, journeys: [STARTER_JOURNEYS[0], { id: 'bad', mode: 'plane' }] }),
    )

    expect(loadJourneys(storage)).toEqual([STARTER_JOURNEYS[0]])
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
})

