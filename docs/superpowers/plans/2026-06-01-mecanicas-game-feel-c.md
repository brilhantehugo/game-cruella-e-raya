# Mecânicas / Game Feel C — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir 2 itens de mecânicas: (M3) eliminar o número mágico `10000` da duração de power-up usando `POWER_UP_DURATION`, e (M2) adicionar um anel pulsante que sinaliza a janela de combo dash→swap.

**Architecture:** M3 é uma troca de literal por constante em 2 arquivos + 1 teste. M2 adiciona um método visual `comboWindowHint()` em EffectsManager e o ciclo de vida do indicador em Player (criar no dash, destruir após 600ms ou no combo). Sem novos arquivos.

**Tech Stack:** TypeScript, Phaser 3 (Graphics + tweens + preupdate listener), Vitest

---

## Estrutura de arquivos

| Arquivo | Mudança |
|---|---|
| `src/GameState.ts` | M3: importar e usar `POWER_UP_DURATION` em `applyPowerUp()` |
| `src/scenes/UIScene.ts` | M3: importar e usar `POWER_UP_DURATION` no cálculo da barra |
| `tests/GameState.test.ts` | M3: teste de `applyPowerUp` |
| `src/fx/EffectsManager.ts` | M2: novo método `comboWindowHint()` |
| `src/entities/Player.ts` | M2: campo + `_showComboHint()` + `_destroyComboHint()` + wires |

---

## Task 1: M3 — Power-up duration via POWER_UP_DURATION (TDD)

**Files:**
- Modify: `src/GameState.ts` (linha 1 import, linha 98)
- Modify: `src/scenes/UIScene.ts` (import + linha 155)
- Test: `tests/GameState.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Adicionar ao final de `tests/GameState.test.ts` (antes do último `})` de fechamento do arquivo, como novo `describe`):

```typescript
describe('applyPowerUp usa POWER_UP_DURATION', () => {
  it('define expiresAt = now + POWER_UP_DURATION', async () => {
    const { POWER_UP_DURATION } = await import('../src/constants')
    const gs = new GameState()
    gs.applyPowerUp('petisco', 5000)
    expect(gs.activePowerUp).not.toBeNull()
    expect(gs.activePowerUp!.expiresAt).toBe(5000 + POWER_UP_DURATION)
  })
})
```

> Nota: verifique no topo de `tests/GameState.test.ts` se `GameState` já é importado. Se o import for `import { gameState } from '../src/GameState'` (a instância), adicione `GameState` (a classe): `import { GameState, gameState } from '../src/GameState'`. Use a classe `GameState` para instanciar um estado limpo no teste.

- [ ] **Step 2: Rodar o teste — deve passar imediatamente (valor atual é 10000)**

```bash
npx vitest run tests/GameState.test.ts
```

Esperado: PASS — porque `applyPowerUp` já usa `10000` e `POWER_UP_DURATION` também é `10000`. O teste trava o acoplamento: se alguém mudar a constante sem mudar `applyPowerUp`, o teste falha.

> Este é um teste de regressão que protege a refatoração do Step 3. Ele passa antes e depois — seu valor é garantir que após trocar o literal pela constante, o comportamento permanece idêntico.

- [ ] **Step 3: Trocar o literal pela constante em `src/GameState.ts`**

Linha 1 — adicionar `POWER_UP_DURATION` ao import:
```typescript
import { PHYSICS, POWER_UP_DURATION } from './constants'
```

Linha 98 — usar a constante:
```typescript
  applyPowerUp(type: string, now: number): void {
    this.activePowerUp = { type, expiresAt: now + POWER_UP_DURATION }
  }
```

- [ ] **Step 4: Trocar o literal em `src/scenes/UIScene.ts`**

Localizar a linha de import de `../constants` no topo de `UIScene.ts` e adicionar `POWER_UP_DURATION` à lista de imports existente. Se não houver import de `../constants`, adicionar:
```typescript
import { POWER_UP_DURATION } from '../constants'
```

Linha 155 — usar a constante na divisão:
```typescript
      const fraction = Math.max(0, (gameState.activePowerUp.expiresAt - now) / POWER_UP_DURATION)
```

- [ ] **Step 5: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -5
npx vitest run tests/GameState.test.ts
```

Esperado: 0 erros TS, teste passando.

- [ ] **Step 6: Commit**

```bash
git add src/GameState.ts src/scenes/UIScene.ts tests/GameState.test.ts
git commit -m "refactor: use POWER_UP_DURATION constant instead of magic 10000"
```

---

## Task 2: M2 — Método comboWindowHint em EffectsManager

**Files:**
- Modify: `src/fx/EffectsManager.ts` (adicionar método)

> Contexto: EffectsManager já recebe `scene` no construtor (linha 6) e usa `scene.add.graphics()` + `scene.tweens` em outros métodos. O novo método segue esse padrão e adiciona um listener `preupdate` para o anel acompanhar o sprite, anexando o tracker ao Graphics via `setData` para cleanup posterior pelo chamador.

- [ ] **Step 1: Adicionar o método `comboWindowHint` em `src/fx/EffectsManager.ts`**

Adicionar como novo método público dentro da classe `EffectsManager` (após `dustPuff` ou qualquer método existente, antes do fechamento `}` da classe):

```typescript
  /**
   * Anel ciano pulsante acima do sprite, sinalizando a janela de combo dash→swap.
   * Retorna o Graphics; o chamador é responsável pelo cleanup:
   *   const tracker = gfx.getData('tracker')
   *   if (tracker) scene.events.off('preupdate', tracker)
   *   gfx.destroy()
   */
  comboWindowHint(target: Phaser.GameObjects.Sprite, _durationMs: number): Phaser.GameObjects.Graphics {
    const gfx = this.scene.add.graphics()
    gfx.lineStyle(3, 0x44ddff, 0.9)
    gfx.strokeCircle(0, 0, 14)
    gfx.setPosition(target.x, target.y - 36)
    gfx.setDepth(EffectsManager.PARTICLE_DEPTH)

    // Pulse: escala 0.8 ↔ 1.2 + alpha 0.4 ↔ 0.9
    gfx.setScale(0.8)
    gfx.setAlpha(0.4)
    this.scene.tweens.add({
      targets: gfx,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.9,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Tracker: segue o sprite a cada frame; anexado ao Graphics para cleanup
    const tracker = () => {
      if (gfx.active) gfx.setPosition(target.x, target.y - 36)
    }
    this.scene.events.on('preupdate', tracker)
    gfx.setData('tracker', tracker)

    return gfx
  }
```

- [ ] **Step 2: Build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -5
```

Esperado: nenhum erro.

- [ ] **Step 3: Rodar testes existentes**

```bash
npx vitest run
```

Esperado: todos passam (nenhum teste novo; método é visual).

- [ ] **Step 4: Commit**

```bash
git add src/fx/EffectsManager.ts
git commit -m "feat: add comboWindowHint visual to EffectsManager"
```

---

## Task 3: M2 — Ciclo de vida do hint em Player

**Files:**
- Modify: `src/entities/Player.ts`

> Contexto: O listener `'dashed'` (linha 24) já define `_dashComboWindowUntil = time + 600`. Adicionamos a criação do hint ali, com auto-destruição via `delayedCall(600)` e destruição antecipada em `_activateDashCombo()`. O acesso ao EffectsManager é via `(this.scene as any)._fx` (campo `/*internal*/` em GameScene). Guard `if (!fx) return` protege contextos de teste.

- [ ] **Step 1: Adicionar import de EffectsManager (type) e campo em `src/entities/Player.ts`**

No topo, após `import { SoundManager } from '../audio/SoundManager'` (linha 7), adicionar:
```typescript
import type { EffectsManager } from '../fx/EffectsManager'
```

Na lista de campos privados (após linha 15 `private _lastDashDir: number = 1`), adicionar:
```typescript
  private _comboHintGfx: Phaser.GameObjects.Graphics | null = null
```

- [ ] **Step 2: Chamar `_showComboHint()` no listener de dash**

Localizar o listener `'dashed'` (linhas 24–27):
```typescript
    this.raya.on('dashed', ({ dir, time }: { dir: number; time: number }) => {
      this._dashComboWindowUntil = time + 600
      this._lastDashDir = dir
    })
```

Substituir por:
```typescript
    this.raya.on('dashed', ({ dir, time }: { dir: number; time: number }) => {
      this._dashComboWindowUntil = time + 600
      this._lastDashDir = dir
      this._showComboHint()
    })
```

- [ ] **Step 3: Adicionar os métodos `_showComboHint` e `_destroyComboHint`**

Adicionar como métodos privados na classe `Player` (após o construtor, antes ou depois de `_performSwap` — qualquer posição dentro da classe):

```typescript
  private _showComboHint(): void {
    this._destroyComboHint()   // guard contra dash duplo
    const fx = (this.scene as any)._fx as EffectsManager | undefined
    if (!fx) return
    this._comboHintGfx = fx.comboWindowHint(this.raya, 600)
    this.scene.time.delayedCall(600, () => this._destroyComboHint())
  }

  private _destroyComboHint(): void {
    if (this._comboHintGfx) {
      const tracker = this._comboHintGfx.getData('tracker')
      if (tracker) this.scene.events.off('preupdate', tracker)
      if (this._comboHintGfx.active) this._comboHintGfx.destroy()
      this._comboHintGfx = null
    }
  }
```

- [ ] **Step 4: Destruir o hint quando o combo é ativado**

Localizar o método `_activateDashCombo()`. No final dele (após `this._dashComboWindowUntil = 0`, que reseta a janela), adicionar:
```typescript
    this._destroyComboHint()
```

- [ ] **Step 5: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -5
npx vitest run
```

Esperado: 0 erros TS, todos os testes passando.

- [ ] **Step 6: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat: show pulsing combo-window hint over Raya during dash→swap window"
```
