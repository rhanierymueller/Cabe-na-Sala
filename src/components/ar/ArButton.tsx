import { AnimatePresence, motion } from 'framer-motion'
import { Smartphone } from 'lucide-react'
import { useArQuickLook } from '../../hooks/useArQuickLook'
import type { DimensionsMeters, FurnitureKind } from '../../types/furniture'

interface ArButtonProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
}

/**
 * Botão "Ver na minha casa": gera o USDZ e abre o AR Quick Look no iPhone.
 * Em navegadores sem suporte (desktop/Android), mostra como acessar.
 */
export function ArButton({ kind, dimensions }: ArButtonProps) {
  const { isSupported, status, launchAr } = useArQuickLook(kind, dimensions)

  if (!isSupported) {
    return (
      <p className="ar-hint">
        <Smartphone size={15} aria-hidden="true" /> Abra esta página no{' '}
        <strong>Safari do iPhone</strong> para ver o móvel na sua casa, em tamanho real,
        pela câmera.
      </p>
    )
  }

  const isGenerating = status === 'generating'

  return (
    <div className="ar-launcher">
      <motion.button
        type="button"
        className="ar-button"
        onClick={launchAr}
        disabled={isGenerating}
        whileTap={{ scale: 0.97 }}
      >
        {isGenerating ? (
          'Gerando modelo…'
        ) : (
          <>
            <Smartphone size={17} aria-hidden="true" /> Ver na minha casa
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {status === 'error' && (
          <motion.p
            className="ar-launcher__error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            Não foi possível gerar o modelo. Tente novamente.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
