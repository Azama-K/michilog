import type { Journey, JourneyMode, TrackPoint } from '../types'

const BASE_TIME = Date.UTC(2026, 7, 3, 1, 15)

function makeTrack(coordinates: Array<[number, number]>, speed: number, interval = 60_000): TrackPoint[] {
  return coordinates.map(([latitude, longitude], index) => ({
    latitude,
    longitude,
    timestamp: BASE_TIME + index * interval,
    speed,
    accuracy: 5,
  }))
}

const C1_LOOP = makeTrack([
  [35.6752, 139.7447],
  [35.6825, 139.7498],
  [35.6904, 139.7587],
  [35.6916, 139.7698],
  [35.6858, 139.7791],
  [35.6752, 139.7821],
  [35.6648, 139.7764],
  [35.6548, 139.7661],
  [35.6533, 139.7537],
  [35.6597, 139.7421],
  [35.6687, 139.7374],
  [35.6752, 139.7447],
], 12.5)

const GAIEN_PART = makeTrack([
  [35.6459, 139.7211],
  [35.6546, 139.7205],
  [35.6628, 139.7191],
  [35.6707, 139.7183],
  [35.6791, 139.7198],
  [35.6873, 139.7218],
], 8.5)

const YASUKUNI_WALK = makeTrack([
  [35.6932, 139.7004],
  [35.6934, 139.7089],
  [35.6941, 139.7191],
  [35.6948, 139.7309],
  [35.6953, 139.7428],
  [35.6957, 139.7514],
], 1.4, 180_000)

const YAMANOTE_PART = makeTrack([
  [35.6580, 139.7016],
  [35.6702, 139.7027],
  [35.6896, 139.7006],
  [35.7126, 139.7038],
  [35.7289, 139.7104],
  [35.7384, 139.7285],
], 15.2, 95_000)

export const DEMO_TRACKS: Record<JourneyMode, TrackPoint[]> = {
  road: C1_LOOP,
  walk: YASUKUNI_WALK,
  rail: YAMANOTE_PART,
}

export const STARTER_JOURNEYS: Journey[] = [
  {
    id: 'sample-c1-loop',
    name: '首都高 C1 一周',
    mode: 'road',
    source: 'demo',
    startedAt: '2026-08-03T01:15:00.000Z',
    endedAt: '2026-08-03T01:58:00.000Z',
    distanceMeters: 14_800,
    durationSeconds: 2580,
    points: C1_LOOP,
  },
  {
    id: 'sample-gaien-part',
    name: '外苑通りの一部',
    mode: 'road',
    source: 'demo',
    startedAt: '2026-08-02T02:20:00.000Z',
    endedAt: '2026-08-02T02:42:00.000Z',
    distanceMeters: 5_900,
    durationSeconds: 1320,
    points: GAIEN_PART,
  },
  {
    id: 'sample-yasukuni-walk',
    name: '靖国通りを歩いた区間',
    mode: 'walk',
    source: 'demo',
    startedAt: '2026-08-01T08:10:00.000Z',
    endedAt: '2026-08-01T08:46:00.000Z',
    distanceMeters: 4_100,
    durationSeconds: 2160,
    points: YASUKUNI_WALK,
  },
  {
    id: 'sample-yamanote-part',
    name: '山手線の北西区間',
    mode: 'rail',
    source: 'demo',
    startedAt: '2026-07-31T04:20:00.000Z',
    endedAt: '2026-07-31T04:49:00.000Z',
    distanceMeters: 16_300,
    durationSeconds: 1740,
    points: YAMANOTE_PART,
  },
]
