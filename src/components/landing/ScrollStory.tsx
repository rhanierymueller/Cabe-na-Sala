import { Canvas } from '@react-three/fiber'
import type { MotionValue } from 'framer-motion'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { StoryScene } from './StoryScene'
import { HERO_FADE_RANGE, STORY_CAPTIONS } from './storyTimeline'

interface ScrollStoryProps {
  readonly onStart: () => void
}

const CAPTION_FADE_MARGIN = 0.04

interface StoryCaptionOverlayProps {
  readonly progress: MotionValue<number>
  readonly range: readonly [number, number]
  readonly children: ReactNode
}

function StoryCaptionOverlay({ progress, range, children }: StoryCaptionOverlayProps) {
  const [start, end] = range
  const opacity = useTransform(
    progress,
    [start, start + CAPTION_FADE_MARGIN, end - CAPTION_FADE_MARGIN, end],
    [0, 1, 1, 0],
  )
  const y = useTransform(progress, [start, end], [36, -36])

  return (
    <motion.p className="story__caption" style={{ opacity, y }}>
      {children}
    </motion.p>
  )
}

/**
 * Palco do scrollytelling: a cena 3D fica presa (sticky) na tela enquanto
 * o container de 500dvh rola por baixo — o scroll vira o "play" da história.
 */
export function ScrollStory({ onStart }: ScrollStoryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Fade do hero via estado + transição CSS: o binding de opacity dirigido
  // por scroll falhava no Safari do iOS; classe CSS funciona em qualquer motor.
  const [, heroFadeEnd] = HERO_FADE_RANGE
  const [isHeroHidden, setIsHeroHidden] = useState(false)
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setIsHeroHidden(value > heroFadeEnd)
  })
  const hiddenClass = isHeroHidden ? ' story__hero--hidden' : ''

  return (
    <div ref={containerRef} className="story">
      <div className="story__stage">
        <Canvas
          shadows
          camera={{ position: [1.5, 1.15, 2.1], fov: 42 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
        >
          <StoryScene progress={scrollYProgress} />
        </Canvas>

        <div className={`story__hero${hiddenClass}`}>
          <motion.p
            className="story__badge"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Sem app · Sem cadastro · Grátis
          </motion.p>
          <motion.h1
            className="story__title"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            Vai caber?
          </motion.h1>
          <motion.p
            className="story__subtitle"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Role e veja o que acontece com quem compra móvel no olho.
          </motion.p>
          <motion.button
            type="button"
            className="cta-button"
            onClick={onStart}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Descobrir se cabe <ArrowRight size={18} aria-hidden="true" />
          </motion.button>
        </div>

        {STORY_CAPTIONS.map((caption) => (
          <StoryCaptionOverlay
            key={caption.text}
            progress={scrollYProgress}
            range={caption.range}
          >
            {caption.text}
          </StoryCaptionOverlay>
        ))}

        <motion.div
          className={`story__scroll-hint${isHeroHidden ? ' story__scroll-hint--hidden' : ''}`}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <ChevronDown size={22} />
        </motion.div>
      </div>
    </div>
  )
}
