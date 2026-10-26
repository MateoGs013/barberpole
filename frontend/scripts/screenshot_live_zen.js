import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const OUTPUT_DIR = 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen'

async function captureLiveZen() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  })

  // Desktop context
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })

  // 1. Landing
  console.log('Capturando 1: Landing Editorial...')
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_live_landing.png'), fullPage: true })

  // 2. Portal Negocio (Studio Palermo)
  console.log('Capturando 2: Portal Negocio Studio Palermo...')
  await page.goto('http://localhost:5173/studio-palermo', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_live_portal_negocio.png'), fullPage: true })

  // 3. Reservar
  console.log('Capturando 3: Reservar Wizard...')
  await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_live_reservar.png'), fullPage: true })

  // 4. Mobile Portal Negocio
  console.log('Capturando 4: Mobile Portal Negocio...')
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  })
  await mobilePage.goto('http://localhost:5173/studio-palermo', { waitUntil: 'networkidle' })
  await mobilePage.waitForTimeout(600)
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '04_live_mobile_portal.png'), fullPage: true })

  console.log('Capturas Live Zen completadas con éxito!')
  await browser.close()
}

captureLiveZen().catch(console.error)
