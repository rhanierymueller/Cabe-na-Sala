import type { Variants } from 'framer-motion'

/** Container que revela os filhos em cascata quando entra na tela. */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

/** Item que sobe e aparece — usado dentro de um stagger container. */
export const riseInVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
}

/** Configuração padrão de viewport: anima uma vez, um pouco antes de entrar. */
export const sectionViewport = { once: true, margin: '-80px' } as const
