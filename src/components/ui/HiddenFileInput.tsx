import type { ChangeEvent, Ref } from 'react'

interface HiddenFileInputProps {
  readonly ref?: Ref<HTMLInputElement>
  readonly id?: string
  readonly accept: string
  /** Abre direto a câmera no celular. */
  readonly capture?: 'environment' | 'user'
  readonly label: string
  readonly onFile: (file: File) => void
}

/**
 * Campo de arquivo fora da vista, aberto por um botão próprio com click().
 * Entrega o arquivo escolhido e limpa o campo, para o mesmo arquivo poder
 * ser escolhido de novo.
 */
export function HiddenFileInput({ ref, id, accept, capture, label, onFile }: HiddenFileInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onFile(file)
  }

  return (
    <input
      ref={ref}
      id={id}
      className="file-input"
      type="file"
      accept={accept}
      capture={capture}
      onChange={handleChange}
      aria-label={label}
      tabIndex={-1}
    />
  )
}
