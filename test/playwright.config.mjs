import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  testDir: '.',
  testMatch: ['ui.spec.mjs'],
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: 'http://localhost:8010',
    headless: true,
    viewport: { width: 1440, height: 900 },
    browserName: 'firefox',
  },
  webServer: [
    {
      command: 'npm run subtitles:server',
      url: 'http://127.0.0.1:8787/api/health',
      cwd: ROOT_DIR,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run build && python3 -m http.server 8010 --directory dist',
      url: 'http://localhost:8010',
      cwd: ROOT_DIR,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
