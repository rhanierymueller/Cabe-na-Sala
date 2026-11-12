import { Html } from '@react-three/drei'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { Object3D } from 'three'
import { LatheGeometry, Vector2 } from 'three'
import { useHtmlPortal } from '../../hooks/useHtmlPortal'
import { normalizeModel } from '../furniture/scanned/fitModel'
import { disposeModel, loadGlbModel } from '../furniture/scanned/loadModel'
import { FIGURE_HEIGHT_M } from './stageLayout'

/** Pessoa gerada por IA (Higgsfield/Meshy), servida como arquivo estático. */
const PERSON_MODEL_URL = '/models/person.glb'
/** O modelo vem de perfil; um quarto de volta o põe de frente, como o móvel. */
const PERSON_QUARTER_TURNS = 1

interface ScaleFigureProps {
  readonly position: readonly [number, number, number]
}

type Vec3 = readonly [number, number, number]

const FIGURE_COLOR = '#70747c'
const SIDES = [-1, 1] as const
/** Perfil do tronco, de baixo para cima: [raio, altura]. Quadril, cintura, peito, ombro, pescoço. */
const TORSO_PROFILE: readonly (readonly [number, number])[] = [
  [0.0, 0.86],
  [0.13, 0.88],
  [0.16, 0.95],
  [0.135, 1.06],
  [0.128, 1.12],
  [0.158, 1.26],
  [0.178, 1.36],
  [0.16, 1.415],
  [0.07, 1.445],
  [0.0, 1.45],
]
/** O torno gera um tronco redondo; achatado de frente para trás vira um corpo. */
const TORSO_DEPTH_SCALE = 0.6

function Skin() {
  return <meshStandardMaterial color={FIGURE_COLOR} roughness={0.62} metalness={0.05} />
}

interface LimbProps {
  readonly position: Vec3
  readonly topRadius: number
  readonly bottomRadius: number
  readonly length: number
  readonly tilt?: number
}

/** Segmento de braço ou perna: mais grosso em cima, com a junta arredondada embaixo. */
function Limb({ position, topRadius, bottomRadius, length, tilt = 0 }: LimbProps) {
  return (
    <group position={[...position]} rotation={[0, 0, tilt]}>
      <mesh castShadow>
        <cylinderGeometry args={[topRadius, bottomRadius, length, 20]} />
        <Skin />
      </mesh>
      <mesh position={[0, -length / 2, 0]} castShadow>
        <sphereGeometry args={[bottomRadius, 16, 12]} />
        <Skin />
      </mesh>
    </group>
  )
}

interface BlobProps {
  readonly position: Vec3
  readonly radius: number
  readonly scale: Vec3
}

function Blob({ position, radius, scale }: BlobProps) {
  return (
    <mesh position={[...position]} scale={[...scale]} castShadow>
      <sphereGeometry args={[radius, 28, 20]} />
      <Skin />
    </mesh>
  )
}

function mirrored(render: (side: -1 | 1) => ReactNode): ReactNode {
  return SIDES.map((side) => <group key={side}>{render(side)}</group>)
}

/** Manequim com proporção humana (oito cabeças), gerado em código: aparece enquanto a pessoa carrega, ou se o arquivo faltar. */
function Mannequin() {
  const torsoGeometry = useMemo(
    () => new LatheGeometry(TORSO_PROFILE.map(([radius, y]) => new Vector2(radius, y)), 32),
    [],
  )

  return (
    <>
      <Blob position={[0, 1.585, 0]} radius={0.1} scale={[0.9, 1.15, 1]} />
      <Limb position={[0, 1.47, 0]} topRadius={0.045} bottomRadius={0.05} length={0.09} />
      <mesh geometry={torsoGeometry} scale={[1, 1, TORSO_DEPTH_SCALE]} castShadow>
        <Skin />
      </mesh>

      {mirrored((side) => (
        <>
          <Blob position={[side * 0.19, 1.375, 0]} radius={0.058} scale={[1, 1, 1]} />
          <Limb position={[side * 0.208, 1.225, 0]} topRadius={0.05} bottomRadius={0.04} length={0.3} tilt={side * 0.07} />
          <Limb position={[side * 0.228, 0.94, 0.01]} topRadius={0.038} bottomRadius={0.028} length={0.26} tilt={side * 0.04} />
          <Blob position={[side * 0.235, 0.755, 0.015]} radius={0.04} scale={[0.6, 1.6, 0.95]} />

          <Limb position={[side * 0.085, 0.7, 0]} topRadius={0.082} bottomRadius={0.054} length={0.42} />
          <Limb position={[side * 0.085, 0.28, 0]} topRadius={0.054} bottomRadius={0.036} length={0.42} />
          <Blob position={[side * 0.085, 0.035, 0.055]} radius={0.05} scale={[0.95, 0.7, 2.3]} />
        </>
      ))}
    </>
  )
}

/** Carrega a pessoa em 3D; devolve null enquanto carrega ou se o arquivo não vier. */
function usePersonModel(): Object3D | null {
  const [model, setModel] = useState<Object3D | null>(null)

  useEffect(() => {
    let isCancelled = false
    let loaded: Object3D | null = null
    loadGlbModel(PERSON_MODEL_URL)
      .then((scene) => {
        if (isCancelled) return disposeModel(scene)
        loaded = scene
        setModel(scene)
      })
      // Sem o arquivo a cena segue com o manequim, que já está na tela.
      .catch(() => undefined)

    return () => {
      isCancelled = true
      if (loaded) disposeModel(loaded)
    }
  }, [])

  return model
}

function Person({ model }: { readonly model: Object3D }) {
  const normalized = useMemo(() => normalizeModel(model, PERSON_QUARTER_TURNS), [model])
  const scale = FIGURE_HEIGHT_M / normalized.baseSize[1]

  return (
    <group scale={scale}>
      <primitive object={normalized.root} />
    </group>
  )
}

/** Pessoa de 1,70 m ao lado do móvel: dá ao número digitado um tamanho que o olho entende. */
export function ScaleFigure({ position }: ScaleFigureProps) {
  const portal = useHtmlPortal()
  const personModel = usePersonModel()

  return (
    <group position={[...position]}>
      {personModel ? <Person model={personModel} /> : <Mannequin />}

      <Html
        position={[0, FIGURE_HEIGHT_M + 0.14, 0]}
        center
        portal={portal}
        zIndexRange={[5, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <span className="dimension-line__label dimension-line__label--quiet">1,70 m</span>
      </Html>
    </group>
  )
}
