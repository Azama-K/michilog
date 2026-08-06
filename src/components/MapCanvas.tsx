import { useMemo, useState } from 'react'
import type { JourneyMode, TrackPoint } from '../types'
import { Icon } from './Icon'
import { ModeSwitch } from './ModeSwitch'

interface MapCanvasProps {
  mode: JourneyMode
  onModeChange: (mode: JourneyMode) => void
  isRecording: boolean
  activePoints: TrackPoint[]
  selectedPoints?: TrackPoint[]
  selectedMode?: JourneyMode
}

const STREET_PATHS = [
  'M-20 150 C180 120 260 210 430 180 S720 110 1230 180',
  'M-10 260 C220 230 330 300 520 265 S900 215 1220 275',
  'M-10 380 C190 350 380 420 600 370 S940 330 1220 405',
  'M-10 520 C230 475 360 560 560 520 S940 480 1220 540',
  'M20 690 C240 620 390 710 620 670 S980 610 1210 690',
  'M130 -20 C110 180 220 280 165 820',
  'M320 -20 C360 180 270 330 350 820',
  'M520 -20 C470 160 580 330 525 820',
  'M730 -20 C690 180 790 310 720 820',
  'M950 -20 C900 170 1010 380 930 820',
]

const SMALL_STREETS = [
  'M0 90 1200 710',
  'M0 620 880 0',
  'M150 0 1120 800',
  'M0 750 980 0',
  'M250 800 1100 0',
  'M0 320 560 0',
  'M640 800 1200 430',
  'M760 0 1200 250',
]

function projectCoordinates(points: TrackPoint[]): Array<[number, number]> {
  if (points.length === 0) return []
  if (points.length === 1) return [[600, 390]]

  const longitudes = points.map((point) => point.longitude)
  const latitudes = points.map((point) => point.latitude)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const longitudeSpan = Math.max(maxLongitude - minLongitude, 0.001)
  const latitudeSpan = Math.max(maxLatitude - minLatitude, 0.001)

  return points.map((point) => {
      const x = 140 + ((point.longitude - minLongitude) / longitudeSpan) * 900
      const y = 90 + (1 - (point.latitude - minLatitude) / latitudeSpan) * 620
      return [Number(x.toFixed(1)), Number(y.toFixed(1))]
    })
}

export function MapCanvas({
  mode,
  onModeChange,
  isRecording,
  activePoints,
  selectedPoints = [],
  selectedMode,
}: MapCanvasProps) {
  const [zoom, setZoom] = useState(1)
  const [mapMessage, setMapMessage] = useState('')
  const displayPoints = activePoints.length > 0 ? activePoints : selectedPoints
  const displayMode = activePoints.length > 0 ? mode : selectedMode ?? mode
  const projectedCoordinates = useMemo(() => projectCoordinates(displayPoints), [displayPoints])
  const projectedPoints = projectedCoordinates.map(([x, y]) => `${x},${y}`).join(' ')
  const groupTransform = `translate(${600 - 600 * zoom} ${400 - 400 * zoom}) scale(${zoom})`

  const recenter = () => {
    setZoom(1)
    setMapMessage(activePoints.length > 0 ? '記録中の現在地を中心に表示しました' : '地図を初期位置に戻しました')
  }

  return (
    <section className="map-canvas" aria-label="旅の地図">
      <ModeSwitch
        mode={mode}
        onChange={onModeChange}
        disabled={isRecording}
        className="mobile-mode-switch"
      />
      <svg viewBox="0 0 1200 800" role="img" aria-label="東京周辺の道路と鉄道路線の概略地図">
        <defs>
          <pattern id="map-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M36 0H0V36" className="map-grid-line" />
          </pattern>
        </defs>
        <rect width="1200" height="800" className="map-background" />
        <rect width="1200" height="800" fill="url(#map-grid)" />
        <g transform={groupTransform}>
          <path className="map-water" d="M1040-20c-55 160-8 252-66 392-47 112-8 248-78 448h324V-20Z" />
          <path className="map-park" d="m510 285 120-44 96 87-41 120-135 11-68-88Z" />
          <path className="map-park" d="m145 530 105-34 68 70-31 98-126 12-50-72Z" />
          <g className="small-streets">
            {SMALL_STREETS.map((path) => <path key={path} d={path} />)}
          </g>
          <g className="street-lines">
            {STREET_PATHS.map((path) => <path key={path} d={path} />)}
          </g>
          <path className="rail-bed" d="M170 80C205 210 180 320 250 440s22 220 95 340" />
          <path className="rail-line" d="M170 80C205 210 180 320 250 440s22 220 95 340" />
          <path className="rail-bed" d="M760 30c-20 140 70 240 22 365s-100 210-70 385" />
          <path className="rail-line" d="M760 30c-20 140 70 240 22 365s-100 210-70 385" />
          {projectedPoints && displayMode === 'road' ? null : (
            <>
              <path className="road-route-shadow" d="M120 680c-70-120 5-210 94-248 88-38 89-135 183-130 93 5 90 90 186 51 92-38 77-118 174-118 97 0 113-79 224-143" />
              <path className="road-route" d="M120 680c-70-120 5-210 94-248 88-38 89-135 183-130 93 5 90 90 186 51 92-38 77-118 174-118 97 0 113-79 224-143" />
            </>
          )}
          {['170,80', '219,376', '250,440', '345,780', '760,30', '782,395', '728,586', '712,780'].map((point) => {
            const [cx, cy] = point.split(',')
            return <circle key={point} cx={cx} cy={cy} r="10" className="station-dot" />
          })}
          <g className="map-labels">
            <text x="410" y="176">新宿区</text>
            <text x="665" y="194">文京区</text>
            <text x="845" y="224">台東区</text>
            <text x="555" y="430">東京</text>
            <text x="520" y="480">千代田区</text>
            <text x="815" y="500">中央区</text>
            <text x="405" y="647">港区</text>
            <text x="306" y="733">目黒</text>
            <text x="930" y="145">浅草</text>
            <text x="195" y="409">渋谷</text>
          </g>
          {projectedPoints ? (
            <g className={`recorded-track is-${displayMode}`}>
              <polyline points={projectedPoints} />
              {projectedCoordinates.map(([cx, cy], index) => {
                if (index !== 0 && index !== projectedCoordinates.length - 1) return null
                return <circle key={`${displayPoints[index].timestamp}-${index}`} cx={cx} cy={cy} r={index === projectedCoordinates.length - 1 ? 12 : 7} />
              })}
            </g>
          ) : null}
          <g className="current-location" transform="translate(600 390)">
            <circle r="26" className="location-halo" />
            <circle r="10" className="location-core" />
          </g>
        </g>
      </svg>
      <div className="map-legend" aria-label="地図の凡例">
        <span><i className="legend-road" />道路</span>
        <span><i className="legend-rail" />鉄道</span>
        <span><i className="legend-location" />現在地</span>
      </div>
      <div className="map-controls" aria-label="地図操作">
        <button type="button" onClick={() => setZoom((value) => Math.min(1.35, value + 0.15))} aria-label="拡大">
          <Icon name="plus" />
        </button>
        <button type="button" onClick={() => setZoom((value) => Math.max(0.85, value - 0.15))} aria-label="縮小">
          <Icon name="minus" />
        </button>
        <button type="button" onClick={recenter} aria-label="現在地へ移動">
          <Icon name="location" />
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{mapMessage}</p>
    </section>
  )
}
