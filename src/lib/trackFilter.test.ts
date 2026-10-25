import { describe, expect, it } from 'vitest'
import { calculateDistance } from './geo'
import { FILTER_PROFILES, evaluatePoint, filterTrack, simplifyTrack } from './trackFilter'
import type { TrackPoint } from '../types'

// 緯度方向に約1.11mずつ進む点を作る（0.00001度 ≒ 1.11m）
const point = (northMeters: number, seconds: number, accuracy = 5, eastMeters = 0): TrackPoint => ({
  latitude: 35.68 + northMeters / 111_320,
  longitude: 139.76 + eastMeters / (111_320 * Math.cos((35.68 * Math.PI) / 180)),
  timestamp: seconds * 1000,
  accuracy,
})

describe('evaluatePoint', () => {
  const road = FILTER_PROFILES.road

  it('accepts the first accurate point and rejects an inaccurate one', () => {
    expect(evaluatePoint(undefined, point(0, 0, 8), road)).toBe('accepted')
    expect(evaluatePoint(undefined, point(0, 0, 120), road)).toBe('low-accuracy')
  })

  it('ignores jitter while stopped at a signal', () => {
    expect(evaluatePoint(point(0, 0), point(3, 5), road)).toBe('too-close')
    expect(evaluatePoint(point(0, 0), point(40, 5), road)).toBe('accepted')
  })

  it('needs a larger step when the reported accuracy is worse', () => {
    // 誤差40mなら20m未満の移動はふらつきとみなす
    expect(evaluatePoint(point(0, 0), point(15, 5, 40), road)).toBe('too-close')
    expect(evaluatePoint(point(0, 0), point(25, 5, 40), road)).toBe('accepted')
  })

  it('drops jumps faster than the mode allows', () => {
    // 1秒で500m = 1800 km/h
    expect(evaluatePoint(point(0, 0), point(500, 1), road)).toBe('implausible-speed')
    expect(evaluatePoint(point(0, 1), point(30, 1), road)).toBe('implausible-speed')
  })

  it('rejects broken coordinates', () => {
    expect(evaluatePoint(undefined, { latitude: Number.NaN, longitude: 139, timestamp: 0 }, road)).toBe('invalid')
  })

  it('uses looser limits on trains than on foot', () => {
    const fromTrain = point(0, 0)
    const candidate = point(500, 10, 80) // 180 km/h、誤差80m
    expect(evaluatePoint(fromTrain, candidate, FILTER_PROFILES.rail)).toBe('accepted')
    expect(evaluatePoint(fromTrain, candidate, FILTER_PROFILES.walk)).not.toBe('accepted')
  })
})

describe('filterTrack', () => {
  it('removes a stationary cluster and an outlier but keeps the real path', () => {
    const raw = [
      point(0, 0),
      point(2, 5),
      point(-1, 10),
      point(1, 15), // 停車中のふらつき
      point(60, 20),
      point(2_000, 21), // 1秒で約2km先へ飛んだ点
      point(120, 25),
      point(180, 30, 200), // 誤差200m
      point(180, 31),
    ]
    const filtered = filterTrack(raw, FILTER_PROFILES.road)
    expect(filtered.map((p) => p.timestamp / 1000)).toEqual([0, 20, 25, 31])
    expect(calculateDistance(filtered)).toBeGreaterThan(170)
    expect(calculateDistance(filtered)).toBeLessThan(190)
  })
})

describe('simplifyTrack', () => {
  it('drops points on a straight line and keeps the corner', () => {
    const straightThenTurn = [
      ...Array.from({ length: 11 }, (_, index) => point(index * 20, index * 2)),
      ...Array.from({ length: 10 }, (_, index) => point(200, 22 + index * 2, 5, (index + 1) * 20)),
    ]
    const simplified = simplifyTrack(straightThenTurn, 5)
    expect(simplified).toHaveLength(3)
    expect(simplified[0]).toBe(straightThenTurn[0])
    expect(simplified[1]).toBe(straightThenTurn[10])
    expect(simplified.at(-1)).toBe(straightThenTurn.at(-1))
  })

  it('returns short tracks unchanged without mutating input', () => {
    const points = [point(0, 0), point(10, 1)]
    const result = simplifyTrack(points, 5)
    expect(result).toEqual(points)
    expect(result).not.toBe(points)
  })
})
