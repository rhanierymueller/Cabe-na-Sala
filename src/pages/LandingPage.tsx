import { motion, useScroll } from 'framer-motion'
import { Sofa } from 'lucide-react'
import { ClosingSection } from '../components/landing/ClosingSection'
import { ProofSection } from '../components/landing/ProofSection'
import { ScrollStory } from '../components/landing/ScrollStory'
import '../styles/landing.css'

interface LandingPageProps {
  readonly onStart: () => void
}

export function LandingPage({ onStart }: LandingPageProps) {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      className="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="landing__progress"
        style={{ scaleX: scrollYProgress }}
        aria-hidden="true"
      />

      <ScrollStory onStart={onStart} />
      <ProofSection />
      <ClosingSection onStart={onStart} />

      <footer className="landing__footer">
        <p>
          <Sofa size={16} aria-hidden="true" /> Cabe na Sala — sem app, sem cadastro, grátis.
        </p>
      </footer>
    </motion.div>
  )
}
