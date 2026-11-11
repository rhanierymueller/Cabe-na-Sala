import { useEffect, useMemo, useRef } from 'react'

/**
 * Uma chamada por vez: começar outra cancela a anterior, e sair da tela
 * cancela a que estiver em andamento.
 */
export function useLatestRequest() {
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  return useMemo(() => ({
    start: (): AbortController => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      return controller
    },
    cancel: (): void => {
      controllerRef.current?.abort()
      controllerRef.current = null
    },
  }), [])
}
