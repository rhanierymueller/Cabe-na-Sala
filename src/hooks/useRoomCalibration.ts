import { useEffect, useMemo, useRef, useState } from 'react'
import { requestChallengeToken } from '../services/challenge'
import { findRoomReference } from '../services/referenceApi'
import { parseDimensionInput } from '../utils/dimensionValidation'
import { resizeImageToDataUrl } from '../utils/imageResize'
import type { CameraPose, PhotoPoint, PhotoSize, ReferenceLine } from '../utils/roomPhoto'
import { estimateCameraPose } from '../utils/roomPhoto'
import { centimetersToMeters } from '../utils/units'

/** Procurando a referência na foto, achou (com o nome do que marcou) ou ficou por conta da pessoa. */
type Detection =
  | { readonly status: 'looking' }
  | { readonly status: 'found'; readonly label: string }
  | { readonly status: 'manual' }

interface FoundReference {
  readonly line: ReferenceLine
  readonly heightCm: number
  readonly label: string
}

export interface RoomCalibration {
  readonly size: PhotoSize | null
  readonly line: ReferenceLine | null
  readonly referenceCm: string
  /** Altura digitada, em cm; null enquanto o texto não é um número. */
  readonly parsedReferenceCm: number | null
  /** Câmera estimada; null quando a marcação não fecha com nenhuma câmera plausível. */
  readonly pose: CameraPose | null
  readonly detection: Detection
  readonly setPhotoSize: (size: PhotoSize) => void
  readonly changeLine: (line: ReferenceLine) => void
  readonly changeReferenceCm: (value: string) => void
}

/** A porta interna padrão no Brasil. */
const DEFAULT_REFERENCE_CM = '210'
/** Lado maior da foto enviada para análise: o bastante para achar uma porta. */
const ANALYSIS_MAX_SIDE_PX = 1568

function initialLine(size: PhotoSize): ReferenceLine {
  const x = size.widthPx * 0.5
  return { bottom: { x, y: size.heightPx * 0.8 }, top: { x, y: size.heightPx * 0.3 } }
}

/** Pede ao servidor a referência de altura da foto (porta, bancada), já em pixels. */
async function detectReference(
  photoUrl: string,
  size: PhotoSize,
  signal: AbortSignal,
): Promise<FoundReference | null> {
  const photo = await (await fetch(photoUrl)).blob()
  const imageDataUrl = await resizeImageToDataUrl(photo, ANALYSIS_MAX_SIDE_PX)
  const challengeToken = await requestChallengeToken(signal)
  const reference = await findRoomReference({ imageDataUrl, challengeToken, signal })
  if (!reference) return null

  const toPixels = (point: PhotoPoint): PhotoPoint => ({
    x: point.x * size.widthPx,
    y: point.y * size.heightPx,
  })
  return {
    line: { bottom: toPixels(reference.bottom), top: toPixels(reference.top) },
    heightCm: reference.heightCm,
    label: reference.label,
  }
}

/**
 * A régua da foto da sala: a linha marcada, a altura dela e a câmera que sai
 * das duas. Com a foto carregada, pede ao servidor a referência; sem resposta
 * útil, nada muda e a pessoa marca à mão.
 */
export function useRoomCalibration(photoUrl: string): RoomCalibration {
  const [size, setSize] = useState<PhotoSize | null>(null)
  const [line, setLine] = useState<ReferenceLine | null>(null)
  const [referenceCm, setReferenceCm] = useState(DEFAULT_REFERENCE_CM)
  const [detection, setDetection] = useState<Detection>({ status: 'looking' })
  // Se a pessoa já mexeu na linha, a marcação automática não passa por cima.
  const hasAdjustedRef = useRef(false)

  useEffect(() => {
    if (!size) return
    const controller = new AbortController()

    const detect = async (): Promise<void> => {
      try {
        const found = await detectReference(photoUrl, size, controller.signal)
        if (controller.signal.aborted) return
        if (!found || hasAdjustedRef.current) {
          setDetection({ status: 'manual' })
          return
        }
        setLine(found.line)
        setReferenceCm(String(found.heightCm))
        setDetection({ status: 'found', label: found.label })
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        console.error('Falha na marcação automática da referência', error)
        setDetection({ status: 'manual' })
      }
    }

    void detect()
    return () => controller.abort()
  }, [size, photoUrl])

  const parsedReferenceCm = parseDimensionInput(referenceCm)
  const pose = useMemo(() => {
    if (!size || !line || parsedReferenceCm === null) return null
    return estimateCameraPose({ ...line, heightM: centimetersToMeters(parsedReferenceCm) }, size)
  }, [size, line, parsedReferenceCm])

  const setPhotoSize = (nextSize: PhotoSize): void => {
    setSize(nextSize)
    setLine(initialLine(nextSize))
  }
  const changeLine = (nextLine: ReferenceLine): void => {
    hasAdjustedRef.current = true
    setLine(nextLine)
  }
  const changeReferenceCm = (value: string): void => {
    hasAdjustedRef.current = true
    setReferenceCm(value)
  }

  return { size, line, referenceCm, parsedReferenceCm, pose, detection, setPhotoSize, changeLine, changeReferenceCm }
}
