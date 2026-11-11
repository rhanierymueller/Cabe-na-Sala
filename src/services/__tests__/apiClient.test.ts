import { afterEach, describe, expect, test, vi } from 'vitest'
import { ApiError, callApi } from '../apiClient'

const MESSAGES = { unavailable: 'Indisponível.', failed: 'Falhou.' }

function stubFetch(body: string, status: number) {
  const fetchMock = vi.fn(async () => new Response(body, { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('callApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('returns the envelope data when the route succeeds', async () => {
    // Arrange
    stubFetch(JSON.stringify({ success: true, data: { id: 'abc' }, error: null }), 200)

    // Act
    const data = await callApi('/api/x', { signal: new AbortController().signal }, MESSAGES)

    // Assert
    expect(data).toEqual({ id: 'abc' })
  })

  test('sends the body as a JSON POST', async () => {
    // Arrange
    const fetchMock = stubFetch(JSON.stringify({ success: true, data: {}, error: null }), 200)

    // Act
    await callApi('/api/x', { body: { text: 'oi' }, signal: new AbortController().signal }, MESSAGES)

    // Assert
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"text":"oi"}')
  })

  test('throws the server message when the route refuses', async () => {
    // Arrange
    stubFetch(JSON.stringify({ success: false, data: null, error: 'Muitas tentativas.' }), 429)

    // Act
    const call = callApi('/api/x', { signal: new AbortController().signal }, MESSAGES)

    // Assert
    await expect(call).rejects.toEqual(new ApiError('Muitas tentativas.'))
  })

  test('falls back to the generic message when the refusal has none', async () => {
    // Arrange
    stubFetch(JSON.stringify({ success: false, data: null }), 500)

    // Act
    const call = callApi('/api/x', { signal: new AbortController().signal }, MESSAGES)

    // Assert
    await expect(call).rejects.toEqual(new ApiError('Falhou.'))
  })

  test('reports the route as unavailable when the answer is not JSON', async () => {
    // Arrange
    stubFetch('<html>404</html>', 404)

    // Act
    const call = callApi('/api/x', { signal: new AbortController().signal }, MESSAGES)

    // Assert
    await expect(call).rejects.toEqual(new ApiError('Indisponível.'))
  })
})
