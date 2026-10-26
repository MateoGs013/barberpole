import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'

const DEMO_HTML_URI = 'file:///C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/demo_industrial_editorial.html'
const OUTPUT_DIR = 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/demo'

async function captureDemo() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  })

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })

  console.log('Abriendo demo HTML...')
  await page.goto(DEMO_HTML_URI, { waitUntil: 'load' })
  await page.waitForTimeout(1000)

  // 1. Tab Terminal Split
  console.log('Capturando Tab 1: Terminal Split...')
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_demo_terminal_split.png') })

  // 2. Tab Hardware Instrument (Img 1)
  console.log('Capturando Tab 2: Hardware Instrument...')
  await page.click('#btn-tab-hardware')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_demo_hardware_instrument.png') })

  // 3. Tab SWA Calendar (Img 3)
  console.log('Capturando Tab 3: SWA Calendar...')
  await page.click('#btn-tab-calendar')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_demo_swa_calendar.png') })

  // 4. Tab Tacto Editorial (Img 4)
  console.log('Capturando Tab 4: Tacto Editorial...')
  await page.click('#btn-tab-tacto')
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_demo_tacto_editorial.png') })

  // 5. Boarding Pass Modal (Img 2)
  console.log('Capturando Modal Boarding Pass...')
  await page.click('#btn-tab-terminal')
  await page.waitForTimeout(400)
  await page.evaluate(() => window.confirmarTurnoDemo())
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_demo_boarding_pass_modal.png') })

  console.log('Capturas finalizadas exitosamente!')
  await browser.close()
}

captureDemo().catch(console.error)
