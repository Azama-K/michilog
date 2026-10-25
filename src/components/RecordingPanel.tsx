import { formatDistance, formatDuration } from '../lib/geo'
import type { WakeLockState } from '../hooks/useWakeLock'
import type { ActiveJourney, RecorderStatus } from '../types'

interface RecordingPanelProps {
  status: RecorderStatus
  active: ActiveJourney | null
  errorMessage: string
  wakeLock?: WakeLockState
  onStartGps: () => void
  onFinish: () => void
  onDismissError: () => void
}

export function RecordingPanel({ status, active, errorMessage, wakeLock = 'idle', onStartGps, onFinish, onDismissError }: RecordingPanelProps) {
  const isActive = status === 'recording' || status === 'requesting'

  return (
    <aside className="recording-dock" id="recording-panel" aria-label="通った道の記録" tabIndex={-1}>
      {errorMessage ? (
        <div className="recorder-error" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={onDismissError}>閉じる</button>
        </div>
      ) : null}
      {status === 'requesting' ? <p className="recording-live-status">位置情報の許可を待っています</p> : null}
      {status === 'recording' && active ? (
        <p className="recording-live-status" aria-live="polite">
          記録中 · {formatDistance(active.distanceMeters)} · {formatDuration(active.durationSeconds)}
        </p>
      ) : null}
      {status === 'recording' && active?.waitingForAccuracy ? (
        <p className="recording-live-status is-weak">
          GPSの精度を待っています{active.latestAccuracyMeters != null ? `（誤差 約${Math.round(active.latestAccuracyMeters)}m）` : ''}
        </p>
      ) : null}
      {isActive && (wakeLock === 'unsupported' || wakeLock === 'failed') ? (
        <p className="recording-wake-hint">画面が消えると記録が止まります。記録中は画面を点けたままにしてください。</p>
      ) : null}
      <button
        className={`primary-record-button ${isActive ? 'is-recording' : ''}`}
        type="button"
        onClick={isActive ? onFinish : onStartGps}
      >
        <span className="record-button-icon" aria-hidden="true" />
        {status === 'requesting' ? '待機を終了する' : status === 'recording' ? '記録を終了して保存' : '記録をはじめる'}
      </button>
    </aside>
  )
}
