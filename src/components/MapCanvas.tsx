import { useEffect, useMemo, useState } from 'react'
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
  selectedJourneyId?: string
}

const DEFAULT_CENTER: LatLngExpression = [35.6812, 139.7671]

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

const routeColor = (mode: JourneyMode) => mode === 'road' ? '#ff6248' : '#078d85'

export function MapCanvas({
  mode,
  onModeChange,
  isRecording,
  activePoints,
  journeys,
  selectedJourneyId,
}: MapCanvasProps) {
  const [focusRequest, setFocusRequest] = useState(0)
  const [tileStatus, setTileStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const selectedJourney = useMemo(
    () => journeys.find((journey) => journey.id === selectedJourneyId) ?? journeys[0],
    [journeys, selectedJourneyId],
  )
  const focusPoints = activePoints.length > 0 ? activePoints : selectedJourney?.points ?? []
  const activeLatLngs = useMemo(() => toLatLngs(activePoints), [activePoints])
  const focusMode = activePoints.length > 0 ? mode : selectedJourney?.mode ?? mode

  return (
    <section className="map-canvas" aria-label="旅の地図">
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

        {journeys.map((journey) => {
          const isSelected = journey.id === selectedJourney?.id && activePoints.length === 0
          const positions = toLatLngs(journey.points)
          if (positions.length < 2) return null
          return (
            <Polyline
              key={journey.id}
              positions={positions}
              pathOptions={{
                color: routeColor(journey.mode),
                dashArray: journey.mode === 'rail' ? '10 7' : undefined,
                lineCap: 'round',
                lineJoin: 'round',
                opacity: isSelected ? 0.95 : 0.32,
                weight: isSelected ? 7 : 4,
              }}
            />
          )
        })}

        {activeLatLngs.length > 1 ? (
          <Polyline
            positions={activeLatLngs}
            pathOptions={{
              color: routeColor(mode),
              dashArray: mode === 'rail' ? '10 7' : undefined,
              lineCap: 'round',
              lineJoin: 'round',
              opacity: 1,
              weight: 7,
            }}
          />
        ) : null}

        {focusPoints.length > 0 ? (
          <>
            <CircleMarker
              center={[focusPoints[0].latitude, focusPoints[0].longitude]}
              radius={6}
              pathOptions={{ color: '#ffffff', fillColor: routeColor(focusMode), fillOpacity: 1, weight: 3 }}
            />
            <CircleMarker
              center={[focusPoints.at(-1)!.latitude, focusPoints.at(-1)!.longitude]}
              radius={9}
              pathOptions={{ color: '#ffffff', fillColor: '#246bfd', fillOpacity: 1, weight: 3 }}
            />
          </>
        ) : null}
      </MapContainer>

      <div className="map-legend" aria-label="地図の凡例">
        <span><i className="legend-road" />道路</span>
        <span><i className="legend-rail" />鉄道</span>
        <span><i className="legend-location" />現在地</span>
      </div>
      <button
        className="map-recenter-control"
        type="button"
        onClick={() => setFocusRequest((current) => current + 1)}
        aria-label="選択中の記録を地図に収める"
        title="選択中の記録を表示"
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
