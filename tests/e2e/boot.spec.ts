import { test, expect } from '@playwright/test'

test('jogo carrega sem erros de console', async ({ page }) => {
  const errors: string[] = []

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('/')
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(3_000) // aguarda boot + preload completar

  expect(errors, `Erros de console detectados:\n${errors.join('\n')}`).toHaveLength(0)
  await page.screenshot({ path: 'tests/e2e/screenshots/01-boot.png' })
})
