# Polimento Visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar cinco melhorias visuais de polimento: blink de invencibilidade, aura de power-up ativo, contagem animada de score em LevelComplete e GameOver, e texto flutuante ao ativar checkpoint.

**Architecture:** Todas as mudanças são autocontidas em arquivos existentes. Nenhum novo arquivo de produção. Nenhum import circular. Nenhum teste unitário novo necessário (efeitos Phaser não são testáveis com vitest sem mocks pesados — verificação é build TypeScript limpo).

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript, Vitest

---

## Arquivos

| Arquivo | Ação | O que muda |
|---|---|---|
| `src/entities/Player.ts` | Modificar linha 136-137 | Adicionar blink tween após flash vermelho em `takeDamage()` |
| `src/scenes/GameScene.ts` | Modificar 3 locais | Campo `_puAuraGfx`, inicialização em `create()`, atualização em `update()`, + texto no checkpoint |
| `src/scenes/LevelCompleteScene.ts` | Modificar linha 154 | Score row estático → label manual + `tweens.addCounter` |
| `src/scenes/GameOverScene.ts` | Modificar linhas 90-92 | Score estático → variável + `tweens.addCounter` |

---

## Task 1: Player.ts — Blink de invencibilidade

**Files:**
- Modify: `src/entities/Player.ts:136-137`

**Contexto:** O método `takeDamage()` está em `src/entities/Player.ts` linhas 130-138. As linhas 136-137 fazem um flash vermelho de 300ms e depois limpam o tint. Precisamos adicionar um blink de alpha (piscada) após o flash, indicando a janela de invencibilidade.

- [ ] **Step 1: Substituir o delayedCall em `takeDamage()`**

Localizar (linhas 136-137):
```typescript
    this.active.setTint(0xff0000)
    this.scene.time.delayedCall(300, () => this.active.clearTint())
```

Substituir por:
```typescript
    this.active.setTint(0xff0000)
    this.scene.time.delayedCall(300, () => {
      this.active.clearTint()
      this.scene.tweens.add({
        targets: this.active,
        alpha: 0.3,
        duration: 150,
        yoyo: true,
        repeat: 5,
        ease: 'Linear',
        onComplete: () => { this.active.setAlpha(1) },
      })
    })
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat(player): blink de invencibilidade após tomar dano"
```

---

## Task 2: GameScene.ts — Aura de power-up ativo

**Files:**
- Modify: `src/scenes/GameScene.ts` (3 locais: campo privado ~linha 67, create() ~linha 141, update() ~linha 1090)

**Contexto:** `GameScene` já tem campo privado `_fx` (linha 56). O método `create()` inicializa `_fx` em linha 127. O método `update()` termina na linha 1091 (após o bloco `// Ghost trail no dash`). `gameState.activePowerUp` é `{ type: string, expiresAt: number } | null`. `gameState.hasAnyPowerUp(now)` retorna `true` se há power-up ativo (e zera o campo se expirado).

- [ ] **Step 1: Adicionar campo privado `_puAuraGfx`**

Localizar o bloco de campos privados. Após a linha:
```typescript
  private _lastTrailAt: number = 0
```

Adicionar:
```typescript
  private _puAuraGfx!: Phaser.GameObjects.Graphics
```

- [ ] **Step 2: Inicializar `_puAuraGfx` em `create()`**

Localizar (linha ~141):
```typescript
    this.events.on('swap-fx', ({ x, y, isRaya }: { x: number; y: number; isRaya: boolean }) => {
      this._fx.swapBurst(x, y, isRaya)
    })
    this._spawnEnemies()
```

Substituir por:
```typescript
    this.events.on('swap-fx', ({ x, y, isRaya }: { x: number; y: number; isRaya: boolean }) => {
      this._fx.swapBurst(x, y, isRaya)
    })
    this._puAuraGfx = this.add.graphics()
    this._puAuraGfx.setDepth(5)
    this._spawnEnemies()
```

- [ ] **Step 3: Atualizar aura em `update()`**

Localizar o final de `update()` (linha ~1083-1090):
```typescript
    // Ghost trail no dash
    if (this.player.raya.getIsDashing()) {
      const now = this.time.now
      if (now - this._lastTrailAt >= 80) {
        this._fx.ghostTrail(this.player.raya)
        this._lastTrailAt = now
      }
    }
  }
```

Substituir por:
```typescript
    // Ghost trail no dash
    if (this.player.raya.getIsDashing()) {
      const now = this.time.now
      if (now - this._lastTrailAt >= 80) {
        this._fx.ghostTrail(this.player.raya)
        this._lastTrailAt = now
      }
    }

    // Aura de power-up ativo
    this._puAuraGfx.clear()
    if (gameState.hasAnyPowerUp(this.time.now)) {
      const puEntry = gameState.activePowerUp!
      const puColors: Record<string, number> = {
        petisco:   0xff8800,
        pipoca:    0xffff00,
        churrasco: 0xff4400,
      }
      const puColor = puColors[puEntry.type] ?? 0x00ccff
      const alpha = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(this.time.now * 0.005))
      this._puAuraGfx.lineStyle(2, puColor, alpha)
      this._puAuraGfx.strokeCircle(this.player.active.x, this.player.active.y, 28)
    }
  }
```

- [ ] **Step 4: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(game): aura pulsante ao redor do personagem com power-up ativo"
```

---

## Task 3: GameScene.ts — Checkpoint texto flutuante

**Files:**
- Modify: `src/scenes/GameScene.ts:896-902`

**Contexto:** O método `_handleItemCollect()` começa na linha 893. O case `'checkpoint'` (linhas 896-902) ativa o checkpoint com `gameState.setCheckpoint()`, toca som e dispara sparkle. O método `_spawnScorePopup(x, y, text, color)` já existe na linha 280 e chama `this._fx.scorePopupBounce()`.

- [ ] **Step 1: Adicionar popup no case 'checkpoint'**

Localizar (linhas 896-902):
```typescript
      case 'checkpoint':
        if (!gameState.checkpointReached) {
          gameState.setCheckpoint(item.x, item.y)
          SoundManager.play('checkpoint')
          this._fx.checkpointSparkle(item.x, item.y)
        }
        return // don't destroy
```

Substituir por:
```typescript
      case 'checkpoint':
        if (!gameState.checkpointReached) {
          gameState.setCheckpoint(item.x, item.y)
          SoundManager.play('checkpoint')
          this._fx.checkpointSparkle(item.x, item.y)
          this._spawnScorePopup(item.x, item.y - 32, '✅ checkpoint!', '#00ffcc')
        }
        return // don't destroy
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(game): texto flutuante ao ativar checkpoint"
```

---

## Task 4: LevelCompleteScene.ts — Score count animado

**Files:**
- Modify: `src/scenes/LevelCompleteScene.ts:154`

**Contexto:** A função `row()` (definida localmente em `create()` linha 146) cria um par label+valor estático. O painel de stats usa `panelX = cx - 140`, `panelW = 280`, `panelY = 238`. A linha do score (linha 154) é `row('Pontuação', \`${score}\`, panelY + 12, '#ffff88')`. O valor do painel fica em `panelX + panelW - 16` com `setOrigin(1, 0)`.

- [ ] **Step 1: Substituir score estático por animado**

Localizar (linha 154):
```typescript
    row('Pontuação',  `${score}`,          panelY + 12, '#ffff88')
```

Substituir por:
```typescript
    // Label estático (replica o padrão de row())
    this.add.text(panelX + 16, panelY + 12, 'Pontuação', { fontSize: '14px', color: '#888888' })
    // Valor animado
    const scoreValTxt = this.add.text(panelX + panelW - 16, panelY + 12, '0', {
      fontSize: '14px', color: '#ffff88', align: 'right',
    }).setOrigin(1, 0)
    this.tweens.addCounter({
      from: 0,
      to: score,
      duration: 1500,
      delay: 600,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        scoreValTxt.setText(Math.floor(tween.getValue()).toString())
      },
    })
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/LevelCompleteScene.ts
git commit -m "feat(level-complete): score count animado de 0 até o valor final"
```

---

## Task 5: GameOverScene.ts — Score count animado

**Files:**
- Modify: `src/scenes/GameOverScene.ts:90-92`

**Contexto:** As linhas 90-92 criam o score estático centralizado em `cx`, `y=186`, cor `#ffaa88`, bold. Precisamos guardar referência e animar via `tweens.addCounter`.

- [ ] **Step 1: Substituir score estático por animado**

Localizar (linhas 90-92):
```typescript
    this.add.text(cx, 186, `${gameState.score}`, {
      fontSize: '18px', color: '#ffaa88', fontStyle: 'bold',
    }).setOrigin(0.5)
```

Substituir por:
```typescript
    const scoreText = this.add.text(cx, 186, '0', {
      fontSize: '18px', color: '#ffaa88', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.tweens.addCounter({
      from: 0,
      to: gameState.score,
      duration: 1200,
      delay: 800,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        scoreText.setText(Math.floor(tween.getValue()).toString())
      },
    })
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameOverScene.ts
git commit -m "feat(game-over): score count animado de 0 até o valor final"
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

Esperado: todos os testes passando (sem regressões nos testes existentes de SWAP_COLORS e ItemMessages).

- [ ] **Step 3: Checklist de comportamento**

Verificar mentalmente:
- ✅ Ao tomar dano: flash vermelho 300ms → 6 piscadas de alpha (0.3↔1.0) em 900ms → alpha retorna a 1.0
- ✅ Com power-up ativo: círculo colorido pulsa ao redor do personagem ativo (petisco=laranja, pipoca=amarelo, churrasco=vermelho, outros=ciano)
- ✅ Aura desaparece quando power-up expira
- ✅ Level Complete: score conta de 0 até o valor final em 1500ms (delay 600ms)
- ✅ Game Over: score conta de 0 até o valor final em 1200ms (delay 800ms)
- ✅ Checkpoint: texto "✅ checkpoint!" em ciano flutua e some (apenas na primeira ativação)
- ✅ Nenhuma regressão nas demais mecânicas
