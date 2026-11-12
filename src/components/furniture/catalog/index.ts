import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  BedDouble,
  Box,
  DoorClosed,
  Flame,
  Image,
  Refrigerator,
  Sofa,
  UtensilsCrossed,
} from 'lucide-react'
import type {
  ArPlacement,
  DimensionsCm,
  DimensionsMeters,
  FurnitureKind,
} from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { DEFAULT_BED_DIMENSIONS_CM, computeBedLayout } from './bed'
import { DEFAULT_CABINET_DIMENSIONS_CM, computeCabinetLayout } from './cabinet'
import { DEFAULT_FRAME_DIMENSIONS_CM, computeFrameLayout } from './frame'
import { DEFAULT_FRIDGE_DIMENSIONS_CM, computeFridgeLayout } from './fridge'
import { DEFAULT_OTHER_DIMENSIONS_CM, computeOtherLayout } from './other'
import { DEFAULT_SOFA_DIMENSIONS_CM, computeSofaLayout } from './sofa'
import { DEFAULT_STOVE_DIMENSIONS_CM, computeStoveLayout } from './stove'
import { DEFAULT_TABLE_DIMENSIONS_CM, computeTableLayout } from './table'
import { DEFAULT_WARDROBE_DIMENSIONS_CM, computeWardrobeLayout } from './wardrobe'

interface FurnitureDefinition {
  readonly kind: FurnitureKind
  readonly label: string
  readonly icon: LucideIcon
  readonly defaultDimensionsCm: DimensionsCm
  readonly computeLayout: (dimensions: DimensionsMeters) => FurnitureLayout
  /** Onde o AR ancora: chão (padrão) ou parede (quadros). */
  readonly arPlacement?: ArPlacement
}

export const FURNITURE_CATALOG: Record<FurnitureKind, FurnitureDefinition> = {
  stove: {
    kind: 'stove',
    label: 'Fogão',
    icon: Flame,
    defaultDimensionsCm: DEFAULT_STOVE_DIMENSIONS_CM,
    computeLayout: computeStoveLayout,
  },
  sofa: {
    kind: 'sofa',
    label: 'Sofá',
    icon: Sofa,
    defaultDimensionsCm: DEFAULT_SOFA_DIMENSIONS_CM,
    computeLayout: computeSofaLayout,
  },
  fridge: {
    kind: 'fridge',
    label: 'Geladeira',
    icon: Refrigerator,
    defaultDimensionsCm: DEFAULT_FRIDGE_DIMENSIONS_CM,
    computeLayout: computeFridgeLayout,
  },
  wardrobe: {
    kind: 'wardrobe',
    label: 'Guarda-roupa',
    icon: DoorClosed,
    defaultDimensionsCm: DEFAULT_WARDROBE_DIMENSIONS_CM,
    computeLayout: computeWardrobeLayout,
  },
  bed: {
    kind: 'bed',
    label: 'Cama',
    icon: BedDouble,
    defaultDimensionsCm: DEFAULT_BED_DIMENSIONS_CM,
    computeLayout: computeBedLayout,
  },
  table: {
    kind: 'table',
    label: 'Mesa',
    icon: UtensilsCrossed,
    defaultDimensionsCm: DEFAULT_TABLE_DIMENSIONS_CM,
    computeLayout: computeTableLayout,
  },
  cabinet: {
    kind: 'cabinet',
    label: 'Rack',
    icon: Archive,
    defaultDimensionsCm: DEFAULT_CABINET_DIMENSIONS_CM,
    computeLayout: computeCabinetLayout,
  },
  frame: {
    kind: 'frame',
    label: 'Quadro',
    icon: Image,
    defaultDimensionsCm: DEFAULT_FRAME_DIMENSIONS_CM,
    computeLayout: computeFrameLayout,
    arPlacement: 'wall',
  },
  other: {
    kind: 'other',
    label: 'Outro',
    icon: Box,
    defaultDimensionsCm: DEFAULT_OTHER_DIMENSIONS_CM,
    computeLayout: computeOtherLayout,
  },
}

/** Ordem de exibição no menu. */
export const FURNITURE_KINDS: readonly FurnitureKind[] = [
  'stove',
  'sofa',
  'fridge',
  'wardrobe',
  'bed',
  'table',
  'cabinet',
  'frame',
  'other',
]

/** Valida um tipo vindo de fora (URL, servidor). */
export function toFurnitureKind(value: unknown): FurnitureKind | null {
  return FURNITURE_KINDS.includes(value as FurnitureKind) ? (value as FurnitureKind) : null
}
