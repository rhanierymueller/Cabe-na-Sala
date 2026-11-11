import { Check, Download, Ruler, X } from 'lucide-react'
import type { PointerEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { trackEvent } from '../../utils/analytics'
import { parseDimensionInput } from '../../utils/dimensionValidation'
import type { GroundPoint, PhotoSize } from '../../utils/roomPhoto'
import { estimateCameraPose, groundPointFromPixel } from '../../utils/roomPhoto'
import { centimetersToMeters } from '../../utils/units'
import type { ReferenceLine } from './RoomCalibrator'
import { RoomCalibrator } from './RoomCalibrator'
import { RoomScene } from './RoomScene'
import { saveRoomImage } from './saveRoomImage'
import '../../styles/room.css'

interface RoomPhotoStageProps {
  readonly photoUrl: string
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  readonly scannedModel: ScannedModel | null
  readonly onClose: () => void
}

type Step = 'calibrate' | 'place'

/** A porta interna padrão no Brasil. */
const DEFAULT_REFERENCE_CM = '210'
const FALLBACK_POSITION: GroundPoint = { x: 0, z: -3 }
/** Espaço reservado para a barra de controles ao encaixar a foto na tela. */
const BAR_SPACE_PX = 250
const ICON_SIZE = 16

function initialLine(size: PhotoSize): ReferenceLine {
  const x = size.widthPx * 0.5
  return { bottom: { x, y: size.heightPx * 0.8 }, top: { x, y: size.heightPx * 0.3 } }
}

/**
 * "Ver na foto da minha sala": a pessoa marca uma altura conhecida na foto e
 * o móvel é desenhado por cima, em tamanho proporcional. É uma estimativa.
 */
export function RoomPhotoStage({ photoUrl, kind, dimensions, scannedModel, onClose }: RoomPhotoStageProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)
  const [size, setSize] = useState<PhotoSize | null>(null)
  const [line, setLine] = useState<ReferenceLine | null>(null)
  const [referenceCm, setReferenceCm] = useState(DEFAULT_REFERENCE_CM)
  const [step, setStep] = useState<Step>('calibrate')
  const [position, setPosition] = useState<GroundPoint>(FALLBACK_POSITION)
  const [rotationDeg, setRotationDeg] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const parsedReferenceCm = parseDimensionInput(referenceCm)
  const pose = useMemo(() => {
    if (!size || !line || parsedReferenceCm === null) return null
    return estimateCameraPose({ ...line, heightM: centimetersToMeters(parsedReferenceCm) }, size)
  }, [size, line, parsedReferenceCm])

  const handlePhotoLoad = (): void => {
    const photo = photoRef.current
    if (!photo) return
    const nextSize = { widthPx: photo.naturalWidth, heightPx: photo.naturalHeight }
    setSize(nextSize)
    setLine(initialLine(nextSize))
  }

  const handleContinue = (): void => {
    if (!size || !line || !pose) return
    // O móvel nasce ao lado da referência, onde a escala é mais confiável.
    setPosition(groundPointFromPixel(line.bottom, size, pose) ?? FALLBACK_POSITION)
    setStep('place')
    trackEvent('room_photo_placed', { furniture: kind })
  }

  const handlePlace = (event: PointerEvent<HTMLDivElement>): void => {
    if (!size || !pose || event.buttons === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ground = groundPointFromPixel(
      {
        x: ((event.clientX - rect.left) / rect.width) * size.widthPx,
        y: ((event.clientY - rect.top) / rect.height) * size.heightPx,
      },
      size,
      pose,
    )
    // Toque acima do horizonte não é chão: o móvel fica onde estava.
    if (ground) setPosition(ground)
  }

  const handleSave = (): void => {
    const photo = photoRef.current
    const furniture = frameRef.current?.querySelector('canvas')
    if (!photo || !furniture) return

    setErrorMessage(null)
    saveRoomImage(photo, furniture)
      .then(() => trackEvent('room_photo_saved', { furniture: kind }))
      .catch((error: unknown) => {
        console.error('Falha ao salvar a imagem da sala', error)
        setErrorMessage('Não foi possível salvar a imagem. Tire um print da tela.')
      })
  }

  const frameStyle = size
    ? {
        aspectRatio: `${size.widthPx} / ${size.heightPx}`,
        width: `min(100vw, calc((100dvh - ${BAR_SPACE_PX}px) * ${size.widthPx / size.heightPx}))`,
      }
    : undefined

  return (
    <div className="room" role="dialog" aria-modal="true" aria-label="Ver na foto da minha sala">
      <div className="room__viewport">
        <div ref={frameRef} className="room__frame" style={frameStyle}>
          <img
            ref={photoRef}
            className="room__photo"
            src={photoUrl}
            alt="Foto do ambiente"
            onLoad={handlePhotoLoad}
            onError={() => setErrorMessage('Não consegui abrir esta foto. Tente outra, em JPG ou PNG.')}
          />
          {step === 'place' && size && pose && (
            <>
              <RoomScene
                size={size}
                pose={pose}
                kind={kind}
                dimensions={dimensions}
                scannedModel={scannedModel}
                position={position}
                rotationDeg={rotationDeg}
              />
              <div className="room__touch" onPointerDown={handlePlace} onPointerMove={handlePlace} />
            </>
          )}
          {step === 'calibrate' && size && line && (
            <RoomCalibrator
              size={size}
              line={line}
              label={parsedReferenceCm === null ? '' : `${parsedReferenceCm} cm`}
              onChange={setLine}
            />
          )}
        </div>
      </div>

      <div className="room__bar">
        {step === 'calibrate' ? (
          <>
            <p className="room__hint">
              Arraste a linha: uma ponta no chão, a outra no topo de algo que você sabe a altura. A
              porta costuma ter 210 cm.
            </p>
            <div className="room__row">
              <label className="room__field">
                Altura marcada
                <span className="room__field-control">
                  <input
                    className="room__input"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={referenceCm}
                    onChange={(event) => setReferenceCm(event.target.value)}
                  />
                  cm
                </span>
              </label>
              <button type="button" className="room__button" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="room__button room__button--primary"
                onClick={handleContinue}
                disabled={pose === null}
              >
                <Check size={ICON_SIZE} aria-hidden="true" /> Colocar o móvel
              </button>
            </div>
            {size && pose === null && (
              <p className="room__error" role="alert">
                Não fechou com essa marcação. Confira a altura e deixe a ponta de baixo no chão.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="room__hint">
              Toque ou arraste no chão para posicionar. O tamanho é aproximado; a medida exata é a
              que você digitou.
            </p>
            <div className="room__row">
              <label className="room__field room__field--grow">
                Girar
                <input
                  className="dimension-field__slider"
                  type="range"
                  min={0}
                  max={360}
                  step={5}
                  value={rotationDeg}
                  onChange={(event) => setRotationDeg(Number(event.target.value))}
                />
              </label>
              <button type="button" className="room__button" onClick={() => setStep('calibrate')}>
                <Ruler size={ICON_SIZE} aria-hidden="true" /> Refazer marcação
              </button>
              <button type="button" className="room__button room__button--primary" onClick={handleSave}>
                <Download size={ICON_SIZE} aria-hidden="true" /> Salvar imagem
              </button>
            </div>
          </>
        )}
        {errorMessage && (
          <p className="room__error" role="alert">
            {errorMessage}
          </p>
        )}
      </div>

      <button type="button" className="room__close" onClick={onClose} aria-label="Fechar">
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  )
}
