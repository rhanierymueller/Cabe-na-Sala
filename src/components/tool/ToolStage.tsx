import type { DimensionsCm, FurnitureKind, ScannedModel } from '../../types/furniture'
import { dimensionsCmToMeters } from '../../utils/units'
import { FurnitureViewer } from '../viewer/FurnitureViewer'

interface ToolStageProps {
  readonly kind: FurnitureKind
  readonly dimensionsCm: DimensionsCm
  readonly scannedModel: ScannedModel | null
}

/** O palco: o móvel em 3D. As medidas gigantes de fundo agora vivem dentro da cena. */
export function ToolStage({ kind, dimensionsCm, scannedModel }: ToolStageProps) {
  return (
    <div className="tool__canvas" aria-label="Visualização 3D do móvel">
      <FurnitureViewer
        kind={kind}
        dimensions={dimensionsCmToMeters(dimensionsCm)}
        scannedModel={scannedModel}
      />
    </div>
  )
}
