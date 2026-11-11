import { AnimatePresence, motion } from 'framer-motion'
import { Smartphone } from 'lucide-react'
import { useMemo } from 'react'
import { useArQuickLook } from '../../hooks/useArQuickLook'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { detectPlatform } from '../../utils/platform'
import { ArHandoffQr } from './ArHandoffQr'
import { SafariHandoff } from './SafariHandoff'

interface ArButtonProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  /** Link desta configuração — QR no desktop, deep link no iPhone. */
  readonly handoffUrl: string
  /** Modelo do produto real; quando presente, é ele que vai para o AR. */
  readonly scannedModel?: ScannedModel | null
}

/**
 * Botão "Ver na minha casa": gera o USDZ e abre o AR Quick Look no iPhone.
 * Onde o AR não existe, cada plataforma ganha a melhor saída possível:
 * iPhone em outro navegador → abrir no Safari; Android → aviso honesto;
 * desktop → QR de handoff para o celular.
 */
export function ArButton({ kind, dimensions, handoffUrl, scannedModel = null }: ArButtonProps) {
  const { isSupported, status, launchAr } = useArQuickLook(kind, dimensions, scannedModel)
  const platform = useMemo(() => detectPlatform(), [])

  if (!isSupported && platform === 'ios') {
    return <SafariHandoff url={handoffUrl} />
  }

  if (!isSupported && platform === 'android') {
    return (
      <p className="ar-hint">
        <Smartphone size={15} aria-hidden="true" /> No Android a câmera ao vivo ainda não abre. Por
        enquanto, confira o móvel em 3D aqui e veja se passa na porta.
      </p>
    )
  }

  if (!isSupported) {
    return (
      <div className="ar-hint">
        <p className="ar-hint__text">
          <Smartphone size={15} aria-hidden="true" /> Para ver na sua casa em tamanho real, abra
          no <strong>Safari do iPhone</strong>.
        </p>
        <ArHandoffQr url={handoffUrl} />
        <p className="ar-hint__caption">Aponte a câmera do celular — abre já com estas medidas.</p>
      </div>
    )
  }

  const isGenerating = status === 'generating'

  return (
    <div className="ar-launcher">
      <motion.button
        type="button"
        className="button button--primary button--large button--block"
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
