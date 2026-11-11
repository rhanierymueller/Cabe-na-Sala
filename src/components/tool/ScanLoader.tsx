import type { CSSProperties, PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DimensionsMeters } from '../../types/furniture'
import { metersToCentimeters } from '../../utils/units'
import '../../styles/scan-loader.css'

interface ScanLoaderProps {
  readonly dimensions: DimensionsMeters
  readonly label: string
  /** Quando presente, a espera acabou em erro: a caixa para e o texto explica. */
  readonly errorMessage?: string | null
  /** Cancela a geração ou, depois de um erro, fecha o aviso. */
  readonly onCancel: () => void
}

/** Lado maior da caixa na tela; os outros seguem a proporção das medidas. */
const BOX_MAX_SIDE_PX = 150
const BOX_MIN_SIDE_PX = 14
const DRAG_DEGREES_PER_PX = 0.6
const INITIAL_TILT_DEG = -20
const MAX_TILT_DEG = 70
const SECOND_MS = 1000
const FACES = ['front', 'back', 'left', 'right', 'top', 'bottom'] as const

interface Spin {
  readonly yawDeg: number
  readonly tiltDeg: number
}

function toBoxSidePx(valueM: number, largestM: number): number {
  return Math.max(BOX_MIN_SIDE_PX, (valueM / largestM) * BOX_MAX_SIDE_PX)
}

/**
 * Espera da geração por foto: a caixa do móvel, nas proporções das medidas
 * digitadas, sendo varrida por um plano de luz. Dá para girar com o dedo.
 * Cobre a tela com um fosco escuro para a pessoa não mexer no resto.
 */
export function ScanLoader({ dimensions, label, errorMessage = null, onCancel }: ScanLoaderProps) {
  const hasFailed = errorMessage !== null
  const [spin, setSpin] = useState<Spin>({ yawDeg: 0, tiltDeg: INITIAL_TILT_DEG })
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (hasFailed) return
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), SECOND_MS)
    return () => window.clearInterval(timer)
  }, [hasFailed])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    lastPointRef.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const last = lastPointRef.current
    if (!last) return
    const deltaX = event.clientX - last.x
    const deltaY = event.clientY - last.y
    lastPointRef.current = { x: event.clientX, y: event.clientY }
    setSpin((current) => ({
      yawDeg: current.yawDeg + deltaX * DRAG_DEGREES_PER_PX,
      tiltDeg: Math.min(
        MAX_TILT_DEG,
        Math.max(-MAX_TILT_DEG, current.tiltDeg - deltaY * DRAG_DEGREES_PER_PX),
      ),
    }))
  }

  const handlePointerEnd = (): void => {
    lastPointRef.current = null
  }

  const largestM = Math.max(dimensions.widthM, dimensions.heightM, dimensions.depthM)
  const boxStyle = {
    '--scan-w': `${toBoxSidePx(dimensions.widthM, largestM)}px`,
    '--scan-h': `${toBoxSidePx(dimensions.heightM, largestM)}px`,
    '--scan-d': `${toBoxSidePx(dimensions.depthM, largestM)}px`,
  } as CSSProperties
  const sizeText = [dimensions.widthM, dimensions.heightM, dimensions.depthM]
    .map((valueM) => Math.round(metersToCentimeters(valueM)))
    .join(' × ')

  return createPortal(
    <div className={`scan${hasFailed ? ' scan--failed' : ''}`} role="dialog" aria-modal="true" aria-label="Gerando o modelo 3D">
      <div
        className="scan__stage"
        style={boxStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        aria-hidden="true"
      >
        <div
          className="scan__drag"
          style={{ transform: `rotateX(${spin.tiltDeg}deg) rotateY(${spin.yawDeg}deg)` }}
        >
          <div className="scan__box">
            {FACES.map((face) => (
              <span key={face} className={`scan__face scan__face--${face}`} />
            ))}
            <span className="scan__plane" />
          </div>
        </div>
      </div>

      <p className="scan__size">{sizeText} cm</p>
      {hasFailed ? (
        <p className="scan__label scan__label--error" role="alert">
          {errorMessage}
        </p>
      ) : (
        <>
          <p className="scan__label" role="status">
            {label}
          </p>
          <p className="scan__hint">{elapsedSeconds} s · arraste a caixa para girar</p>
        </>
      )}
      <button type="button" className="scan__cancel" onClick={onCancel}>
        {hasFailed ? 'Tentar outra foto' : 'Cancelar'}
      </button>
    </div>,
    document.body,
  )
}
