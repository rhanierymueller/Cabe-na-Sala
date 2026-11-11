import { Camera, ImageUp, RotateCw, X } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useMemo, useRef } from 'react'
import type { PhotoModelPhase } from '../../hooks/usePhotoModel'
import { CAMERA_ACCEPT, PHOTO_MODEL_ACCEPT, usePhotoModel } from '../../hooks/usePhotoModel'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { detectPlatform } from '../../utils/platform'
import { nextQuarterTurn } from '../furniture/scanned/fitModel'

interface PhotoModelProps {
  readonly dimensions: DimensionsMeters
  readonly model: ScannedModel | null
  readonly onModelChange: (model: ScannedModel | null) => void
  readonly onKindDetected: (kind: FurnitureKind) => void
}

const ICON_SIZE = 15

const BUSY_LABEL: Partial<Record<PhotoModelPhase, string>> = {
  preparing: 'Preparando a foto…',
  checking: 'Conferindo se a foto serve…',
  generating: 'Modelando em 3D… leva até 1 minuto',
  loading: 'Carregando o modelo…',
}

/**
 * "Use a foto do anúncio": troca o móvel genérico pelo produto de verdade.
 * A forma vem da foto; o tamanho continua vindo das medidas digitadas.
 */
export function PhotoModel({ dimensions, model, onModelChange, onKindDetected }: PhotoModelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  // No computador o atributo capture é ignorado e o botão só confundiria.
  const hasCamera = useMemo(() => detectPlatform() !== 'desktop', [])
  const photoModel = usePhotoModel(dimensions, onModelChange, onKindDetected)

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    // Limpa o campo para o mesmo arquivo poder ser escolhido de novo.
    event.target.value = ''
    if (file) photoModel.handleFile(file)
  }

  const busyLabel = BUSY_LABEL[photoModel.phase]

  return (
    <section className="photo-model" aria-label="Usar a foto do anúncio">
      <h2 className="photo-model__title">
        <Camera size={ICON_SIZE} aria-hidden="true" /> Tem a foto do anúncio?
      </h2>

      <input
        ref={inputRef}
        className="photo-model__input"
        type="file"
        accept={PHOTO_MODEL_ACCEPT}
        onChange={handleInputChange}
        aria-label="Escolher foto do móvel"
        tabIndex={-1}
      />
      <input
        ref={cameraRef}
        className="photo-model__input"
        type="file"
        accept={CAMERA_ACCEPT}
        capture="environment"
        onChange={handleInputChange}
        aria-label="Tirar foto do móvel"
        tabIndex={-1}
      />

      {model === null && !photoModel.isBusy && (
        <>
          <p className="photo-model__hint">
            Use a foto e veja o móvel de verdade no lugar do genérico. As medidas continuam as que
            você digitou. Funciona melhor com o móvel inteiro, sozinho e bem iluminado.
          </p>
          <div className="photo-model__actions">
            {hasCamera && (
              <button
                type="button"
                className="photo-model__button"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera size={ICON_SIZE} aria-hidden="true" /> Tirar foto
              </button>
            )}
            <button
              type="button"
              className="photo-model__button"
              onClick={() => inputRef.current?.click()}
            >
              <ImageUp size={ICON_SIZE} aria-hidden="true" /> Enviar foto
            </button>
          </div>
        </>
      )}

      {photoModel.isBusy && (
        <div className="photo-model__progress" role="status">
          <span className="photo-model__tape" aria-hidden="true" />
          <p className="photo-model__status">{busyLabel}</p>
          <button type="button" className="photo-model__link" onClick={photoModel.cancel}>
            Cancelar
          </button>
        </div>
      )}

      {model !== null && !photoModel.isBusy && (
        <div className="photo-model__active">
          <p className="photo-model__stamp">
            {model.source === 'photo' ? 'Modelo da foto' : 'Modelo do arquivo'}
          </p>
          <p className="photo-model__hint">
            A parte de trás é estimada. Se a frente ficou de lado, gire.
          </p>
          <div className="photo-model__actions">
            <button
              type="button"
              className="photo-model__button"
              onClick={() =>
                onModelChange({ ...model, quarterTurns: nextQuarterTurn(model.quarterTurns) })
              }
            >
              <RotateCw size={ICON_SIZE} aria-hidden="true" /> Girar 90°
            </button>
            <button
              type="button"
              className="photo-model__button photo-model__button--quiet"
              onClick={() => onModelChange(null)}
            >
              <X size={ICON_SIZE} aria-hidden="true" /> Voltar ao genérico
            </button>
          </div>
        </div>
      )}

      {photoModel.phase === 'error' && photoModel.errorMessage && (
        <p className="photo-model__error" role="alert">
          {photoModel.errorMessage}
        </p>
      )}
    </section>
  )
}
