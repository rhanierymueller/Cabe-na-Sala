import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Tv } from 'lucide-react'
import { useRef } from 'react'
import { FURNITURE_CATALOG, FURNITURE_KINDS } from '../furniture/catalog'
import { riseInVariants, sectionViewport, staggerContainerVariants } from './sectionVariants'

interface ClosingSectionProps {
  readonly onStart: () => void
}

const CHIP_ICON_SIZE = 16

/**
 * Fechamento centralizado com CTA e camadas decorativas em parallax
 * (velocidades diferentes conforme o scroll atravessa a seção).
 */
export function ClosingSection({ onStart }: ClosingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const backdropY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])
  const slowLayerY = useTransform(scrollYProgress, [0, 1], [80, -80])
  const fastLayerY = useTransform(scrollYProgress, [0, 1], [160, -160])

  return (
    <section ref={sectionRef} className="closing">
      <motion.div className="closing__backdrop" style={{ y: backdropY }} aria-hidden="true" />
      <div className="closing__scrim" aria-hidden="true" />
      <motion.div className="closing__glow closing__glow--slow" style={{ y: slowLayerY }} aria-hidden="true" />
      <motion.div className="closing__glow closing__glow--fast" style={{ y: fastLayerY }} aria-hidden="true" />

      <motion.div
        className="closing__content"
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <motion.h2 className="closing__title" variants={riseInVariants}>
          Meça. Veja. <span className="text-accent">Compre certo.</span>
        </motion.h2>
        <motion.p className="closing__subtitle" variants={riseInVariants}>
          Seis categorias prontas para testar — e vem mais por aí.
        </motion.p>

        <motion.ul className="closing__categories" variants={riseInVariants}>
          {FURNITURE_KINDS.map((kind) => {
            const definition = FURNITURE_CATALOG[kind]
            return (
              <li key={kind} className="category-chip category-chip--available">
                <definition.icon size={CHIP_ICON_SIZE} aria-hidden="true" /> {definition.label}
              </li>
            )
          })}
          <li className="category-chip">
            <Tv size={CHIP_ICON_SIZE} aria-hidden="true" /> TV
            <span className="category-chip__badge">em breve</span>
          </li>
        </motion.ul>

        <motion.div variants={riseInVariants}>
          <motion.button
            type="button"
            className="cta-button cta-button--large"
            onClick={onStart}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Testar um móvel agora <ArrowRight size={18} aria-hidden="true" />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  )
}
