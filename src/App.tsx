import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useState } from 'react'
import { LandingPage } from './pages/LandingPage'
import { ToolPage } from './pages/ToolPage'

type AppView = 'landing' | 'tool'

export function App() {
  const [view, setView] = useState<AppView>('landing')

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {view === 'tool' ? (
          <ToolPage key="tool" onBackToLanding={() => setView('landing')} />
        ) : (
          <LandingPage key="landing" onStart={() => setView('tool')} />
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

export default App
