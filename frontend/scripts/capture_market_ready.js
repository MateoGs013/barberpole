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

  // 1. Login con botón Google
  console.log('1. Capturando Login con Google 1-Click...')
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15_login_google.png'), fullPage: true })

  // 2. Click en botón Google y autenticación
  console.log('2. Iniciando sesión con Google 1-Click...')
  const googleBtn = page.getByRole('button', { name: /continuar con google/i }).first()
  await googleBtn.click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 6000 })
  await page.waitForTimeout(600)

  // 3. Reservar en vivo con confirmación y sincronización de calendario
  console.log('3. Creando reserva para ver pantalla de confirmación y Google Calendar...')
  await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Elegir primer servicio
  const servicioBtn = page.locator('section button').filter({ hasText: 'MIN' }).first()
  await servicioBtn.click()
  await page.waitForTimeout(200)

  // Elegir primer empleado
  const empleadoBtn = page.locator('section').nth(1).locator('button').first()
  await empleadoBtn.click()
  await page.waitForTimeout(200)

  // Elegir fecha futura (mañana o fecha libre)
  const fechaInput = page.locator('input[type="date"]').first()
  // tomorrow date
  const manana = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  await fechaInput.fill(manana)
  await page.waitForTimeout(600)

  // Seleccionar primer slot disponible
  const slotBtn = page.locator('button:has-text("HS"):not([disabled])').first()
  if (await slotBtn.isVisible()) {
    await slotBtn.click()
    await page.waitForTimeout(200)

    // Click en Confirmar reserva
    const confirmarBtn = page.getByRole('button', { name: /confirmar reserva/i })
    if (await confirmarBtn.isEnabled()) {
      await confirmarBtn.click()
      await page.waitForTimeout(1000)
      console.log('4. Capturando pantalla de sincronización de Calendario...')
      await page.screenshot({ path: path.join(OUTPUT_DIR, '16_turno_confirmado_calendar.png'), fullPage: true })
    }
  }

  // 4. Capturar /turnos con el nuevo botón + Calendar
  console.log('5. Capturando /turnos con botón + Calendar...')
  await page.goto('http://localhost:5173/turnos', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '17_turnos_con_calendar.png'), fullPage: true })

  console.log('¡Capturas de mercado completadas!')
  await browser.close()
}

capture().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
