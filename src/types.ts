export type JourneyMode = 'road' | 'walk' | 'rail'
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
  /** 直近に受け取ったGPSの誤差半径（m）。採用しなかった点も含む */
  latestAccuracyMeters: number | null
  /** 直近に受け取った点が精度不足で採用されなかったか */
  waitingForAccuracy: boolean
}

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'error'
export type AppView = 'map' | 'history'
