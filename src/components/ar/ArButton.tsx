import { AnimatePresence, motion } from 'framer-motion'
import { Smartphone } from 'lucide-react'
import { useArQuickLook } from '../../hooks/useArQuickLook'
import type { DimensionsMeters, FurnitureKind } from '../../types/furniture'
import { ArHandoffQr } from './ArHandoffQr'

interface ArButtonProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  /** Link desta configuração — vira QR de handoff onde não há AR. */
  readonly handoffUrl: string
}

/**
 * Botão "Ver na minha casa": gera o USDZ e abre o AR Quick Look no iPhone.
 * Em navegadores sem suporte (desktop/Android), oferece um QR que abre a
 * mesma configuração no celular — o funil não morre num beco sem saída.
 */
export function ArButton({ kind, dimensions, handoffUrl }: ArButtonProps) {
  const { isSupported, status, launchAr } = useArQuickLook(kind, dimensions)

  if (!isSupported) {
    return (
      <div className="ar-hint">
        <p className="ar-hint__text">
          <Smartphone size={15} aria-hidden="true" /> Para ver na sua casa em tamanho real,
          abra no <strong>Safari do iPhone</strong>.
        </p>
        <ArHandoffQr url={handoffUrl} />
        <p className="ar-hint__caption">
          Aponte a câmera do celular — abre já com estas medidas.
        </p>
      </div>
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
