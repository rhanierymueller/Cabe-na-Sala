/**
 * Geometria do "ver na foto da minha sala": a partir de uma medida conhecida
 * marcada na foto, estima a pose da câmera para desenhar o móvel por cima em
 * tamanho proporcional. É uma estimativa, não uma medição.
 */

/** Ponto na foto, em pixels da imagem original (origem no canto superior esquerdo). */
export interface PhotoPoint {
  readonly x: number
  readonly y: number
}

export interface PhotoSize {
  readonly widthPx: number
  readonly heightPx: number
}

/** Câmera estimada: sem rolagem, inclinada `pitchRad` para baixo, a `heightM` do chão. */
export interface CameraPose {
  readonly focalPx: number
  readonly pitchRad: number
  readonly heightM: number
}

export interface GroundPoint {
  readonly x: number
  readonly z: number
}

/**
 * ponytail: assume a câmera principal do celular (equivalente a 26 mm em
 * sensor de 36 mm). Foto em 0,5x ou com zoom sai fora de proporção longe da
 * referência; ler o EXIF resolve se virar reclamação.
 */
const FOCAL_TO_LONG_SIDE = 26 / 36

/**
 * ponytail: altura de quem fotografa em pé com o celular no peito. O tamanho
 * no ponto da referência não depende dela; só a variação com a distância.
 * Vira um controle se a estimativa incomodar.
 */
export const ASSUMED_CAMERA_HEIGHT_M = 1.45
/**
 * Quando a marcação não fecha com a altura acima (foto tirada sentado, de
 * cima, ou recortada), tentam-se as vizinhas, da mais próxima à mais distante.
 */
const CAMERA_HEIGHT_CANDIDATES_M = [
  ASSUMED_CAMERA_HEIGHT_M,
  1.35,
  1.55,
  1.25,
  1.65,
  1.15,
  1.75,
  1.05,
  0.95,
] as const

const MIN_PITCH_RAD = -Math.PI / 4
const MAX_PITCH_RAD = (Math.PI * 80) / 180
const PITCH_SCAN_STEPS = 250
const BISECTION_STEPS = 40
/** Chão mais longe que isto é quase horizonte: o toque não vale como posição. */
const MAX_GROUND_DISTANCE_M = 30

export function focalLengthPx(size: PhotoSize): number {
  return Math.max(size.widthPx, size.heightPx) * FOCAL_TO_LONG_SIDE
}

/** Campo de visão vertical, em graus, para a câmera do three.js. */
export function verticalFovDeg(size: PhotoSize): number {
  return (2 * Math.atan(size.heightPx / 2 / focalLengthPx(size)) * 180) / Math.PI
}

/** Raio do pixel no mundo (câmera olha para -z, y para cima), sem normalizar. */
function worldRay(point: PhotoPoint, size: PhotoSize, focalPx: number, pitchRad: number) {
  const x = point.x - size.widthPx / 2
  const up = size.heightPx / 2 - point.y
  const cos = Math.cos(pitchRad)
  const sin = Math.sin(pitchRad)
  return { x, y: up * cos - focalPx * sin, z: -up * sin - focalPx * cos }
}

/** Onde o raio do pixel toca o chão; null se aponta para o horizonte ou acima. */
export function groundPointFromPixel(
  point: PhotoPoint,
  size: PhotoSize,
  pose: CameraPose,
): GroundPoint | null {
  const ray = worldRay(point, size, pose.focalPx, pose.pitchRad)
  if (ray.y >= 0) return null

  const distance = pose.heightM / -ray.y
  const ground = { x: ray.x * distance, z: ray.z * distance }
  return Math.hypot(ground.x, ground.z) > MAX_GROUND_DISTANCE_M ? null : ground
}

interface Reference {
  /** Ponta da referência que encosta no chão. */
  readonly bottom: PhotoPoint
  /** Ponta de cima, na vertical da de baixo. */
  readonly top: PhotoPoint
  readonly heightM: number
}

/**
 * Erro de altura da referência para uma inclinação candidata: projeta a base
 * no chão e mede a que altura o raio do topo passa nessa mesma distância.
 */
function referenceHeightError(
  reference: Reference,
  size: PhotoSize,
  focalPx: number,
  cameraHeightM: number,
  pitchRad: number,
): number | null {
  const bottomRay = worldRay(reference.bottom, size, focalPx, pitchRad)
  const topRay = worldRay(reference.top, size, focalPx, pitchRad)
  if (bottomRay.y >= 0 || bottomRay.z >= 0 || topRay.z >= 0) return null

  const depth = (cameraHeightM / -bottomRay.y) * bottomRay.z
  const topHeightM = cameraHeightM + (depth / topRay.z) * topRay.y
  return topHeightM - reference.heightM
}

/** Inclinação que faz a referência ter a altura certa, para uma altura de câmera dada. */
function solvePitch(
  reference: Reference,
  size: PhotoSize,
  focalPx: number,
  cameraHeightM: number,
): number | null {
  const errorAt = (pitchRad: number): number | null =>
    referenceHeightError(reference, size, focalPx, cameraHeightM, pitchRad)
  const stepRad = (MAX_PITCH_RAD - MIN_PITCH_RAD) / PITCH_SCAN_STEPS

  for (let step = 0; step < PITCH_SCAN_STEPS; step += 1) {
    let low = MIN_PITCH_RAD + step * stepRad
    let high = low + stepRad
    const lowError = errorAt(low)
    const highError = errorAt(high)
    if (lowError === null || highError === null || lowError * highError > 0) continue

    for (let iteration = 0; iteration < BISECTION_STEPS; iteration += 1) {
      const middle = (low + high) / 2
      const middleError = errorAt(middle)
      if (middleError === null) break
      if (middleError * lowError > 0) low = middle
      else high = middle
    }
    return (low + high) / 2
  }
  return null
}

/**
 * Estima a câmera a partir de uma referência vertical de altura conhecida
 * (a porta, o pé-direito). Devolve null quando a marcação não fecha com
 * nenhuma inclinação e altura de câmera plausíveis.
 */
export function estimateCameraPose(reference: Reference, size: PhotoSize): CameraPose | null {
  if (reference.heightM <= 0 || reference.top.y >= reference.bottom.y) return null

  const focalPx = focalLengthPx(size)
  for (const heightM of CAMERA_HEIGHT_CANDIDATES_M) {
    const pitchRad = solvePitch(reference, size, focalPx, heightM)
    if (pitchRad !== null) return { focalPx, pitchRad, heightM }
  }
  return null
}
