import type { SVGProps } from 'react'

export type IconName =
  | 'map'
  | 'record'
  | 'history'
  | 'lock'
  | 'menu'
  | 'road'
  | 'walk'
  | 'rail'
  | 'route'
  | 'timer'
  | 'speed'
  | 'play'
  | 'location'
  | 'plus'
  | 'minus'
  | 'chevron'
  | 'list'
  | 'check'
  | 'trash'
  | 'download'
  | 'info'
  | 'settings'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...props,
  }

  switch (name) {
    case 'map':
      return (
        <svg {...common}>
          <path d="m3 6.5 5-3 8 3 5-3v14l-5 3-8-3-5 3z" />
          <path d="M8 3.5v14M16 6.5v14" />
        </svg>
      )
    case 'record':
      return (
        <svg {...common}>
          <path d="m4 20 4.5-1 10.9-10.9a2.5 2.5 0 0 0-3.5-3.5L5 15.5z" />
          <path d="m14.5 6 3.5 3.5M4 20l1-4.5 3.5 3.5" />
        </svg>
      )
    case 'history':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3.2 2M5.8 5.8 3.5 8V4.5" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 6.5h16M4 12h16M4 17.5h16" />
        </svg>
      )
    case 'road':
      return (
        <svg {...common}>
          <path d="m5 10 1.6-4h10.8l1.6 4" />
          <rect x="3.5" y="9" width="17" height="8" rx="2" />
          <path d="M6.5 17v2M17.5 17v2M7 13h.01M17 13h.01" />
        </svg>
      )
    case 'walk':
      return (
        <svg {...common}>
          <circle cx="13" cy="4.5" r="2" />
          <path d="m10.5 9 2.5-2 2.5 3 3 1.5M13 8l-1 5 3 3.5M12 13l-3 2-2 4M15 16.5l3 3" />
        </svg>
      )
    case 'rail':
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="15" rx="3" />
          <path d="M8 7h8M8 13h.01M16 13h.01M8 21l2-3M16 18l2 3M9 21h6" />
        </svg>
      )
    case 'route':
      return (
        <svg {...common}>
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="6" r="2" />
          <path d="M8 18h2a3 3 0 0 0 0-6h4a3 3 0 0 0 3-3V8" />
        </svg>
      )
    case 'timer':
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 1.5M9 3h6" />
        </svg>
      )
    case 'speed':
      return (
        <svg {...common}>
          <path d="M4.2 17a8.5 8.5 0 1 1 15.6 0M12 12l4-3M7 17h10" />
        </svg>
      )
    case 'play':
      return (
        <svg {...common}>
          <path d="m8 5 11 7-11 7z" />
        </svg>
      )
    case 'location':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'minus':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m9 5 7 7-7 7" />
        </svg>
      )
    case 'list':
      return (
        <svg {...common}>
          <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4.5 4.5L19 7" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3v12M7.5 11 12 15.5 16.5 11M5 20h14" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1H9.55a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.75 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4V9.55a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.86-2.86.06.06A1.7 1.7 0 0 0 8.15 3.75a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1h4.05a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4v4.05a1.7 1.7 0 0 0-1.1.4 1.7 1.7 0 0 0-.6 1Z" />
        </svg>
      )
  }
}
