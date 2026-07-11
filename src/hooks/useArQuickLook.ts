import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildFurnitureGroup } from '../components/furniture/buildFurnitureGroup'
import type { DimensionsMeters, FurnitureKind } from '../types/furniture'
import { trackEvent } from '../utils/analytics'
import type { UsdzExportResult } from '../utils/usdzExport'
import { exportObjectToUsdz, isArQuickLookSupported, openArQuickLook } from '../utils/usdzExport'

export type ArLaunchStatus = 'idle' | 'generating' | 'error'

export interface ArQuickLook {
  readonly isSupported: boolean
  readonly status: ArLaunchStatus
  readonly launchAr: () => void
}

/**
 * Gera o USDZ do móvel selecionado com as medidas atuais e abre o AR
 * Quick Look. O modelo é regenerado a cada toque, sempre atualizado.
 */
export function useArQuickLook(kind: FurnitureKind, dimensions: DimensionsMeters): ArQuickLook {
  const [status, setStatus] = useState<ArLaunchStatus>('idle')
  const isSupported = useMemo(isArQuickLookSupported, [])
  const lastExportRef = useRef<UsdzExportResult | null>(null)

  useEffect(() => {
    return () => lastExportRef.current?.revoke()
  }, [])

  const launchAr = useCallback(() => {
    const generateAndOpen = async (): Promise<void> => {
      setStatus('generating')
      trackEvent('launch_ar', { furniture: kind })
      try {
        const furnitureGroup = buildFurnitureGroup(kind, dimensions)
        const usdzExport = await exportObjectToUsdz(furnitureGroup)

        lastExportRef.current?.revoke()
        lastExportRef.current = usdzExport

        openArQuickLook(usdzExport.arUrl)
        setStatus('idle')
      } catch (error: unknown) {
        console.error('Falha ao gerar o modelo USDZ para AR', error)
        setStatus('error')
      }
    }

    void generateAndOpen()
  }, [kind, dimensions])

  return { isSupported, status, launchAr }
}
