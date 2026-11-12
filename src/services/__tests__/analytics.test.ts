import { afterEach, describe, expect, test, vi } from 'vitest'

interface FakeBrowser {
  readonly appendedScripts: { src: string }[]
  readonly window: { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}

/** O serviço lê o ID de medição ao ser importado: cada teste importa uma cópia nova. */
async function loadAnalytics(measurementId: string | undefined) {
  vi.resetModules()
  if (measurementId !== undefined) vi.stubEnv('VITE_GA_ID', measurementId)

  const browser: FakeBrowser = { appendedScripts: [], window: {} }
  vi.stubGlobal('window', browser.window)
  vi.stubGlobal('document', {
    createElement: () => ({ src: '', async: false }),
    head: { appendChild: (script: { src: string }) => browser.appendedScripts.push(script) },
  })

  const analytics = await import('../analytics')
  return { analytics, browser }
}

/** O gtag guarda o objeto `arguments` de cada chamada; aqui vira lista para comparar. */
function sentEvents(browser: FakeBrowser): unknown[][] {
  return (browser.window.dataLayer ?? [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter(([command]) => command === 'event')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('analytics', () => {
  test('sends nothing and loads no script when there is no measurement id', async () => {
    const { analytics, browser } = await loadAnalytics(undefined)

    analytics.initAnalytics()
    analytics.trackEvent('view_landing')

    expect(browser.appendedScripts).toHaveLength(0)
    expect(sentEvents(browser)).toHaveLength(0)
  })

  test('sends each funnel step with its params once a measurement id is set', async () => {
    const { analytics, browser } = await loadAnalytics('G-TEST')

    analytics.initAnalytics()
    analytics.trackEvent('view_landing')
    analytics.trackEvent('landing_start', { furniture: 'sofa', changed_measures: true })
    analytics.trackEvent('photo_model_failed', { source: 'photo', reason: 'server' })

    expect(browser.appendedScripts).toHaveLength(1)
    expect(sentEvents(browser)).toEqual([
      ['event', 'view_landing', {}],
      ['event', 'landing_start', { furniture: 'sofa', changed_measures: true }],
      ['event', 'photo_model_failed', { source: 'photo', reason: 'server' }],
    ])
  })

  test('names every event the way GA4 accepts: snake_case, short and unique', async () => {
    const { analytics } = await loadAnalytics(undefined)
    const names = analytics.ANALYTICS_EVENT_NAMES

    names.forEach((name) => {
      expect(name).toMatch(/^[a-z]+(_[a-z0-9]+)*$/)
      expect(name.length).toBeLessThanOrEqual(40)
    })
    expect(new Set(names).size).toBe(names.length)
  })

  test('covers the whole funnel, from the landing to the share', async () => {
    const { analytics } = await loadAnalytics(undefined)

    expect(analytics.ANALYTICS_EVENT_NAMES).toEqual(
      expect.arrayContaining([
        'view_landing',
        'landing_start',
        'view_tool',
        'select_furniture',
        'photo_model_start',
        'photo_model_ready',
        'photo_model_failed',
        'launch_ar',
        'share_click',
      ]),
    )
  })
})
