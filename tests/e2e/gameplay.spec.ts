import { test, expect, Page } from '@playwright/test'

async function collectErrors(page: Page): Promise<string[]> {
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
  return errors
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `tests/e2e/screenshots/${name}.png` })
}

test('gameplay smoke — boot → movimento → ataque → troca', async ({ page }) => {
  const errors = await collectErrors(page)

  // 1. Abrir o jogo e aguardar canvas
  await page.goto('/')
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 })
  await page.waitForTimeout(2_000)
  await screenshot(page, '01-boot')

  // 2. Avançar intro/menu (3× Enter para passar telas iniciais)
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1_000)
  }
  await screenshot(page, '02-menu')

  // 3. Aguardar fase carregar (loading + spawn de entidades)
  await page.waitForTimeout(3_000)
  await screenshot(page, '03-fase-carregada')

  // 4. Mover jogador para a direita por 2 segundos
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(2_000)
  await page.keyboard.up('ArrowRight')
  await screenshot(page, '04-player-movendo')

  // 5. Atacar
  await page.keyboard.press('Space')
  await page.waitForTimeout(500)
  await screenshot(page, '05-ataque')

  // 6. Trocar personagem (tecla S)
  await page.keyboard.press('KeyS')
  await page.waitForTimeout(500)
  await screenshot(page, '06-troca-personagem')

  // 7. Verificação final — nenhum erro durante toda a sessão
  expect(errors, `Erros detectados durante gameplay:\n${errors.join('\n')}`).toHaveLength(0)
})
