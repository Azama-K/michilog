import type { Journey, JourneyMode, TrackPoint } from '../types'

const BASE_TIME = Date.UTC(2026, 7, 3, 1, 15)

export const DEMO_TRACKS: Record<JourneyMode, TrackPoint[]> = {
  road: [
    [35.6282, 139.7387],
    [35.6339, 139.7159],
    [35.6462, 139.7013],
    [35.658, 139.7016],
    [35.6711, 139.7036],
    [35.6812, 139.721],
    [35.6908, 139.7385],
    [35.7011, 139.7662],
    [35.7138, 139.7773],
  ].map(([latitude, longitude], index) => ({
    latitude,
    longitude,
    timestamp: BASE_TIME + index * 70_000,
    speed: 10.5,
    accuracy: 5,
  })),
  rail: [
    [35.658, 139.7016],
    [35.6702, 139.7027],
    [35.6896, 139.7006],
    [35.7126, 139.7038],
    [35.7289, 139.7104],
    [35.7384, 139.7285],
    [35.7295, 139.7693],
    [35.7138, 139.7773],
    [35.6984, 139.7731],
  ].map(([latitude, longitude], index) => ({
    latitude,
    longitude,
    timestamp: BASE_TIME + index * 95_000,
    speed: 15.2,
    accuracy: 4,
  })),
}

export const STARTER_JOURNEYS: Journey[] = [
  {
    id: 'sample-road-tokyo',
    name: '東京ドライブ（湾岸〜渋谷）',
    mode: 'road',
    source: 'demo',
    startedAt: '2026-08-03T01:15:00.000Z',
    endedAt: '2026-08-03T02:04:00.000Z',
    distanceMeters: 28_600,
    durationSeconds: 2940,
    points: DEMO_TRACKS.road,
  },
  {
    id: 'sample-rail-yamanote',
    name: '山手線 一周の旅',
    mode: 'rail',
    source: 'demo',
    startedAt: '2026-08-02T04:20:00.000Z',
    endedAt: '2026-08-02T05:24:00.000Z',
    distanceMeters: 34_500,
    durationSeconds: 3840,
    points: DEMO_TRACKS.rail,
  },
]

