import { ClipboardPaste, ImageUp } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { DimensionsCm } from '../../types/furniture'
import { FURNITURE_CATALOG } from '../furniture/catalog'
import { ChallengeError, requestChallengeToken } from '../../utils/challenge'
import { resizeImageToDataUrl } from '../../utils/imageResize'
import type { AdMeasures as FoundMeasures } from '../../utils/measuresApi'
import { MeasuresApiError, readAdMeasures } from '../../utils/measuresApi'

interface AdMeasuresProps {
  /** Recebe o que foi lido: medidas (null onde faltou) e o tipo de móvel reconhecido. */
  readonly onRead: (found: FoundMeasures) => void
}

type Feedback = { readonly kind: 'ok' | 'error'; readonly text: string }

const ICON_SIZE = 15
/** O servidor aceita mais; isto só evita colar a página inteira por engano. */
const MAX_TEXT_LENGTH = 6000
/** Print precisa de mais resolução que foto de produto: o texto é pequeno. */
const PRINT_MAX_SIDE_PX = 1568
const AXIS_LABELS: Readonly<Record<keyof DimensionsCm, string>> = {
  widthCm: 'largura',
  heightCm: 'altura',
  depthCm: 'profundidade',
}
const AXES = Object.keys(AXIS_LABELS) as readonly (keyof DimensionsCm)[]

function describeResult(found: FoundMeasures): string {
  const missing = AXES.filter((axis) => found[axis] === null).map((axis) => AXIS_LABELS[axis])
  const what = found.kind ? `${FURNITURE_CATALOG[found.kind].label}: ` : ''
  if (missing.length === 0) return `${what}medidas preenchidas. Confira com o anúncio.`
  return `${what}preenchi o que achei. Faltou: ${missing.join(' e ')}.`
}

/**
 * "Tem o anúncio aberto?": a pessoa cola a descrição ou envia um print e as
 * medidas são preenchidas e o móvel certo é selecionado. O que o anúncio não
 * informa fica como estava.
 */
export function AdMeasures({ onRead }: AdMeasuresProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [text, setText] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const read = (source: { readonly text?: string; readonly file?: File }): void => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsBusy(true)
    setFeedback(null)

    const run = async (): Promise<void> => {
      try {
        const imageDataUrl = source.file
          ? await resizeImageToDataUrl(source.file, PRINT_MAX_SIDE_PX)
          : undefined
        const challengeToken = await requestChallengeToken(controller.signal)
        const found = await readAdMeasures({
          text: source.text,
          imageDataUrl,
          challengeToken,
          signal: controller.signal,
        })
        onRead(found)
        setFeedback({ kind: 'ok', text: describeResult(found) })
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        const isKnown = error instanceof MeasuresApiError || error instanceof ChallengeError
        if (!isKnown) console.error('Falha ao ler as medidas do anúncio', error)
        setFeedback({
          kind: 'error',
          text: isKnown ? error.message : 'Não foi possível ler o anúncio. Digite as medidas.',
        })
      } finally {
        if (!controller.signal.aborted) setIsBusy(false)
      }
    }
    void run()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    // Limpa o campo para o mesmo print poder ser escolhido de novo.
    event.target.value = ''
    if (file) read({ file })
  }

  const trimmedText = text.trim()

  return (
    <section className="photo-model" aria-label="Preencher pelo anúncio">
      <h2 className="photo-model__title">
        <ClipboardPaste size={ICON_SIZE} aria-hidden="true" /> Tem o anúncio aberto?
      </h2>
      <p className="photo-model__hint">
        Cole a descrição ou envie um print. Eu preencho as medidas.
      </p>

      <textarea
        className="ad-measures__text"
        rows={3}
        maxLength={MAX_TEXT_LENGTH}
        placeholder="Ex.: Sofá 3 lugares, L 210 x A 88 x P 95 cm"
        aria-label="Texto do anúncio"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <input
        ref={inputRef}
        className="photo-model__input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        aria-label="Escolher print do anúncio"
        tabIndex={-1}
      />

      <div className="photo-model__actions">
        <button
          type="button"
          className="photo-model__button"
          onClick={() => read({ text: trimmedText })}
          disabled={isBusy || trimmedText === ''}
        >
          Ler medidas
        </button>
        <button
          type="button"
          className="photo-model__button photo-model__button--quiet"
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
        >
          <ImageUp size={ICON_SIZE} aria-hidden="true" /> Enviar print
        </button>
      </div>

      {isBusy && (
        <div className="photo-model__progress" role="status">
          <span className="photo-model__tape" aria-hidden="true" />
          <p className="photo-model__status">Lendo o anúncio…</p>
        </div>
      )}
      {feedback && (
        <p
          className={feedback.kind === 'ok' ? 'photo-model__status' : 'photo-model__error'}
          role={feedback.kind === 'ok' ? 'status' : 'alert'}
        >
          {feedback.text}
        </p>
      )}
    </section>
  )
}
