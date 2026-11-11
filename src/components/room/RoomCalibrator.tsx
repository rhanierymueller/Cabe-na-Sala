import type { PointerEvent } from 'react'
import { useRef } from 'react'
import type { PhotoPoint, PhotoSize } from '../../utils/roomPhoto'

export interface ReferenceLine {
  readonly bottom: PhotoPoint
  readonly top: PhotoPoint
}

interface RoomCalibratorProps {
  readonly size: PhotoSize
  readonly line: ReferenceLine
  readonly label: string
  readonly onChange: (line: ReferenceLine) => void
}

type Handle = keyof ReferenceLine

const HANDLES: readonly Handle[] = ['bottom', 'top']
/** Tamanhos relativos ao lado maior da foto, para não depender da resolução. */
const HANDLE_RADIUS_RATIO = 0.016
const HIT_RADIUS_RATIO = 0.06
const STROKE_RATIO = 0.004

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), max)
}

/**
 * Linha de referência sobre a foto: duas alças arrastáveis, uma no chão e
 * outra no topo de algo com altura conhecida.
 */
export function RoomCalibrator({ size, line, label, onChange }: RoomCalibratorProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const longSide = Math.max(size.widthPx, size.heightPx)

  const handleMove = (handle: Handle, event: PointerEvent<SVGCircleElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return

    const point: PhotoPoint = {
      x: clamp(((event.clientX - rect.left) / rect.width) * size.widthPx, size.widthPx),
      y: clamp(((event.clientY - rect.top) / rect.height) * size.heightPx, size.heightPx),
    }
    onChange({ ...line, [handle]: point })
  }

  return (
    <svg
      ref={svgRef}
      className="room__calibrator"
      viewBox={`0 0 ${size.widthPx} ${size.heightPx}`}
      preserveAspectRatio="none"
    >
      <line
        className="room__line room__line--halo"
        x1={line.bottom.x}
        y1={line.bottom.y}
        x2={line.top.x}
        y2={line.top.y}
        strokeWidth={longSide * STROKE_RATIO * 2.4}
      />
      <line
        className="room__line"
        x1={line.bottom.x}
        y1={line.bottom.y}
        x2={line.top.x}
        y2={line.top.y}
        strokeWidth={longSide * STROKE_RATIO}
      />
      <text
        className="room__line-label"
        x={(line.bottom.x + line.top.x) / 2 + longSide * 0.03}
        y={(line.bottom.y + line.top.y) / 2}
        fontSize={longSide * 0.034}
        strokeWidth={longSide * 0.008}
      >
        {label}
      </text>
      {HANDLES.map((handle) => (
        <g key={handle}>
          <circle
            className="room__handle-dot"
            cx={line[handle].x}
            cy={line[handle].y}
            r={longSide * HANDLE_RADIUS_RATIO}
            strokeWidth={longSide * STROKE_RATIO}
          />
          <circle
            className="room__handle-hit"
            cx={line[handle].x}
            cy={line[handle].y}
            r={longSide * HIT_RADIUS_RATIO}
            role="slider"
            aria-label={handle === 'bottom' ? 'Ponta no chão' : 'Ponta no topo'}
            aria-valuenow={Math.round(line[handle].y)}
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerMove={(event) => handleMove(handle, event)}
          />
        </g>
      ))}
    </svg>
  )
}
