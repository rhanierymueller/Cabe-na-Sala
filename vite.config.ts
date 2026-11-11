/// <reference types="vitest/config" />
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig, loadEnv } from 'vite'

// DEV_SSL=1 liga HTTPS no dev server (certificado autoassinado) — necessário
// para testar no iPhone o deep link x-safari-https, que só existe em https.
const shouldUseDevSsl = process.env.DEV_SSL === '1'

const API_ROUTE = '/api/modelo3d'
type RouteHandler = (request: Request) => Promise<Response>

/**
 * Em produção a Vercel serve `api/modelo3d.ts`. No dev, este plugin entrega
 * a mesma rota pelo servidor do Vite, chamando os mesmos handlers.
 */
function apiDevPlugin(): Plugin {
  return {
    name: 'cabe-na-sala-api-dev',
    configureServer(server) {
      server.middlewares.use(API_ROUTE, async (req, res) => {
        try {
          const handlers = (await server.ssrLoadModule('/api/modelo3d.ts')) as Record<
            string,
            RouteHandler | undefined
          >
          const method = req.method ?? 'GET'
          const handler = handlers[method]
          if (!handler) {
            res.statusCode = 405
            res.end()
            return
          }

          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)

          const url = new URL(req.originalUrl ?? API_ROUTE, `http://${req.headers.host}`)
          const headers = new Headers()
          Object.entries(req.headers).forEach(([name, value]) => {
            if (typeof value === 'string') headers.set(name, value)
          })

          const response = await handler(
            new Request(url, {
              method,
              headers,
              body: method === 'GET' ? undefined : Buffer.concat(chunks),
            }),
          )

          res.statusCode = response.status
          response.headers.forEach((value, name) => res.setHeader(name, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error: unknown) {
          console.error('Falha na rota de API em desenvolvimento', error)
          res.statusCode = 500
          res.end()
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Deixa FAL_KEY do .env.local visível para a rota de API no dev.
  // (Atribuir undefined a process.env vira o texto "undefined" — por isso o if.)
  const localFalKey = loadEnv(mode, process.cwd(), '').FAL_KEY
  if (localFalKey && !process.env.FAL_KEY) process.env.FAL_KEY = localFalKey

  return {
    plugins: [react(), apiDevPlugin(), ...(shouldUseDevSsl ? [basicSsl()] : [])],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
    },
  }
})
