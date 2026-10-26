import { chromium } from 'playwright'
import path from 'path'

const SCREENSHOTS_DIR = 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots'

async function runAudit() {
  console.log('🚀 Iniciando auditoría visual y de interacción con Playwright...')

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })

  const page = await context.newPage()

  try {
    // ----------------------------------------------------
    // 1. Landing Page B2B SaaS
    // ----------------------------------------------------
    console.log('📸 1. Capturando Landing Page Hero y Showcase...')
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01_landing_hero.png'),
    })

    const salonesSec = page.locator('#salones')
    await salonesSec.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02_showcase_salones.png'),
    })

    const bentoSec = page.locator('#capacidades')
    await bentoSec.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)

    const slot17 = page.locator('text=17:00').first()
    if (await slot17.isVisible()) {
      await slot17.click()
      await page.waitForTimeout(400)
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03_bento_capabilities_interactive.png'),
    })

    const planesSec = page.locator('#planes')
    await planesSec.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04_pricing_tiers.png'),
    })

    // ----------------------------------------------------
    // 2. Command Palette (Cmd+K / Ctrl+K)
    // ----------------------------------------------------
    console.log('📸 2. Abriendo Command Palette...')
    await page.keyboard.press('Control+k')
    await page.waitForTimeout(500)

    await page.keyboard.type('studio')
    await page.waitForTimeout(400)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05_command_palette.png'),
    })

    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)

    // ----------------------------------------------------
    // 3. Portal de Turnos por Salón: /studio-palermo
    // ----------------------------------------------------
    console.log('📸 3. Navegando al Portal Público de Studio Palermo...')
    await page.goto('http://localhost:5173/studio-palermo', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // Elegir servicio "Corte Fade / Degradé"
    const servicioCard = page.locator('text=Corte Fade / Degradé').first()
    await servicioCard.click()
    await page.waitForTimeout(400)

    // Elegir profesional "Mateo"
    const profesionalCard = page.locator('text=Mateo').first()
    await profesionalCard.click()
    await page.waitForTimeout(400)

    // Llenar fecha laboral de lunes
    const fechaInput = page.locator('#fecha')
    await fechaInput.scrollIntoViewIfNeeded()
    await fechaInput.fill('2026-10-26')
    await page.waitForTimeout(1000)

    // Clic en el primer slot interactivo disponible
    const primerSlot = page.locator('button:has-text("09:00")').first()
    await primerSlot.scrollIntoViewIfNeeded()
    await primerSlot.click()
    await page.waitForTimeout(600)

    // Capturar Step 3 con MatrixCalendar y slots interactivos
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05b_matrix_calendar_step3.png'),
    })

    // Si está el botón de "Ver Ticket ↘", avanzar al Boarding Pass
    const btnVerTicket = page.locator('button:has-text("Ver Ticket")').first()
    if (await btnVerTicket.isVisible()) {
      await btnVerTicket.click()
      await page.waitForTimeout(600)
    }

    // Capturar Boarding Pass de confirmación industrial
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06_portal_dynamic_island_activa.png'),
    })

    // ----------------------------------------------------
    // 4. Onboarding Autoservicio de Salones (/onboarding)
    // ----------------------------------------------------
    console.log('📸 4. Probando Wizard de Onboarding Autoservicio...')
    await page.goto('http://localhost:5173/onboarding', { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    await page.fill('#nombreNegocio', 'The Royal Cut & Lounge')
    await page.waitForTimeout(400)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07_onboarding_paso1_slug.png'),
    })

    // Avanzar a paso 2
    const btnPaso1 = page.locator('button:has-text("Continuar a datos del dueño")')
    await btnPaso1.click()
    await page.waitForTimeout(500)

    // Llenar paso 2
    await page.fill('#nombreOwner', 'Esteban Quito')
    await page.fill('#email', 'esteban@royalcut.com')
    await page.fill('#password', 'Royal123456!')
    await page.waitForTimeout(300)

    // Avanzar a paso 3 usando el texto exacto
    const btnPaso2 = page.locator('button:has-text("Elegir plan")')
    await btnPaso2.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '08_onboarding_paso3_planes.png'),
    })

    // ----------------------------------------------------
    // 5. Consola de Control Studio (/dashboard con Login)
    // ----------------------------------------------------
    console.log('📸 5. Ingresando al Dashboard como Admin Studio...')
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    // Llenar credenciales de Admin Studio
    await page.fill('#email', 'admin@peluqueria.com')
    await page.fill('#password', 'admin123')
    await page.waitForTimeout(300)

    const btnSubmit = page.locator('button[type="submit"]').first()
    await btnSubmit.click()
    await page.waitForTimeout(1600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '09_dashboard_admin_kpis.png'),
    })

    // ----------------------------------------------------
    // 6. Vista Móvil Responsiva en iPhone 14 (390x844)
    // ----------------------------------------------------
    console.log('📸 6. Probando Vista Móvil en iPhone 14 (390x844)...')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:5173/studio-palermo', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '10_mobile_responsive_portal.png'),
    })

    console.log('🎉 Auditoría visual y de interacción con Playwright completada al 100%!')
  } catch (err) {
    console.error('❌ Error durante la auditoría de Playwright:', err)
  } finally {
    await browser.close()
  }
}

runAudit()
