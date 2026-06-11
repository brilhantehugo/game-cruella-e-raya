# Power-ups Múltiplos (M1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir múltiplos power-ups ativos simultaneamente (petisco, pipoca, churrasco) trocando o slot único de GameState por um Map, com HUD empilhado e aura pela cor do mais recente.

**Architecture:** `GameState.activePowerUp: ActivePowerUp | null` → `activePowerUps: Map<string, number>` (tipo→expiração) com expiração lazy. Métodos públicos mantêm assinatura (consumidores de efeito não mudam). UIScene renderiza um pool de até 3 linhas [ícone+barra]; GameScene escolhe a cor da aura pelo power-up mais recente via `getActivePowerUps()`.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## Estrutura de arquivos

| Arquivo | Mudança |
|---|---|
| `src/GameState.ts` | `activePowerUps: Map` + métodos + `getActivePowerUps` + resets; remover interface `ActivePowerUp` |
| `tests/GameState.test.ts` | Atualizar testes existentes + novos para múltiplos |
| `src/scenes/UIScene.ts` | Pool `_puRows` (3 linhas) em vez de ícone/barra únicos |
| `src/scenes/GameScene.ts` | Aura usa `getActivePowerUps` (cor do mais recente) |

---

## Task 1: Modelo Map em GameState (TDD)

**Files:**
- Modify: `src/GameState.ts`
- Modify: `tests/GameState.test.ts`

> Contexto: `GameState` é testável sem Phaser (já tem suíte). Trocamos o slot único por Map e atualizamos os testes que liam `activePowerUp` direto.

- [ ] **Step 1: Atualizar/adicionar testes em `tests/GameState.test.ts`**

Substituir o teste `'power-up expira após 10s'` (linhas ~60-65) e `'hasPowerUp retorna false para tipo errado'` (~67-70) e adicionar novos. O bloco final deve ficar:

```typescript
  it('power-up expira após 10s', () => {
    state.applyPowerUp('petisco', 0)
    expect(state.hasPowerUp('petisco', 5000)).toBe(true)
    expect(state.hasPowerUp('petisco', 10001)).toBe(false)
    expect(state.hasAnyPowerUp(10001)).toBe(false)
  })

  it('hasPowerUp retorna false para tipo errado', () => {
    state.applyPowerUp('petisco', 0)
    expect(state.hasPowerUp('pipoca', 5000)).toBe(false)
  })

  it('múltiplos power-ups ficam ativos simultaneamente', () => {
    state.applyPowerUp('petisco', 0)
    state.applyPowerUp('pipoca', 0)
    expect(state.hasPowerUp('petisco', 5000)).toBe(true)
    expect(state.hasPowerUp('pipoca', 5000)).toBe(true)
    expect(state.getActivePowerUps(5000).length).toBe(2)
  })

  it('aplicar o mesmo tipo renova a expiração, não duplica', () => {
    state.applyPowerUp('petisco', 0)
    state.applyPowerUp('petisco', 3000)
    expect(state.getActivePowerUps(5000).length).toBe(1)
    expect(state.hasPowerUp('petisco', 12000)).toBe(true)   // renovado até 13000
    expect(state.hasPowerUp('petisco', 13001)).toBe(false)
  })

  it('getActivePowerUps retorna ordem de inserção e exclui expirados', () => {
    state.applyPowerUp('petisco', 0)       // expira 10000
    state.applyPowerUp('churrasco', 6000)  // expira 16000
    const active = state.getActivePowerUps(11000)  // petisco expirado
    expect(active.map(p => p.type)).toEqual(['churrasco'])
  })
```

Atualizar as 2 asserções em resets que liam `activePowerUp` direto:
- Linha ~115: `state.activePowerUp = { type: 'petisco', expiresAt: 99999 }` → `state.applyPowerUp('petisco', 90000)`
- Linha ~121: `expect(state.activePowerUp).toBeNull()` → `expect(state.hasAnyPowerUp(0)).toBe(false)`
- Linha ~155: `state.activePowerUp = { type: 'pipoca', expiresAt: 99999 }` → `state.applyPowerUp('pipoca', 90000)`
- Linha ~160: `expect(state.activePowerUp).toBeNull()` → `expect(state.hasAnyPowerUp(0)).toBe(false)`

Também atualizar o teste `'applyPowerUp usa POWER_UP_DURATION'` (linha ~243-248):
```typescript
describe('applyPowerUp usa POWER_UP_DURATION', () => {
  it('define expiração = now + POWER_UP_DURATION', () => {
    const gs = new GameState()
    gs.applyPowerUp('petisco', 5000)
    expect(gs.getActivePowerUps(5001).length).toBe(1)
    expect(gs.hasPowerUp('petisco', 5000 + POWER_UP_DURATION - 1)).toBe(true)
    expect(gs.hasPowerUp('petisco', 5000 + POWER_UP_DURATION)).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar os testes para verificar que falham**

```bash
npx vitest run tests/GameState.test.ts
```

Esperado: FAIL — `getActivePowerUps` não existe, `activePowerUp` removido.

- [ ] **Step 3: Atualizar `src/GameState.ts`**

Remover a interface `ActivePowerUp` (linhas 6-9):
```typescript
export interface ActivePowerUp {
  type: string
  expiresAt: number
}
```

Trocar o campo (linha ~19) `activePowerUp: ActivePowerUp | null = null` por:
```typescript
  activePowerUps: Map<string, number> = new Map()
```

Substituir os métodos `hasPowerUp`, `hasAnyPowerUp`, `applyPowerUp` (e adicionar `getActivePowerUps`):
```typescript
  hasPowerUp(type: string, now: number): boolean {
    const exp = this.activePowerUps.get(type)
    if (exp === undefined) return false
    if (now >= exp) { this.activePowerUps.delete(type); return false }
    return true
  }

  hasAnyPowerUp(now: number): boolean {
    for (const [type, exp] of this.activePowerUps) {
      if (now >= exp) this.activePowerUps.delete(type)
    }
    return this.activePowerUps.size > 0
  }

  applyPowerUp(type: string, now: number): void {
    this.activePowerUps.set(type, now + POWER_UP_DURATION)
  }

  /** Power-ups ativos (não-expirados), em ordem de inserção. Para o HUD/aura. */
  getActivePowerUps(now: number): Array<{ type: string; expiresAt: number }> {
    const out: Array<{ type: string; expiresAt: number }> = []
    for (const [type, exp] of this.activePowerUps) {
      if (now < exp) out.push({ type, expiresAt: exp })
      else this.activePowerUps.delete(type)
    }
    return out
  }
```

Nos 3 resets (`reset`, `resetAtCheckpoint`, `resetLevel`), trocar `this.activePowerUp = null` por:
```typescript
    this.activePowerUps.clear()
```

> Nota: `POWER_UP_DURATION` já é importado em GameState.ts (usado por applyPowerUp). Não adicionar import duplicado.

- [ ] **Step 4: Rodar os testes para verificar que passam**

```bash
npx vitest run tests/GameState.test.ts
```

Esperado: todos passam.

- [ ] **Step 5: Build (verifica consumidores de `activePowerUp`)**

```bash
npm run build 2>&1 | grep "error TS" | head -10
```

Esperado: erros TS em `UIScene.ts` e `GameScene.ts` (leem `activePowerUp` removido) — **esperado**, serão corrigidos nas Tasks 2 e 3. Os consumidores que usam `hasPowerUp`/`hasAnyPowerUp` (Raya, Cruella, Player, CollisionSetup) NÃO devem ter erro.

> Se aparecer erro em arquivo além de UIScene.ts/GameScene.ts, investigar antes de prosseguir.

- [ ] **Step 6: Commit**

```bash
git add src/GameState.ts tests/GameState.test.ts
git commit -m "feat: multiple simultaneous power-ups via Map in GameState"
```

---

## Task 2: Aura pela cor do mais recente (GameScene)

**Files:**
- Modify: `src/scenes/GameScene.ts` (bloco da aura, linhas ~617-632)

> Contexto: O bloco da aura lê `gameState.activePowerUp` (removido na Task 1). Trocar por `getActivePowerUps` e usar a cor do power-up mais recente (último da lista, ordem de inserção).

- [ ] **Step 1: Substituir o bloco da aura**

Localizar (linhas ~617-632):
```typescript
    // Aura de power-up ativo
    this._puAuraGfx.clear()
    const puEntry = gameState.activePowerUp
    if (puEntry && gameState.hasAnyPowerUp(this.time.now)) {
      const puColors: Record<string, number> = {
        petisco:   0xff8800,
        pipoca:    0xffff00,
        churrasco: 0xff4400,
        bola:      0x44ff88,
        frisbee:   0x44ff88,
      }
      const puColor = puColors[puEntry.type] ?? 0x00ccff
      const alpha = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(this.time.now * 0.005))
      this._puAuraGfx.lineStyle(2, puColor, alpha)
      this._puAuraGfx.strokeCircle(this.player.active.x, this.player.active.y, 28)
    }
```

Substituir por:
```typescript
    // Aura de power-up ativo (cor do mais recente quando há múltiplos)
    this._puAuraGfx.clear()
    const auraActive = gameState.getActivePowerUps(this.time.now)
    if (auraActive.length > 0) {
      const puColors: Record<string, number> = {
        petisco:   0xff8800,
        pipoca:    0xffff00,
        churrasco: 0xff4400,
        bola:      0x44ff88,
        frisbee:   0x44ff88,
      }
      const primary = auraActive[auraActive.length - 1].type
      const puColor = puColors[primary] ?? 0x00ccff
      const alpha = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(this.time.now * 0.005))
      this._puAuraGfx.lineStyle(2, puColor, alpha)
      this._puAuraGfx.strokeCircle(this.player.active.x, this.player.active.y, 28)
    }
```

- [ ] **Step 2: Build (GameScene deve compilar agora)**

```bash
npm run build 2>&1 | grep "error TS" | head -10
```

Esperado: nenhum erro em `GameScene.ts` (restará erro só em `UIScene.ts`, corrigido na Task 3).

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: power-up aura uses most-recent active color"
```

---

## Task 3: HUD empilhado (UIScene)

**Files:**
- Modify: `src/scenes/UIScene.ts`

> Contexto: HUD atual tem campos `_puIcon` (Text), `_puBarBg`/`_puBar` (Rectangle) — um power-up. Substituímos por um pool `_puRows` de 3 linhas. O fundo do HUD é um rect em y=22 altura 44 (faixa y≈0–44). Posições das linhas: y = 24, 33, 42 (3 linhas de 9px cabem na faixa). Ícone em x=140, barra em x=185 (mantém X atuais).

- [ ] **Step 1: Trocar os campos no topo da classe**

Localizar (linhas ~13-15):
```typescript
  private _puIcon!: Phaser.GameObjects.Text
  private _puBarBg!: Phaser.GameObjects.Rectangle
  private _puBar!: Phaser.GameObjects.Rectangle
```

Substituir por:
```typescript
  private _puRows: Array<{
    icon: Phaser.GameObjects.Text
    barBg: Phaser.GameObjects.Rectangle
    bar: Phaser.GameObjects.Rectangle
  }> = []
```

- [ ] **Step 2: Substituir a criação no `create()`**

Localizar (linhas ~47-49):
```typescript
    this._puIcon   = this.add.text(140, 24, '', { fontSize: '14px' }).setScrollFactor(0)
    this._puBarBg  = this.add.rectangle(185, 31, 60, 7, 0x333333).setScrollFactor(0)
    this._puBar    = this.add.rectangle(185, 31, 60, 7, 0x06b6d4).setScrollFactor(0).setOrigin(0.5)
```

Substituir por (pool de 3 linhas, todas invisíveis até haver power-up):
```typescript
    for (let i = 0; i < 3; i++) {
      const y = 24 + i * 9
      const icon  = this.add.text(140, y - 7, '', { fontSize: '12px' }).setScrollFactor(0).setVisible(false)
      const barBg = this.add.rectangle(185, y, 60, 6, 0x333333).setScrollFactor(0).setVisible(false)
      const bar   = this.add.rectangle(185, y, 60, 6, 0x06b6d4).setScrollFactor(0).setOrigin(0.5).setVisible(false)
      this._puRows.push({ icon, barBg, bar })
    }
```

- [ ] **Step 3: Substituir o render no update**

Localizar (linhas ~156-171):
```typescript
    if (gameState.hasAnyPowerUp(now) && gameState.activePowerUp) {
      const puIcons: Record<string, string> = {
        petisco: '🍖', pipoca: '🍿', churrasco: '🥩', bola: '🎾', frisbee: '🥏'
      }
      const fraction = Math.max(0, (gameState.activePowerUp.expiresAt - now) / POWER_UP_DURATION)
      const barColor = fraction < 0.2 ? 0xef4444 : 0x06b6d4
      this._puIcon.setText(puIcons[gameState.activePowerUp.type] ?? '⚡')
      this._puBar.setDisplaySize(60 * fraction, 7).setFillStyle(barColor)
      this._puBarBg.setVisible(true)
      this._puBar.setVisible(true)
      this._puIcon.setVisible(true)
    } else {
      this._puBarBg.setVisible(false)
      this._puBar.setVisible(false)
      this._puIcon.setVisible(false)
    }
```

Substituir por:
```typescript
    const puIcons: Record<string, string> = {
      petisco: '🍖', pipoca: '🍿', churrasco: '🥩', bola: '🎾', frisbee: '🥏'
    }
    const activePU = gameState.getActivePowerUps(now)
    this._puRows.forEach((row, i) => {
      const pu = activePU[i]
      if (pu) {
        const fraction = Math.max(0, (pu.expiresAt - now) / POWER_UP_DURATION)
        const barColor = fraction < 0.2 ? 0xef4444 : 0x06b6d4
        row.icon.setText(puIcons[pu.type] ?? '⚡').setVisible(true)
        row.bar.setDisplaySize(60 * fraction, 6).setFillStyle(barColor).setVisible(true)
        row.barBg.setVisible(true)
      } else {
        row.icon.setVisible(false)
        row.bar.setVisible(false)
        row.barBg.setVisible(false)
      }
    })
```

- [ ] **Step 4: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -10
npx vitest run 2>&1 | grep -E "Test Files|Tests "
```

Esperado: 0 erros TS, todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/UIScene.ts
git commit -m "feat: stacked HUD rows for multiple active power-ups"
```
