import type { AppView } from '../types'
import { BrandMark } from './BrandMark'
import { Icon } from './Icon'

interface AppHeaderProps {
  activeView: AppView
  onViewChange: (view: AppView) => void
  onMenuClick?: () => void
  menuOpen?: boolean
}

const NAV_ITEMS: Array<{ view: AppView; label: string; icon: 'map' | 'record' | 'history' }> = [
  { view: 'map', label: '地図', icon: 'map' },
  { view: 'record', label: '記録', icon: 'record' },
  { view: 'history', label: '履歴', icon: 'history' },
]

export function AppHeader({ activeView, onViewChange, onMenuClick, menuOpen = false }: AppHeaderProps) {
  return (
    <header className="app-header">
      <BrandMark />
      <nav className="desktop-nav" aria-label="メインナビゲーション">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            type="button"
            className={activeView === item.view ? 'is-active' : ''}
            onClick={() => onViewChange(item.view)}
            aria-current={activeView === item.view ? 'page' : undefined}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="privacy-indicator" title="位置情報を含む記録はサーバーへ送信しません">
        <Icon name="lock" size={20} />
        <span>この端末だけに保存</span>
      </div>
      <button
        className="menu-button"
        type="button"
        aria-label="メニュー"
        aria-expanded={menuOpen}
        onClick={onMenuClick}
      >
        <Icon name="menu" size={28} />
      </button>
    </header>
  )
}

export function MobileNav({ activeView, onViewChange }: AppHeaderProps) {
  return (
    <nav className="mobile-nav" aria-label="メインナビゲーション">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.view}
          type="button"
          className={activeView === item.view ? 'is-active' : ''}
          onClick={() => onViewChange(item.view)}
          aria-current={activeView === item.view ? 'page' : undefined}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
