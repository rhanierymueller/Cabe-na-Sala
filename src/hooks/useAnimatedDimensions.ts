import { useFrame } from '@react-three/fiber'
import { useState } from 'react'
import { MathUtils } from 'three'
import type { DimensionsMeters } from '../types/furniture'

/** Velocidade da animação — quanto maior, mais rápido o móvel "cresce". */
const DAMPING_LAMBDA = 8
/** Abaixo desta diferença (em metros) consideramos a animação concluída. */
const CONVERGENCE_EPSILON_M = 0.0005

function dampDimensions(
  current: DimensionsMeters,
  target: DimensionsMeters,
  deltaSeconds: number,
): DimensionsMeters {
  const hasConverged =
    Math.abs(current.widthM - target.widthM) < CONVERGENCE_EPSILON_M &&
    Math.abs(current.heightM - target.heightM) < CONVERGENCE_EPSILON_M &&
    Math.abs(current.depthM - target.depthM) < CONVERGENCE_EPSILON_M

  // Mesma referência quando convergido → React pula o re-render.
  if (hasConverged) return current

  return {
    widthM: MathUtils.damp(current.widthM, target.widthM, DAMPING_LAMBDA, deltaSeconds),
    heightM: MathUtils.damp(current.heightM, target.heightM, DAMPING_LAMBDA, deltaSeconds),
    depthM: MathUtils.damp(current.depthM, target.depthM, DAMPING_LAMBDA, deltaSeconds),
  }
}

/**
 * Interpola suavemente as dimensões atuais em direção às medidas alvo,
 * fazendo o móvel "crescer" animado quando o usuário muda uma medida.
 * Deve ser usado dentro de um <Canvas> (depende de useFrame).
 */
export function useAnimatedDimensions(target: DimensionsMeters): DimensionsMeters {
  const [animated, setAnimated] = useState(target)

  useFrame((_, deltaSeconds) => {
    setAnimated((current) => dampDimensions(current, target, deltaSeconds))
  })

  return animated
}
