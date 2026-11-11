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
  readonly shape: 'box' | 'roundedBox' | 'cylinder'
  readonly position: Vec3
  /** Box: [largura, altura, profundidade]. Cilindro: [raio, comprimento, raio]. */
  readonly size: Vec3
  readonly rotation: Vec3
  readonly material: MaterialSpec
  /** Só em `roundedBox`: raio das quinas, em metros. */
  readonly radius?: number
}

export type FurnitureLayout = readonly FurniturePart[]

const NO_ROTATION: Vec3 = [0, 0, 0]
export const FACING_FRONT: Vec3 = [Math.PI / 2, 0, 0]
export const LYING_SIDEWAYS: Vec3 = [0, 0, Math.PI / 2]

export function box(position: Vec3, size: Vec3, material: MaterialSpec): FurniturePart {
  return { shape: 'box', position, size, rotation: NO_ROTATION, material }
}

/** Quinas levemente quebradas — madeira, aço, portas. */
const EDGE_SOFT = 0.08
/** Quinas bem redondas — almofadas, colchão, travesseiros. */
export const EDGE_PLUSH = 0.38
const MAX_RADIUS_RATIO = 0.5

/**
 * Caixa de quinas arredondadas. `radiusRatio` é relativo ao menor lado,
 * então o arredondamento acompanha a peça quando as medidas mudam.
 */
export function roundedBox(
  position: Vec3,
  size: Vec3,
  material: MaterialSpec,
  radiusRatio: number = EDGE_SOFT,
): FurniturePart {
  const radius = Math.min(...size) * Math.min(radiusRatio, MAX_RADIUS_RATIO)
  return { shape: 'roundedBox', position, size, rotation: NO_ROTATION, material, radius }
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
  /** Aço escovado dos eletrodomésticos atuais. */
  inox: { color: '#aeb2b6', roughness: 0.34, metalness: 0.6 },
  blackGlass: { color: '#0b0c0e', roughness: 0.06, metalness: 0.35 },
  blackSteel: { color: '#1b1c1f', roughness: 0.45, metalness: 0.5 },
  /** Espelho: claro e brilhante. Metal puro refletiria o estúdio escuro e sairia preto. */
  mirror: { color: '#c3ccd2', roughness: 0.12, metalness: 0.45 },
  lacquer: { color: '#d9d4cb', roughness: 0.5, metalness: 0 },
  oak: { color: '#c9a67e', roughness: 0.6, metalness: 0.02 },
  oakDark: { color: '#8f7254', roughness: 0.62, metalness: 0.02 },
  darkSteel: { color: '#33373c', roughness: 0.4, metalness: 0.6 },
  graphite: { color: '#8f9499', roughness: 0.5, metalness: 0.2 },
  cooktop: { color: '#24272b', roughness: 0.2, metalness: 0.55 },
  burner: { color: '#121416', roughness: 0.7, metalness: 0.5 },
  chrome: { color: '#f2f3f4', roughness: 0.2, metalness: 0.6 },
  fabricDark: { color: '#a89c8a', roughness: 0.95, metalness: 0 },
  fabricSeat: { color: '#c9bfae', roughness: 0.95, metalness: 0 },
  woodDark: { color: '#6e4b31', roughness: 0.66, metalness: 0.02 },
  mattress: { color: '#eceae4', roughness: 0.9, metalness: 0 },
  pillow: { color: '#f7f5f0', roughness: 0.92, metalness: 0 },
  duvet: { color: '#8b9684', roughness: 0.95, metalness: 0 },
  canvas: { color: '#efe8d8', roughness: 0.95, metalness: 0 },
  art: { color: '#c8553d', roughness: 0.9, metalness: 0 },
} as const satisfies Record<string, MaterialSpec>
