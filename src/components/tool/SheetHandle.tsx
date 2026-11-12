import { ChevronUp } from 'lucide-react'
import type { BottomSheet } from '../../hooks/useBottomSheet'

interface SheetHandleProps {
  readonly sheet: BottomSheet
}

/** A alça da folha do celular (some no computador). Tem de ser filha direta do painel. */
export function SheetHandle({ sheet }: SheetHandleProps) {
  return (
    <button type="button" className="tool__handle" aria-expanded={sheet.isOpen} {...sheet.handleProps}>
      <ChevronUp size={14} aria-hidden="true" />
      {sheet.isExpanded ? 'Fechar' : 'Foto do anúncio e mais'}
    </button>
  )
}
