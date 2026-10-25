import { useMemo, useState, type ReactNode } from 'react'
import { formatDistance, formatDuration } from '../lib/geo'
import type { Journey, JourneyMode } from '../types'
import { Icon } from './Icon'

type HistoryFilter = 'all' | JourneyMode

interface HistoryViewProps {
  journeys: Journey[]
  onSelect: (journey: Journey) => void
  onDelete: (journeyId: string) => void
  onClear: () => void
  onExport: () => void
  importButton?: ReactNode
}

const fullDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function HistoryView({ journeys, onSelect, onDelete, onClear, onExport, importButton }: HistoryViewProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const filteredJourneys = useMemo(
    () => journeys.filter((journey) => filter === 'all' || journey.mode === filter),
    [filter, journeys],
  )
  const totalDistance = useMemo(
    () => filteredJourneys.reduce((total, journey) => total + journey.distanceMeters, 0),
    [filteredJourneys],
  )

  return (
    <main className="history-view">
      <section className="history-intro">
        <div>
          <h1>通過記録</h1>
          <p>青い地図を作っている元データです。選ぶとその区間を地図の中心に表示します。</p>
        </div>
        <div className="history-backup-actions">
          <button className="export-button" type="button" onClick={onExport} disabled={journeys.length === 0}>
            <Icon name="download" size={19} />
            JSONでバックアップ
          </button>
          {importButton}
        </div>
      </section>

      <section className="history-summary" aria-label="履歴の集計">
        <div><strong>{filteredJourneys.length}</strong><span>件の記録</span></div>
        <div><strong>{formatDistance(totalDistance)}</strong><span>通った距離</span></div>
        <div className="history-privacy"><Icon name="lock" size={18} /><span>サーバー送信なし</span></div>
      </section>

      <div className="history-toolbar">
        <div className="history-filters" aria-label="履歴を絞り込む">
          {([
            ['all', 'すべて'],
            ['road', '車'],
            ['walk', '徒歩'],
            ['rail', '電車'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'is-active' : ''}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {value !== 'all' ? <Icon name={value} size={18} /> : null}
              {label}
            </button>
          ))}
        </div>
        <button className="clear-button" type="button" onClick={onClear} disabled={journeys.length === 0}>
          <Icon name="trash" size={17} />
          すべて削除
        </button>
      </div>

      {filteredJourneys.length > 0 ? (
        <ol className="history-list">
          {filteredJourneys.map((journey) => (
            <li key={journey.id}>
              <button className="history-main-action" type="button" onClick={() => onSelect(journey)}>
                <span className={`journey-icon is-${journey.mode}`}>
                  <Icon name={journey.mode} />
                </span>
                <span className="history-copy">
                  <strong>
                    {journey.name}
                    {journey.source === 'demo' ? <em className="demo-badge">デモ</em> : null}
                  </strong>
                  <small>{fullDateFormatter.format(new Date(journey.startedAt))}</small>
                </span>
                <span className="history-meta">
                  <b>{formatDistance(journey.distanceMeters)}</b>
                  <small>{formatDuration(journey.durationSeconds)}</small>
                </span>
                <Icon name="chevron" size={20} />
              </button>
              <button
                className="journey-delete-button"
                type="button"
                onClick={() => onDelete(journey.id)}
                aria-label={`${journey.name}を削除`}
              >
                <Icon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="history-empty">
          <Icon name="route" size={34} />
          <h2>該当する記録はありません</h2>
          <p>地図画面の「記録をはじめる」から最初の区間を残せます。</p>
        </div>
      )}
    </main>
  )
}
