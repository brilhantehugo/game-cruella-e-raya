# Efeito Visual de Swap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o flash branco genérico do swap por flash colorido (Raya=azul, Cruella=vermelho) + burst de 12 partículas na posição de swap.

**Architecture:** `SWAP_COLORS` exportado de `constants.ts` garante testabilidade. Player emite evento Phaser `swap-fx` — GameScene escuta e aciona `EffectsManager.swapBurst()`. Sem importação circular entre Player e GameScene.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript, Vitest

---

## Arquivos

| Arquivo | Ação | O que muda |
|---|---|---|
| `src/constants.ts` | Modificar — append ao final | Adicionar `SWAP_COLORS` exportado |
| `src/fx/EffectsManager.ts` | Modificar — adicionar método | `swapBurst()` usando `SWAP_COLORS` |
| `tests/SwapEffect.test.ts` | Criar | 3 testes de cor e duration |
| `src/entities/Player.ts` | Modificar linha 98 + adicionar emit | Flash colorido + `events.emit('swap-fx')` |
| `src/scenes/GameScene.ts` | Modificar — adicionar listener | `events.on('swap-fx')` → `_fx.swapBurst()` |

---

## Task 1: constants.ts — Adicionar SWAP_COLORS

**Files:**
- Modify: `src/constants.ts` (final do arquivo, após `POWERUP_LABEL`)

- [ ] **Step 1: Adicionar ao final de `src/constants.ts`**

Após o bloco `POWERUP_LABEL` existente, adicionar:

```typescript
export const SWAP_COLORS = {
  raya:    { hex: 0x44aaff, r: 68,  g: 170, b: 255, flash: 180 },
  cruella: { hex: 0xff4444, r: 255, g: 68,  b: 68,  flash: 180 },
} as const
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat(constants): adicionar SWAP_COLORS para efeito de swap"
```

---

## Task 2: EffectsManager.ts — Adicionar swapBurst()

**Files:**
- Modify: `src/fx/EffectsManager.ts` (após `powerUpBurst`, em torno da linha 124)

- [ ] **Step 1: Adicionar import de SWAP_COLORS**

Localizar a linha de import de `KEYS` no topo de `src/fx/EffectsManager.ts`:

```typescript
import { KEYS, GAME_WIDTH } from '../constants'
```

Substituir por:

```typescript
import { KEYS, GAME_WIDTH, SWAP_COLORS } from '../constants'
```

- [ ] **Step 2: Adicionar método `swapBurst` após `powerUpBurst`**

Localizar o método `powerUpBurst` (termina com `this._burst(x, y, 10, color, 20, 60, 3, 7, 350)`). Adicionar logo após:

```typescript
/** Burst colorido ao trocar de personagem (Raya=azul, Cruella=vermelho) */
swapBurst(x: number, y: number, isRaya: boolean): void {
  const color = isRaya ? SWAP_COLORS.raya.hex : SWAP_COLORS.cruella.hex
  this._burst(x, y, 12, color, 20, 80, 3, 6, 400)
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/fx/EffectsManager.ts
git commit -m "feat(fx): adicionar swapBurst() ao EffectsManager"
```

---

## Task 3: Testes TDD — SwapEffect.test.ts

**Files:**
- Create: `tests/SwapEffect.test.ts`

- [ ] **Step 1: Criar o arquivo de testes**

```typescript
// tests/SwapEffect.test.ts
import { describe, it, expect } from 'vitest'
import { SWAP_COLORS } from '../src/constants'

describe('SWAP_COLORS', () => {
  it('Raya tem cor azul', () => {
    expect(SWAP_COLORS.raya.hex).toBe(0x44aaff)
    expect(SWAP_COLORS.raya.r).toBe(68)
    expect(SWAP_COLORS.raya.g).toBe(170)
    expect(SWAP_COLORS.raya.b).toBe(255)
  })

  it('Cruella tem cor vermelha', () => {
    expect(SWAP_COLORS.cruella.hex).toBe(0xff4444)
    expect(SWAP_COLORS.cruella.r).toBe(255)
    expect(SWAP_COLORS.cruella.g).toBe(68)
    expect(SWAP_COLORS.cruella.b).toBe(68)
  })

  it('flash duration é 180ms para ambos', () => {
    expect(SWAP_COLORS.raya.flash).toBe(180)
    expect(SWAP_COLORS.cruella.flash).toBe(180)
  })
})
```

- [ ] **Step 2: Rodar testes — devem passar**

```bash
npm test -- tests/SwapEffect.test.ts 2>&1 | tail -10
```

Esperado: 3 testes passando. `SWAP_COLORS` já existe em `constants.ts` (Task 1 feita).

- [ ] **Step 3: Commit**

```bash
git add tests/SwapEffect.test.ts
git commit -m "test(swap): testes TDD para SWAP_COLORS"
```

---

## Task 4: Player.ts — Flash colorido + emit 'swap-fx'

**Files:**
- Modify: `src/entities/Player.ts` (método `_performSwap`, em torno da linha 98)

- [ ] **Step 1: Adicionar import de SWAP_COLORS**

Localizar a linha de import de PHYSICS no topo de `src/entities/Player.ts`:

```typescript
import { PHYSICS } from '../constants'
```

Substituir por:

```typescript
import { PHYSICS, SWAP_COLORS } from '../constants'
```

- [ ] **Step 2: Substituir o flash em `_performSwap()`**

Localizar esta linha (em torno da linha 98):

```typescript
    this.scene.cameras.main.flash(80, 255, 255, 255)
```

Substituir por:

```typescript
    const isRaya = gameState.activeDog === 'raya'
    const c = isRaya ? SWAP_COLORS.raya : SWAP_COLORS.cruella
    this.scene.cameras.main.flash(c.flash, c.r, c.g, c.b)
    this.scene.events.emit('swap-fx', { x: newActive.x, y: newActive.y, isRaya })
```

> **Contexto:** `newActive` já está definido neste método (linha ~79 do arquivo original) como `const newActive = this.active`. `gameState.activeDog` já reflete o personagem novo porque `gameState.swap()` foi chamado antes de `_performSwap()`.

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat(player): flash colorido e emit swap-fx ao trocar personagem"
```

---

## Task 5: GameScene.ts — Listener 'swap-fx'

**Files:**
- Modify: `src/scenes/GameScene.ts` (método `create()`, após linha 138)

- [ ] **Step 1: Adicionar listener após os eventos de dust puff**

Localizar este bloco em `create()` (em torno da linha 135):

```typescript
    this.player.raya.on('landed', () => {
      const body = this.player.raya.body as Phaser.Physics.Arcade.Body
      this._fx.dustPuff(this.player.raya.x, body.bottom, 'large')
    })
    this._spawnEnemies()
```

Substituir por:

```typescript
    this.player.raya.on('landed', () => {
      const body = this.player.raya.body as Phaser.Physics.Arcade.Body
      this._fx.dustPuff(this.player.raya.x, body.bottom, 'large')
    })
    this.events.on('swap-fx', ({ x, y, isRaya }: { x: number; y: number; isRaya: boolean }) => {
      this._fx.swapBurst(x, y, isRaya)
    })
    this._spawnEnemies()
```

> **Por que aqui:** `this._fx` é inicializado em `this._fx = new EffectsManager(this)` na linha 127 — o listener deve vir depois disso. Agrupado com outros listeners de efeitos (dust puff) para clareza.

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 3: Rodar suite completa de testes**

```bash
npm test 2>&1 | tail -10
```

Esperado: todos os testes passando (sem regressões).

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(game): listener swap-fx → _fx.swapBurst()"
```

---

## Task 6: Verificação final

- [ ] **Step 1: Build limpo**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros.

- [ ] **Step 2: Suite completa de testes**

```bash
npm test 2>&1 | tail -10
```

Esperado: todos os testes passando.

- [ ] **Step 3: Checklist de comportamento**

Verificar mentalmente:
- ✅ Swap com Raya → flash **azul** (#44aaff), 12 partículas azuis
- ✅ Swap com Cruella → flash **vermelho** (#ff4444), 12 partículas vermelhas
- ✅ Flash dura 180ms (antes era 80ms branco)
- ✅ Partículas se espalham 20–80px e somem em 400ms
- ✅ Nenhum import circular (Player não importa GameScene)
- ✅ Cooldown e lógica de swap inalterados
