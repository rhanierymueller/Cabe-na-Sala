/**
 * Sistema de peças paramétricas: todo móvel do catálogo é uma lista de
 * caixas e cilindros derivados das medidas totais. Um único renderer
 * (FurnitureModel) e um único exportador USDZ entendem qualquer móvel.
 */

export type Vec3 = readonly [number, number, number]

export interface MaterialSpec {
  readonly color: string
  readonly roughness: number
  readonly metalness: number
}

export interface FurniturePart {
  readonly shape: 'box' | 'cylinder'
  readonly position: Vec3
  /** Box: [largura, altura, profundidade]. Cilindro: [raio, comprimento, raio]. */
  readonly size: Vec3
  readonly rotation: Vec3
  readonly material: MaterialSpec
}

export type FurnitureLayout = readonly FurniturePart[]

export const NO_ROTATION: Vec3 = [0, 0, 0]
export const FACING_FRONT: Vec3 = [Math.PI / 2, 0, 0]
export const LYING_SIDEWAYS: Vec3 = [0, 0, Math.PI / 2]

export function box(position: Vec3, size: Vec3, material: MaterialSpec): FurniturePart {
  return { shape: 'box', position, size, rotation: NO_ROTATION, material }
}

export function cylinder(
  position: Vec3,
  radius: number,
  length: number,
  material: MaterialSpec,
  rotation: Vec3 = NO_ROTATION,
): FurniturePart {
  return { shape: 'cylinder', position, size: [radius, length, radius], rotation, material }
}

/** Paleta compartilhada — o viewer e o AR mostram exatamente o mesmo material. */
export const MATERIALS = {
  steel: { color: '#cfd4d9', roughness: 0.35, metalness: 0.6 },
  darkSteel: { color: '#3a3f45', roughness: 0.35, metalness: 0.6 },
  graphite: { color: '#2d3239', roughness: 0.4, metalness: 0.55 },
  cooktop: { color: '#3a3f45', roughness: 0.25, metalness: 0.6 },
  burner: { color: '#1c1f23', roughness: 0.7, metalness: 0.5 },
  glass: { color: '#14181d', roughness: 0.1, metalness: 0.2 },
  chrome: { color: '#e8ebee', roughness: 0.15, metalness: 0.9 },
  fabricDark: { color: '#3f4652', roughness: 0.9, metalness: 0.05 },
  fabricSeat: { color: '#4c5563', roughness: 0.9, metalness: 0.05 },
  wood: { color: '#8a6f52', roughness: 0.7, metalness: 0.05 },
  woodDark: { color: '#5f4c37', roughness: 0.7, metalness: 0.05 },
  mattress: { color: '#d9dde3', roughness: 0.85, metalness: 0 },
  pillow: { color: '#eceef2', roughness: 0.9, metalness: 0 },
} as const satisfies Record<string, MaterialSpec>
