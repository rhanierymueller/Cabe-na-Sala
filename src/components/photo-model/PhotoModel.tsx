import { Camera, ImageUp, RotateCw, X } from 'lucide-react'
import { useMemo, useRef } from 'react'
import type { PhotoModelPhase } from '../../hooks/usePhotoModel'
import { usePhotoModel } from '../../hooks/usePhotoModel'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { CAMERA_ACCEPT, PHOTO_MODEL_ACCEPT } from '../../utils/modelFile'
import { detectPlatform } from '../../utils/platform'
import { nextQuarterTurn } from '../furniture/scanned/fitModel'
import { HiddenFileInput } from '../ui/HiddenFileInput'
import { ScanLoader } from './ScanLoader'

interface PhotoModelProps {
  readonly dimensions: DimensionsMeters
  readonly model: ScannedModel | null
  readonly onModelChange: (model: ScannedModel | null) => void
  readonly onKindDetected: (kind: FurnitureKind) => void
}

const ICON_SIZE = 15
/** O atalho da folha recolhida do celular abre este mesmo campo de arquivo. */
export const PHOTO_MODEL_INPUT_ID = 'photo-model-file'

const BUSY_LABEL: Partial<Record<PhotoModelPhase, string>> = {
  preparing: 'Preparando a foto…',
  checking: 'Conferindo se a foto serve…',
  generating: 'Modelando em 3D… leva até 1 minuto',
  loading: 'Carregando o modelo…',
}

interface PhotoChoiceProps {
  readonly hasCamera: boolean
  readonly onTakePhoto: () => void
  readonly onUpload: () => void
}

/** Antes do modelo: o convite e os botões de foto. */
function PhotoChoice({ hasCamera, onTakePhoto, onUpload }: PhotoChoiceProps) {
  return (
    <>
      <p className="panel-section__hint">
        Envie a foto e veja este móvel de verdade em 3D, no tamanho das suas medidas.
      </p>
      <div className="panel-section__actions">
        {hasCamera && (
          <button type="button" className="button" onClick={onTakePhoto}>
            <Camera size={ICON_SIZE} aria-hidden="true" /> Tirar foto
          </button>
        )}
        <button type="button" className="button" onClick={onUpload}>
          <ImageUp size={ICON_SIZE} aria-hidden="true" /> Enviar foto
        </button>
      </div>
    </>
  )
}

interface ActiveModelProps {
  readonly model: ScannedModel
  readonly onModelChange: (model: ScannedModel | null) => void
}

/** Com o modelo na tela: de onde ele veio, girar e voltar ao genérico. */
function ActiveModel({ model, onModelChange }: ActiveModelProps) {
  return (
    <div className="photo-model__active">
      <p className="photo-model__stamp">
        {model.source === 'photo' ? 'Modelo da foto' : 'Modelo do arquivo'}
      </p>
      <p className="panel-section__hint">
        A parte de trás é estimada. Se a frente ficou de lado, gire.
      </p>
      <div className="panel-section__actions">
        <button
          type="button"
          className="button"
          onClick={() => onModelChange({ ...model, quarterTurns: nextQuarterTurn(model.quarterTurns) })}
        >
          <RotateCw size={ICON_SIZE} aria-hidden="true" /> Girar 90°
        </button>
        <button type="button" className="button button--quiet" onClick={() => onModelChange(null)}>
          <X size={ICON_SIZE} aria-hidden="true" /> Voltar ao genérico
        </button>
      </div>
    </div>
  )
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
  const hasFailed = photoModel.phase === 'error'

  return (
    <section className="panel-section photo-model" aria-label="Usar a foto do anúncio">
      <h2 className="panel-section__title">
        <Camera size={ICON_SIZE} aria-hidden="true" /> Tem a foto do anúncio?
      </h2>

      <HiddenFileInput
        ref={inputRef}
        id={PHOTO_MODEL_INPUT_ID}
        accept={PHOTO_MODEL_ACCEPT}
        label="Escolher foto do móvel"
        onFile={photoModel.handleFile}
      />
      <HiddenFileInput
        ref={cameraRef}
        accept={CAMERA_ACCEPT}
        capture="environment"
        label="Tirar foto do móvel"
        onFile={photoModel.handleFile}
      />

      {model === null && !photoModel.isBusy && (
        <PhotoChoice
          hasCamera={hasCamera}
          onTakePhoto={() => cameraRef.current?.click()}
          onUpload={() => inputRef.current?.click()}
        />
      )}
      {(photoModel.isBusy || hasFailed) && (
        // No celular o painel fica recolhido: o erro aparece aqui, não escondido na folha.
        <ScanLoader
          dimensions={dimensions}
          label={BUSY_LABEL[photoModel.phase] ?? ''}
          errorMessage={hasFailed ? photoModel.errorMessage : null}
          onCancel={photoModel.cancel}
        />
      )}
      {model !== null && !photoModel.isBusy && (
        <ActiveModel model={model} onModelChange={onModelChange} />
      )}
    </section>
  )
}
