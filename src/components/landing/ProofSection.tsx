import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { riseInVariants, sectionViewport, staggerContainerVariants } from './sectionVariants'

const AR_SCREENSHOT_SRC = '/images/ar-real.jpg'

/**
 * Prova real: print verdadeiro do AR Quick Look rodando num iPhone,
 * dentro de uma moldura de celular desenhada em CSS, flutuando em parallax.
 */
export function ProofSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const phoneY = useTransform(scrollYProgress, [0, 1], [70, -70])

  return (
    <section ref={sectionRef} className="proof">
      <motion.div
        className="proof__content"
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <motion.h2 className="proof__title" variants={riseInVariants}>
          Isto é um <span className="text-accent">print de verdade</span>
        </motion.h2>
        <motion.p className="proof__subtitle" variants={riseInVariants}>
          Fogão de 60 cm posicionado numa cozinha real, pelo iPhone, direto do navegador.
          Escala exata, travada — impossível "dar zoom" e se enganar.
        </motion.p>
      </motion.div>

      <motion.figure className="phone-frame" style={{ y: phoneY }}>
        <div className="phone-frame__screen">
          <img
            src={AR_SCREENSHOT_SRC}
            alt="Print de AR mostrando um fogão virtual em tamanho real encaixado em uma cozinha"
            loading="lazy"
          />
        </div>
        <figcaption className="phone-frame__caption">AR Quick Look · iPhone · sem app</figcaption>
      </motion.figure>
    </section>
  )
}
