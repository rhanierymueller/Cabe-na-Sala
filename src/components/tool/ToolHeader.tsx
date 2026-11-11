import { ArrowLeft } from 'lucide-react'

interface ToolHeaderProps {
  readonly onBack: () => void
}

/** A marca no canto, que também leva de volta ao início. */
export function ToolHeader({ onBack }: ToolHeaderProps) {
  return (
    <header className="tool__top">
      <h1 className="tool__brand">
        <button type="button" className="tool__back" onClick={onBack} title="Voltar ao início">
          <ArrowLeft size={18} aria-hidden="true" />
          Cabe na Sala
        </button>
      </h1>
    </header>
  )
}
