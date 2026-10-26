import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } })
  const page = await context.newPage()

  console.log('1. Navegando al login...')
  await page.goto('http://localhost:5173/login')
  await page.waitForLoadState('networkidle')

  // Iniciar como Superadmin
  const saBtn = page.getByRole('button', { name: /^superadmin$/i })
  if (await saBtn.isVisible()) {
    await saBtn.click()
    await page.waitForTimeout(300)
    await page.click('button[type="submit"]')
  } else {
    await page.fill('input[type="email"]', 'superadmin@barberpole.test')
    await page.fill('input[type="password"]', 'superadmin123')
    await page.click('button[type="submit"]')
  }

  await page.waitForTimeout(1500)

  // 1. Navegar al panel de Superadmin
  console.log('2. Navegando a /superadmin...')
  await page.goto('http://localhost:5173/superadmin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  await page.screenshot({
    path: 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen/23_superadmin_panel.png',
    fullPage: false,
  })
  console.log('Captura 23_superadmin_panel.png guardada')

  // 2. Abrir Modal Crear Salón
  console.log('3. Abriendo modal Crear Salón...')
  const crearBtn = page.getByRole('button', { name: /crear salón/i }).first()
  if (await crearBtn.isVisible()) {
    await crearBtn.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen/24_superadmin_crear_salon.png',
      fullPage: false,
    })
    console.log('Captura 24_superadmin_crear_salon.png guardada')

    // Cerrar modal
    const cerrarModalBtn = page.getByRole('button', { name: 'Cancelar' })
    if (await cerrarModalBtn.isVisible()) {
      await cerrarModalBtn.click()
      await page.waitForTimeout(500)
    }
  }

  // 3. Navegar a /configuracion (como Admin)
  console.log('4. Navegando a /login para entrar como Admin de Palermo...')
  await page.goto('http://localhost:5173/login')
  await page.waitForLoadState('networkidle')

  const adminBtn = page.getByRole('button', { name: /^admin$/i })
  if (await adminBtn.isVisible()) {
    await adminBtn.click()
    await page.waitForTimeout(300)
    await page.click('button[type="submit"]')
  }

  await page.waitForTimeout(1500)
  console.log('5. Navegando a /configuracion...')
  await page.goto('http://localhost:5173/configuracion')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  await page.screenshot({
    path: 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen/25_configuracion_negocio.png',
    fullPage: false,
  })
  console.log('Captura 25_configuracion_negocio.png guardada')

  await browser.close()
  console.log('Todas las capturas de Superadmin y Configuración finalizadas!')
}

run().catch(console.error)
