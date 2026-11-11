/** Cancelamento (de uma chamada, ou do compartilhar fechado pela pessoa): não é erro para mostrar. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
