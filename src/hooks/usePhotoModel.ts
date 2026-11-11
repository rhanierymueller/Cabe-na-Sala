import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeModel, suggestQuarterTurns } from '../components/furniture/scanned/fitModel'
import { EmptyModelError, loadGlbModel } from '../components/furniture/scanned/loadModel'
import type { DimensionsMeters, ScannedModel, ScannedModelSource } from '../types/furniture'
import { trackEvent } from '../utils/analytics'
import { resizeImageToDataUrl } from '../utils/imageResize'
import { ModelApiError, generateModelFromPhoto } from '../utils/modelApi'

export type PhotoModelPhase = 'idle' | 'preparing' | 'generating' | 'loading' | 'error'

export interface PhotoModel {
  readonly phase: PhotoModelPhase
  readonly errorMessage: string | null
  readonly isBusy: boolean
  /** Recebe a foto (ou um .glb pronto) escolhida pelo usuário. */
  readonly handleFile: (file: File) => void
  readonly cancel: () => void
}

const ACCEPTED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']
const GLB_EXTENSION = '.glb'
const BYTES_PER_MB = 1024 * 1024
const MAX_IMAGE_SIZE_MB = 15
const MAX_MODEL_SIZE_MB = 40
const GENERIC_ERROR_MESSAGE = 'Não deu certo com este arquivo. Tente outro.'

/** Entrada do seletor de arquivo: fotos e, para quem já tem, modelo .glb. */
export const PHOTO_MODEL_ACCEPT = [...ACCEPTED_IMAGE_TYPES, GLB_EXTENSION].join(',')

function isGlbFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(GLB_EXTENSION)
}

/** Recusa cedo o que não serve, com mensagem que diz o que fazer. */
function validateFile(file: File): string | null {
  if (isGlbFile(file)) {
    return file.size > MAX_MODEL_SIZE_MB * BYTES_PER_MB
      ? `O modelo passa de ${MAX_MODEL_SIZE_MB} MB.`
      : null
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Use uma foto JPG, PNG ou WebP.'
  if (file.size > MAX_IMAGE_SIZE_MB * BYTES_PER_MB) return `A foto passa de ${MAX_IMAGE_SIZE_MB} MB.`
  return null
}

function describeError(error: unknown): string {
  if (error instanceof ModelApiError || error instanceof EmptyModelError) return error.message
  return GENERIC_ERROR_MESSAGE
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * Leva um arquivo escolhido pelo usuário até um modelo 3D carregado:
 * foto → redimensiona → servidor gera → baixa o GLB; ou .glb → carrega direto.
 */
export function usePhotoModel(
  dimensions: DimensionsMeters,
  onModelReady: (model: ScannedModel) => void,
): PhotoModel {
  const [phase, setPhase] = useState<PhotoModelPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // As medidas mudam enquanto o modelo é gerado; usamos as do momento em que ele chega.
  const dimensionsRef = useRef(dimensions)
  useEffect(() => {
    dimensionsRef.current = dimensions
  }, [dimensions])

  useEffect(() => () => abortRef.current?.abort(), [])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setPhase('idle')
    setErrorMessage(null)
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setPhase('error')
        setErrorMessage(validationError)
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setErrorMessage(null)

      const run = async (): Promise<void> => {
        const source: ScannedModelSource = isGlbFile(file) ? 'file' : 'photo'
        let localUrl: string | null = null
        try {
          let modelUrl: string
          if (source === 'file') {
            localUrl = URL.createObjectURL(file)
            modelUrl = localUrl
          } else {
            setPhase('preparing')
            const imageDataUrl = await resizeImageToDataUrl(file)
            setPhase('generating')
            modelUrl = await generateModelFromPhoto(imageDataUrl, controller.signal)
          }

          setPhase('loading')
          const scene = await loadGlbModel(modelUrl)
          if (controller.signal.aborted) return

          const { baseSize } = normalizeModel(scene, 0)
          const quarterTurns = suggestQuarterTurns(baseSize, dimensionsRef.current)
          trackEvent('photo_model_ready', { source })
          onModelReady({ scene, source, quarterTurns })
          setPhase('idle')
        } catch (error: unknown) {
          if (isAbort(error) || controller.signal.aborted) return
          console.error('Falha ao transformar o arquivo em modelo 3D', error)
          setPhase('error')
          setErrorMessage(describeError(error))
        } finally {
          if (localUrl) URL.revokeObjectURL(localUrl)
        }
      }

      void run()
    },
    [onModelReady],
  )

  return {
    phase,
    errorMessage,
    isBusy: phase === 'preparing' || phase === 'generating' || phase === 'loading',
    handleFile,
    cancel,
  }
}
