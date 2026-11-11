import type { DimensionsCm, FurnitureKind, ScannedModel } from '../../types/furniture'
import { dimensionsCmToMeters } from '../../utils/units'
import { FurnitureViewer } from '../viewer/FurnitureViewer'

interface ToolStageProps {
  readonly kind: FurnitureKind
  readonly dimensionsCm: DimensionsCm
  readonly scannedModel: ScannedModel | null
}

/** O palco: as medidas gigantes e quase apagadas atrás, o móvel em 3D na frente. */
export function ToolStage({ kind, dimensionsCm, scannedModel }: ToolStageProps) {
  return (
    <div className="tool__canvas" aria-label="Visualização 3D do móvel">
      <p className="tool__backdrop" aria-hidden="true">
        {dimensionsCm.widthCm} × {dimensionsCm.heightCm} × {dimensionsCm.depthCm}
      </p>
      <FurnitureViewer
        kind={kind}
        dimensions={dimensionsCmToMeters(dimensionsCm)}
        scannedModel={scannedModel}
      />
    </div>
  )
}
