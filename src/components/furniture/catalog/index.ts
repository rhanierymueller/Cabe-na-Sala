import type { LucideIcon } from 'lucide-react'
import {
  BedDouble,
  DoorClosed,
  Flame,
  Image,
  Refrigerator,
  Sofa,
  UtensilsCrossed,
} from 'lucide-react'
import type { DimensionsCm, DimensionsMeters, FurnitureKind } from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { DEFAULT_BED_DIMENSIONS_CM, computeBedLayout } from './bed'
import { DEFAULT_FRAME_DIMENSIONS_CM, computeFrameLayout } from './frame'
import { DEFAULT_FRIDGE_DIMENSIONS_CM, computeFridgeLayout } from './fridge'
import { DEFAULT_SOFA_DIMENSIONS_CM, computeSofaLayout } from './sofa'
import { DEFAULT_STOVE_DIMENSIONS_CM, computeStoveLayout } from './stove'
import { DEFAULT_TABLE_DIMENSIONS_CM, computeTableLayout } from './table'
import { DEFAULT_WARDROBE_DIMENSIONS_CM, computeWardrobeLayout } from './wardrobe'

export interface FurnitureDefinition {
  readonly kind: FurnitureKind
  readonly label: string
  readonly icon: LucideIcon
  readonly defaultDimensionsCm: DimensionsCm
  readonly computeLayout: (dimensions: DimensionsMeters) => FurnitureLayout
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
  frame: {
    kind: 'frame',
    label: 'Quadro',
    icon: Image,
    defaultDimensionsCm: DEFAULT_FRAME_DIMENSIONS_CM,
    computeLayout: computeFrameLayout,
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
  'frame',
]

export { DEFAULT_STOVE_DIMENSIONS_CM }
