/// <reference types="vitest/config" />
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import vercelConfig from "./vercel.json" with { type: "json" };

// DEV_SSL=1 liga HTTPS no dev server (certificado autoassinado) — necessário
// para testar no iPhone o deep link x-safari-https, que só existe em https.
const shouldUseDevSsl = process.env.DEV_SSL === "1";

const API_ROUTES = ["/api/modelo3d", "/api/medidas"] as const;
/** Variáveis lidas só pelo servidor (nunca expostas ao navegador). */
const SERVER_ENV_NAMES = [
  "FAL_KEY",
  "TURNSTILE_SECRET_KEY",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "MODELO3D_TETO_DIARIO",
  "ANTHROPIC_API_KEY",
  "CLAUDE_MODELO",
] as const;
type RouteHandler = (request: Request) => Promise<Response>;

/**
 * Em produção a Vercel serve os arquivos de `api/`. No dev, este plugin entrega
 * as mesmas rotas pelo servidor do Vite, chamando os mesmos handlers.
 */
function apiDevPlugin(): Plugin {
  return {
    name: "cabe-na-sala-api-dev",
    configureServer(server) {
      API_ROUTES.forEach((route) => {
        server.middlewares.use(route, async (req, res) => {
          try {
            const handlers = (await server.ssrLoadModule(
              `${route}.ts`,
            )) as Record<string, RouteHandler | undefined>;
            const method = req.method ?? "GET";
            const handler = handlers[method];
            if (!handler) {
              res.statusCode = 405;
              res.end();
              return;
            }

            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(chunk as Buffer);

            const url = new URL(
              req.originalUrl ?? route,
              `http://${req.headers.host}`,
            );
            const headers = new Headers();
            Object.entries(req.headers).forEach(([name, value]) => {
              if (typeof value === "string") headers.set(name, value);
            });

            const response = await handler(
              new Request(url, {
                method,
                headers,
                body: method === "GET" ? undefined : Buffer.concat(chunks),
              }),
            );

            res.statusCode = response.status;
            response.headers.forEach((value, name) =>
              res.setHeader(name, value),
            );
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch (error: unknown) {
            console.error("Falha na rota de API em desenvolvimento", error);
            res.statusCode = 500;
            res.end();
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Deixa as variáveis de servidor do .env.local visíveis para a rota de API no dev.
  // (Atribuir undefined a process.env vira o texto "undefined" — por isso o if.)
  const localEnv = loadEnv(mode, process.cwd(), "");
  SERVER_ENV_NAMES.forEach((name) => {
    if (localEnv[name] && !process.env[name])
      process.env[name] = localEnv[name];
  });

  return {
    plugins: [
      react(),
      apiDevPlugin(),
      ...(shouldUseDevSsl ? [basicSsl()] : []),
    ],
    // `npm run preview` serve o build com os mesmos cabeçalhos de segurança da produção.
    preview: {
      headers: Object.fromEntries(
        vercelConfig.headers[0].headers.map(({ key, value }) => [key, value]),
      ),
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts", "api/**/*.test.ts"],
    },
  };
});
