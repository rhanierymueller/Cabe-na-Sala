/** Dimensões em centímetros — unidade usada na UI (o que o usuário digita). */
export interface DimensionsCm {
  readonly widthCm: number
  readonly heightCm: number
  readonly depthCm: number
}

/** Dimensões em metros — unidade interna do 3D/AR (regra do projeto: metros, sempre). */
export interface DimensionsMeters {
  readonly widthM: number
  readonly heightM: number
  readonly depthM: number
}

/** Eixo editável no formulário de medidas. */
export type DimensionAxis = keyof DimensionsCm

/** Categorias de móvel disponíveis no catálogo paramétrico. */
export type FurnitureKind = 'stove' | 'sofa' | 'fridge' | 'wardrobe' | 'bed' | 'table' | 'frame'

export interface DimensionFieldConfig {
  readonly axis: DimensionAxis
  readonly label: string
  readonly hint: string
}
