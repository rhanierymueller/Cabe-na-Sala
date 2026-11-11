import { useCallback, useState } from 'react'
import { FURNITURE_CATALOG } from '../components/furniture/catalog'
import { disposeModel } from '../components/furniture/scanned/loadModel'
import type { AdMeasures } from '../services/measuresApi'
import type { FurnitureKind, ScannedModel } from '../types/furniture'
import { fillMissingMeasures } from '../utils/dimensionValidation'
import type { ToolUrlState } from '../utils/urlState'
import type { DimensionsForm } from './useDimensionsForm'
import { useDimensionsForm } from './useDimensionsForm'

interface ToolSelection {
  readonly kind: FurnitureKind
  readonly form: DimensionsForm
  readonly scannedModel: ScannedModel | null
  /** Muda quando a pessoa troca de móvel: remonta a foto do anúncio e cancela a geração. */
  readonly photoSession: number
  readonly selectKind: (kind: FurnitureKind) => void
  readonly applyAdMeasures: (found: AdMeasures) => void
  readonly applyPhotoKind: (kind: FurnitureKind) => void
  readonly changeScannedModel: (model: ScannedModel | null) => void
}

const FALLBACK_KIND: FurnitureKind = 'stove'

/**
 * O móvel escolhido, as medidas dele e o modelo da foto, com as três formas
 * de trocar de móvel: pelo seletor, pelo anúncio lido ou pela foto enviada.
 */
export function useToolSelection(initialState: ToolUrlState | null): ToolSelection {
  const [kind, setKind] = useState<FurnitureKind>(initialState?.kind ?? FALLBACK_KIND)
  const [scannedModel, setScannedModel] = useState<ScannedModel | null>(null)
  const [photoSession, setPhotoSession] = useState(0)
  const form = useDimensionsForm(initialState?.dimensionsCm ?? FURNITURE_CATALOG[kind].defaultDimensionsCm)

  // Troca o modelo e libera a GPU do anterior (girar mantém a mesma cena).
  const changeScannedModel = useCallback((next: ScannedModel | null): void => {
    setScannedModel((current) => {
      if (current && current.scene !== next?.scene) disposeModel(current.scene)
      return next
    })
  }, [])

  // O modelo da foto pertence ao produto anterior.
  const switchKind = (nextKind: FurnitureKind): void => {
    changeScannedModel(null)
    setPhotoSession((session) => session + 1)
    setKind(nextKind)
  }

  const selectKind = (nextKind: FurnitureKind): void => {
    // Tocar no móvel já ativo não pode apagar um modelo que custou uma geração.
    if (nextKind === kind) return
    switchKind(nextKind)
    form.reset(FURNITURE_CATALOG[nextKind].defaultDimensionsCm)
  }

  const applyAdMeasures = (found: AdMeasures): void => {
    const nextKind = found.kind ?? kind
    // Medida que o anúncio não traz: a que está na tela, ou a padrão do móvel novo.
    const base = nextKind === kind ? form.dimensionsCm : FURNITURE_CATALOG[nextKind].defaultDimensionsCm
    if (nextKind !== kind) switchKind(nextKind)
    form.reset(fillMissingMeasures(found, base))
  }

  // A foto mostrou outro tipo de móvel: troca o tipo sem cancelar a geração, e as
  // medidas só mudam se ainda forem as padrão (ninguém digitou nada).
  const applyPhotoKind = (detectedKind: FurnitureKind): void => {
    if (detectedKind === kind) return
    const defaults = FURNITURE_CATALOG[kind].defaultDimensionsCm
    const isUntouched = (['widthCm', 'heightCm', 'depthCm'] as const).every(
      (axis) => form.dimensionsCm[axis] === defaults[axis],
    )
    setKind(detectedKind)
    if (isUntouched) form.reset(FURNITURE_CATALOG[detectedKind].defaultDimensionsCm)
  }

  return {
    kind,
    form,
    scannedModel,
    photoSession,
    selectKind,
    applyAdMeasures,
    applyPhotoKind,
    changeScannedModel,
  }
}
