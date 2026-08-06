import type { TrackPoint } from '../types'

const EARTH_RADIUS_METERS = 6_371_000

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export function distanceBetween(a: TrackPoint, b: TrackPoint): number {
  const latitudeDelta = toRadians(b.latitude - a.latitude)
  const longitudeDelta = toRadians(b.longitude - a.longitude)
  const latitudeA = toRadians(a.latitude)
  const latitudeB = toRadians(b.latitude)

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine))
}

export function calculateDistance(points: TrackPoint[]): number {
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    total += distanceBetween(points[index - 1], points[index])
  }
  return total
}

export function calculateSpeedKmh(previous: TrackPoint | undefined, current: TrackPoint): number {
  if (typeof current.speed === 'number' && current.speed >= 0) {
    return current.speed * 3.6
  }

  if (!previous) return 0
  const elapsedSeconds = (current.timestamp - previous.timestamp) / 1000
  if (elapsedSeconds <= 0) return 0
  return (distanceBetween(previous, current) / elapsedSeconds) * 3.6
}

export function formatDistance(distanceMeters: number): string {
  return `${(Math.max(0, distanceMeters) / 1000).toFixed(1)} km`
}

export function formatDuration(durationSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatSpeed(speedKmh: number): string {
  return `${Math.max(0, Math.round(speedKmh))} km/h`
}

