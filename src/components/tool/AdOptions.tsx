import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

interface AdOptionsProps {
  /** Já nasce aberto quando há um modelo de foto em uso: ele é controlado daqui. */
  readonly isInitiallyOpen: boolean
  readonly children: ReactNode
}

const BODY_ID = 'ad-options-body'

/**
 * Os atalhos que partem do anúncio (foto e texto colado), recolhidos atrás de
 * um botão só: à primeira vista o painel pede apenas as três medidas. O
 * conteúdo fica sempre na página, porque o atalho do celular abre o campo de
 * arquivo que mora aqui dentro.
 */
export function AdOptions({ isInitiallyOpen, children }: AdOptionsProps) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen)

  return (
    <div className={`ad-options${isOpen ? ' ad-options--open' : ''}`}>
      <button
        type="button"
        className="button button--block ad-options__toggle"
        aria-expanded={isOpen}
        aria-controls={BODY_ID}
        onClick={() => setIsOpen((current) => !current)}
      >
        Preencher pelo anúncio <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div id={BODY_ID} className="ad-options__body">
        {children}
      </div>
    </div>
  )
}
