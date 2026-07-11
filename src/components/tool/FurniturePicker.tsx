import { motion } from 'framer-motion'
import { FURNITURE_CATALOG, FURNITURE_KINDS } from '../furniture/catalog'
import type { FurnitureKind } from '../../types/furniture'

interface FurniturePickerProps {
  readonly selectedKind: FurnitureKind
  readonly onSelect: (kind: FurnitureKind) => void
}

const ICON_SIZE = 19

/**
 * Dock de móveis flutuando sobre o 3D: o indicador desliza entre os itens
 * (layoutId) e o item ativo expande mostrando o nome.
 */
export function FurniturePicker({ selectedKind, onSelect }: FurniturePickerProps) {
  return (
    <nav className="furniture-dock" aria-label="Escolher móvel">
      {FURNITURE_KINDS.map((kind) => {
        const definition = FURNITURE_CATALOG[kind]
        const isSelected = kind === selectedKind

        return (
          <motion.button
            key={kind}
            type="button"
            layout
            className={`furniture-dock__item${isSelected ? ' furniture-dock__item--selected' : ''}`}
            onClick={() => onSelect(kind)}
            aria-pressed={isSelected}
            title={definition.label}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.94 }}
          >
            {isSelected && (
              <motion.span
                layoutId="furniture-dock-indicator"
                className="furniture-dock__indicator"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <definition.icon size={ICON_SIZE} aria-hidden="true" />
            {isSelected && <span className="furniture-dock__label">{definition.label}</span>}
          </motion.button>
        )
      })}
    </nav>
  )
}
