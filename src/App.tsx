import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { LandingPage } from './pages/LandingPage'
import { ToolPage } from './pages/ToolPage'
import type { DimensionsCm, FurnitureKind } from './types/furniture'
import type { ToolUrlState } from './utils/urlState'
import { buildToolSearch, parseToolUrl } from './utils/urlState'

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

  const handleToolStateChange = useCallback(
    (kind: FurnitureKind, dimensionsCm: DimensionsCm): void => {
      window.history.replaceState(null, '', buildToolSearch(kind, dimensionsCm))
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
