import type { Object3D } from 'three'
import { Box3, Group, Vector3 } from 'three'
import type { DimensionsMeters } from '../../../types/furniture'

/** Giros de 90° em torno do eixo vertical — o gerador não sabe onde é a frente. */
export type QuarterTurns = 0 | 1 | 2 | 3

export type Size3 = readonly [number, number, number]

const QUARTER_TURN_RAD = Math.PI / 2
const QUARTER_TURNS_IN_FULL_TURN = 4
/** Abaixo disto (em unidades do modelo) um lado é considerado sem volume. */
const MIN_SIDE = 1e-6

export interface NormalizedModel {
  /** Modelo recentrado: base em y = 0, centro em x/z = 0, já girado. */
  readonly root: Group
  /** Tamanho da caixa envolvente do modelo normalizado, na unidade dele. */
  readonly baseSize: Size3
}

export function nextQuarterTurn(current: QuarterTurns): QuarterTurns {
  return ((current + 1) % QUARTER_TURNS_IN_FULL_TURN) as QuarterTurns
}

/** Um modelo só serve se tiver malha com volume nos três eixos. */
export function hasRenderableGeometry(object: Object3D): boolean {
  const size = new Box3().setFromObject(object).getSize(new Vector3())
  return [size.x, size.y, size.z].every((side) => Number.isFinite(side) && side > MIN_SIDE)
}

/**
 * Recentra uma cópia do modelo: gira, apoia no chão e centraliza. O original
 * não é alterado — o mesmo modelo carregado serve ao viewer e ao AR.
 */
export function normalizeModel(source: Object3D, quarterTurns: QuarterTurns): NormalizedModel {
  const turned = new Group()
  turned.add(source.clone(true))
  turned.rotation.y = quarterTurns * QUARTER_TURN_RAD
  turned.updateMatrixWorld(true)

  const box = new Box3().setFromObject(turned)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())

  const root = new Group()
  root.add(turned)
  turned.position.set(-center.x, -box.min.y, -center.z)
  root.updateMatrixWorld(true)

  return { root, baseSize: [size.x, size.y, size.z] }
}

/** Escala por eixo que leva o modelo normalizado às medidas digitadas. */
export function computeFitScale(baseSize: Size3, target: DimensionsMeters): Size3 {
  const [baseX, baseY, baseZ] = baseSize
  return [
    target.widthM / Math.max(baseX, MIN_SIDE),
    target.heightM / Math.max(baseY, MIN_SIDE),
    target.depthM / Math.max(baseZ, MIN_SIDE),
  ]
}

/**
 * Escolhe entre manter ou girar 90°: fica com a orientação em que a planta
 * do modelo (largura ÷ profundidade) mais se parece com a das medidas,
 * ou seja, a que deforma menos ao encaixar.
 */
export function suggestQuarterTurns(modelSize: Size3, target: DimensionsMeters): QuarterTurns {
  const [modelX, , modelZ] = modelSize
  const targetAspect = Math.log(target.widthM / target.depthM)
  const keptDistortion = Math.abs(Math.log(modelX / modelZ) - targetAspect)
  const turnedDistortion = Math.abs(Math.log(modelZ / modelX) - targetAspect)
  return turnedDistortion < keptDistortion ? 1 : 0
}

/**
 * Monta o modelo já do tamanho real como THREE.Group puro — usado pelo
 * exportador USDZ. A caixa envolvente bate com as medidas digitadas.
 */
export function buildScannedGroup(
  source: Object3D,
  target: DimensionsMeters,
  quarterTurns: QuarterTurns,
): Group {
  const { root, baseSize } = normalizeModel(source, quarterTurns)
  const fitted = new Group()
  fitted.add(root)
  fitted.scale.set(...computeFitScale(baseSize, target))
  fitted.updateMatrixWorld(true)
  return fitted
}
