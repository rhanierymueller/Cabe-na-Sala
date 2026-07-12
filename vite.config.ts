/// <reference types="vitest/config" />
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// DEV_SSL=1 liga HTTPS no dev server (certificado autoassinado) — necessário
// para testar no iPhone o deep link x-safari-https, que só existe em https.
const shouldUseDevSsl = process.env.DEV_SSL === '1'

export default defineConfig({
  plugins: [react(), ...(shouldUseDevSsl ? [basicSsl()] : [])],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
