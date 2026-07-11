import type { Vec3 } from '../furniture/parts'

/**
 * Linha do tempo do scrollytelling da landing.
 * O scroll (0 → 1) dirige uma única cena 3D fixa que conta a história:
 *
 *   HERO    → o móvel gira sozinho no primeiro plano, título por cima
 *   GIRO    → "no anúncio parece perfeito" — volta completa de 360°
 *   COZINHA → uma cozinha estilizada cresce do chão, com um vão vazio
 *   ENCAIXE → o móvel desliza para trás e assenta exato no vão; medidas surgem
 */

export interface StoryFrame {
  /** Posição do móvel — ele desliza da frente do palco até o vão da cozinha. */
  readonly stovePosition: Vec3
  readonly stoveRotationY: number
  /** 0 = cozinha invisível, 1 = balcões e parede em altura total. */
  readonly kitchenGrowth: number
  readonly cameraPosition: Vec3
  readonly lookAtTarget: Vec3
  readonly areLabelsVisible: boolean
}

export interface StoryCaption {
  readonly range: readonly [number, number]
  readonly text: string
}

export const STORY_CAPTIONS: readonly StoryCaption[] = [
  { range: [0.17, 0.33], text: 'No anúncio, todo móvel parece perfeito.' },
  { range: [0.38, 0.57], text: 'A pergunta é: será que cabe no seu espaço?' },
  { range: [0.63, 0.84], text: 'Aqui ele gira, desliza e encaixa — antes de pagar.' },
]

/** Faixa do scroll em que o overlay do hero (título + CTA) esmaece. */
export const HERO_FADE_RANGE: readonly [number, number] = [0.02, 0.12]

const FULL_TURN = Math.PI * 2
/** Posição inicial do móvel: à frente do palco, onde a cozinha não alcança. */
const STOVE_START_Z = 0.85
/** Posição final: dentro do vão da cozinha (origem). */
const STOVE_END_Z = 0.01

interface NumberKeyframe {
  readonly at: number
  readonly value: number
}

interface Vec3Keyframe {
  readonly at: number
  readonly value: Vec3
}

// Câmera mira alto no hero para o móvel assentar na parte de baixo do
// quadro — o título e o CTA ficam com a metade de cima livre.
const CAMERA_KEYFRAMES: readonly Vec3Keyframe[] = [
  { at: 0, value: [1.7, 1.5, 3.0] },
  { at: 0.25, value: [1.35, 1.05, 2.45] },
  { at: 0.48, value: [2.2, 1.55, 3.1] },
  { at: 0.75, value: [1.5, 1.3, 2.6] },
  { at: 1, value: [1.85, 1.35, 2.45] },
]

const LOOK_AT_KEYFRAMES: readonly Vec3Keyframe[] = [
  { at: 0, value: [0, 1.05, 0.7] },
  { at: 0.25, value: [0, 0.6, 0.7] },
  { at: 0.48, value: [0, 0.8, 0.1] },
  { at: 0.75, value: [0, 0.65, 0] },
  { at: 1, value: [0, 0.65, 0] },
]

const ROTATION_KEYFRAMES: readonly NumberKeyframe[] = [
  { at: 0, value: 0.45 },
  { at: 0.15, value: 0.45 },
  // Volta completa: o visitante vê o móvel por todos os lados.
  { at: 0.38, value: FULL_TURN },
  { at: 1, value: FULL_TURN },
]

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

/** Progresso 0→1 dentro de uma janela do scroll, com easing suave. */
export function easedWindow(progress: number, from: number, to: number): number {
  return smoothstep(clamp01((progress - from) / (to - from)))
}

function sampleNumber(progress: number, keyframes: readonly NumberKeyframe[]): number {
  const first = keyframes[0]
  const last = keyframes[keyframes.length - 1]
  if (progress <= first.at) return first.value
  if (progress >= last.at) return last.value

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const current = keyframes[index]
    const next = keyframes[index + 1]
    if (progress >= current.at && progress <= next.at) {
      const t = smoothstep((progress - current.at) / (next.at - current.at))
      return lerp(current.value, next.value, t)
    }
  }
  return last.value
}

function sampleVec3(progress: number, keyframes: readonly Vec3Keyframe[]): Vec3 {
  const sampleAxis = (axis: 0 | 1 | 2): number =>
    sampleNumber(
      progress,
      keyframes.map(({ at, value }) => ({ at, value: value[axis] })),
    )
  return [sampleAxis(0), sampleAxis(1), sampleAxis(2)]
}

export function sampleStoryFrame(progress: number): StoryFrame {
  const p = clamp01(progress)

  const kitchenGrowth = easedWindow(p, 0.36, 0.56)
  const slideIn = easedWindow(p, 0.6, 0.78)

  return {
    stovePosition: [0, 0, lerp(STOVE_START_Z, STOVE_END_Z, slideIn)],
    stoveRotationY: sampleNumber(p, ROTATION_KEYFRAMES),
    kitchenGrowth,
    cameraPosition: sampleVec3(p, CAMERA_KEYFRAMES),
    lookAtTarget: sampleVec3(p, LOOK_AT_KEYFRAMES),
    areLabelsVisible: p >= 0.72,
  }
}

/** Proporção de tela (largura/altura) para a qual a câmera foi calibrada. */
const BASELINE_ASPECT = 1.4
const MAX_DISTANCE_FACTOR = 1.9
const DISTANCE_EXPONENT = 0.55
const MAX_LOOK_AT_LIFT_M = 0.15

export interface PortraitCompensation {
  /** Multiplica a posição da câmera — afasta em telas estreitas (retrato). */
  readonly distanceFactor: number
  /** Sobe o ponto de mira para o móvel assentar mais baixo no quadro. */
  readonly lookAtYOffset: number
}

/**
 * Em retrato (celular), o campo de visão horizontal encolhe e o móvel
 * estoura o quadro. Compensa afastando a câmera e subindo a mira.
 */
export function computePortraitCompensation(aspect: number): PortraitCompensation {
  if (aspect >= BASELINE_ASPECT) {
    return { distanceFactor: 1, lookAtYOffset: 0 }
  }

  const safeAspect = Math.max(0.4, aspect)
  const rawFactor = Math.pow(BASELINE_ASPECT / safeAspect, DISTANCE_EXPONENT)

  return {
    distanceFactor: Math.min(MAX_DISTANCE_FACTOR, rawFactor),
    lookAtYOffset: MAX_LOOK_AT_LIFT_M * (1 - safeAspect / BASELINE_ASPECT),
  }
}
