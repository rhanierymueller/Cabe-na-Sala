import { motion } from 'framer-motion'
import { ArrowLeft, Sofa } from 'lucide-react'
import { useState } from 'react'
import { ArButton } from '../components/ar/ArButton'
import { DimensionsForm } from '../components/form/DimensionsForm'
import { FURNITURE_CATALOG } from '../components/furniture/catalog'
import { FurniturePicker } from '../components/tool/FurniturePicker'
import { FurnitureViewer } from '../components/viewer/FurnitureViewer'
import { useDimensionsForm } from '../hooks/useDimensionsForm'
import type { FurnitureKind } from '../types/furniture'
import { dimensionsCmToMeters } from '../utils/units'

interface ToolPageProps {
  readonly onBackToLanding: () => void
}

const INITIAL_KIND: FurnitureKind = 'stove'

export function ToolPage({ onBackToLanding }: ToolPageProps) {
  const [kind, setKind] = useState<FurnitureKind>(INITIAL_KIND)
  const definition = FURNITURE_CATALOG[kind]
  const form = useDimensionsForm(definition.defaultDimensionsCm)
  const dimensionsMeters = dimensionsCmToMeters(form.dimensionsCm)

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

        <ArButton kind={kind} dimensions={dimensionsMeters} />

        <footer className="tool__footer">
          <p>Grade do chão: cada quadrado = 10 cm.</p>
        </footer>
      </motion.aside>
    </motion.div>
  )
}
