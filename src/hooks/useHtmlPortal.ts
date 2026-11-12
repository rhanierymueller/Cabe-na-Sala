import { useThree } from '@react-three/fiber'
import type { RefObject } from 'react'
import { useRef } from 'react'

/**
 * Onde o `Html` da drei deve pendurar as etiquetas: o contêiner do canvas,
 * fixo desde a primeira renderização. Sem isto a drei escolhe o destino
 * sozinha, ele muda logo depois de a cena montar (R3F 9.8) e a primeira
 * etiqueta some na troca.
 */
export function useHtmlPortal(): RefObject<HTMLElement> {
  const canvas = useThree((state) => state.gl.domElement)
  return useRef(canvas.parentElement as HTMLElement)
}
