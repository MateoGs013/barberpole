import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto('http://localhost:5173/login')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'C:/Users/mateo/.gemini/antigravity/brain/3906e7d4-1414-41a7-a1f7-ccb0b86b354a/screenshots/live_zen/26_login_profesional_limpio.png' })
  await browser.close()
  console.log('Captura guardada')
}

run().catch(console.error)
