import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LandingPage } from './pages/LandingPage'
import { ToolPage } from './pages/ToolPage'
import type { DimensionsCm, FurnitureKind } from './types/furniture'
import type { ToolUrlState } from './utils/urlState'
import { buildToolSearch, parseToolUrl } from './utils/urlState'

/**
 * O Safari bloqueia replaceState acima de ~100 chamadas/30s — sem debounce,
 * arrastar um slider de medida estoura o limite e derruba a página.
 */
const URL_SYNC_DEBOUNCE_MS = 300

type AppView = 'landing' | 'tool'

function readToolStateFromLocation(): ToolUrlState | null {
  return parseToolUrl(window.location.search)
}

/**
 * Roteamento mínimo por query string: `/` é a landing e `?movel=...` é a
 * ferramenta. Cada configuração de móvel vira um link compartilhável, e o
 * botão voltar do navegador alterna as telas em vez de expulsar o usuário.
 */
export function App() {
  const [initialToolState] = useState(readToolStateFromLocation)
  const [view, setView] = useState<AppView>(initialToolState ? 'tool' : 'landing')

  useEffect(() => {
    const handlePopState = (): void => {
      setView(readToolStateFromLocation() ? 'tool' : 'landing')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleStart = useCallback(() => {
    window.history.pushState(null, '', '?movel=fogao')
    setView('tool')
  }, [])

  const handleBackToLanding = useCallback(() => {
    window.history.pushState(null, '', window.location.pathname)
    setView('landing')
  }, [])

  const urlSyncTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(urlSyncTimerRef.current)
  }, [])

  const handleToolStateChange = useCallback(
    (kind: FurnitureKind, dimensionsCm: DimensionsCm, doorWidthCm: number | null): void => {
      window.clearTimeout(urlSyncTimerRef.current)
      urlSyncTimerRef.current = window.setTimeout(() => {
        window.history.replaceState(null, '', buildToolSearch(kind, dimensionsCm, doorWidthCm))
      }, URL_SYNC_DEBOUNCE_MS)
    },
    [],
  )

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {view === 'tool' ? (
          <ToolPage
            key="tool"
            initialState={initialToolState}
            onBackToLanding={handleBackToLanding}
            onStateChange={handleToolStateChange}
          />
        ) : (
          <LandingPage key="landing" onStart={handleStart} />
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

export default App
