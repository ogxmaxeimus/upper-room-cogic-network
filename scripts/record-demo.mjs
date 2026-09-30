import { chromium } from 'playwright'
import { mkdir, readdir, rename } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const outDir = path.join(projectRoot, 'recordings')
const baseUrl = process.env.DEMO_URL || 'http://localhost:5173'
const durationMs = Number(process.env.DEMO_DURATION_MS || 120_000)

async function pause(page, ms) {
  await page.waitForTimeout(ms)
}

async function scrollPage(page, steps = 4, delay = 600) {
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, 420)
    await pause(page, delay)
  }
}

async function visit(page, url, dwellMs) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await scrollPage(page)
  const remaining = dwellMs - 2400
  if (remaining > 0) await pause(page, remaining)
}

async function main() {
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: outDir,
      size: { width: 1440, height: 900 },
    },
  })

  const page = await context.newPage()
  const started = Date.now()
  const segment = Math.floor(durationMs / 6)

  await visit(page, baseUrl, segment)
  await visit(page, `${baseUrl}/search`, segment)
  await visit(page, `${baseUrl}/about`, segment)
  await visit(page, `${baseUrl}/members/marcus-williams`, segment)
  await visit(page, `${baseUrl}/join`, segment)
  await visit(page, `${baseUrl}/cities`, segment)

  const elapsed = Date.now() - started
  if (elapsed < durationMs) {
    await visit(page, baseUrl, durationMs - elapsed)
  }

  const video = page.video()
  await context.close()
  await browser.close()

  if (!video) {
    throw new Error('Playwright did not produce a video file.')
  }

  const webmPath = await video.path()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const finalWebm = path.join(outDir, `upper-room-network-demo-${timestamp}.webm`)
  await rename(webmPath, finalWebm)

  const files = await readdir(outDir)
  const leftovers = files.filter((f) => f.endsWith('.webm') && f !== path.basename(finalWebm))
  console.log(JSON.stringify({ saved: finalWebm, durationMs: Date.now() - started, leftovers }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
