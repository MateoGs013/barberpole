import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const DEMO_HTML_URI = 'file:///C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/demo_zen_ultra.html'
const OUTPUT_DIR = 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/zen_ultra'

async function captureZenUltra() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  })

  // 1. Desktop Standard 1440x900
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })

  console.log('Abriendo demo Zen Ultra...')
  await page.goto(DEMO_HTML_URI, { waitUntil: 'load' })
  await page.waitForTimeout(800)

  console.log('Capturando 1: Desktop 1440x900...')
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_desktop_1440.png') })

  // 2. Confirmed Screen
  console.log('Capturando 2: Confirmed Screen...')
  await page.evaluate(() => window.submitBooking())
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_confirmed_screen.png') })
  await page.evaluate(() => window.resetBooking())
  await page.waitForTimeout(300)

  // 3. Desktop Ultrawide 1920x1080
  console.log('Capturando 3: Ultrawide 1920x1080...')
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_desktop_1920.png') })

  // 4. Mobile Viewport
  console.log('Capturando 4: Mobile Viewport...')
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  })
  await mobilePage.goto(DEMO_HTML_URI, { waitUntil: 'load' })
  await mobilePage.waitForTimeout(800)
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, '04_mobile_390.png'), fullPage: true })

  console.log('Capturas Zen Ultra finalizadas con éxito!')
  await browser.close()
}

captureZenUltra().catch(console.error)
