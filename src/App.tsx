import { useCallback, useMemo, useState } from 'react'
import { AppHeader, MobileNav } from './components/AppHeader'
import { HistoryView } from './components/HistoryView'
import { MapCanvas } from './components/MapCanvas'
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
  const [focusJourneyId, setFocusJourneyId] = useState('')
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
    setFocusJourneyId(journey.id)
  }, [])

  const recorder = useJourneyRecorder({ mode, onSave: handleJourneySaved })
  const isRecording = recorder.status === 'recording' || recorder.status === 'requesting'
  const coverageDistance = useMemo(
    () => journeys.reduce((total, journey) => total + journey.distanceMeters, 0),
    [journeys],
  )

  const changeView = (view: AppView) => {
    setMenuOpen(false)
    setActiveView(view)
  }

  const selectJourney = (journey: Journey) => {
    setFocusJourneyId(journey.id)
    setMode(journey.mode)
    setActiveView('map')
    setNotice(`${journey.name}の区間を中心に表示しました。通った道はすべて青で残ります。`)
  }

  const deleteJourney = (journeyId: string) => {
    const target = journeys.find((journey) => journey.id === journeyId)
    if (!target || !window.confirm(`「${target.name}」をこの端末から削除しますか？`)) return
    const next = journeys.filter((journey) => journey.id !== journeyId)
    persist(next)
    if (focusJourneyId === journeyId) setFocusJourneyId('')
    setNotice('選択した記録を削除しました。')
  }

  const clearAll = () => {
    if (!window.confirm('すべての記録をこの端末から削除します。この操作は元に戻せません。続けますか？')) return
    clearJourneys()
    setJourneys([])
    setFocusJourneyId('')
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
        mode={mode}
        isRecording={isRecording}
        onModeChange={setMode}
        onViewChange={changeView}
        onExport={exportJourneys}
        onSettings={() => setMenuOpen((current) => !current)}
        settingsOpen={menuOpen}
      />

      {menuOpen ? (
        <aside className="mobile-menu-panel" aria-label="設定とデータ">
          <h2>設定とデータ</h2>
          <p>通った区間はこの端末だけに保存されます。現在は道路への自動吸着をせず、GPSの軌跡をそのまま青く残します。</p>
          <dl>
            <div><dt>保存済み</dt><dd>{journeys.length}件</dd></div>
            <div><dt>累計距離</dt><dd>{(coverageDistance / 1000).toFixed(1)}km</dd></div>
          </dl>
          <button type="button" onClick={() => { setMenuOpen(false); recorder.startDemo() }} disabled={isRecording}>動作確認用のデモ記録</button>
          <button type="button" onClick={exportJourneys} disabled={journeys.length === 0}>JSONでバックアップ</button>
          <button type="button" onClick={() => changeView('history')}>履歴を開く</button>
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
            focusJourneyId={focusJourneyId}
          />
          <RecordingPanel
            status={recorder.status}
            active={recorder.active}
            errorMessage={recorder.errorMessage}
            onStartGps={recorder.startGps}
            onFinish={recorder.finish}
            onDismissError={recorder.dismissError}
          />
        </main>
      )}

      {notice ? (
        <button className="notice-toast" type="button" onClick={() => setNotice('')} aria-live="polite">
          {notice}
        </button>
      ) : null}
      <MobileNav
        activeView={activeView}
        settingsOpen={menuOpen}
        onViewChange={changeView}
        onSettings={() => setMenuOpen((current) => !current)}
      />
    </div>
  )
}

export default App
