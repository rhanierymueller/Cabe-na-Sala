import { Check } from 'lucide-react'
import type { RoomCalibration } from '../../hooks/useRoomCalibration'

interface RoomCalibrateBarProps {
  readonly calibration: RoomCalibration
  readonly onCancel: () => void
  readonly onContinue: () => void
}

const ICON_SIZE = 16

/** O que dizer enquanto procura a referência, depois de achar ou quando a marcação é à mão. */
function DetectionHint({ detection, referenceCm }: Pick<RoomCalibration, 'detection' | 'referenceCm'>) {
  if (detection.status === 'looking') {
    return (
      <p className="room__hint" role="status">
        Procurando na foto algo de altura conhecida… Se preferir, já pode arrastar a linha.
      </p>
    )
  }
  if (detection.status === 'found') {
    return (
      <p className="room__hint room__hint--found" role="status">
        Marquei {detection.label} ({referenceCm} cm). Confira as duas pontas e ajuste se precisar.
      </p>
    )
  }
  return (
    <p className="room__hint">
      Arraste a linha: uma ponta no chão, a outra no topo de algo que você sabe a altura. A porta
      costuma ter 210 cm.
    </p>
  )
}

/** Passo 1 da foto da sala: conferir a régua e a altura dela. */
export function RoomCalibrateBar({ calibration, onCancel, onContinue }: RoomCalibrateBarProps) {
  const { detection, referenceCm, size, pose } = calibration

  return (
    <>
      <DetectionHint detection={detection} referenceCm={referenceCm} />
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
              onChange={(event) => calibration.changeReferenceCm(event.target.value)}
            />
            cm
          </span>
        </label>
        <button type="button" className="button" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={onContinue}
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
  )
}
