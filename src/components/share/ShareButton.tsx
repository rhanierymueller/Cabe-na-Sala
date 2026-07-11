import { Check, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DimensionsCm } from '../../types/furniture'

interface ShareButtonProps {
  readonly furnitureLabel: string
  readonly dimensionsCm: DimensionsCm
  readonly shareUrl: string
}

type ShareStatus = 'idle' | 'copied' | 'error'

const COPIED_FEEDBACK_MS = 2000

function buildShareText(furnitureLabel: string, dimensionsCm: DimensionsCm): string {
  const { widthCm, heightCm, depthCm } = dimensionsCm
  return `Vai caber? ${furnitureLabel} de ${widthCm} × ${heightCm} × ${depthCm} cm — veja em tamanho real na sua casa, sem baixar nada.`
}

/**
 * "Enviar para quem decide junto" — decisão de móvel é quase sempre em dupla.
 * Usa o share nativo do celular (WhatsApp etc.); no desktop copia o link.
 */
export function ShareButton({ furnitureLabel, dimensionsCm, shareUrl }: ShareButtonProps) {
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
      const text = buildShareText(furnitureLabel, dimensionsCm)

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
