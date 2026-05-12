import { test, expect } from '@playwright/test'

test('jogo carrega sem erros de console', async ({ page }) => {
  const errors: string[] = []

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Audio decoding errors are expected in headless Chromium (no audio codec support)
      if (text.includes('decoding audio') || text.includes('Failed to process file') || text.includes('Unable to decode audio')) return
      errors.push(text)
    }
  })
  page.on('pageerror', err => {
    // Audio decoding errors are expected in headless Chromium (no audio codec support)
    if (err.message.includes('Unable to decode audio')) return
    errors.push(err.message)
  })

  await page.goto('/')
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(3_000) // aguarda boot + preload completar

  expect(errors, `Erros de console detectados:\n${errors.join('\n')}`).toHaveLength(0)
  await page.screenshot({ path: 'tests/e2e/screenshots/01-boot.png' })
})
