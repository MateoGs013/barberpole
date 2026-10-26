import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  console.log('1. Navegando al login...')
  await page.goto('http://localhost:5173/login')
  await page.waitForLoadState('networkidle')

  const adminBtn = page.getByRole('button', { name: 'ADMIN' })
  if (await adminBtn.isVisible()) {
    await adminBtn.click()
    await page.waitForTimeout(300)
    await page.click('button[type="submit"]')
  }

  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {})
  await page.waitForTimeout(1000)

  // 1. Capturar /empleados con el estado actualizado (Mateo Gabús con Google Calendar activo)
  console.log('2. Navegando a /empleados...')
  await page.goto('http://localhost:5173/empleados')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  await page.screenshot({
    path: 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen/19_empleados_google_calendar.png',
    fullPage: false,
  })
  console.log('Captura 19_empleados_google_calendar.png actualizada')

  // 2. Capturar /turnos con el botón de Google Calendar ↗
  console.log('3. Navegando a /turnos...')
  await page.goto('http://localhost:5173/turnos')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  await page.screenshot({
    path: 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen/21_turnos_admin_calendar_link.png',
    fullPage: false,
  })
  console.log('Captura 21_turnos_admin_calendar_link.png guardada')

  // 3. Capturar /reservar demostrando los slots bloqueados por Google Calendar
  console.log('4. Navegando a /reservar...')
  await page.goto('http://localhost:5173/reservar')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1200)

  // Seleccionar Mateo Gabús (primer empleado)
  const mateoBtn = page.locator('section:nth-of-type(2) button').first()
  if (await mateoBtn.isVisible()) {
    await mateoBtn.click()
    await page.waitForTimeout(500)
  }

  // Click en el día 28 en MatrixCalendar
  const dia28 = page.getByRole('button', { name: /^28$/ }).first()
  if (await dia28.isVisible()) {
    await dia28.click()
    await page.waitForTimeout(1200)
  }

  await page.screenshot({
    path: 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen/22_reservar_slot_google_blocked.png',
    fullPage: false,
  })
  console.log('Captura 22_reservar_slot_google_blocked.png guardada')

  await browser.close()
  console.log('Todas las capturas completadas con éxito!')
}

run().catch(console.error)
