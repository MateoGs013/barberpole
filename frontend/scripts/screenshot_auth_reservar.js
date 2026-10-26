import { chromium } from 'playwright'
import path from 'path'

const OUTPUT_DIR = 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen'

async function captureAllAuth() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  })

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })

  console.log('Iniciando sesión con 1-click cliente...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.click('button:has-text("Cliente")')
  await page.waitForTimeout(200)
  await page.click('button[type="submit"]')
  
  // Wait for navigation after login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 })
  console.log('Sesión iniciada con éxito! URL actual:', page.url())

  console.log('Navegando a /reservar...')
  await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_live_reservar_authenticated.png'), fullPage: true })

  console.log('Navegando a /dashboard...')
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_live_dashboard.png'), fullPage: true })

  console.log('Navegando a /turnos...')
  await page.goto('http://localhost:5173/turnos', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_live_turnos.png'), fullPage: true })

  console.log('Todas las capturas autenticadas completadas con éxito!')
  await browser.close()
}

captureAllAuth().catch(console.error)
