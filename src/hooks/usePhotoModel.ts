import type { Object3D } from 'three'
import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeModel, suggestQuarterTurns } from '../components/furniture/scanned/fitModel'
import {
  EmptyModelError,
  loadGlbModel,
  softenPhotoMaterials,
} from '../components/furniture/scanned/loadModel'
import { trackEvent } from '../services/analytics'
import { ApiError } from '../services/apiClient'
import { ChallengeError, requestChallengeToken } from '../services/challenge'
import { generateModelFromPhoto } from '../services/modelApi'
import type {
  DimensionsMeters,
  FurnitureKind,
  ScannedModel,
  ScannedModelSource,
} from '../types/furniture'
import { isAbortError } from '../utils/abort'
import { resizeImageToDataUrl } from '../utils/imageResize'
import { isGlbFile, validateModelFile } from '../utils/modelFile'
import { useLatestRequest } from './useLatestRequest'

export type PhotoModelPhase =
  | 'idle'
  | 'preparing'
  | 'checking'
  | 'generating'
  | 'loading'
  | 'error'

interface PhotoModelFlow {
  readonly phase: PhotoModelPhase
  readonly errorMessage: string | null
  readonly isBusy: boolean
  /** Recebe a foto (ou um .glb pronto) escolhida pelo usuário. */
  readonly handleFile: (file: File) => void
  readonly cancel: () => void
}

interface LoadSteps {
  readonly signal: AbortSignal
  readonly onPhase: (phase: PhotoModelPhase) => void
  readonly onKindDetected: (kind: FurnitureKind) => void
}

const GENERIC_ERROR_MESSAGE = 'Não deu certo com este arquivo. Tente outro.'
const BUSY_PHASES: readonly PhotoModelPhase[] = ['preparing', 'checking', 'generating', 'loading']

function describeError(error: unknown): string {
  const isKnown =
    error instanceof ApiError || error instanceof EmptyModelError || error instanceof ChallengeError
  return isKnown ? error.message : GENERIC_ERROR_MESSAGE
}

/** Foto → redimensiona → o servidor gera o modelo → URL do GLB. */
async function generateFromPhoto(file: File, { signal, onPhase, onKindDetected }: LoadSteps): Promise<string> {
  onPhase('preparing')
  const imageDataUrl = await resizeImageToDataUrl(file)
  signal.throwIfAborted()
  const challengeToken = await requestChallengeToken(signal)
  onPhase('checking')
  return generateModelFromPhoto({
    imageDataUrl,
    challengeToken,
    signal,
    onAccepted: (detectedKind) => {
      onPhase('generating')
      if (detectedKind) onKindDetected(detectedKind)
    },
  })
}

/** Leva o arquivo escolhido até a cena 3D: a foto passa pelo servidor; o .glb carrega direto. */
async function loadModelFromFile(
  file: File,
  steps: LoadSteps,
): Promise<{ readonly scene: Object3D; readonly source: ScannedModelSource }> {
  const source: ScannedModelSource = isGlbFile(file) ? 'file' : 'photo'
  const localUrl = source === 'file' ? URL.createObjectURL(file) : null
  try {
    const modelUrl = localUrl ?? (await generateFromPhoto(file, steps))
    steps.onPhase('loading')
    const scene = await loadGlbModel(modelUrl)
    if (source === 'photo') softenPhotoMaterials(scene)
    return { scene, source }
  } finally {
    if (localUrl) URL.revokeObjectURL(localUrl)
  }
}

/**
 * Leva um arquivo escolhido pelo usuário até um modelo 3D carregado, na
 * orientação que mais combina com as medidas do momento em que ele chega.
 */
export function usePhotoModel(
  dimensions: DimensionsMeters,
  onModelReady: (model: ScannedModel) => void,
  /** A foto mostrou um móvel de outro tipo que o selecionado. */
  onKindDetected: (kind: FurnitureKind) => void,
): PhotoModelFlow {
  const [phase, setPhase] = useState<PhotoModelPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const request = useLatestRequest()
  // As medidas mudam enquanto o modelo é gerado; usamos as do momento em que ele chega.
  const dimensionsRef = useRef(dimensions)
  useEffect(() => {
    dimensionsRef.current = dimensions
  }, [dimensions])

  const showError = (message: string): void => {
    setPhase('error')
    setErrorMessage(message)
  }

  const cancel = useCallback(() => {
    request.cancel()
    setPhase('idle')
    setErrorMessage(null)
  }, [request])

  const handleFile = (file: File): void => {
    const validationError = validateModelFile(file)
    if (validationError) {
      showError(validationError)
      return
    }

    const controller = request.start()
    setErrorMessage(null)
    // Só a execução ativa mexe na tela: uma cancelada ou substituída fica muda.
    const isActive = (): boolean => !controller.signal.aborted
    const steps: LoadSteps = {
      signal: controller.signal,
      onPhase: (nextPhase) => {
        if (isActive()) setPhase(nextPhase)
      },
      onKindDetected: (kind) => {
        if (isActive()) onKindDetected(kind)
      },
    }

    const run = async (): Promise<void> => {
      try {
        const { scene, source } = await loadModelFromFile(file, steps)
        if (!isActive()) return
        const { baseSize } = normalizeModel(scene, 0)
        const quarterTurns = suggestQuarterTurns(baseSize, dimensionsRef.current)
        trackEvent('photo_model_ready', { source })
        onModelReady({ scene, source, quarterTurns })
        setPhase('idle')
      } catch (error: unknown) {
        if (isAbortError(error) || !isActive()) return
        console.error('Falha ao transformar o arquivo em modelo 3D', error)
        showError(describeError(error))
      }
    }
    void run()
  }

  return { phase, errorMessage, isBusy: BUSY_PHASES.includes(phase), handleFile, cancel }
}
