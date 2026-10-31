import { defineConfig, devices } from '@playwright/test'

// Smoke e2e local. Levanta el backend (con Mongo efímero) y el frontend (Vite dev,
// que proxea /api -> localhost:4000) y corre los specs contra un navegador real.
// Uso: npm run test:e2e   (requiere: npx playwright install chromium)
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node scripts/start-e2e.js',
      cwd: '../backend',
      url: 'http://localhost:4000/api/salud',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
