/**
 * Desafio anti-robô no navegador (Cloudflare Turnstile). Só é carregado
 * quando o usuário pede para gerar um modelo — a ferramenta em si continua
 * sem nenhum script de terceiros. Sem VITE_TURNSTILE_SITE_KEY (dev local),
 * não há desafio e o servidor também não o exige.
 */

const SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const CHALLENGE_TIMEOUT_MS = 90_000
const HOST_CLASS_NAME = 'challenge-host'

interface TurnstileOptions {
  readonly sitekey: string
  readonly appearance: 'interaction-only'
  readonly callback: (token: string) => void
  readonly 'error-callback': () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string
      remove: (widgetId: string) => void
    }
  }
}

export class ChallengeError extends Error {
  constructor() {
    super('Não foi possível confirmar que você não é um robô. Tente de novo.')
    this.name = 'ChallengeError'
  }
}

let scriptLoading: Promise<void> | null = null

function loadScript(): Promise<void> {
  scriptLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptLoading = null
      reject(new ChallengeError())
    }
    document.head.appendChild(script)
  })
  return scriptLoading
}

/**
 * Resolve o desafio e devolve o token para o servidor conferir.
 * Devolve null quando o desafio não está configurado neste ambiente.
 */
export async function requestChallengeToken(signal: AbortSignal): Promise<string | null> {
  // O listener de abort não dispara para um sinal que já chegou abortado.
  signal.throwIfAborted()
  if (!SITE_KEY) return null
  await loadScript()
  signal.throwIfAborted()
  const turnstile = window.turnstile
  if (!turnstile) throw new ChallengeError()

  return new Promise<string>((resolve, reject) => {
    const host = document.createElement('div')
    host.className = HOST_CLASS_NAME
    document.body.appendChild(host)

    let widgetId: string | null = null
    const finish = (settle: () => void): void => {
      window.clearTimeout(timer)
      if (widgetId !== null) turnstile.remove(widgetId)
      host.remove()
      settle()
    }
    const timer = window.setTimeout(() => finish(() => reject(new ChallengeError())), CHALLENGE_TIMEOUT_MS)
    signal.addEventListener('abort', () => finish(() => reject(signal.reason)), { once: true })

    widgetId = turnstile.render(host, {
      sitekey: SITE_KEY,
      // Invisível para a maioria; só aparece se a Cloudflare pedir interação.
      appearance: 'interaction-only',
      callback: (token) => finish(() => resolve(token)),
      'error-callback': () => finish(() => reject(new ChallengeError())),
    })
  })
}
