import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173/game-cruella-e-raya/',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            '--use-gl=swiftshader',
            '--enable-unsafe-swiftshader',
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/game-cruella-e-raya/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
