import { formatDistance, formatDuration, formatSpeed } from '../lib/geo'
import type { ActiveJourney, JourneyMode, RecorderStatus } from '../types'
import { Icon } from './Icon'
import { ModeSwitch } from './ModeSwitch'

interface RecordingPanelProps {
  mode: JourneyMode
  onModeChange: (mode: JourneyMode) => void
  status: RecorderStatus
  active: ActiveJourney | null
  errorMessage: string
  onStartGps: () => void
  onStartDemo: () => void
  onFinish: () => void
  onDismissError: () => void
}

function statusCopy(status: RecorderStatus, active: ActiveJourney | null) {
  if (status === 'requesting') return '位置情報の許可を待っています'
  if (status === 'recording') {
    return active?.source === 'demo' ? 'デモの経路を記録中です' : '現在地を記録しています'
  }
  if (status === 'error') return '記録を開始できませんでした'
  return '記録の準備ができています'
}

export function RecordingPanel({
  mode,
  onModeChange,
  status,
  active,
  errorMessage,
  onStartGps,
  onStartDemo,
  onFinish,
  onDismissError,
}: RecordingPanelProps) {
  const isActive = status === 'recording' || status === 'requesting'

  return (
    <aside className="recording-panel" id="recording-panel" aria-labelledby="recording-heading" tabIndex={-1}>
      <div className="sheet-handle" aria-hidden="true" />
      <div className="recording-heading-row">
        <h1 id="recording-heading">今日の記録</h1>
        <p className={`recording-status is-${status}`}>
          <span className="status-icon"><Icon name={status === 'error' ? 'info' : 'check'} size={17} /></span>
          {statusCopy(status, active)}
        </p>
      </div>

      <div className="desktop-mode-block">
        <span className="field-label">モードを選択</span>
        <ModeSwitch mode={mode} onChange={onModeChange} disabled={isActive} />
      </div>

      {errorMessage ? (
        <div className="recorder-error" role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={onDismissError}>閉じる</button>
        </div>
      ) : null}

      <div className="recording-metrics" aria-label="現在の記録">
        <div>
          <Icon name="route" />
          <strong>{formatDistance(active?.distanceMeters ?? 0)}</strong>
          <span>距離</span>
        </div>
        <div>
          <Icon name="timer" />
          <strong>{formatDuration(active?.durationSeconds ?? 0)}</strong>
          <span>時間</span>
        </div>
        <div>
          <Icon name="speed" />
          <strong>{formatSpeed(active?.currentSpeedKmh ?? 0)}</strong>
          <span>速度</span>
        </div>
      </div>

      <div className="record-actions">
        <button
          className={`primary-record-button ${isActive ? 'is-recording' : ''}`}
          type="button"
          onClick={isActive ? onFinish : onStartGps}
        >
          <span className="record-button-icon" aria-hidden="true" />
          {status === 'requesting'
            ? '待機を終了する'
            : status === 'recording'
              ? '記録を終了して保存'
              : '記録をはじめる'}
        </button>
        <button
          className="demo-button"
          type="button"
          onClick={onStartDemo}
          disabled={isActive}
        >
          <Icon name="play" size={20} />
          デモで試す
        </button>
      </div>
      <p className="privacy-note">
        <Icon name="lock" size={15} />
        記録はこの端末だけに保存されます
      </p>
    </aside>
  )
}
