import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { DimensionsMeters } from '../../types/furniture'
import { formatMeasureBackdrop } from './stageLayout'

interface MeasureBackdropProps {
  readonly dimensions: DimensionsMeters
}

const TEXTURE_WIDTH_PX = 2048
const TEXTURE_HEIGHT_PX = 420
const PANEL_WIDTH_M = 5
const PANEL_HEIGHT_M = (PANEL_WIDTH_M * TEXTURE_HEIGHT_PX) / TEXTURE_WIDTH_PX
/** Distância entre as costas do móvel e os números. */
const BEHIND_M = 0.9
/** Altura do pé dos números: sobem o bastante para aparecer por cima de um sofá. */
const FLOOR_GAP_M = 0.35
const AFTER_FLOOR_FADE = 1
const FONT = '700 300px -apple-system, "SF Pro Display", "Inter", "Helvetica Neue", Arial, sans-serif'

/**
 * A assinatura do "estúdio", agora dentro da cena: as medidas gigantes em pé
 * atrás do móvel, contando enquanto ele estica e refletidas no chão.
 */
export function MeasureBackdrop({ dimensions }: MeasureBackdropProps) {
  const { canvas, texture } = useMemo(() => {
    const element = document.createElement('canvas')
    element.width = TEXTURE_WIDTH_PX
    element.height = TEXTURE_HEIGHT_PX
    const canvasTexture = new CanvasTexture(element)
    canvasTexture.colorSpace = SRGBColorSpace
    return { canvas: element, texture: canvasTexture }
  }, [])
  useEffect(() => () => texture.dispose(), [texture])

  const text = formatMeasureBackdrop(dimensions)

  useEffect(() => {
    const context = canvas.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, TEXTURE_WIDTH_PX, TEXTURE_HEIGHT_PX)
    context.font = FONT
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = '#ffffff'
    context.fillText(text, TEXTURE_WIDTH_PX / 2, TEXTURE_HEIGHT_PX / 2 + 16, TEXTURE_WIDTH_PX - 40)
    // eslint-disable-next-line react-hooks/immutability -- é assim que o three recebe o canvas redesenhado
    texture.needsUpdate = true
  }, [canvas, texture, text])

  return (
    // Desenhado depois do esmaecimento do chão: os números não gravam profundidade, então o
    // chão distante (já da cor do fundo) era pintado por cima deles e abria uma faixa preta.
    <mesh
      renderOrder={AFTER_FLOOR_FADE}
      position={[0, PANEL_HEIGHT_M / 2 + FLOOR_GAP_M, -(dimensions.depthM / 2 + BEHIND_M)]}
    >
      <planeGeometry args={[PANEL_WIDTH_M, PANEL_HEIGHT_M]} />
      <meshBasicMaterial map={texture} transparent opacity={0.13} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
