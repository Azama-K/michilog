import { Fragment, useEffect, useMemo, useState } from 'react'
import type { LatLngExpression, LatLngTuple } from 'leaflet'
import {
  AttributionControl,
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Journey, JourneyMode, TrackPoint } from '../types'
import { Icon } from './Icon'
import { ModeSwitch } from './ModeSwitch'

interface MapCanvasProps {
  mode: JourneyMode
  onModeChange: (mode: JourneyMode) => void
  isRecording: boolean
  activePoints: TrackPoint[]
  journeys: Journey[]
  /** 見本として表示するサンプル経路。記録とは別の見た目で描く */
  sampleJourneys?: Journey[]
  focusJourneyId?: string
}

const DEFAULT_CENTER: LatLngExpression = [35.6812, 139.7671]
// 毎回新しい配列を作ると地図の再フィットが走るため、空配列は共有する
const NO_JOURNEYS: Journey[] = []

function toLatLngs(points: TrackPoint[]): LatLngTuple[] {
  return points.map((point) => [point.latitude, point.longitude])
}

function ViewportController({ points, focusRequest }: { points: TrackPoint[]; focusRequest: number }) {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, 12, { animate: true })
      return
    }
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 16, { animate: true })
      return
    }
    map.fitBounds(toLatLngs(points), { animate: true, maxZoom: 16, padding: [56, 56] })
  }, [focusRequest, map, points])

  return null
}

export function MapCanvas({
  mode,
  onModeChange,
  isRecording,
  activePoints,
  journeys,
  sampleJourneys = NO_JOURNEYS,
  focusJourneyId,
}: MapCanvasProps) {
  const [focusRequest, setFocusRequest] = useState(0)
  const [tileStatus, setTileStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const focusJourney = useMemo(
    () => journeys.find((journey) => journey.id === focusJourneyId),
    [focusJourneyId, journeys],
  )
  // 自分の記録があればそれを優先して地図に収め、なければサンプルを収める
  const allCoveragePoints = useMemo(
    () => (journeys.length > 0 ? journeys : sampleJourneys).flatMap((journey) => journey.points),
    [journeys, sampleJourneys],
  )
  const focusPoints = activePoints.length > 0
    ? activePoints
    : focusJourney?.points ?? allCoveragePoints
  const activeLatLngs = useMemo(() => toLatLngs(activePoints), [activePoints])

  return (
    <section className="map-canvas" aria-label="これまでに通った道の地図">
      <ModeSwitch
        mode={mode}
        onChange={onModeChange}
        disabled={isRecording}
        className="mobile-mode-switch"
      />

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        zoomControl={false}
        attributionControl={false}
        preferCanvas
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            load: () => setTileStatus('ready'),
            tileerror: () => setTileStatus('error'),
          }}
        />
        <ZoomControl position="topright" />
        <AttributionControl position="bottomright" prefix={false} />
        <ViewportController points={focusPoints} focusRequest={focusRequest} />

        {sampleJourneys.map((journey) => {
          const positions = toLatLngs(journey.points)
          if (positions.length < 2) return null
          // 背景地図の模様に埋もれないよう、白い縁取りの上に点線を重ねる
          return (
            <Fragment key={journey.id}>
              <Polyline
                positions={positions}
                interactive={false}
                pathOptions={{ color: '#ffffff', lineCap: 'round', lineJoin: 'round', opacity: 0.9, weight: 9 }}
              />
              <Polyline
                positions={positions}
                interactive={false}
                pathOptions={{
                  color: '#4d5d78',
                  dashArray: '1 11',
                  lineCap: 'round',
                  lineJoin: 'round',
                  opacity: 1,
                  weight: 5,
                }}
              />
            </Fragment>
          )
        })}

        {journeys.map((journey) => {
          const positions = toLatLngs(journey.points)
          if (positions.length < 2) return null
          return (
            <Polyline
              key={journey.id}
              positions={positions}
              pathOptions={{
                color: '#1769f4',
                lineCap: 'round',
                lineJoin: 'round',
                opacity: 0.9,
                weight: 6,
              }}
            />
          )
        })}

        {activeLatLngs.length > 1 ? (
          <Polyline
            positions={activeLatLngs}
            pathOptions={{
              color: '#ff6248',
              lineCap: 'round',
              lineJoin: 'round',
              opacity: 1,
              weight: 7,
            }}
          />
        ) : null}

        {activePoints.length > 0 ? (
          <>
            <CircleMarker
              center={[activePoints[0].latitude, activePoints[0].longitude]}
              radius={6}
              pathOptions={{ color: '#ffffff', fillColor: '#ff6248', fillOpacity: 1, weight: 3 }}
            />
            <CircleMarker
              center={[activePoints.at(-1)!.latitude, activePoints.at(-1)!.longitude]}
              radius={9}
              pathOptions={{ color: '#ffffff', fillColor: '#246bfd', fillOpacity: 1, weight: 3 }}
            />
          </>
        ) : null}
      </MapContainer>

      <div className="map-legend" aria-label="地図の凡例">
        <span><i className="legend-visited" />通った道</span>
        <span><i className="legend-recording" />記録中</span>
        {sampleJourneys.length > 0 ? <span><i className="legend-sample" />サンプル</span> : null}
      </div>
      <button
        className="map-recenter-control"
        type="button"
        onClick={() => setFocusRequest((current) => current + 1)}
        aria-label="通った道を地図に収める"
        title="通った道をすべて表示"
      >
        <Icon name="location" />
      </button>
      {tileStatus === 'error' ? (
        <p className="map-tile-error" role="status">背景地図を読み込めません。インターネット接続をご確認ください。</p>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {tileStatus === 'loading' ? '背景地図を読み込んでいます' : tileStatus === 'ready' ? '背景地図を表示しました' : '背景地図を読み込めませんでした'}
      </p>
    </section>
  )
}
