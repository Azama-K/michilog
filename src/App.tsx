import { useCallback, useMemo, useRef, useState } from 'react'
import { AppHeader, MobileNav } from './components/AppHeader'
import { HistoryView } from './components/HistoryView'
import { MapCanvas } from './components/MapCanvas'
import { RecordingPanel } from './components/RecordingPanel'
import { STARTER_JOURNEYS } from './data/demo'
import { useJourneyRecorder } from './hooks/useJourneyRecorder'
import { useWakeLock } from './hooks/useWakeLock'
import {
  BackupFormatError,
  MAX_BACKUP_BYTES,
  clearJourneys,
  loadJourneys,
  loadSettings,
  mergeJourneys,
  parseBackup,
  saveJourneys,
  saveSettings,
} from './lib/storage'
import type { AppView, Journey, JourneyMode } from './types'

const NO_SAMPLES: Journey[] = []
const STORAGE_FAILED_NOTICE = 'ブラウザの保存領域を利用できません。記録はこの画面を閉じると失われます。'

function App() {
  const [activeView, setActiveView] = useState<AppView>('map')
  const [mode, setMode] = useState<JourneyMode>('road')
  // 記録は利用者自身のものだけ。サンプル経路は別扱いで、保存データには含めない。
  const [journeys, setJourneys] = useState<Journey[]>(() => loadJourneys())
  const journeysRef = useRef(journeys)
  // 一度も設定していなければ、記録がまだないときだけサンプルを見せる
  const [showSamples, setShowSamples] = useState(() => loadSettings()?.showSamples ?? journeys.length === 0)
  const [focusJourneyId, setFocusJourneyId] = useState('')
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const persist = useCallback((nextJourneys: Journey[]) => {
    journeysRef.current = nextJourneys
    setJourneys(nextJourneys)
    return saveJourneys(nextJourneys)
  }, [])

  const updateShowSamples = useCallback((next: boolean) => {
    setShowSamples(next)
    saveSettings({ showSamples: next })
  }, [])

  const handleJourneySaved = useCallback((journey: Journey) => {
    const current = journeysRef.current
    const isFirstGpsRecord = journey.source === 'gps' && !current.some((item) => item.source === 'gps')
    const stored = persist([journey, ...current])
    setFocusJourneyId(journey.id)

    if (!stored) {
      setNotice('記録は作成しましたが、端末へ保存できませんでした。空き容量やブラウザ設定をご確認ください。')
      return
    }
    if (isFirstGpsRecord && showSamples) {
      // 自分の線とサンプルが混ざらないよう、最初の記録を残した時点でサンプルを隠す
      updateShowSamples(false)
      setNotice('最初の記録を保存しました。サンプル経路は非表示にしました（設定から再表示できます）。')
      return
    }
    setNotice('記録をこの端末に保存しました。')
  }, [persist, showSamples, updateShowSamples])

  const recorder = useJourneyRecorder({ mode, onSave: handleJourneySaved })
  const isRecording = recorder.status === 'recording' || recorder.status === 'requesting'
  const wakeLock = useWakeLock(isRecording && recorder.active?.source === 'gps')
  const coverageDistance = useMemo(
    () => journeys.reduce((total, journey) => total + journey.distanceMeters, 0),
    [journeys],
  )
  const sampleJourneys = showSamples ? STARTER_JOURNEYS : NO_SAMPLES

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
    const stored = persist(journeys.filter((journey) => journey.id !== journeyId))
    if (focusJourneyId === journeyId) setFocusJourneyId('')
    setNotice(stored ? '選択した記録を削除しました。' : STORAGE_FAILED_NOTICE)
  }

  const clearAll = () => {
    if (!window.confirm('すべての記録をこの端末から削除します。この操作は元に戻せません。続けますか？')) return
    clearJourneys()
    journeysRef.current = []
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

  const importJourneys = async (file: File) => {
    setMenuOpen(false)
    if (file.size > MAX_BACKUP_BYTES) {
      setNotice('ファイルが大きすぎるため読み込めませんでした（上限20MB）。')
      return
    }
    try {
      const { journeys: incoming, invalidCount } = parseBackup(await file.text())
      const result = mergeJourneys(journeysRef.current, incoming)
      if (result.added > 0 && !persist(result.journeys)) {
        setNotice(STORAGE_FAILED_NOTICE)
        return
      }
      const details = [
        result.duplicates > 0 ? `既にある${result.duplicates}件は重複のため省略` : '',
        invalidCount > 0 ? `形式が正しくない${invalidCount}件は読み飛ばし` : '',
      ].filter(Boolean).join('、')
      setNotice(`${result.added}件の記録を読み込みました。${details ? `（${details}）` : ''}`)
      if (result.added > 0) {
        setFocusJourneyId('')
        setActiveView('map')
      }
    } catch (error) {
      setNotice(error instanceof BackupFormatError ? error.message : 'ファイルを読み込めませんでした。')
    }
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
          <p>通った区間はこの端末だけに保存されます。誤差の大きいGPS点は除いていますが、道路や線路への自動吸着はまだ行いません。</p>
          <dl>
            <div><dt>保存済み</dt><dd>{journeys.length}件</dd></div>
            <div><dt>累計距離</dt><dd>{(coverageDistance / 1000).toFixed(1)}km</dd></div>
          </dl>
          <label className="menu-toggle">
            <input
              type="checkbox"
              checked={showSamples}
              onChange={(event) => updateShowSamples(event.target.checked)}
            />
            <span>
              <b>サンプル経路を表示</b>
              <small>C1一周などの見本を点線で表示します。記録や距離には含まれません。</small>
            </span>
          </label>
          <button type="button" onClick={() => { setMenuOpen(false); recorder.startDemo() }} disabled={isRecording}>動作確認用のデモ記録</button>
          <button type="button" onClick={exportJourneys} disabled={journeys.length === 0}>JSONでバックアップ</button>
          <ImportButton className="menu-secondary-button" onFile={importJourneys} />
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
          importButton={<ImportButton className="export-button is-secondary" onFile={importJourneys} />}
        />
      ) : (
        <main className="map-view">
          <MapCanvas
            mode={mode}
            onModeChange={setMode}
            isRecording={isRecording}
            activePoints={recorder.active?.points ?? []}
            journeys={journeys}
            sampleJourneys={sampleJourneys}
            focusJourneyId={focusJourneyId}
          />
          <RecordingPanel
            status={recorder.status}
            active={recorder.active}
            errorMessage={recorder.errorMessage}
            wakeLock={wakeLock}
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

/** バックアップJSONを選ぶボタン。ファイルは端末内で読むだけで、どこにも送らない。 */
function ImportButton({ className, onFile }: { className: string; onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <button className={className} type="button" onClick={() => inputRef.current?.click()}>
        バックアップを読み込む
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          // 同じファイルをもう一度選べるように値を戻す
          event.target.value = ''
          if (file) onFile(file)
        }}
      />
    </>
  )
}

export default App
