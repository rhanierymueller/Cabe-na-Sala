import type { Material, Object3D } from 'three'
import { Mesh } from 'three'
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
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach(disposeMaterial)
  })
}
