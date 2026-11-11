import { Camera } from 'lucide-react'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { PHOTO_MODEL_INPUT_ID } from '../photo-model/PhotoModel'
import { RoomPhotoEntry } from '../room/RoomPhotoEntry'

interface ToolShortcutsProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  readonly scannedModel: ScannedModel | null
}

/** Atalhos sob o botão principal. No computador só aparece o da foto da sala. */
export function ToolShortcuts({ kind, dimensions, scannedModel }: ToolShortcutsProps) {
  return (
    <div className="tool__shortcuts">
      {/* Só no celular: com a folha recolhida, o cartão da foto do anúncio não aparece. */}
      <button
        type="button"
        className="button tool__photo-shortcut"
        onClick={() => document.getElementById(PHOTO_MODEL_INPUT_ID)?.click()}
      >
        <Camera size={16} aria-hidden="true" /> 3D pela foto
      </button>
      <RoomPhotoEntry kind={kind} dimensions={dimensions} scannedModel={scannedModel} />
    </div>
  )
}
