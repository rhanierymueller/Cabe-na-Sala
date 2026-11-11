import { Download, Ruler } from 'lucide-react'

interface RoomPlaceBarProps {
  readonly rotationDeg: number
  readonly onRotationChange: (rotationDeg: number) => void
  readonly onRecalibrate: () => void
  readonly onSave: () => void
}

const ICON_SIZE = 16
const FULL_TURN_DEG = 360
const ROTATION_STEP_DEG = 5

/** Passo 2 da foto da sala: girar o móvel, refazer a régua ou salvar a imagem. */
export function RoomPlaceBar({ rotationDeg, onRotationChange, onRecalibrate, onSave }: RoomPlaceBarProps) {
  return (
    <>
      <p className="room__hint">
        Toque ou arraste no chão para posicionar. O tamanho é aproximado; a medida exata é a que
        você digitou.
      </p>
      <div className="room__row">
        <label className="room__field room__field--grow">
          Girar
          <input
            className="slider"
            type="range"
            min={0}
            max={FULL_TURN_DEG}
            step={ROTATION_STEP_DEG}
            value={rotationDeg}
            onChange={(event) => onRotationChange(Number(event.target.value))}
          />
        </label>
        <button type="button" className="button" onClick={onRecalibrate}>
          <Ruler size={ICON_SIZE} aria-hidden="true" /> Refazer marcação
        </button>
        <button type="button" className="button button--primary" onClick={onSave}>
          <Download size={ICON_SIZE} aria-hidden="true" /> Salvar imagem
        </button>
      </div>
    </>
  )
}
