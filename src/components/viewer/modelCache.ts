export type CachedModel<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly model: T }
  | { readonly status: 'failed' }

interface ModelCache<T> {
  /** O estado de agora, sem esperar: quem monta depois do carregamento já recebe o modelo. */
  readonly peek: () => CachedModel<T>
  /** Dispara o carregamento na primeira chamada; as seguintes reaproveitam o mesmo. */
  readonly request: () => Promise<CachedModel<T>>
}

/**
 * Guarda um modelo carregado uma vez só para a sessão inteira. A cena 3D
 * remonta a cada troca de móvel; sem isto o arquivo seria lido de novo e a
 * figura piscaria a cada troca.
 */
export function createModelCache<T>(load: () => Promise<T>): ModelCache<T> {
  let state: CachedModel<T> = { status: 'loading' }
  let pending: Promise<CachedModel<T>> | null = null

  const settle = (next: CachedModel<T>): CachedModel<T> => {
    state = next
    return next
  }

  return {
    peek: () => state,
    request: () => {
      pending ??= load().then(
        (model) => settle({ status: 'ready', model }),
        () => settle({ status: 'failed' }),
      )
      return pending
    },
  }
}
