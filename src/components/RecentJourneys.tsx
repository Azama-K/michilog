import { formatDistance } from '../lib/geo'
import type { Journey } from '../types'
import { Icon } from './Icon'

interface RecentJourneysProps {
  journeys: Journey[]
  selectedId?: string
  onSelect: (journey: Journey) => void
  onOpenHistory: () => void
}

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
})

export function RecentJourneys({ journeys, selectedId, onSelect, onOpenHistory }: RecentJourneysProps) {
  const recentByMode: Journey[] = []
  const seenModes = new Set<Journey['mode']>()
  for (const journey of journeys) {
    if (seenModes.has(journey.mode)) continue
    recentByMode.push(journey)
    seenModes.add(journey.mode)
    if (recentByMode.length === 2) break
  }

  return (
    <aside className="recent-journeys" aria-labelledby="recent-heading">
      <div className="recent-heading-row">
        <h2 id="recent-heading">最近の記録</h2>
        <button type="button" onClick={onOpenHistory}>
          すべて見る <Icon name="chevron" size={16} />
        </button>
      </div>
      {journeys.length > 0 ? (
        <ul>
          {recentByMode.map((journey) => (
            <li key={journey.id}>
              <button
                type="button"
                className={selectedId === journey.id ? 'is-selected' : ''}
                onClick={() => onSelect(journey)}
              >
                <span className={`journey-icon is-${journey.mode}`}>
                  <Icon name={journey.mode} size={20} />
                </span>
                <span className="journey-copy">
                  <strong>{journey.name}</strong>
                  <small>
                    {dateFormatter.format(new Date(journey.startedAt))}
                    <i>{journey.mode === 'road' ? '車' : journey.mode === 'walk' ? '徒歩' : '電車'}</i>
                  </small>
                </span>
                <span className="journey-distance">{formatDistance(journey.distanceMeters)}</span>
                <Icon name="chevron" size={18} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="recent-empty">最初の旅を記録すると、ここに表示されます。</p>
      )}
      <button className="history-open-button" type="button" onClick={onOpenHistory}>
        <Icon name="list" size={19} />
        履歴を開く
        <Icon name="chevron" size={18} />
      </button>
    </aside>
  )
}
