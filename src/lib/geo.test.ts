import { describe, expect, it } from 'vitest'
import { calculateDistance, calculateSpeedKmh, distanceBetween, formatDistance, formatDuration } from './geo'
import type { TrackPoint } from '../types'

const point = (latitude: number, longitude: number, timestamp = 0): TrackPoint => ({
  latitude,
  longitude,
  timestamp,
})

describe('geo utilities', () => {
  it('calculates a realistic distance between Tokyo and Shinjuku', () => {
    const tokyo = point(35.6812, 139.7671)
    const shinjuku = point(35.6909, 139.7003)
    const distance = distanceBetween(tokyo, shinjuku)

    expect(distance).toBeGreaterThan(6_000)
    expect(distance).toBeLessThan(6_500)
  })

  it('adds every segment without mutating the points', () => {
    const points = [point(35.68, 139.76), point(35.685, 139.75), point(35.69, 139.74)]
    const snapshot = structuredClone(points)

    expect(calculateDistance(points)).toBeGreaterThan(2_000)
    expect(points).toEqual(snapshot)
  })

  it('uses browser speed when available and falls back to distance over time', () => {
    const previous = point(35.68, 139.76, 0)
    const current = { ...point(35.681, 139.76, 10_000), speed: null }
    const reported = { ...current, speed: 12 }

    expect(calculateSpeedKmh(previous, reported)).toBe(43.2)
    expect(calculateSpeedKmh(previous, current)).toBeGreaterThan(39)
  })

  it('formats distance and time for the recording panel', () => {
    expect(formatDistance(28_640)).toBe('28.6 km')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(3_725)).toBe('1:02:05')
    expect(formatDuration(-2)).toBe('0:00')
  })
})

