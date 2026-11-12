import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { ArButton } from '../components/ar/ArButton'
import { DimensionsForm } from '../components/form/DimensionsForm'
import { FURNITURE_CATALOG } from '../components/furniture/catalog'
import { PhotoModel } from '../components/photo-model/PhotoModel'
import { ShareButton } from '../components/share/ShareButton'
import { FurniturePicker } from '../components/tool/FurniturePicker'
import { PhotoShortcut } from '../components/tool/PhotoShortcut'
import { SheetHandle } from '../components/tool/SheetHandle'
import { ToolHeader } from '../components/tool/ToolHeader'
import { ToolStage } from '../components/tool/ToolStage'
import { useBottomSheet } from '../hooks/useBottomSheet'
import { useToolSelection } from '../hooks/useToolSelection'
import { COPYRIGHT_NOTICE } from '../constants/site'
import { trackEvent } from '../services/analytics'
import type { DimensionsCm, FurnitureKind } from '../types/furniture'
import { dimensionsCmToMeters } from '../utils/units'
import type { ToolUrlState } from '../utils/urlState'
import { buildToolSearch } from '../utils/urlState'

interface ToolPageProps {
  /** Estado vindo de um link compartilhado (`?movel=...`), se houver. */
  readonly initialState: ToolUrlState | null
  readonly onBackToLanding: () => void
  readonly onStateChange: (kind: FurnitureKind, dimensionsCm: DimensionsCm) => void
}

export function ToolPage({ initialState, onBackToLanding, onStateChange }: ToolPageProps) {
  const tool = useToolSelection(initialState)
  const { kind, form, scannedModel } = tool
  // Só importa no celular: a folha de baixo, que abre por toque ou arrasto.
  const sheet = useBottomSheet()
  const furnitureLabel = FURNITURE_CATALOG[kind].label
  const dimensions = dimensionsCmToMeters(form.dimensionsCm)
  const shareUrl = `${window.location.origin}${window.location.pathname}${buildToolSearch(kind, form.dimensionsCm)}`

  // Mantém a URL espelhando o estado — todo ajuste vira link compartilhável.
  useEffect(() => {
    onStateChange(kind, form.dimensionsCm)
  }, [kind, form.dimensionsCm, onStateChange])

  useEffect(() => {
    trackEvent('view_tool', { furniture: kind })
    // Dispara só na chegada — trocas de móvel já aparecem nos outros eventos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div className="tool" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <ToolStage kind={kind} dimensionsCm={form.dimensionsCm} scannedModel={scannedModel} />
      <ToolHeader onBack={onBackToLanding} />
      <FurniturePicker
        selectedKind={kind}
        onSelect={(nextKind) => {
          if (nextKind !== kind) trackEvent('select_furniture', { furniture: nextKind, where: 'tool' })
          tool.selectKind(nextKind)
        }}
      />

      <aside className={`tool__panel${sheet.isExpanded ? ' tool__panel--open' : ''}`} style={sheet.panelStyle}>
        <SheetHandle sheet={sheet} />
        <div className="tool__scroll">
          <DimensionsForm form={form} furnitureLabel={furnitureLabel} />

          <PhotoModel
            // Trocar de móvel à mão remonta o componente e cancela a geração em andamento.
            key={tool.photoSession}
            dimensions={dimensions}
            model={scannedModel}
            onModelChange={tool.changeScannedModel}
            onKindDetected={tool.applyPhotoKind}
          />

          <div className="tool__more">
            <ShareButton furnitureLabel={furnitureLabel} dimensionsCm={form.dimensionsCm} shareUrl={shareUrl} />
            <p className="tool__footer">A pessoa ao lado tem 1,70 m. Cotas em centímetros.</p>
            <p className="tool__footer tool__footer--copyright">{COPYRIGHT_NOTICE}</p>
          </div>
        </div>

        <div className="tool__cta">
          <ArButton kind={kind} dimensions={dimensions} handoffUrl={shareUrl} scannedModel={scannedModel} />
          <PhotoShortcut />
        </div>
      </aside>
    </motion.div>
  )
}
