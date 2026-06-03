# Checkpoint Feedback + Game Over Label — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (P1) Dar feedback visual persistente ao checkpoint ativado via glow/pulse, e (P2) corrigir o label enganoso do botão ENTER de Game Over quando não há checkpoint.

**Architecture:** P1 adiciona `checkpointActivatedGlow()` em EffectsManager, chamado na ativação (ItemCollectHandler) e na reentrada (GameScene._buildTilemap, após reordenar a init de _fx). P2 extrai a escolha do label como função pura testável `checkpointButtonLabel()` e a usa em GameOverScene.

**Tech Stack:** TypeScript, Phaser 3 (tint + tweens), Vitest

---

## Estrutura de arquivos

| Arquivo | Mudança |
|---|---|
| `src/fx/EffectsManager.ts` | P1: novo método `checkpointActivatedGlow()` |
| `src/scenes/ItemCollectHandler.ts` | P1: chamar glow na ativação |
| `src/scenes/GameScene.ts` | P1: mover init de `_fx` antes de `_buildTilemap` + aplicar glow se já alcançado |
| `src/scenes/checkpointButtonLabel.ts` | P2: **criar** — função pura do label |
| `tests/checkpointButtonLabel.test.ts` | P2: **criar** — testes da função pura |
| `src/scenes/GameOverScene.ts` | P2: usar `checkpointButtonLabel()` |

---

## Task 1: P2 — Função pura checkpointButtonLabel (TDD)

**Files:**
- Create: `src/scenes/checkpointButtonLabel.ts`
- Create: `tests/checkpointButtonLabel.test.ts`

> Contexto: GameOverScene mostra sempre `[ ENTER — retomar do checkpoint ]`, mesmo quando nenhum checkpoint foi tocado (aí `resetAtCheckpoint()` cai ao spawn). Extraímos a escolha do texto como função pura para poder testá-la sem instanciar a cena Phaser.

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/checkpointButtonLabel.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { checkpointButtonLabel } from '../src/scenes/checkpointButtonLabel'

describe('checkpointButtonLabel', () => {
  it('com checkpoint ativo menciona "checkpoint"', () => {
    expect(checkpointButtonLabel(true)).toContain('checkpoint')
  })
  it('sem checkpoint menciona "início da fase"', () => {
    expect(checkpointButtonLabel(false)).toContain('início da fase')
  })
  it('ambos os labels começam com "[ ENTER"', () => {
    expect(checkpointButtonLabel(true)).toContain('[ ENTER')
    expect(checkpointButtonLabel(false)).toContain('[ ENTER')
  })
})
```

- [ ] **Step 2: Rodar o teste para verificar que falha**

```bash
npx vitest run tests/checkpointButtonLabel.test.ts
```

Esperado: FAIL — `Cannot find module '../src/scenes/checkpointButtonLabel'`

- [ ] **Step 3: Criar `src/scenes/checkpointButtonLabel.ts`**

```typescript
/** Texto do botão ENTER no Game Over, conforme haja ou não checkpoint ativo. */
export function checkpointButtonLabel(reached: boolean): string {
  return reached
    ? '[ ENTER — retomar do checkpoint ]'
    : '[ ENTER — recomeçar do início da fase ]'
}
```

- [ ] **Step 4: Rodar o teste para verificar que passa**

```bash
npx vitest run tests/checkpointButtonLabel.test.ts
```

Esperado: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/scenes/checkpointButtonLabel.ts tests/checkpointButtonLabel.test.ts
git commit -m "feat: add checkpointButtonLabel pure function for honest game over text"
```

---

## Task 2: P2 — Usar checkpointButtonLabel em GameOverScene

**Files:**
- Modify: `src/scenes/GameOverScene.ts` (import + linha do enterBtn ~111)

> Contexto: GameOverScene importa `gameState` e tem `const enterBtn = mkBtn(300, '[ ENTER — retomar do checkpoint ]', '#ffffff')`. Trocamos o literal pela função pura, passando `gameState.checkpointReached`.

- [ ] **Step 1: Adicionar import em `src/scenes/GameOverScene.ts`**

Após os imports existentes no topo (após `import { SoundManager } from '../audio/SoundManager'`), adicionar:

```typescript
import { checkpointButtonLabel } from './checkpointButtonLabel'
```

- [ ] **Step 2: Substituir o literal do enterBtn**

Localizar a linha (~111):
```typescript
    const enterBtn = mkBtn(300, '[ ENTER — retomar do checkpoint ]', '#ffffff')
```

Substituir por:
```typescript
    const enterBtn = mkBtn(300, checkpointButtonLabel(gameState.checkpointReached), '#ffffff')
```

- [ ] **Step 3: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -5
```

Esperado: nenhuma linha de saída.

- [ ] **Step 4: Rodar todos os testes**

```bash
npx vitest run
```

Esperado: todos passam.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameOverScene.ts
git commit -m "feat: use honest conditional label on game over ENTER button"
```

---

## Task 3: P1 — Método checkpointActivatedGlow em EffectsManager

**Files:**
- Modify: `src/fx/EffectsManager.ts` (adicionar método)

> Contexto: EffectsManager recebe `scene` no construtor e usa `scene.tweens` em vários métodos. O novo método marca um checkpoint como ativado de forma persistente (tint + pulse infinito).

- [ ] **Step 1: Adicionar o método `checkpointActivatedGlow` em `src/fx/EffectsManager.ts`**

Adicionar como novo método público dentro da classe `EffectsManager` (após `checkpointSparkle`, por proximidade temática):

```typescript
  /** Marca um checkpoint como ativado: tint ciano + pulse infinito suave. */
  checkpointActivatedGlow(sprite: Phaser.GameObjects.Image): void {
    sprite.setTint(0x66ffdd)
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0.7,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }
```

- [ ] **Step 2: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -5
```

Esperado: nenhuma linha de saída.

- [ ] **Step 3: Rodar testes existentes**

```bash
npx vitest run
```

Esperado: todos passam (método visual, sem teste unitário novo).

- [ ] **Step 4: Commit**

```bash
git add src/fx/EffectsManager.ts
git commit -m "feat: add checkpointActivatedGlow to EffectsManager"
```

---

## Task 4: P1 — Glow na ativação (ItemCollectHandler)

**Files:**
- Modify: `src/scenes/ItemCollectHandler.ts` (case 'checkpoint')

> Contexto: O `case 'checkpoint'` em `ItemCollectHandler.handle()` recebe o próprio sprite como `item`. Após o `checkpointSparkle` existente, aplicamos o glow persistente.

- [ ] **Step 1: Adicionar a chamada de glow no case 'checkpoint'**

Localizar o bloco (linhas ~13–20):
```typescript
      case 'checkpoint':
        if (!gameState.checkpointReached) {
          gameState.setCheckpoint(item.x, item.y)
          SoundManager.play('checkpoint')
          scene._fx.checkpointSparkle(item.x, item.y)
          scene._spawnScorePopup(item.x, item.y - 32, '✅ checkpoint!', '#00ffcc')
        }
        return // don't destroy
```

Adicionar a linha de glow após o `_spawnScorePopup`:
```typescript
      case 'checkpoint':
        if (!gameState.checkpointReached) {
          gameState.setCheckpoint(item.x, item.y)
          SoundManager.play('checkpoint')
          scene._fx.checkpointSparkle(item.x, item.y)
          scene._spawnScorePopup(item.x, item.y - 32, '✅ checkpoint!', '#00ffcc')
          scene._fx.checkpointActivatedGlow(item)
        }
        return // don't destroy
```

- [ ] **Step 2: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -5
```

Esperado: nenhuma linha de saída.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ItemCollectHandler.ts
git commit -m "feat: apply persistent glow to checkpoint on activation"
```

---

## Task 5: P1 — Glow na reentrada + reordenar init de _fx (GameScene)

**Files:**
- Modify: `src/scenes/GameScene.ts` (create() init order + _buildTilemap)

> Contexto: Em `create()`, `_buildTilemap()` roda na linha 142, mas `this._fx = new EffectsManager(this)` só na 144. Para aplicar o glow no checkpoint durante `_buildTilemap` (reentrada), `_fx` precisa existir antes. O construtor de EffectsManager só guarda a `scene`, então mover é seguro.

- [ ] **Step 1: Reordenar init de _fx antes de _buildTilemap**

Localizar o bloco em `create()` (linhas ~139–146):
```typescript
    this._buildDecorations()
    this._buildMovingPlatforms()
    this._buildHazards()
    this._buildTilemap()
    this._spawnPlayer()
    this._fx = new EffectsManager(this)
    this._enemyHPBar = new EnemyHPBar(this)
    this._applyUpgrades()
```

Substituir por (mover `this._fx = ...` para antes de `_buildTilemap()`):
```typescript
    this._buildDecorations()
    this._buildMovingPlatforms()
    this._buildHazards()
    this._fx = new EffectsManager(this)
    this._buildTilemap()
    this._spawnPlayer()
    this._enemyHPBar = new EnemyHPBar(this)
    this._applyUpgrades()
```

- [ ] **Step 2: Aplicar glow no checkpoint em _buildTilemap quando já alcançado**

Localizar o bloco de criação do checkpoint em `_buildTilemap()` (linhas ~293–299):
```typescript
    if (!this.currentLevel.isBossLevel) {
      const cpSprite = this.currentLevel.checkpointSprite ?? KEYS.HYDRANT
      const cp = this.physics.add.staticImage(this.currentLevel.checkpointX, groundY, cpSprite)
      cp.setOrigin(0.5, 1).refreshBody()
      cp.setData('type', 'checkpoint')
      this.itemGroup.add(cp)
    }
```

Substituir por (adicionar glow condicional antes de fechar o `if`):
```typescript
    if (!this.currentLevel.isBossLevel) {
      const cpSprite = this.currentLevel.checkpointSprite ?? KEYS.HYDRANT
      const cp = this.physics.add.staticImage(this.currentLevel.checkpointX, groundY, cpSprite)
      cp.setOrigin(0.5, 1).refreshBody()
      cp.setData('type', 'checkpoint')
      this.itemGroup.add(cp)
      if (gameState.checkpointReached) {
        this._fx.checkpointActivatedGlow(cp)
      }
    }
```

- [ ] **Step 3: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -5
```

Esperado: nenhuma linha de saída.

- [ ] **Step 4: Rodar todos os testes**

```bash
npx vitest run
```

Esperado: todos passam — nenhuma regressão pela reordenação de `_fx`.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: show activated checkpoint glow on level re-entry; init _fx before tilemap"
```
