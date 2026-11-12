/**
 * Desafio anti-robô (Cloudflare Turnstile): o navegador resolve o desafio e
 * manda um token; aqui o servidor confere o token antes de gastar dinheiro.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const VERIFY_TIMEOUT_MS = 5000
/** Tokens do Turnstile têm até 2048 caracteres. */
const MAX_TOKEN_LENGTH = 2048

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export function isPlausibleChallengeToken(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_TOKEN_LENGTH
}

/**
 * Confere o token com a Cloudflare. Falha fechada: qualquer erro (rede,
 * resposta inesperada, token recusado) conta como "não passou".
 * O token tem de ter sido resolvido neste site: a chave do widget é pública,
 * e sem isto valeria um token colhido em outra página.
 */
export async function verifyChallenge(
  token: string,
  secret: string,
  clientIp: string,
  expectedHostname: string,
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(VERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: clientIp }),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    })
    if (!response.ok) return false
    const outcome = (await response.json()) as { success?: unknown; hostname?: unknown }
    return outcome.success === true && outcome.hostname === expectedHostname
  } catch (error: unknown) {
    console.error('Falha ao verificar o desafio anti-robô', error)
    return false
  }
}
