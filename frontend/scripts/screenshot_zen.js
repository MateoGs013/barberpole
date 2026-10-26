import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const DEMO_HTML_URI = 'file:///C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/demo_editorial_zen.html'
const OUTPUT_DIR = 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/zen'

async function captureZenDemo() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  })

  // Desktop context
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
  })

  console.log('Abriendo demo Zen...')
  await page.goto(DEMO_HTML_URI, { waitUntil: 'load' })
  await page.waitForTimeout(1000)

  // 1. Vista Reserva Hiperfoco
  console.log('Capturando 1: Reserva Hiperfoco...')
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_reserva_hiperfoco.png'), fullPage: true })

  // 2. Modal de Confirmación
  console.log('Capturando 2: Modal de Confirmación...')
  await page.evaluate(() => window.confirmBooking())
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_reserva_modal_confirmacion.png') })
  await page.evaluate(() => window.closeConfirmation())
  await page.waitForTimeout(300)

  // 3. Vista Editorial
  console.log('Capturando 3: Vista Editorial...')
  await page.click('#btn-mode-editorial')
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_editorial_landing.png'), fullPage: true })

  // 4. Vista Agenda Barbero
  console.log('Capturando 4: Agenda Barbero...')
  await page.click('#btn-mode-agenda')
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_agenda_profesional.png'), fullPage: true })

  // 5. Mobile Viewport (iPhone 14)
  console.log('Capturando 5: Mobile Viewport...')
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  })
  await mobilePage.goto(DEMO_HTML_URI, { waitUntil: 'load' })
  await mobilePage.waitForTimeout(800)
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '05_mobile_reserva.png'), fullPage: true })

  console.log('Capturas Zen finalizadas exitosamente!')
  await browser.close()
}

captureZenDemo().catch(console.error)
