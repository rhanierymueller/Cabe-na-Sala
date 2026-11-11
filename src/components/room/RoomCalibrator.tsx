import type { KeyboardEvent, PointerEvent } from 'react'
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
/** Passo das setas do teclado, como fração do lado maior. */
const KEY_STEP_RATIO = 0.01
const KEY_DIRECTIONS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

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

  const handleKeyDown = (handle: Handle, event: KeyboardEvent<SVGCircleElement>): void => {
    const direction = KEY_DIRECTIONS[event.key]
    if (!direction) return
    event.preventDefault()

    const stepPx = longSide * KEY_STEP_RATIO
    const current = line[handle]
    onChange({
      ...line,
      [handle]: {
        x: clamp(current.x + direction[0] * stepPx, size.widthPx),
        y: clamp(current.y + direction[1] * stepPx, size.heightPx),
      },
    })
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
            tabIndex={0}
            aria-label={
              handle === 'bottom'
                ? 'Ponta no chão. Use as setas para mover.'
                : 'Ponta no topo. Use as setas para mover.'
            }
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={Math.round(size.heightPx)}
            aria-valuenow={Math.round(line[handle].y)}
            onKeyDown={(event) => handleKeyDown(handle, event)}
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerMove={(event) => handleMove(handle, event)}
          />
        </g>
      ))}
    </svg>
  )
}
