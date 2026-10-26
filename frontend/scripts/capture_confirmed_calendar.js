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

  // Login as existing client
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.click('button:has-text("CLIENTE")')
  await page.waitForTimeout(200)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 })

  // Ir a /reservar
  await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 1. Elegir servicio
  const servicio = page.locator('section').first().locator('button').first()
  await servicio.click()
  await page.waitForTimeout(300)

  // 2. Elegir empleado
  const empleado = page.locator('section').nth(1).locator('button').first()
  await empleado.click()
  await page.waitForTimeout(300)

  // 3. Click en un día disponible del calendario
  const diaBtn = page.locator('button.rounded-full:not([disabled])').last()
  await diaBtn.click()
  await page.waitForTimeout(1000)

  // 4. Seleccionar primer slot disponible
  const primerSlot = page.locator('button:has-text("HS"):not([disabled])').first()
  if (await primerSlot.isVisible()) {
    await primerSlot.click()
    await page.waitForTimeout(300)

    // 5. Click en Confirmar Reserva
    const btnConfirmar = page.getByRole('button', { name: /confirmar reserva/i })
    await btnConfirmar.click()
    await page.waitForTimeout(1500)

    // 6. Capturar pantalla de sincronización automática
    console.log('Capturando pantalla de ticket confirmado con Google Calendar y WhatsApp...')
    await page.screenshot({ path: path.join(OUTPUT_DIR, '16_turno_confirmado_calendar.png'), fullPage: true })
  }

  // 7. Ir a /turnos y capturar los turnos con el botón + Calendar
  await page.goto('http://localhost:5173/turnos', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '18_turnos_cliente_con_calendar.png'), fullPage: true })

  await browser.close()
  console.log('Completado exitosamente!')
}

capture().catch((err) => {
  console.error(err)
  process.exit(1)
})
