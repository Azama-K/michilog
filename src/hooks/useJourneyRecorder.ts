import { useCallback, useEffect, useRef, useState } from 'react'
import { DEMO_TRACKS } from '../data/demo'
import { calculateSpeedKmh, distanceBetween } from '../lib/geo'
import { FILTER_PROFILES, evaluatePoint, simplifyTrack } from '../lib/trackFilter'
import type { ActiveJourney, Journey, JourneyMode, RecorderStatus, TrackPoint } from '../types'

interface UseJourneyRecorderOptions {
  mode: JourneyMode
  onSave: (journey: Journey) => void
}

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `journey-${Date.now()}-${Math.random().toString(16).slice(2)}`

const createActiveJourney = (mode: JourneyMode, source: 'gps' | 'demo'): ActiveJourney => ({
  mode,
  source,
  startedAt: Date.now(),
  points: [],
  distanceMeters: 0,
  durationSeconds: 0,
  currentSpeedKmh: 0,
  latestAccuracyMeters: null,
  waitingForAccuracy: false,
})

export function useJourneyRecorder({ mode, onSave }: UseJourneyRecorderOptions) {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [active, setActive] = useState<ActiveJourney | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const activeRef = useRef<ActiveJourney | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const demoTimerRef = useRef<number | null>(null)

  const updateActive = useCallback((updater: (current: ActiveJourney) => ActiveJourney) => {
    const current = activeRef.current
    if (!current) return
    const next = updater(current)
    activeRef.current = next
    setActive(next)
  }, [])

  const stopResources = useCallback(() => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (demoTimerRef.current !== null) {
      window.clearInterval(demoTimerRef.current)
      demoTimerRef.current = null
    }
  }, [])

  const begin = useCallback((source: 'gps' | 'demo') => {
    const journey = createActiveJourney(mode, source)
    activeRef.current = journey
    setActive(journey)
    setErrorMessage('')
    timerRef.current = window.setInterval(() => {
      updateActive((current) => ({
        ...current,
        durationSeconds: Math.max(0, Math.floor((Date.now() - current.startedAt) / 1000)),
      }))
    }, 1000)
    return journey
  }, [mode, updateActive])

  const finish = useCallback(() => {
    const current = activeRef.current
    stopResources()
    if (!current || current.points.length < 2) {
      activeRef.current = null
      setActive(null)
      setStatus('error')
      setErrorMessage(
        !current || current.points.length === 0
          ? current?.latestAccuracyMeters != null
            ? 'GPSの精度が低い状態が続いたため、記録は保存しませんでした。空が開けた場所でお試しください。'
            : '位置を取得できなかったため、記録は保存しませんでした。'
          : '移動がほとんど記録されなかったため、保存しませんでした。',
      )
      return
    }

    const endedAt = Date.now()
    const dateLabel = new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
    }).format(current.startedAt)
    const journey: Journey = {
      id: createId(),
      name: `${current.mode === 'road' ? '車' : current.mode === 'walk' ? '徒歩' : '電車'}の記録 · ${dateLabel}`,
      mode: current.mode,
      source: current.source,
      startedAt: new Date(current.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      distanceMeters: current.distanceMeters,
      durationSeconds: Math.max(current.durationSeconds, Math.floor((endedAt - current.startedAt) / 1000)),
      // 線の形を保ったまま点を間引いて保存する（距離は間引く前の値を使う）
      points: current.source === 'gps'
        ? simplifyTrack(current.points, FILTER_PROFILES[current.mode].simplifyToleranceMeters)
        : current.points,
    }
    onSave(journey)
    activeRef.current = null
    setActive(null)
    setStatus('idle')
  }, [onSave, stopResources])

  const appendPoint = useCallback((point: TrackPoint) => {
    updateActive((current) => {
      const previous = current.points.at(-1)
      const accuracy = typeof point.accuracy === 'number' ? point.accuracy : null
      // デモ記録は既知の経路なので、GPS用のノイズ除去を通さない
      const decision = current.source === 'gps'
        ? evaluatePoint(previous, point, FILTER_PROFILES[current.mode])
        : 'accepted'
      if (decision !== 'accepted') {
        return {
          ...current,
          latestAccuracyMeters: accuracy,
          waitingForAccuracy: decision === 'low-accuracy',
          // 停止中のふらつきは「止まっている」とみなす
          currentSpeedKmh: decision === 'too-close' ? 0 : current.currentSpeedKmh,
        }
      }
      const addedDistance = previous ? distanceBetween(previous, point) : 0
      return {
        ...current,
        points: [...current.points, point],
        distanceMeters: current.distanceMeters + addedDistance,
        currentSpeedKmh: calculateSpeedKmh(previous, point),
        latestAccuracyMeters: accuracy,
        waitingForAccuracy: false,
      }
    })
  }, [updateActive])

  const startGps = useCallback(() => {
    if (status === 'recording' || status === 'requesting') return
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setErrorMessage('このブラウザでは位置情報を利用できません。デモ記録をお試しください。')
      return
    }

    begin('gps')
    setStatus('requesting')
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setStatus('recording')
        appendPoint({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
        })
      },
      (error) => {
        stopResources()
        activeRef.current = null
        setActive(null)
        setStatus('error')
        setErrorMessage(
          error.code === error.PERMISSION_DENIED
            ? '位置情報が許可されていません。ブラウザの設定を確認するか、デモ記録をお試しください。'
            : '現在地を取得できませんでした。電波状況を確認して、もう一度お試しください。',
        )
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    )
  }, [appendPoint, begin, status, stopResources])

  const startDemo = useCallback(() => {
    if (status === 'recording' || status === 'requesting') return
    const started = begin('demo')
    setStatus('recording')
    const sourcePoints = DEMO_TRACKS[mode]
    let index = 0
    const addNextPoint = () => {
      const source = sourcePoints[index]
      appendPoint({ ...source, timestamp: started.startedAt + index * 20_000 })
      index += 1
      if (index >= sourcePoints.length) {
        if (demoTimerRef.current !== null) window.clearInterval(demoTimerRef.current)
        demoTimerRef.current = null
      }
    }
    addNextPoint()
    demoTimerRef.current = window.setInterval(addNextPoint, 700)
  }, [appendPoint, begin, mode, status])

  const dismissError = useCallback(() => {
    setErrorMessage('')
    setStatus('idle')
  }, [])

  useEffect(() => stopResources, [stopResources])

  return {
    status,
    active,
    errorMessage,
    startGps,
    startDemo,
    finish,
    dismissError,
  }
}
