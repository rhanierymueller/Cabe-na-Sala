import { useCallback, useState } from 'react'
import { MAX_DIMENSION_CM, MIN_DIMENSION_CM } from '../constants/dimensions'
import type { DimensionAxis, DimensionsCm } from '../types/furniture'
import {
  clampDimensionCm,
  isWithinDimensionLimits,
  parseDimensionInput,
} from '../utils/dimensionValidation'

type FieldValues = Readonly<Record<DimensionAxis, string>>
type FieldErrors = Readonly<Partial<Record<DimensionAxis, string>>>

interface DimensionsFormState {
  readonly dimensionsCm: DimensionsCm
  readonly fieldValues: FieldValues
  readonly fieldErrors: FieldErrors
}

export interface DimensionsForm {
  readonly dimensionsCm: DimensionsCm
  readonly fieldValues: FieldValues
  readonly fieldErrors: FieldErrors
  readonly handleFieldChange: (axis: DimensionAxis, rawValue: string) => void
  readonly handleFieldBlur: (axis: DimensionAxis) => void
  /** Substitui todas as medidas — usado ao trocar de móvel no catálogo. */
  readonly reset: (dimensions: DimensionsCm) => void
}

const OUT_OF_RANGE_MESSAGE = `Use entre ${MIN_DIMENSION_CM} e ${MAX_DIMENSION_CM} cm`
const INVALID_NUMBER_MESSAGE = 'Digite um número válido'

function createInitialState(initialDimensions: DimensionsCm): DimensionsFormState {
  return {
    dimensionsCm: initialDimensions,
    fieldValues: {
      widthCm: String(initialDimensions.widthCm),
      heightCm: String(initialDimensions.heightCm),
      depthCm: String(initialDimensions.depthCm),
    },
    fieldErrors: {},
  }
}

function reduceFieldChange(
  state: DimensionsFormState,
  axis: DimensionAxis,
  rawValue: string,
): DimensionsFormState {
  const fieldValues = { ...state.fieldValues, [axis]: rawValue }
  const parsedCm = parseDimensionInput(rawValue)

  if (parsedCm === null) {
    return {
      ...state,
      fieldValues,
      fieldErrors: { ...state.fieldErrors, [axis]: INVALID_NUMBER_MESSAGE },
    }
  }

  if (!isWithinDimensionLimits(parsedCm)) {
    return {
      ...state,
      fieldValues,
      fieldErrors: { ...state.fieldErrors, [axis]: OUT_OF_RANGE_MESSAGE },
    }
  }

  return {
    dimensionsCm: { ...state.dimensionsCm, [axis]: parsedCm },
    fieldValues,
    fieldErrors: { ...state.fieldErrors, [axis]: undefined },
  }
}

function reduceFieldBlur(state: DimensionsFormState, axis: DimensionAxis): DimensionsFormState {
  const parsedCm = parseDimensionInput(state.fieldValues[axis])
  const normalizedCm = parsedCm === null ? state.dimensionsCm[axis] : clampDimensionCm(parsedCm)

  return {
    dimensionsCm: { ...state.dimensionsCm, [axis]: normalizedCm },
    fieldValues: { ...state.fieldValues, [axis]: String(normalizedCm) },
    fieldErrors: { ...state.fieldErrors, [axis]: undefined },
  }
}

/**
 * Estado controlado do formulário de medidas: o texto digitado fica livre
 * enquanto o usuário edita, mas só medidas válidas chegam ao modelo 3D.
 * No blur, o valor é normalizado (clamp nos limites).
 */
export function useDimensionsForm(initialDimensions: DimensionsCm): DimensionsForm {
  const [state, setState] = useState(() => createInitialState(initialDimensions))

  const handleFieldChange = useCallback((axis: DimensionAxis, rawValue: string) => {
    setState((current) => reduceFieldChange(current, axis, rawValue))
  }, [])

  const handleFieldBlur = useCallback((axis: DimensionAxis) => {
    setState((current) => reduceFieldBlur(current, axis))
  }, [])

  const reset = useCallback((dimensions: DimensionsCm) => {
    setState(createInitialState(dimensions))
  }, [])

  return {
    dimensionsCm: state.dimensionsCm,
    fieldValues: state.fieldValues,
    fieldErrors: state.fieldErrors,
    handleFieldChange,
    handleFieldBlur,
    reset,
  }
}
