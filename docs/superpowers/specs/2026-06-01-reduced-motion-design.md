# Spec RM — Acessibilidade: Reduzir Movimento

**Data:** 2026-06-01
**Status:** Aprovado

**Goal:** Adicionar uma opção de acessibilidade "Reduzir movimento" que suprime os gatilhos de enjoo durante o gameplay — camera shake, partículas ambientais e loops decorativos pulsantes — preservando toda a informação visual.

---

## Contexto

O jogo acumulou muitas fontes de movimento: 10 chamadas de `camera.shake`, partículas ambientais contínuas (`AmbientFX`), e vários tweens decorativos infinitos (combo hint, glow de checkpoint, bob do ícone de stun). Não há opção de acessibilidade para reduzir movimento — um gatilho de enjoo/vestibular conhecido.

Escopo escolhido: **gameplay** (shake + AmbientFX + loops decorativos de gameplay). Pulsos de botão em menus/transições ficam de fora (baixo impacto, fundo estático, auxiliam descoberta).

Padrão de persistência: espelha `gameState.muted` — campo in-memory que sobrevive a `reset()`, sem novo storage.

---

## Seção 1 — Flag + persistência + toggle

### `gameState.reducedMotion`

Novo campo em `src/GameState.ts`:
```typescript
reducedMotion: boolean = false
```

**Excluído de `reset()`** (persiste entre partidas, como `muted`). Adicionar comentário análogo ao de `muted` no fim de `reset()`:
```typescript
// reducedMotion é uma preferência de acessibilidade — persiste entre partidas
```

### Toggle em `src/ui/SettingsOverlay.ts`

Segundo toggle abaixo do de música, mesmo estilo (verde ativado / vermelho desligado), com label:
- `♿  Reduzir movimento: ATIVADO` / `♿  Reduzir movimento: DESLIGADO`

O separador, título de controles e tabela de controles descem ~26px para abrir espaço para o novo toggle. O toggle alterna `gameState.reducedMotion` e atualiza seu próprio texto/cor (mesmo padrão do `_muteBtn`).

`show()` reatualiza o texto/cor do novo toggle além do de mute.

---

## Seção 2 — Helper `cameraShake` central

### Novo módulo `src/fx/cameraShake.ts`

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

### Substituir as 10 chamadas diretas

| Arquivo:linha | Antes | Depois |
|---|---|---|
| `src/scenes/BossIntro.ts:51` | `cam.shake(200, 0.003)` | `cameraShake(scene, 200, 0.003)` |
| `src/scenes/GameOverScene.ts:68` | `this.cameras.main.shake(300, 0.012)` | `cameraShake(this, 300, 0.012)` |
| `src/scenes/BossSetup.ts:75` | `scene.cameras.main.shake(200, 0.006)` | `cameraShake(scene, 200, 0.006)` |
| `src/scenes/BossSetup.ts:219` | `scene.cameras.main.shake(200, 0.006)` | `cameraShake(scene, 200, 0.006)` |
| `src/scenes/CollisionSetup.ts:145` | `scene.cameras.main.shake(150, 0.007)` | `cameraShake(scene, 150, 0.007)` |
| `src/entities/Player.ts:160` | `this.scene.cameras.main.shake(200, 0.01)` | `cameraShake(this.scene, 200, 0.01)` |
| `src/entities/enemies/Aspirador.ts:167` | `this.scene.cameras.main.shake(100, 0.005)` | `cameraShake(this.scene, 100, 0.005)` |
| `src/entities/enemies/ZeladorBoss.ts:102` | `this.scene.cameras.main.shake(80, 0.004)` | `cameraShake(this.scene, 80, 0.004)` |
| `src/entities/enemies/SegurancaMoto.ts:117` | `this.scene.cameras.main.shake(200, 0.008)` | `cameraShake(this.scene, 200, 0.008)` |
| `src/entities/enemies/SeuBigodes.ts:80` | `this.scene.cameras.main.shake(150, 0.008)` | `cameraShake(this.scene, 150, 0.008)` |

Cada arquivo importa `cameraShake` de seu caminho relativo a `src/fx/cameraShake`.

### Teste

`tests/cameraShake.test.ts`:
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

---

## Seção 3 — Gatear AmbientFX + loops decorativos

Princípio comum: **a informação visual é preservada** (anel, glow, ícone continuam visíveis); só o movimento decorativo (pulse/bob/partículas) é suprimido.

### 1. `src/fx/AmbientFX.ts` — sem partículas quando reduzido

No construtor, após `if (!cfg) return`:
```typescript
if (gameState.reducedMotion) return   // sem partículas ambientais
```
(import de `gameState` adicionado se necessário.)

### 2. `src/fx/EffectsManager.ts` — `comboWindowHint` anel estático

O anel é criado normalmente; o tween de pulse só roda se não reduzido:
```typescript
if (!gameState.reducedMotion) {
  this.scene.tweens.add({ /* pulse existente */ })
}
```
O tracker `preupdate` e o retorno do Graphics permanecem inalterados.

### 3. `src/fx/EffectsManager.ts` — `checkpointActivatedGlow` tint sem pulse

```typescript
sprite.setTint(0x66ffdd)
if (gameState.reducedMotion) return   // tint fixo, sem pulse de alpha
this.scene.tweens.add({ /* pulse existente */ })
```

### 4. `src/entities/Enemy.ts` — `stun` ícone sem bob

O `bobTween` só é criado se não reduzido; o cleanup usa optional chaining:
```typescript
const bobTween = gameState.reducedMotion
  ? null
  : this.scene.tweens.add({ /* bob existente */ })
// no delayedCall de cleanup:
bobTween?.stop()
```
O ícone 😵 continua aparecendo e seguindo o inimigo (tracker da B1).

`EffectsManager.ts` e `Enemy.ts` importam `gameState` se ainda não importam.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/GameState.ts` | Campo `reducedMotion` + comentário em `reset()` |
| `src/ui/SettingsOverlay.ts` | Segundo toggle + reposicionar controles |
| `src/fx/cameraShake.ts` | **Criar** — `shouldShake` + `cameraShake` |
| `tests/cameraShake.test.ts` | **Criar** — testes de `shouldShake` |
| `src/scenes/BossIntro.ts` | Usar `cameraShake` |
| `src/scenes/GameOverScene.ts` | Usar `cameraShake` |
| `src/scenes/BossSetup.ts` | Usar `cameraShake` (2 sites) |
| `src/scenes/CollisionSetup.ts` | Usar `cameraShake` |
| `src/entities/Player.ts` | Usar `cameraShake` |
| `src/entities/enemies/Aspirador.ts` | Usar `cameraShake` |
| `src/entities/enemies/ZeladorBoss.ts` | Usar `cameraShake` |
| `src/entities/enemies/SegurancaMoto.ts` | Usar `cameraShake` |
| `src/entities/enemies/SeuBigodes.ts` | Usar `cameraShake` |
| `src/fx/AmbientFX.ts` | Gate de partículas |
| `src/fx/EffectsManager.ts` | Gate de pulse em comboWindowHint + checkpointActivatedGlow |
| `src/entities/Enemy.ts` | Gate de bob no stun |

---

## Estratégia de Teste

- `tests/cameraShake.test.ts`: `shouldShake` nos 2 casos.
- Build TypeScript sem erros.
- Suite existente continua passando (gates são supressões condicionais; sem mudança de lógica de gameplay).

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Pulsos de botão em menus/transições (~20 sites) | Baixo impacto de enjoo, fundo estático, auxiliam descoberta — Opção B descartada |
| Animações de sprite (Raya/Cruella/inimigos) | São feedback de estado, não movimento decorativo |
| Parallax / scroll de câmera | Essencial ao gameplay |
| Persistir `reducedMotion` em localStorage | Espelha `muted` (sessão); persistência cross-sessão é melhoria separada |
| Sliders de volume SFX/música (G2) | Spec separada |
