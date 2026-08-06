export type JourneyMode = 'road' | 'rail'
export type JourneySource = 'gps' | 'demo'

export interface TrackPoint {
  latitude: number
  longitude: number
  timestamp: number
  accuracy?: number
  speed?: number | null
}

export interface Journey {
  id: string
  name: string
  mode: JourneyMode
  source: JourneySource
  startedAt: string
  endedAt: string
  distanceMeters: number
  durationSeconds: number
  points: TrackPoint[]
}

export interface ActiveJourney {
  mode: JourneyMode
  source: JourneySource
  startedAt: number
  points: TrackPoint[]
  distanceMeters: number
  durationSeconds: number
  currentSpeedKmh: number
}

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'error'
export type AppView = 'map' | 'record' | 'history'

