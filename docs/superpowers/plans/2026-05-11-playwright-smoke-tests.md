# Playwright Smoke Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar Playwright e criar dois smoke tests E2E que abrem o jogo num browser real, verificam que nenhum erro de console ocorre, simulam input do jogador e capturam screenshots.

**Architecture:** Playwright instalado como devDependency com Chromium headless. O webServer usa `npm run build && npm run preview` (Vite preview na porta 4173) para rodar o build compilado — mais estável que o dev server. Testes em `tests/e2e/` separados do Vitest existente. Screenshots salvas em `tests/e2e/screenshots/` (gitignored).

**Tech Stack:** @playwright/test, Vite preview, Chromium headless, TypeScript

---

## Estrutura de Arquivos

```
playwright.config.ts          ← config do Playwright (webServer, baseURL, chromium)
tests/
  e2e/
    boot.spec.ts              ← game carrega sem erros de console
    gameplay.spec.ts          ← fluxo completo: menu → fase → movimento → ataque → troca
    screenshots/              ← (gitignored — revisão manual após cada run)
package.json                  ← adicionar scripts test:e2e e test:e2e:ui
.gitignore                    ← adicionar tests/e2e/screenshots/
```

---

### Task 1: Instalar Playwright e criar `playwright.config.ts`

**Files:**
- Modify: `package.json` (devDependencies)
- Create: `playwright.config.ts`

- [ ] **Step 1: Instalar @playwright/test como devDependency**

```bash
npm install --save-dev @playwright/test
```

Expected output: `added N packages` sem erros.

- [ ] **Step 2: Instalar o browser Chromium**

```bash
npx playwright install chromium
```

Expected output: `Chromium X.X.X (playwright build vNNN) downloaded to ...` — pode demorar ~1-2 minutos na primeira vez.

- [ ] **Step 3: Criar `playwright.config.ts` na raiz do projeto**

Criar o arquivo `/playwright.config.ts` com o seguinte conteúdo:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173/game-cruella-e-raya/',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/game-cruella-e-raya/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
```

**Notas importantes:**
- `testDir: './tests/e2e'` — Playwright só procura testes nessa pasta, não confunde com os testes Vitest em `tests/`
- `reuseExistingServer: !process.env.CI` — em dev reusa servidor existente se já estiver rodando; em CI sempre rebuilda
- `timeout: 60_000` no webServer — dá tempo para `tsc && vite build` terminar
- `baseURL` termina com `/` — importante para `page.goto('/')` funcionar corretamente

- [ ] **Step 4: Verificar que o config é válido**

```bash
npx playwright --version
```

Expected output: `Version X.X.X` (sem erros de TypeScript ou import).

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts package.json package-lock.json
git commit -m "feat: install Playwright and add playwright.config.ts"
```

---

### Task 2: Adicionar scripts e atualizar `.gitignore`

**Files:**
- Modify: `package.json` (scripts)
- Modify: `.gitignore`

- [ ] **Step 1: Adicionar scripts ao `package.json`**

No objeto `"scripts"` de `package.json`, adicionar após `"test": "vitest run"`:

```json
"test:e2e":    "playwright test",
"test:e2e:ui": "playwright test --ui"
```

O bloco `"scripts"` deve ficar assim:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:e2e":    "playwright test",
  "test:e2e:ui": "playwright test --ui"
},
```

- [ ] **Step 2: Adicionar `tests/e2e/screenshots/` ao `.gitignore`**

Adicionar ao final do arquivo `.gitignore`:

```
tests/e2e/screenshots/
```

- [ ] **Step 3: Criar o diretório de screenshots com placeholder**

```bash
mkdir -p tests/e2e/screenshots
touch tests/e2e/screenshots/.gitkeep
```

O `.gitkeep` mantém o diretório no git enquanto os `.png` ficam ignorados. Note: o `.gitkeep` em si **não** está no `.gitignore` — só `*.png` ou o padrão `screenshots/` que já cobrimos.

Atenção: o `.gitignore` ignora `tests/e2e/screenshots/` como diretório, portanto o `.gitkeep` também seria ignorado. Para forçar o `.gitkeep` ser versionado mesmo assim:

```bash
git add -f tests/e2e/screenshots/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add package.json .gitignore tests/e2e/screenshots/.gitkeep
git commit -m "feat: add test:e2e scripts and gitignore screenshots dir"
```

---

### Task 3: Criar `boot.spec.ts` — jogo carrega sem erros de console

**Files:**
- Create: `tests/e2e/boot.spec.ts`

- [ ] **Step 1: Criar o arquivo `tests/e2e/boot.spec.ts`**

```typescript
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
```

**O que este teste faz:**
1. Abre o jogo no browser (Playwright inicia o webServer automaticamente)
2. Coleta todos os erros de console e `pageerror` (exceções não capturadas)
3. Aguarda o `<canvas>` aparecer (prova que Phaser inicializou)
4. Espera 3 segundos para o preload/boot completar
5. Falha se houver qualquer erro de console
6. Salva screenshot de `01-boot.png` para revisão manual

- [ ] **Step 2: Rodar o teste de boot**

```bash
npm run test:e2e -- tests/e2e/boot.spec.ts
```

Este comando vai:
1. Fazer `npm run build` (TypeScript + Vite)
2. Iniciar `vite preview` na porta 4173
3. Abrir Chromium headless
4. Rodar o teste

Expected output:
```
Running 1 test using 1 worker

  ✓  [chromium] › boot.spec.ts › jogo carrega sem erros de console (Xms)

  1 passed (Xs)
```

Se falhar com erros de console, o output mostrará quais erros foram capturados — corrija-os antes de continuar.

- [ ] **Step 3: Verificar screenshot gerada**

```bash
ls tests/e2e/screenshots/
# Expected: 01-boot.png
open tests/e2e/screenshots/01-boot.png
```

A screenshot deve mostrar o jogo na tela de título/intro (canvas visível).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/boot.spec.ts
git commit -m "feat: add boot smoke test — jogo carrega sem erros de console"
```

---

### Task 4: Criar `gameplay.spec.ts` — fluxo completo com screenshots

**Files:**
- Create: `tests/e2e/gameplay.spec.ts`

- [ ] **Step 1: Criar o arquivo `tests/e2e/gameplay.spec.ts`**

```typescript
import { test, expect, Page } from '@playwright/test'

async function collectErrors(page: Page): Promise<string[]> {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))
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
```

**O que cada step faz:**
- **Step 1** `page.goto('/')`: Playwright usa `baseURL` do config → abre `http://localhost:4173/game-cruella-e-raya/`
- **Steps 2-3** `keyboard.press('Enter')` ×3: Navega pelas telas iniciais (intro cinematica, tela de título, seleção de fase). O número de Enters pode precisar de ajuste se o fluxo mudar.
- **Step 4** `keyboard.down/up('ArrowRight')`: Mantém a tecla pressionada por 2 segundos — o player deve se mover
- **Step 5** `keyboard.press('Space')`: Ataque normal
- **Step 6** `keyboard.press('KeyS')`: Troca de personagem (Cruella ↔ Raya)
- **Step 7** `expect(errors).toHaveLength(0)`: Coleta todos os erros acumulados durante o fluxo inteiro

- [ ] **Step 2: Rodar o teste de gameplay**

```bash
npm run test:e2e -- tests/e2e/gameplay.spec.ts
```

Expected output:
```
Running 1 test using 1 worker

  ✓  [chromium] › gameplay.spec.ts › gameplay smoke — boot → movimento → ataque → troca (Xs)

  1 passed (Xs)
```

Se o teste falhar com timeout no `waitFor('canvas')`: aumentar o `timeout` no `waitFor` para `15_000` e o `waitForTimeout` inicial para `3_000`.

Se o teste falhar por erros de console: o output mostra quais erros foram capturados — corrija-os no código do jogo (não no teste).

- [ ] **Step 3: Verificar as 6 screenshots geradas**

```bash
ls tests/e2e/screenshots/
# Expected: 01-boot.png, 02-menu.png, 03-fase-carregada.png,
#           04-player-movendo.png, 05-ataque.png, 06-troca-personagem.png
open tests/e2e/screenshots/
```

Revise visualmente cada screenshot para confirmar que o jogo estava no estado correto em cada etapa.

- [ ] **Step 4: Rodar a suíte completa**

```bash
npm run test:e2e
```

Expected output:
```
Running 2 tests using 1 worker

  ✓  [chromium] › boot.spec.ts › jogo carrega sem erros de console (Xs)
  ✓  [chromium] › gameplay.spec.ts › gameplay smoke — boot → movimento → ataque → troca (Xs)

  2 passed (Xs)
```

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/gameplay.spec.ts
git commit -m "feat: add gameplay smoke test — boot → movimento → ataque → troca"
```

---

## Como Usar (Referência)

```bash
# Rodar todos os smoke tests (faz build antes)
npm run test:e2e

# Rodar apenas o boot test
npm run test:e2e -- tests/e2e/boot.spec.ts

# Abrir UI interativa do Playwright (debug visual com timeline)
npm run test:e2e:ui

# Ver screenshots geradas
open tests/e2e/screenshots/
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `Error: page.goto: net::ERR_CONNECTION_REFUSED` | O webServer não subiu a tempo — aumentar `timeout` no webServer do config para `120_000` |
| Canvas não aparece no boot | `waitFor` timeout muito curto — aumentar para `15_000` |
| Screenshots em branco/pretas | Jogo ainda está carregando — aumentar `waitForTimeout(2_000)` para `4_000` |
| Teste passa mas Enter não avançou o menu | Ajustar número de `keyboard.press('Enter')` ou os `waitForTimeout` entre eles |
| `npx playwright install` falha | Verificar conectividade; tentar `npx playwright install chromium --force` |
