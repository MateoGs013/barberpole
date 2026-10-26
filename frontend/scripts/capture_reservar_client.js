import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()

  console.log('1. Navegando al login...')
  await page.goto('http://localhost:5173/login')
  await page.waitForLoadState('networkidle')

  const clienteBtn = page.getByRole('button', { name: 'CLIENTE' })
  if (await clienteBtn.isVisible()) {
    await clienteBtn.click()
    await page.waitForTimeout(300)
    await page.click('button[type="submit"]')
  }

  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1000)

  console.log('2. Navegando a /reservar...')
  await page.goto('http://localhost:5173/reservar')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // 1. Seleccionar primer servicio
  const primerServicio = page.locator('section:nth-of-type(1) button').first()
  if (await primerServicio.isVisible()) {
    await primerServicio.click()
    await page.waitForTimeout(400)
  }

  // 2. Seleccionar Mateo Gabús
  const mateoBtn = page.getByRole('button', { name: /MATEO GABÚS/i })
  if (await mateoBtn.isVisible()) {
    await mateoBtn.click()
    await page.waitForTimeout(500)
  }

  // 3. Seleccionar día 28 en el calendario
  const dia28 = page.getByRole('button', { name: /^28$/ }).first()
  if (await dia28.isVisible()) {
    await dia28.click()
    await page.waitForTimeout(1200)
  }

  // Scroll un poco hacia abajo para que se vean todos los slots
  await page.evaluate(() => window.scrollBy(0, 300))
  await page.waitForTimeout(500)

  await page.screenshot({
    path: 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen/22_reservar_slot_google_blocked.png',
    fullPage: false,
  })
  console.log('Captura 22_reservar_slot_google_blocked.png guardada con éxito!')

  await browser.close()
}

run().catch(console.error)
