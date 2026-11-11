import { ClipboardPaste, ImageUp } from 'lucide-react'
import { useRef, useState } from 'react'
import type { AdReader } from '../../hooks/useAdReader'
import { useAdReader } from '../../hooks/useAdReader'
import type { AdMeasures as FoundMeasures } from '../../services/measuresApi'
import { HiddenFileInput } from '../ui/HiddenFileInput'

interface AdMeasuresProps {
  /** Recebe o que foi lido: medidas (null onde faltou) e o tipo de móvel reconhecido. */
  readonly onRead: (found: FoundMeasures) => void
}

const ICON_SIZE = 15
/** O servidor aceita mais; isto só evita colar a página inteira por engano. */
const MAX_TEXT_LENGTH = 6000
const PRINT_ACCEPT = 'image/jpeg,image/png,image/webp'

/** A barra de luz enquanto lê; depois, o que foi encontrado ou o erro. */
function AdReadStatus({ isBusy, feedback }: Pick<AdReader, 'isBusy' | 'feedback'>) {
  if (isBusy) {
    return (
      <div className="ad-measures__progress" role="status">
        <span className="ad-measures__tape" aria-hidden="true" />
        <p className="panel-section__status">Lendo o anúncio…</p>
      </div>
    )
  }
  if (!feedback) return null
  const isOk = feedback.kind === 'ok'
  return (
    <p className={isOk ? 'panel-section__status' : 'panel-section__error'} role={isOk ? 'status' : 'alert'}>
      {feedback.text}
    </p>
  )
}

/**
 * "Tem o anúncio aberto?": a pessoa cola a descrição ou envia um print e as
 * medidas são preenchidas e o móvel certo é selecionado. O que o anúncio não
 * informa fica como estava.
 */
export function AdMeasures({ onRead }: AdMeasuresProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const reader = useAdReader(onRead)
  const trimmedText = text.trim()

  return (
    <section className="panel-section ad-measures" aria-label="Preencher pelo anúncio">
      <h2 className="panel-section__title">
        <ClipboardPaste size={ICON_SIZE} aria-hidden="true" /> Tem o anúncio aberto?
      </h2>
      <p className="panel-section__hint">
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
      <HiddenFileInput
        ref={inputRef}
        accept={PRINT_ACCEPT}
        label="Escolher print do anúncio"
        onFile={(file) => reader.read({ file })}
      />

      <div className="panel-section__actions">
        <button
          type="button"
          className="button"
          onClick={() => reader.read({ text: trimmedText })}
          disabled={reader.isBusy || trimmedText === ''}
        >
          Ler medidas
        </button>
        <button
          type="button"
          className="button button--quiet"
          onClick={() => inputRef.current?.click()}
          disabled={reader.isBusy}
        >
          <ImageUp size={ICON_SIZE} aria-hidden="true" /> Enviar print
        </button>
      </div>

      <AdReadStatus isBusy={reader.isBusy} feedback={reader.feedback} />
    </section>
  )
}
