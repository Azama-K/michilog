import { useEffect, useState } from 'react'

export type WakeLockState = 'idle' | 'active' | 'unsupported' | 'failed'

/**
 * `enabled` の間、画面の自動消灯を止める。
 * iPhoneのSafariは画面が消えるとWebページのGPS取得を止めるため、記録中の途切れを防ぐ目的で使う。
 * 画面を切り替えて戻ってきたときはロックが外れるので、表示に戻った時点で取り直す。
 */
export function useWakeLock(enabled: boolean): WakeLockState {
  const [state, setState] = useState<WakeLockState>('idle')

  useEffect(() => {
    if (!enabled) {
      setState('idle')
      return
    }
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      setState('unsupported')
      return
    }

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const next = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void next.release()
          return
        }
        sentinel = next
        setState('active')
      } catch {
        // 省電力モードなどで断られることがある。記録自体は続ける。
        if (!cancelled) setState('failed')
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      if (sentinel && !sentinel.released) void sentinel.release()
    }
  }, [enabled])

  return state
}
