import type { Material, Mesh, Object3D } from 'three'
import { MeshStandardMaterial } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { hasRenderableGeometry } from './fitModel'

export class EmptyModelError extends Error {
  constructor() {
    super('O arquivo não contém um objeto 3D utilizável.')
    this.name = 'EmptyModelError'
  }
}

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true
}

/** Abaixo disto o tecido vira espelho do estúdio escuro. */
const MIN_PHOTO_ROUGHNESS = 0.75
/** Reforço do reflexo do ambiente: a textura gerada já vem com sombra pintada. */
const PHOTO_ENV_INTENSITY = 1.6

function materialsOf(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}

/**
 * O gerador entrega o material como metal (o padrão do formato quando o
 * campo falta), e metal num estúdio escuro reflete o escuro: o móvel sai
 * quase preto. Móvel de foto é tratado como superfície fosca, que mostra a
 * cor da textura. Não se aplica a um .glb enviado pela pessoa.
 */
export function softenPhotoMaterials(scene: Object3D): void {
  scene.traverse((child) => {
    if (!isMesh(child)) return
    materialsOf(child).forEach((material) => {
      if (!(material instanceof MeshStandardMaterial)) return
      material.metalness = 0
      material.metalnessMap = null
      material.roughness = Math.max(material.roughness, MIN_PHOTO_ROUGHNESS)
      material.envMapIntensity = PHOTO_ENV_INTENSITY
      material.needsUpdate = true
    })
  })
}

/** Carrega um GLB (URL remota ou blob local) e valida que há geometria de verdade. */
export async function loadGlbModel(url: string): Promise<Object3D> {
  const gltf = await new GLTFLoader().loadAsync(url)
  if (!hasRenderableGeometry(gltf.scene)) throw new EmptyModelError()

  gltf.scene.traverse((child) => {
    if (!isMesh(child)) return
    child.castShadow = true
    child.receiveShadow = true
  })
  return gltf.scene
}

function disposeMaterial(material: Material): void {
  Object.values(material).forEach((value: unknown) => {
    const texture = value as { isTexture?: boolean; dispose?: () => void } | null
    if (texture?.isTexture) texture.dispose?.()
  })
  material.dispose()
}

/** Libera a memória de GPU de um modelo que saiu de cena. */
export function disposeModel(object: Object3D): void {
  object.traverse((child) => {
    if (!isMesh(child)) return
    child.geometry.dispose()
    materialsOf(child).forEach(disposeMaterial)
  })
}
