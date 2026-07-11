import { motion } from 'framer-motion'
import { ArrowLeft, Sofa } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ArButton } from '../components/ar/ArButton'
import { DimensionsForm } from '../components/form/DimensionsForm'
import { FURNITURE_CATALOG } from '../components/furniture/catalog'
import { ShareButton } from '../components/share/ShareButton'
import { DoorCheck } from '../components/tool/DoorCheck'
import { FurniturePicker } from '../components/tool/FurniturePicker'
import { FurnitureViewer } from '../components/viewer/FurnitureViewer'
import { useDimensionsForm } from '../hooks/useDimensionsForm'
import type { DimensionsCm, FurnitureKind } from '../types/furniture'
import { trackEvent } from '../utils/analytics'
import { dimensionsCmToMeters } from '../utils/units'
import type { ToolUrlState } from '../utils/urlState'
import { buildToolSearch } from '../utils/urlState'

interface ToolPageProps {
  /** Estado vindo de um link compartilhado (`?movel=...`), se houver. */
  readonly initialState: ToolUrlState | null
  readonly onBackToLanding: () => void
  readonly onStateChange: (
    kind: FurnitureKind,
    dimensionsCm: DimensionsCm,
    doorWidthCm: number | null,
  ) => void
}

const FALLBACK_KIND: FurnitureKind = 'stove'

export function ToolPage({ initialState, onBackToLanding, onStateChange }: ToolPageProps) {
  const [kind, setKind] = useState<FurnitureKind>(initialState?.kind ?? FALLBACK_KIND)
  const [doorWidthCm, setDoorWidthCm] = useState<number | null>(initialState?.doorWidthCm ?? null)
  const definition = FURNITURE_CATALOG[kind]
  const form = useDimensionsForm(initialState?.dimensionsCm ?? definition.defaultDimensionsCm)
  const dimensionsMeters = dimensionsCmToMeters(form.dimensionsCm)

  // Mantém a URL espelhando o estado — todo ajuste vira link compartilhável.
  useEffect(() => {
    onStateChange(kind, form.dimensionsCm, doorWidthCm)
  }, [kind, form.dimensionsCm, doorWidthCm, onStateChange])

  useEffect(() => {
    trackEvent('view_tool', { furniture: kind })
    // Dispara só na chegada — trocas de móvel já aparecem nos outros eventos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shareUrl = `${window.location.origin}${window.location.pathname}${buildToolSearch(kind, form.dimensionsCm, doorWidthCm)}`

  const handleSelectKind = (nextKind: FurnitureKind): void => {
    setKind(nextKind)
    form.reset(FURNITURE_CATALOG[nextKind].defaultDimensionsCm)
  }

  return (
    <motion.div
      className="tool"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="tool__canvas" aria-label="Visualização 3D do móvel">
        <FurnitureViewer kind={kind} dimensions={dimensionsMeters} />
      </div>

      <FurniturePicker selectedKind={kind} onSelect={handleSelectKind} />

      <motion.aside
        className="tool__panel"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <header className="tool__header">
          <button type="button" className="app__back" onClick={onBackToLanding}>
            <ArrowLeft size={14} aria-hidden="true" /> Início
          </button>
          <h1 className="app__brand">
            <Sofa size={22} aria-hidden="true" /> Cabe na Sala
          </h1>
        </header>

        <DimensionsForm form={form} furnitureLabel={definition.label} />

        <DoorCheck
          dimensionsCm={form.dimensionsCm}
          doorWidthCm={doorWidthCm}
          onDoorWidthChange={setDoorWidthCm}
        />

        <ArButton kind={kind} dimensions={dimensionsMeters} handoffUrl={shareUrl} />

        <ShareButton
          furnitureLabel={definition.label}
          dimensionsCm={form.dimensionsCm}
          doorWidthCm={doorWidthCm}
          shareUrl={shareUrl}
        />

        <footer className="tool__footer">
          <p>Grade do chão: cada quadrado = 10 cm.</p>
        </footer>
      </motion.aside>
    </motion.div>
  )
}
