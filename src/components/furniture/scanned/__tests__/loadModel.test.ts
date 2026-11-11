import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { describe, expect, test } from 'vitest'
import { softenPhotoMaterials } from '../loadModel'

describe('softenPhotoMaterials', () => {
  test('tira o metal e deixa fosco o material que o gerador entrega', () => {
    // Arrange: como chega um GLB sem os campos de metal e rugosidade.
    const material = new MeshStandardMaterial({ metalness: 1, roughness: 0.2 })
    const scene = new Group().add(new Mesh(new BoxGeometry(), material))

    // Act
    softenPhotoMaterials(scene)

    // Assert
    expect(material.metalness).toBe(0)
    expect(material.roughness).toBeGreaterThanOrEqual(0.75)
    expect(material.envMapIntensity).toBeGreaterThan(1)
  })

  test('mantém a rugosidade de quem já é fosco', () => {
    const material = new MeshStandardMaterial({ metalness: 0.5, roughness: 0.95 })
    const scene = new Group().add(new Mesh(new BoxGeometry(), material))

    softenPhotoMaterials(scene)

    expect(material.roughness).toBe(0.95)
  })

  test('ignora materiais que não são do tipo padrão', () => {
    const material = new MeshBasicMaterial({ color: '#336699' })
    const scene = new Group().add(new Mesh(new BoxGeometry(), material))

    expect(() => softenPhotoMaterials(scene)).not.toThrow()
    expect(material.color.getHexString()).toBe('336699')
  })
})
