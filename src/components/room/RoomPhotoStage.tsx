import { X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useRoomCalibration } from '../../hooks/useRoomCalibration'
import { trackEvent } from '../../services/analytics'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { RoomCalibrateBar } from './RoomCalibrateBar'
import { RoomCalibrator } from './RoomCalibrator'
import { RoomFrame } from './RoomFrame'
import { RoomPlaceBar } from './RoomPlaceBar'
import { RoomPlacement } from './RoomPlacement'
import { saveRoomImage } from './saveRoomImage'

interface RoomPhotoStageProps {
  readonly photoUrl: string
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  readonly scannedModel: ScannedModel | null
  readonly onClose: () => void
}

type Step = 'calibrate' | 'place'

/**
 * "Ver na foto da minha sala": a pessoa marca uma altura conhecida na foto e
 * o móvel é desenhado por cima, em tamanho proporcional. É uma estimativa.
 */
export function RoomPhotoStage({ photoUrl, kind, dimensions, scannedModel, onClose }: RoomPhotoStageProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)
  const calibration = useRoomCalibration(photoUrl)
  const { size, line, pose, parsedReferenceCm } = calibration
  const [step, setStep] = useState<Step>('calibrate')
  const [rotationDeg, setRotationDeg] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  useEscapeKey(onClose)

  const handlePhotoLoad = (): void => {
    const photo = photoRef.current
    if (photo) calibration.setPhotoSize({ widthPx: photo.naturalWidth, heightPx: photo.naturalHeight })
  }

  const handleContinue = (): void => {
    if (!pose) return
    setStep('place')
    trackEvent('room_photo_placed', { furniture: kind })
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

  return (
    <div className="room" role="dialog" aria-modal="true" aria-label="Ver na foto da minha sala">
      <RoomFrame
        photoUrl={photoUrl}
        photoRef={photoRef}
        frameRef={frameRef}
        size={size}
        onPhotoLoad={handlePhotoLoad}
        onPhotoError={() => setErrorMessage('Não consegui abrir esta foto. Tente outra, em JPG ou PNG.')}
      >
        {step === 'place' && size && pose && line && (
          <RoomPlacement
            size={size}
            pose={pose}
            startPoint={line.bottom}
            kind={kind}
            dimensions={dimensions}
            scannedModel={scannedModel}
            rotationDeg={rotationDeg}
          />
        )}
        {step === 'calibrate' && size && line && (
          <RoomCalibrator
            size={size}
            line={line}
            label={parsedReferenceCm === null ? '' : `${parsedReferenceCm} cm`}
            onChange={calibration.changeLine}
          />
        )}
      </RoomFrame>

      <div className="room__bar">
        {step === 'calibrate' ? (
          <RoomCalibrateBar calibration={calibration} onCancel={onClose} onContinue={handleContinue} />
        ) : (
          <RoomPlaceBar
            rotationDeg={rotationDeg}
            onRotationChange={setRotationDeg}
            onRecalibrate={() => setStep('calibrate')}
            onSave={handleSave}
          />
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
