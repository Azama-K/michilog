import type { JourneyMode } from '../types'
import { Icon } from './Icon'

interface ModeSwitchProps {
  mode: JourneyMode
  onChange: (mode: JourneyMode) => void
  disabled?: boolean
  className?: string
}

export function ModeSwitch({ mode, onChange, disabled = false, className = '' }: ModeSwitchProps) {
  return (
    <div className={`mode-switch ${className}`} aria-label="記録モード">
      <button
        className={mode === 'road' ? 'is-active is-road' : ''}
        type="button"
        onClick={() => onChange('road')}
        disabled={disabled}
        aria-pressed={mode === 'road'}
      >
        <Icon name="road" size={22} />
        道路
      </button>
      <button
        className={mode === 'rail' ? 'is-active is-rail' : ''}
        type="button"
        onClick={() => onChange('rail')}
        disabled={disabled}
        aria-pressed={mode === 'rail'}
      >
        <Icon name="rail" size={22} />
        鉄道
      </button>
    </div>
  )
}

