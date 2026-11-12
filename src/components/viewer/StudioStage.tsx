import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { CanvasTexture } from 'three'

const BACKGROUND = '#0d0e10'
const FLOOR_RADIUS_M = 13
const FADE_TEXTURE_PX = 256
const NARROW_VIEWPORT_PX = 700

/** Apaga o chão até a cor do fundo conforme ele se afasta: sem isso aparece a linha do horizonte. */
function FloorFade() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = FADE_TEXTURE_PX
    canvas.height = FADE_TEXTURE_PX
    const context = canvas.getContext('2d')
    if (context) {
      const half = FADE_TEXTURE_PX / 2
      const gradient = context.createRadialGradient(half, half, half * 0.22, half, half, half * 0.62)
      gradient.addColorStop(0, 'rgba(13, 14, 16, 0)')
      gradient.addColorStop(1, 'rgba(13, 14, 16, 1)')
      context.fillStyle = gradient
      context.fillRect(0, 0, FADE_TEXTURE_PX, FADE_TEXTURE_PX)
    }
    return new CanvasTexture(canvas)
  }, [])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
      <planeGeometry args={[FLOOR_RADIUS_M * 2, FLOOR_RADIUS_M * 2]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  )
}

/**
 * O estúdio em volta do móvel: fundo grafite, chão que reflete e some no
 * escuro, e a poça de luz quente, agora uma luz de verdade.
 */
export function StudioStage() {
  return (
    <>
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 7, 16]} />
      <spotLight position={[0.5, 5, 2]} angle={0.36} penumbra={1} intensity={38} color="#ffe9cf" />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[FLOOR_RADIUS_M * 2, FLOOR_RADIUS_M * 2]} />
        <MeshReflectorMaterial
          // Metade da resolução no celular: o reflexo é a parte mais cara da cena.
          resolution={window.innerWidth < NARROW_VIEWPORT_PX ? 512 : 1024}
          blur={[320, 90]}
          mixBlur={1}
          mixStrength={5}
          mirror={0.45}
          roughness={0.9}
          metalness={0.15}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#0c0d0f"
        />
      </mesh>
      <FloorFade />
      <ContactShadows position={[0, 0.004, 0]} opacity={0.7} scale={12} blur={2.2} far={2.5} />
    </>
  )
}
