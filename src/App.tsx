import { useCallback, useMemo, useState } from 'react'
import { AppHeader, MobileNav } from './components/AppHeader'
import { HistoryView } from './components/HistoryView'
import { MapCanvas } from './components/MapCanvas'
import { RecentJourneys } from './components/RecentJourneys'
import { RecordingPanel } from './components/RecordingPanel'
import { STARTER_JOURNEYS } from './data/demo'
import { useJourneyRecorder } from './hooks/useJourneyRecorder'
import { clearJourneys, loadJourneys, saveJourneys } from './lib/storage'
import type { AppView, Journey, JourneyMode } from './types'

function App() {
  const [activeView, setActiveView] = useState<AppView>('map')
  const [mode, setMode] = useState<JourneyMode>('road')
  const [journeys, setJourneys] = useState<Journey[]>(() => {
    const saved = loadJourneys()
    return saved.length > 0 ? saved : STARTER_JOURNEYS
  })
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(STARTER_JOURNEYS[0].id)
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const persist = useCallback((nextJourneys: Journey[]) => {
    setJourneys(nextJourneys)
    const stored = saveJourneys(nextJourneys)
    if (!stored) setNotice('ブラウザの保存領域を利用できません。記録はこの画面を閉じると失われます。')
  }, [])

  const handleJourneySaved = useCallback((journey: Journey) => {
    setJourneys((current) => {
      const next = [journey, ...current]
      if (!saveJourneys(next)) {
        setNotice('記録は作成しましたが、端末へ保存できませんでした。空き容量やブラウザ設定をご確認ください。')
      } else {
        setNotice('記録をこの端末に保存しました。')
      }
      return next
    })
    setSelectedJourneyId(journey.id)
  }, [])

  const recorder = useJourneyRecorder({ mode, onSave: handleJourneySaved })
  const isRecording = recorder.status === 'recording' || recorder.status === 'requesting'
  const selectedJourney = useMemo(
    () => journeys.find((journey) => journey.id === selectedJourneyId) ?? journeys[0],
    [journeys, selectedJourneyId],
  )
  const effectiveSelectedJourneyId = selectedJourney?.id ?? ''

  const changeView = (view: AppView) => {
    setMenuOpen(false)
    setActiveView(view)
    if (view === 'record') {
      window.setTimeout(() => document.getElementById('recording-panel')?.focus({ preventScroll: true }), 0)
    }
  }

  const selectJourney = (journey: Journey) => {
    setSelectedJourneyId(journey.id)
    setMode(journey.mode)
    setActiveView('map')
    setNotice(`${journey.name}を地図に表示しています。`)
  }

  const deleteJourney = (journeyId: string) => {
    const target = journeys.find((journey) => journey.id === journeyId)
    if (!target || !window.confirm(`「${target.name}」をこの端末から削除しますか？`)) return
    const next = journeys.filter((journey) => journey.id !== journeyId)
    persist(next)
    if (selectedJourneyId === journeyId) setSelectedJourneyId(next[0]?.id ?? '')
    setNotice('選択した記録を削除しました。')
  }

  const clearAll = () => {
    if (!window.confirm('すべての記録をこの端末から削除します。この操作は元に戻せません。続けますか？')) return
    clearJourneys()
    setJourneys([])
    setSelectedJourneyId('')
    setNotice('すべての記録を削除しました。')
  }

  const exportJourneys = () => {
    const payload = JSON.stringify({ app: 'みちログ', version: 1, exportedAt: new Date().toISOString(), journeys }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `michilog-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('バックアップを書き出しました。')
  }

  return (
    <div className="app-shell">
      <AppHeader
        activeView={activeView}
        onViewChange={changeView}
        onMenuClick={() => setMenuOpen((current) => !current)}
        menuOpen={menuOpen}
      />

      {menuOpen ? (
        <aside className="mobile-menu-panel" aria-label="データとプライバシー">
          <h2>データとプライバシー</h2>
          <p>GPSを使うのは記録中だけです。記録データはこの端末のブラウザ内に保存します。背景地図の表示時は、表示範囲の地図画像をOpenStreetMapから取得します。</p>
          <button type="button" onClick={() => changeView('history')}>履歴とバックアップを開く</button>
          <button className="mobile-menu-close" type="button" onClick={() => setMenuOpen(false)}>閉じる</button>
        </aside>
      ) : null}

      {activeView === 'history' ? (
        <HistoryView
          journeys={journeys}
          onSelect={selectJourney}
          onDelete={deleteJourney}
          onClear={clearAll}
          onExport={exportJourneys}
        />
      ) : (
        <main className="map-view">
          <MapCanvas
            mode={mode}
            onModeChange={setMode}
            isRecording={isRecording}
            activePoints={recorder.active?.points ?? []}
            journeys={journeys}
            selectedJourneyId={effectiveSelectedJourneyId}
          />
          <RecordingPanel
            mode={mode}
            onModeChange={setMode}
            status={recorder.status}
            active={recorder.active}
            errorMessage={recorder.errorMessage}
            onStartGps={recorder.startGps}
            onStartDemo={recorder.startDemo}
            onFinish={recorder.finish}
            onDismissError={recorder.dismissError}
          />
          <RecentJourneys
            journeys={journeys}
            selectedId={effectiveSelectedJourneyId}
            onSelect={selectJourney}
            onOpenHistory={() => setActiveView('history')}
          />
          <footer className="map-status-bar">
            <span>GPS: 許可後に開始</span>
            <span>保存先: この端末</span>
            <span>地図: OpenStreetMap</span>
          </footer>
        </main>
      )}

      {notice ? (
        <button className="notice-toast" type="button" onClick={() => setNotice('')} aria-live="polite">
          {notice}
        </button>
      ) : null}
      <MobileNav activeView={activeView} onViewChange={changeView} />
    </div>
  )
}

export default App
