import { Check, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DimensionsCm } from '../../types/furniture'
import { trackEvent } from '../../utils/analytics'
import { computeDoorFit } from '../../utils/doorFit'

interface ShareButtonProps {
  readonly furnitureLabel: string
  readonly dimensionsCm: DimensionsCm
  readonly doorWidthCm: number | null
  readonly shareUrl: string
}

type ShareStatus = 'idle' | 'copied' | 'error'

const COPIED_FEEDBACK_MS = 2000

/** O veredito é o que se compartilha ("amor, não passa!") — não a ferramenta. */
function buildShareText(
  furnitureLabel: string,
  dimensionsCm: DimensionsCm,
  doorWidthCm: number | null,
): string {
  const { widthCm, heightCm, depthCm } = dimensionsCm
  const base = `Vai caber? ${furnitureLabel} de ${widthCm} × ${heightCm} × ${depthCm} cm`

  if (doorWidthCm === null) {
    return `${base} — veja em tamanho real na sua casa, sem baixar nada.`
  }

  const fit = computeDoorFit(dimensionsCm, doorWidthCm)
  const gapText = String(Math.round(Math.abs(fit.gapCm) * 10) / 10).replace('.', ',')

  if (fit.status === 'blocked') {
    return `${base}: NÃO passa na porta de ${doorWidthCm} cm — faltam ${gapText} cm. Confere aí:`
  }
  if (fit.status === 'tight') {
    return `${base}: passa JUSTO na porta de ${doorWidthCm} cm (sobram só ${gapText} cm). Confere aí:`
  }
  return `${base}: passa na porta de ${doorWidthCm} cm, sobram ${gapText} cm. Vê como fica na sala:`
}

/**
 * "Enviar para quem decide junto" — decisão de móvel é quase sempre em dupla.
 * Usa o share nativo do celular (WhatsApp etc.); no desktop copia o link.
 */
export function ShareButton({ furnitureLabel, dimensionsCm, doorWidthCm, shareUrl }: ShareButtonProps) {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const feedbackTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(feedbackTimerRef.current)
  }, [])

  const showFeedback = (nextStatus: ShareStatus): void => {
    setStatus(nextStatus)
    window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => setStatus('idle'), COPIED_FEEDBACK_MS)
  }

  const handleShare = (): void => {
    const share = async (): Promise<void> => {
      const text = buildShareText(furnitureLabel, dimensionsCm, doorWidthCm)
      const hasNativeShare = typeof navigator.share === 'function'
      trackEvent('share_click', {
        method: hasNativeShare ? 'native' : 'copy',
        has_verdict: doorWidthCm !== null,
      })

      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: 'Cabe na Sala', text, url: shareUrl })
        } catch (error: unknown) {
          // Usuário fechou o menu de compartilhar — não é erro.
          if (error instanceof DOMException && error.name === 'AbortError') return
          console.error('Falha no compartilhamento nativo', error)
        }
        return
      }

      try {
        await navigator.clipboard.writeText(shareUrl)
        showFeedback('copied')
      } catch (error: unknown) {
        console.error('Falha ao copiar o link', error)
        showFeedback('error')
      }
    }

    void share()
  }

  return (
    <div className="share">
      <button type="button" className="share__button" onClick={handleShare}>
        {status === 'copied' ? (
          <>
            <Check size={16} aria-hidden="true" /> Link copiado!
          </>
        ) : (
          <>
            <Share2 size={16} aria-hidden="true" /> Enviar para quem decide junto
          </>
        )}
      </button>
      {status === 'error' && (
        <p className="share__error">Não foi possível copiar — o link está na barra de endereço.</p>
      )}
    </div>
  )
}
