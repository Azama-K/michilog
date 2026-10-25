import type { JourneyMode, TrackPoint } from '../types'
import { distanceBetween } from './geo'

/**
 * GPSの点を記録に採用するかどうかの基準。
 * 交通手段ごとに、許容する誤差・最小移動距離・ありえない速度が違うため分けている。
 */
export interface FilterProfile {
  /** これより誤差半径（m）が大きい点は捨てる */
  maxAccuracyMeters: number
  /** 前の点からこれ未満しか動いていない点は捨てる（停車中のふらつき対策） */
  minStepMeters: number
  /** 前の点からの速度がこれを超える点は、飛び値として捨てる */
  maxSpeedKmh: number
  /** 保存時に間引くときの許容誤差（m） */
  simplifyToleranceMeters: number
}

export const FILTER_PROFILES: Record<JourneyMode, FilterProfile> = {
  walk: { maxAccuracyMeters: 30, minStepMeters: 5, maxSpeedKmh: 30, simplifyToleranceMeters: 3 },
  road: { maxAccuracyMeters: 50, minStepMeters: 10, maxSpeedKmh: 180, simplifyToleranceMeters: 5 },
  // 電車内はGPSが弱く、点の間隔も長くなりやすいので基準をゆるめる
  rail: { maxAccuracyMeters: 100, minStepMeters: 25, maxSpeedKmh: 330, simplifyToleranceMeters: 10 },
}

export type PointDecision = 'accepted' | 'invalid' | 'low-accuracy' | 'too-close' | 'implausible-speed'

const isValidCoordinate = (point: TrackPoint) =>
  Number.isFinite(point.latitude) &&
  Number.isFinite(point.longitude) &&
  Math.abs(point.latitude) <= 90 &&
  Math.abs(point.longitude) <= 180 &&
  Number.isFinite(point.timestamp)

/**
 * 直前に採用した点 `previous` を基準に、新しい点 `candidate` を記録へ加えるか判定する。
 */
export function evaluatePoint(
  previous: TrackPoint | undefined,
  candidate: TrackPoint,
  profile: FilterProfile,
): PointDecision {
  if (!isValidCoordinate(candidate)) return 'invalid'

  if (typeof candidate.accuracy === 'number' && candidate.accuracy > profile.maxAccuracyMeters) {
    return 'low-accuracy'
  }

  if (!previous) return 'accepted'

  const distance = distanceBetween(previous, candidate)
  // 誤差が大きいほど、ふらつきで動いたように見える距離も大きくなる
  const minDistance = Math.max(profile.minStepMeters, (candidate.accuracy ?? 0) * 0.5)
  if (distance < minDistance) return 'too-close'

  const elapsedSeconds = (candidate.timestamp - previous.timestamp) / 1000
  if (elapsedSeconds <= 0) return 'implausible-speed'
  if ((distance / elapsedSeconds) * 3.6 > profile.maxSpeedKmh) return 'implausible-speed'

  return 'accepted'
}

/** 採用判定をまとめて適用する（取り込みやテスト用） */
export function filterTrack(points: TrackPoint[], profile: FilterProfile): TrackPoint[] {
  const accepted: TrackPoint[] = []
  for (const point of points) {
    if (evaluatePoint(accepted.at(-1), point, profile) === 'accepted') accepted.push(point)
  }
  return accepted
}

/** 緯度経度を、基準点まわりの平面（m単位）へ近似投影する。数km〜数十kmの範囲なら十分な精度。 */
function projector(origin: TrackPoint) {
  const metersPerDegreeLat = 111_320
  const metersPerDegreeLng = 111_320 * Math.cos((origin.latitude * Math.PI) / 180)
  return (point: TrackPoint) => ({
    x: (point.longitude - origin.longitude) * metersPerDegreeLng,
    y: (point.latitude - origin.latitude) * metersPerDegreeLat,
  })
}

function perpendicularDistance(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y)
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy))
}

/**
 * Douglas-Peucker法で、線の形をほぼ保ったまま点を間引く。
 * 直線区間の点が減るので、端末内の保存量と描画負荷が下がる。始点と終点は必ず残す。
 */
export function simplifyTrack(points: TrackPoint[], toleranceMeters: number): TrackPoint[] {
  if (points.length <= 2 || toleranceMeters <= 0) return [...points]

  const project = projector(points[0])
  const projected = points.map(project)
  const keep = new Array<boolean>(points.length).fill(false)
  keep[0] = true
  keep[points.length - 1] = true

  const stack: Array<[number, number]> = [[0, points.length - 1]]
  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop()!
    let farthestIndex = -1
    let farthestDistance = 0
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = perpendicularDistance(projected[index], projected[startIndex], projected[endIndex])
      if (distance > farthestDistance) {
        farthestDistance = distance
        farthestIndex = index
      }
    }
    if (farthestIndex !== -1 && farthestDistance > toleranceMeters) {
      keep[farthestIndex] = true
      stack.push([startIndex, farthestIndex], [farthestIndex, endIndex])
    }
  }

  return points.filter((_, index) => keep[index])
}
