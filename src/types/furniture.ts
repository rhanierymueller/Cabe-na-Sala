import type { Object3D } from 'three'

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
export type FurnitureKind =
  | 'stove'
  | 'sofa'
  | 'fridge'
  | 'wardrobe'
  | 'bed'
  | 'table'
  | 'cabinet'
  | 'frame'

/** Onde o AR ancora o objeto: chão (padrão) ou parede (quadros). */
export type ArPlacement = 'floor' | 'wall'

export interface DimensionFieldConfig {
  readonly axis: DimensionAxis
  readonly label: string
  readonly hint: string
}

/** De onde veio o modelo que substitui o móvel paramétrico. */
export type ScannedModelSource = 'photo' | 'file'

/**
 * Modelo 3D do produto real (gerado a partir de uma foto ou enviado como
 * arquivo). A forma vem dele; o tamanho continua vindo das medidas digitadas.
 */
export interface ScannedModel {
  readonly scene: Object3D
  readonly source: ScannedModelSource
  /** Giros de 90° no eixo vertical — o gerador não sabe onde é a frente. */
  readonly quarterTurns: 0 | 1 | 2 | 3
}
