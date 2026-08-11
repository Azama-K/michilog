import type { AppView, JourneyMode } from '../types'
import { BrandMark } from './BrandMark'
import { Icon } from './Icon'
import { ModeSwitch } from './ModeSwitch'

interface AppHeaderProps {
  activeView: AppView
  mode: JourneyMode
  isRecording: boolean
  onModeChange: (mode: JourneyMode) => void
  onViewChange: (view: AppView) => void
  onExport: () => void
  onSettings: () => void
  settingsOpen?: boolean
}

export function AppHeader({
  activeView,
  mode,
  isRecording,
  onModeChange,
  onViewChange,
  onExport,
  onSettings,
  settingsOpen = false,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-brand-group">
        <BrandMark />
        <button className="map-title-button" type="button" onClick={() => onViewChange('map')}>
          <Icon name="map" />
          これまでに通った道
        </button>
      </div>
      <ModeSwitch mode={mode} onChange={onModeChange} disabled={isRecording} className="header-mode-switch" />
      <nav className="desktop-utilities" aria-label="補助メニュー">
        <button type="button" className={activeView === 'history' ? 'is-active' : ''} onClick={() => onViewChange('history')}>
          <Icon name="history" />履歴
        </button>
        <button type="button" onClick={onExport}><Icon name="download" />バックアップ</button>
        <button type="button" onClick={onSettings} aria-expanded={settingsOpen}><Icon name="settings" />設定</button>
      </nav>
      <button className="menu-button" type="button" aria-label="メニュー" aria-expanded={settingsOpen} onClick={onSettings}>
        <Icon name="menu" size={28} />
      </button>
    </header>
  )
}

interface MobileNavProps {
  activeView: AppView
  settingsOpen: boolean
  onViewChange: (view: AppView) => void
  onSettings: () => void
}

export function MobileNav({ activeView, settingsOpen, onViewChange, onSettings }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="メインナビゲーション">
      <button type="button" className={activeView === 'map' ? 'is-active' : ''} onClick={() => onViewChange('map')}>
        <Icon name="map" /><span>地図</span>
      </button>
      <button type="button" className={activeView === 'history' ? 'is-active' : ''} onClick={() => onViewChange('history')}>
        <Icon name="history" /><span>履歴</span>
      </button>
      <button type="button" className={settingsOpen ? 'is-active' : ''} onClick={onSettings} aria-expanded={settingsOpen}>
        <Icon name="settings" /><span>設定</span>
      </button>
    </nav>
  )
}
