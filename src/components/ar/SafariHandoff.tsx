import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardCheck, ExternalLink, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { buildSafariDeepLink } from '../../utils/platform'

interface SafariHandoffProps {
  /** Link da configuração atual — vai para o Safari com móvel e medidas. */
  readonly url: string
}

/** Tempo até assumir que o Chrome bloqueou o salto para o Safari. */
const BLOCKED_DETECTION_MS = 2000

type HandoffStatus = 'idle' | 'attempted' | 'blocked'

/**
 * Saída para iPhone fora do Safari (Chrome/Firefox/Edge no iOS): tenta o
 * deep link x-safari e, como o Chrome costuma bloquear as primeiras
 * tentativas, copia o link antes e detecta o bloqueio pela visibilidade —
 * se a página continua visível após o toque, o salto não aconteceu.
 */
export function SafariHandoff({ url }: SafariHandoffProps) {
  const [status, setStatus] = useState<HandoffStatus>('idle')
  const blockedTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const cancelIfHidden = (): void => {
      // Página escondida = o Safari abriu; não é bloqueio.
      if (document.visibilityState === 'hidden') {
        window.clearTimeout(blockedTimerRef.current)
      }
    }

    document.addEventListener('visibilitychange', cancelIfHidden)
    return () => {
      document.removeEventListener('visibilitychange', cancelIfHidden)
      window.clearTimeout(blockedTimerRef.current)
    }
  }, [])

  const handleOpenSafari = (): void => {
    const attempt = async (): Promise<void> => {
      try {
        // Garante o plano B antes do salto: link já copiado.
        await navigator.clipboard.writeText(url)
      } catch {
        // Sem clipboard não há fallback automático — o deep link segue valendo.
      }

      setStatus('attempted')
      window.clearTimeout(blockedTimerRef.current)
      blockedTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === 'visible') setStatus('blocked')
      }, BLOCKED_DETECTION_MS)

      window.location.href = buildSafariDeepLink(url)
    }

    void attempt()
  }

  return (
    <div className="ar-hint">
      <p className="ar-hint__text">
        <Smartphone size={15} aria-hidden="true" /> Para ver na sua casa em tamanho real, o iPhone
        usa o <strong>Safari</strong>.
      </p>

      <button type="button" className="ar-button ar-hint__safari" onClick={handleOpenSafari}>
        <ExternalLink size={17} aria-hidden="true" /> Abrir no Safari
      </button>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.p key="idle" className="ar-hint__caption" exit={{ opacity: 0 }}>
            O iPhone vai pedir permissão — toque em <strong>Permitir</strong>.
          </motion.p>
        )}
        {status === 'attempted' && (
          <motion.p
            key="attempted"
            className="ar-hint__caption"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Se aparecer o aviso, toque em <strong>Permitir</strong>. Não abriu? Toque de novo.
          </motion.p>
        )}
        {status === 'blocked' && (
          <motion.p
            key="blocked"
            className="ar-hint__caption ar-hint__caption--copied"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ClipboardCheck size={14} aria-hidden="true" /> Link copiado — abra o Safari e cole na
            barra de endereço.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
