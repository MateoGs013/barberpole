import { chromium } from 'playwright'
import path from 'path'

const OUTPUT_DIR = 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen'

async function capture() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })

  const page = await context.newPage()

  // 1. Login Dark Mode
  console.log('1. Capturando /login (Dark Mode)...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_live_login_dark.png'), fullPage: true })

  // 2. Login Light Mode
  console.log('2. Cambiando a Light Mode en /login...')
  const toggleBtn = page.getByRole('button', { name: /modo claro/i }).first()
  await toggleBtn.waitFor({ state: 'visible', timeout: 5000 })
  await toggleBtn.click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_live_login_light.png'), fullPage: true })

  // 3. Login as CLIENTE (Light Mode remains active)
  console.log('3. Iniciando sesión como CLIENTE...')
  await page.click('button:has-text("CLIENTE")')
  await page.waitForTimeout(200)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 6000 })

  // 4. Reservar in Light Mode
  console.log('4. Capturando /reservar (Light Mode)...')
  await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_live_reservar_light.png'), fullPage: true })

  // 5. Dashboard in Light Mode
  console.log('5. Capturando /dashboard (Light Mode)...')
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_live_dashboard_light.png'), fullPage: true })

  // 6. Switch back to Dark Mode on Dashboard
  console.log('6. Cambiando a Dark Mode...')
  const darkToggle = page.getByRole('button', { name: /modo oscuro/i }).first()
  if (await darkToggle.isVisible()) {
    await darkToggle.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(OUTPUT_DIR, '12_live_dashboard_dark.png'), fullPage: true })
  }

  // 7. Logout and login as ADMIN to capture Clientes
  console.log('7. Iniciando sesión como ADMIN...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  // Ensure dark mode first or switch to light
  const lightBtnAgain = page.getByRole('button', { name: /modo claro/i }).first()
  if (await lightBtnAgain.isVisible()) {
    await lightBtnAgain.click()
    await page.waitForTimeout(400)
  }
  await page.click('button:has-text("ADMIN")')
  await page.waitForTimeout(200)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 6000 })

  console.log('8. Capturando /clientes (Light Mode con ADMIN)...')
  await page.goto('http://localhost:5173/clientes', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_live_clientes_light.png'), fullPage: true })

  // 9. Landing in Light Mode
  console.log('9. Capturando Landing en Light Mode...')
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14_live_landing_light.png'), fullPage: true })

  console.log('¡Todas las capturas se completaron con éxito!')
  await browser.close()
}

capture().catch((err) => {
  console.error('Error en captura:', err)
  process.exit(1)
})
