# Reduced Motion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar opção de acessibilidade "Reduzir movimento" que suprime camera shake, partículas ambientais e loops decorativos pulsantes, preservando toda informação visual.

**Architecture:** Flag `gameState.reducedMotion` (espelha `muted`). Helper `cameraShake()` central gateia as 10 chamadas de shake. Gates condicionais em AmbientFX (sem partículas), EffectsManager (combo hint/checkpoint glow sem pulse) e Enemy.stun (ícone sem bob). Toda informação visual preservada — só o movimento decorativo some.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## Estrutura de arquivos

| Arquivo | Mudança |
|---|---|
| `src/fx/cameraShake.ts` | **Criar** — `shouldShake` + `cameraShake` |
| `tests/cameraShake.test.ts` | **Criar** — testes de `shouldShake` |
| `src/GameState.ts` | Campo `reducedMotion` |
| `src/ui/SettingsOverlay.ts` | Segundo toggle |
| 6 arquivos com shake (BossIntro, GameOverScene, BossSetup, CollisionSetup, Player, 4 enemies) | Usar `cameraShake` |
| `src/fx/AmbientFX.ts`, `src/fx/EffectsManager.ts`, `src/entities/Enemy.ts` | Gates de FX |

---

## Task 1: Flag reducedMotion + helper cameraShake (TDD)

**Files:**
- Modify: `src/GameState.ts`
- Create: `src/fx/cameraShake.ts`
- Create: `tests/cameraShake.test.ts`

- [ ] **Step 1: Adicionar campo em `src/GameState.ts`**

Localizar `muted: boolean = false` (linha ~26) e adicionar logo após:

```typescript
  muted: boolean = false
  reducedMotion: boolean = false
```

No fim de `reset()`, após o comentário de `muted`, adicionar:

```typescript
    // muted é uma preferência de UI — persiste intencionalmente entre partidas
    // reducedMotion é uma preferência de acessibilidade — persiste entre partidas
```

(Ambos os campos NÃO são reatribuídos em `reset()` — persistem.)

- [ ] **Step 2: Escrever o teste que falha**

Criar `tests/cameraShake.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { shouldShake } from '../src/fx/cameraShake'

describe('shouldShake', () => {
  it('permite shake quando movimento normal', () => {
    expect(shouldShake(false)).toBe(true)
  })
  it('bloqueia shake quando reduzir movimento ativo', () => {
    expect(shouldShake(true)).toBe(false)
  })
})
```

- [ ] **Step 3: Rodar o teste para verificar que falha**

```bash
npx vitest run tests/cameraShake.test.ts
```

Esperado: FAIL — `Cannot find module '../src/fx/cameraShake'`

- [ ] **Step 4: Criar `src/fx/cameraShake.ts`**

```typescript
import Phaser from 'phaser'
import { gameState } from '../GameState'

/** Decide se o shake deve ocorrer (pura, testável). */
export function shouldShake(reducedMotion: boolean): boolean {
  return !reducedMotion
}

/** Aplica camera shake, respeitando a preferência de reduzir movimento. */
export function cameraShake(scene: Phaser.Scene, duration: number, intensity: number): void {
  if (!shouldShake(gameState.reducedMotion)) return
  scene.cameras.main.shake(duration, intensity)
}
```

- [ ] **Step 5: Rodar o teste para verificar que passa**

```bash
npx vitest run tests/cameraShake.test.ts
```

Esperado: `2 passed`

- [ ] **Step 6: Build + commit**

```bash
npm run build 2>&1 | grep "error TS" | head -5
git add src/GameState.ts src/fx/cameraShake.ts tests/cameraShake.test.ts
git commit -m "feat: add reducedMotion flag + cameraShake helper"
```

---

## Task 2: Substituir as 10 chamadas de shake por cameraShake

**Files:**
- Modify: `src/scenes/BossIntro.ts`, `src/scenes/GameOverScene.ts`, `src/scenes/BossSetup.ts`, `src/scenes/CollisionSetup.ts`, `src/entities/Player.ts`, `src/entities/enemies/Aspirador.ts`, `src/entities/enemies/ZeladorBoss.ts`, `src/entities/enemies/SegurancaMoto.ts`, `src/entities/enemies/SeuBigodes.ts`

> Contexto: cada site importa `cameraShake`. Caminho relativo: de `src/scenes/` é `../fx/cameraShake`; de `src/entities/` é `../fx/cameraShake`; de `src/entities/enemies/` é `../../fx/cameraShake`.

- [ ] **Step 1: `src/scenes/BossIntro.ts`**

Adicionar import (após imports existentes):
```typescript
import { cameraShake } from '../fx/cameraShake'
```
Substituir `cam.shake(200, 0.003)` por:
```typescript
cameraShake(scene, 200, 0.003)
```

- [ ] **Step 2: `src/scenes/GameOverScene.ts`**

Adicionar import:
```typescript
import { cameraShake } from '../fx/cameraShake'
```
Substituir `this.cameras.main.shake(300, 0.012)` por:
```typescript
cameraShake(this, 300, 0.012)
```

- [ ] **Step 3: `src/scenes/BossSetup.ts` (2 sites)**

Adicionar import:
```typescript
import { cameraShake } from '../fx/cameraShake'
```
Substituir ambas as ocorrências de `scene.cameras.main.shake(200, 0.006)` por:
```typescript
cameraShake(scene, 200, 0.006)
```

- [ ] **Step 4: `src/scenes/CollisionSetup.ts`**

Adicionar import:
```typescript
import { cameraShake } from '../fx/cameraShake'
```
Substituir `scene.cameras.main.shake(150, 0.007)` por:
```typescript
cameraShake(scene, 150, 0.007)
```

- [ ] **Step 5: `src/entities/Player.ts`**

Adicionar import:
```typescript
import { cameraShake } from '../fx/cameraShake'
```
Substituir `this.scene.cameras.main.shake(200, 0.01)` por:
```typescript
cameraShake(this.scene, 200, 0.01)
```

- [ ] **Step 6: 4 inimigos**

Em cada arquivo adicionar import `import { cameraShake } from '../../fx/cameraShake'` e substituir:
- `src/entities/enemies/Aspirador.ts`: `this.scene.cameras.main.shake(100, 0.005)` → `cameraShake(this.scene, 100, 0.005)`
- `src/entities/enemies/ZeladorBoss.ts`: `this.scene.cameras.main.shake(80, 0.004)` → `cameraShake(this.scene, 80, 0.004)`
- `src/entities/enemies/SegurancaMoto.ts`: `this.scene.cameras.main.shake(200, 0.008)` → `cameraShake(this.scene, 200, 0.008)`
- `src/entities/enemies/SeuBigodes.ts`: `this.scene.cameras.main.shake(150, 0.008)` → `cameraShake(this.scene, 150, 0.008)`

- [ ] **Step 7: Verificar que não restam chamadas diretas**

```bash
grep -rn "cameras.main.shake" src/ | grep -v test
```

Esperado: nenhuma saída (todas migradas).

- [ ] **Step 8: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -5
npx vitest run 2>&1 | tail -3
```

Esperado: 0 erros TS, todos os testes passando.

- [ ] **Step 9: Commit**

```bash
git add src/scenes/BossIntro.ts src/scenes/GameOverScene.ts src/scenes/BossSetup.ts src/scenes/CollisionSetup.ts src/entities/Player.ts src/entities/enemies/Aspirador.ts src/entities/enemies/ZeladorBoss.ts src/entities/enemies/SegurancaMoto.ts src/entities/enemies/SeuBigodes.ts
git commit -m "refactor: route all camera shake through reducedMotion-aware helper"
```

---

## Task 3: Gates de FX (AmbientFX, EffectsManager, Enemy.stun)

**Files:**
- Modify: `src/fx/AmbientFX.ts`, `src/fx/EffectsManager.ts`, `src/entities/Enemy.ts`

> Contexto: nenhum desses 3 arquivos importa `gameState` ainda — adicionar o import em cada. Os gates preservam a informação visual; só suprimem movimento.

- [ ] **Step 1: `src/fx/AmbientFX.ts` — sem partículas quando reduzido**

Verificar imports no topo; adicionar se ausente:
```typescript
import { gameState } from '../GameState'
```

No construtor, localizar:
```typescript
  constructor(private scene: Phaser.Scene, theme: BackgroundTheme) {
    const cfg = getAmbientConfig(theme)
    if (!cfg) return

    this._timer = scene.time.addEvent({
```
Adicionar o gate entre `if (!cfg) return` e `this._timer`:
```typescript
    const cfg = getAmbientConfig(theme)
    if (!cfg) return
    if (gameState.reducedMotion) return   // sem partículas ambientais

    this._timer = scene.time.addEvent({
```

- [ ] **Step 2: `src/fx/EffectsManager.ts` — adicionar import de gameState**

No topo (linha 1 atual: `import { KEYS, GAME_WIDTH, SWAP_COLORS } from '../constants'`), adicionar abaixo:
```typescript
import { gameState } from '../GameState'
```

- [ ] **Step 3: `src/fx/EffectsManager.ts` — `checkpointActivatedGlow` tint sem pulse**

Localizar (linhas ~118-128):
```typescript
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
Substituir por:
```typescript
  checkpointActivatedGlow(sprite: Phaser.GameObjects.Image): void {
    sprite.setTint(0x66ffdd)
    if (gameState.reducedMotion) return   // tint fixo, sem pulse de alpha
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

- [ ] **Step 4: `src/fx/EffectsManager.ts` — `comboWindowHint` anel estático**

Localizar o bloco de pulse (linhas ~166-178):
```typescript
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
```
Substituir por (envolver o tween num gate; manter o anel visível com alpha estável quando reduzido):
```typescript
    // Pulse: escala 0.8 ↔ 1.2 + alpha 0.4 ↔ 0.9
    gfx.setScale(1)
    gfx.setAlpha(0.9)
    if (!gameState.reducedMotion) {
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
    }
```

> Quando reduzido, o anel fica em escala 1 / alpha 0.9 (visível e estável). Sem reduzir, mantém o comportamento atual (começa em 0.8/0.4 e pulsa).

- [ ] **Step 5: `src/entities/Enemy.ts` — import de gameState**

No topo (após `import type { WorldDifficulty } from '../constants'`), adicionar:
```typescript
import { gameState } from '../GameState'
```

- [ ] **Step 6: `src/entities/Enemy.ts` — `stun` ícone sem bob**

Localizar (linhas ~55-61):
```typescript
    const bobTween = this.scene.tweens.add({
      targets: stunIcon,
      y: stunIcon.y - 12,
      duration: 400,
      yoyo: true,
      repeat: -1,
    })
```
Substituir por:
```typescript
    const bobTween = gameState.reducedMotion
      ? null
      : this.scene.tweens.add({
          targets: stunIcon,
          y: stunIcon.y - 12,
          duration: 400,
          yoyo: true,
          repeat: -1,
        })
```

Em seguida, localizar no `delayedCall` de cleanup a chamada `bobTween.stop()` e trocar por optional chaining:
```typescript
      bobTween?.stop()
```

- [ ] **Step 7: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -5
npx vitest run 2>&1 | tail -3
```

Esperado: 0 erros TS, todos os testes passando.

- [ ] **Step 8: Commit**

```bash
git add src/fx/AmbientFX.ts src/fx/EffectsManager.ts src/entities/Enemy.ts
git commit -m "feat: gate ambient particles + decorative pulses behind reducedMotion"
```

---

## Task 4: Toggle de Reduzir Movimento em SettingsOverlay

**Files:**
- Modify: `src/ui/SettingsOverlay.ts`

> Contexto: O overlay tem o `_muteBtn` em `py + 62`, separador em `py + 100`, título de controles em `py + 112`, e a tabela de controles em `py + 130 + i*20`. Adicionamos um segundo toggle em `py + 86` e descemos separador/controles em 26px para abrir espaço. O painel tem altura `h = 320`; com 6 linhas de controle terminando em ~py+230, há folga para descer 26px.

- [ ] **Step 1: Adicionar campo `_reduceBtn` e helpers**

No topo da classe, junto de `private _muteBtn`, adicionar:
```typescript
  private _reduceBtn: Phaser.GameObjects.Text
```

Adicionar dois métodos auxiliares (junto de `_muteLabel`/`_muteColor`):
```typescript
  private _reduceLabel(): string {
    return gameState.reducedMotion ? '♿  Reduzir movimento: ATIVADO' : '♿  Reduzir movimento: DESLIGADO'
  }

  private _reduceColor(): string {
    return gameState.reducedMotion ? '#88ffaa' : '#888888'
  }
```

- [ ] **Step 2: Criar o toggle no construtor**

Após o bloco que cria/configura `this._muteBtn` (termina no `})` do listener de pointerdown, ~linha 35), adicionar:
```typescript
    // 3b. Reduce-motion toggle
    this._reduceBtn = scene.add.text(px + 20, py + 86, this._reduceLabel(), {
      fontSize: '15px', color: this._reduceColor(),
    }).setInteractive({ useHandCursor: true })
    this._reduceBtn.on('pointerdown', () => {
      gameState.reducedMotion = !gameState.reducedMotion
      this._reduceBtn.setText(this._reduceLabel())
      this._reduceBtn.setColor(this._reduceColor())
    })
```

- [ ] **Step 3: Descer separador, título e controles em 26px**

Ajustar as posições Y para abrir espaço ao novo toggle:
- Separador (linha ~40): `sep.lineBetween(px + 20, py + 126, cx + w / 2 - 20, py + 126)` (era `py + 100`)
- Título de controles (linha ~43): `scene.add.text(px + 20, py + 138, 'CONTROLES', ...)` (era `py + 112`)
- Tabela de controles (linha ~57): `scene.add.text(px + 20, py + 156 + i * 20, line, ...)` (era `py + 130`)

- [ ] **Step 4: Incluir `_reduceBtn` no container**

Localizar o array do container:
```typescript
    this._container = scene.add.container(0, 0, [
      bg, title, this._muteBtn, sep, ctrlTitle, ...ctrlTexts, closeBtn,
    ])
```
Adicionar `this._reduceBtn`:
```typescript
    this._container = scene.add.container(0, 0, [
      bg, title, this._muteBtn, this._reduceBtn, sep, ctrlTitle, ...ctrlTexts, closeBtn,
    ])
```

- [ ] **Step 5: Atualizar o toggle em `show()`**

Localizar `show()`:
```typescript
  show(): void {
    this._muteBtn.setText(this._muteLabel())
    this._muteBtn.setColor(this._muteColor())
    this._container.setVisible(true)
  }
```
Substituir por:
```typescript
  show(): void {
    this._muteBtn.setText(this._muteLabel())
    this._muteBtn.setColor(this._muteColor())
    this._reduceBtn.setText(this._reduceLabel())
    this._reduceBtn.setColor(this._reduceColor())
    this._container.setVisible(true)
  }
```

- [ ] **Step 6: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -5
npx vitest run 2>&1 | tail -3
```

Esperado: 0 erros TS, todos os testes passando.

- [ ] **Step 7: Commit**

```bash
git add src/ui/SettingsOverlay.ts
git commit -m "feat: add reduce-motion toggle to settings overlay"
```
