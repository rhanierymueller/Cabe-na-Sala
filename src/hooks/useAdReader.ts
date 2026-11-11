import { useState } from 'react'
import { FURNITURE_CATALOG } from '../components/furniture/catalog'
import { ApiError } from '../services/apiClient'
import { ChallengeError, requestChallengeToken } from '../services/challenge'
import type { AdMeasures } from '../services/measuresApi'
import { readAdMeasures } from '../services/measuresApi'
import type { DimensionsCm } from '../types/furniture'
import { resizeImageToDataUrl } from '../utils/imageResize'
import { useLatestRequest } from './useLatestRequest'

type AdSource = { readonly text: string } | { readonly file: File }

interface AdReadFeedback {
  readonly kind: 'ok' | 'error'
  readonly text: string
}

export interface AdReader {
  readonly isBusy: boolean
  readonly feedback: AdReadFeedback | null
  readonly read: (source: AdSource) => void
}

/** Print precisa de mais resolução que foto de produto: o texto é pequeno. */
const PRINT_MAX_SIDE_PX = 1568
const GENERIC_ERROR_MESSAGE = 'Não foi possível ler o anúncio. Digite as medidas.'
const AXIS_LABELS: Readonly<Record<keyof DimensionsCm, string>> = {
  widthCm: 'largura',
  heightCm: 'altura',
  depthCm: 'profundidade',
}
const AXES = Object.keys(AXIS_LABELS) as readonly (keyof DimensionsCm)[]

function describeResult(found: AdMeasures): string {
  const missing = AXES.filter((axis) => found[axis] === null).map((axis) => AXIS_LABELS[axis])
  const what = found.kind ? `${FURNITURE_CATALOG[found.kind].label}: ` : ''
  if (missing.length === 0) return `${what}medidas preenchidas. Confira com o anúncio.`
  return `${what}preenchi o que achei. Faltou: ${missing.join(' e ')}.`
}

function describeError(error: unknown): string {
  if (error instanceof ApiError || error instanceof ChallengeError) return error.message
  console.error('Falha ao ler as medidas do anúncio', error)
  return GENERIC_ERROR_MESSAGE
}

async function readSource(source: AdSource, signal: AbortSignal): Promise<AdMeasures> {
  const imageDataUrl =
    'file' in source ? await resizeImageToDataUrl(source.file, PRINT_MAX_SIDE_PX) : undefined
  const challengeToken = await requestChallengeToken(signal)
  return readAdMeasures({
    text: 'text' in source ? source.text : undefined,
    imageDataUrl,
    challengeToken,
    signal,
  })
}

/**
 * Lê as medidas de um anúncio colado ou de um print e diz o que encontrou.
 * Ler de novo cancela a leitura anterior.
 */
export function useAdReader(onRead: (found: AdMeasures) => void): AdReader {
  const request = useLatestRequest()
  const [isBusy, setIsBusy] = useState(false)
  const [feedback, setFeedback] = useState<AdReadFeedback | null>(null)

  const read = (source: AdSource): void => {
    const controller = request.start()
    setIsBusy(true)
    setFeedback(null)

    const run = async (): Promise<void> => {
      try {
        const found = await readSource(source, controller.signal)
        onRead(found)
        setFeedback({ kind: 'ok', text: describeResult(found) })
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        setFeedback({ kind: 'error', text: describeError(error) })
      } finally {
        if (!controller.signal.aborted) setIsBusy(false)
      }
    }
    void run()
  }

  return { isBusy, feedback, read }
}
