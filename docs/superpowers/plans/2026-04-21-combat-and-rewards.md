# Combat + Rewards System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar combate direto (bark mata inimigos com 1 HP, dash exibe KO + barra de HP) e uma loja de upgrades permanentes financiada por golden bones.

**Architecture:** Edições cirúrgicas em arquivos existentes. `Enemy` ganha `maxHp` público. `PHYSICS` vira objeto mutável com `DASH_COOLDOWN`. `GameState` ganha `maxHearts`. `ProfileManager` ganha CRUD de upgrades. `GameScene` implementa lógica kill/stun e `_applyUpgrades()`. `WorldMapScene` ganha overlay de loja. Novo arquivo `EnemyHPBar` encapsula a barra gráfica.

**Tech Stack:** TypeScript, Phaser 3.87 Arcade Physics, Vitest

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/entities/Enemy.ts` | Modificar | `hp` público; `readonly maxHp` |
| `src/constants.ts` | Modificar | Remove `as const` de PHYSICS; adiciona `DASH_COOLDOWN: 800` |
| `src/entities/Raya.ts` | Modificar | Usa `PHYSICS.DASH_COOLDOWN` no lugar do literal `800` |
| `src/GameState.ts` | Modificar | `maxHearts`; `restoreHeart()`, `swap()`, reset methods |
| `src/storage/ProfileManager.ts` | Modificar | Campo `upgrades` em `PlayerProfile`; `UPGRADE_COSTS`; 5 métodos novos |
| `src/fx/EnemyHPBar.ts` | Criar | Barra de HP animada sobre inimigos |
| `src/scenes/GameScene.ts` | Modificar | Bark kill/stun; dash KO; `_applyUpgrades()`; `_activateBoneRadar()` |
| `src/scenes/WorldMapScene.ts` | Modificar | Botão upgrades + `_renderUpgradePanel()` |
| `tests/GameState.test.ts` | Modificar | Testes para `maxHearts` |
| `tests/ProfileManager.test.ts` | Modificar | Testes para métodos de upgrade |

---

### Task 1: Enemy — hp público + maxHp

**Files:**
- Modify: `src/entities/Enemy.ts:5-22`

- [ ] **Step 1: Escrever teste que falha**

Criar `tests/Enemy.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

// Enemy é abstract — testamos via subclasse mínima
class TestEnemy {
  public hp: number
  public readonly maxHp: number
  constructor(hp: number) {
    this.maxHp = hp
    this.hp = hp
  }
}

describe('Enemy maxHp', () => {
  it('maxHp é igual ao hp inicial', () => {
    const e = new TestEnemy(3)
    expect(e.maxHp).toBe(3)
    expect(e.hp).toBe(3)
  })

  it('hp pode ser reduzido mas maxHp permanece', () => {
    const e = new TestEnemy(3)
    e.hp -= 1
    expect(e.hp).toBe(2)
    expect(e.maxHp).toBe(3)
  })
})
```

Run: `npm test -- tests/Enemy.test.ts 2>&1 | tail -5`
Expected: 2 passing (o teste usa uma classe local, não Enemy real — mas confirma o contrato)

- [ ] **Step 2: Modificar `src/entities/Enemy.ts`**

Localizar e substituir:

```typescript
// ANTES (linhas 5-6):
  readonly isNPC: boolean = false
  protected hp: number

// DEPOIS:
  readonly isNPC: boolean = false
  public hp: number
  public readonly maxHp: number
```

Localizar e substituir no construtor (linha 22):

```typescript
// ANTES:
    this.hp = hp

// DEPOIS:
    this.maxHp = hp
    this.hp = hp
```

- [ ] **Step 3: Rodar testes**

```bash
npm test
```
Expected: 124 passing (+ 2 do novo arquivo Enemy.test.ts = 126), 0 failing.

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: sem erros TypeScript.

- [ ] **Step 5: Commit**

```bash
git add src/entities/Enemy.ts tests/Enemy.test.ts
git commit -m "feat: add public maxHp to Enemy, make hp public"
```

---

### Task 2: constants + Raya + GameState — PHYSICS mutável, DASH_COOLDOWN, SWAP_COOLDOWN

**Files:**
- Modify: `src/constants.ts:141-152`
- Modify: `src/entities/Raya.ts:2,93,110`
- Modify: `src/GameState.ts:1,39`

- [ ] **Step 1: Modificar `src/constants.ts` — remover `as const` de PHYSICS e adicionar DASH_COOLDOWN**

Localizar o bloco PHYSICS (linha 141) e substituir:

```typescript
// ANTES:
export const PHYSICS = {
  GRAVITY: 800,
  RAYA_SPEED: 240,
  CRUELLA_SPEED: 200,
  JUMP_VELOCITY: -450,
  DASH_VELOCITY: 600,
  DASH_DURATION: 200,
  BARK_RADIUS: 120,
  SWAP_COOLDOWN: 1500,
  SWAP_BLOCK_AFTER_HIT: 2000,
  COLLAR_GOLD_SPEED_BONUS: 60,
} as const

// DEPOIS:
export const PHYSICS = {
  GRAVITY: 800,
  RAYA_SPEED: 240,
  CRUELLA_SPEED: 200,
  JUMP_VELOCITY: -450,
  DASH_VELOCITY: 600,
  DASH_DURATION: 200,
  DASH_COOLDOWN: 800,
  BARK_RADIUS: 120,
  SWAP_COOLDOWN: 1500,
  SWAP_BLOCK_AFTER_HIT: 2000,
  COLLAR_GOLD_SPEED_BONUS: 60,
}
```

- [ ] **Step 2: Modificar `src/entities/Raya.ts` — usar PHYSICS.DASH_COOLDOWN**

Linha 93 — substituir:

```typescript
// ANTES:
    gameState.abilityCooldownMs = 800

// DEPOIS:
    gameState.abilityCooldownMs = PHYSICS.DASH_COOLDOWN
```

Linha 110 — substituir:

```typescript
// ANTES:
    this.scene.time.delayedCall(800, () => {

// DEPOIS:
    this.scene.time.delayedCall(PHYSICS.DASH_COOLDOWN, () => {
```

- [ ] **Step 3: Modificar `src/GameState.ts` — import PHYSICS, usar em swap()**

Adicionar import no topo (linha 1, antes de `export type DogType`):

```typescript
import { PHYSICS } from './constants'
```

Linha 39 em `swap()` — substituir:

```typescript
// ANTES:
    this.swapBlockedUntil = now + 1500

// DEPOIS:
    this.swapBlockedUntil = now + PHYSICS.SWAP_COOLDOWN
```

- [ ] **Step 4: Rodar testes**

```bash
npm test
```
Expected: 126 passing, 0 failing.
(O teste `troca de cachorra e define cooldown` verifica `canSwap(1500) === true` com `now=0`. `PHYSICS.SWAP_COOLDOWN` padrão é 1500, portanto `swapBlockedUntil = 1500` e `canSwap(1500)` retorna `true` — continua passando.)

- [ ] **Step 5: Build**

```bash
npm run build
```
Expected: sem erros TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/constants.ts src/entities/Raya.ts src/GameState.ts
git commit -m "feat: make PHYSICS mutable, add DASH_COOLDOWN, use PHYSICS.SWAP_COOLDOWN in swap()"
```

---

### Task 3: GameState — maxHearts

**Files:**
- Modify: `src/GameState.ts:10,98-100,112-113,133-134,142-143`
- Modify: `tests/GameState.test.ts`

- [ ] **Step 1: Escrever testes que falham**

Adicionar ao final do bloco `describe('GameState', ...)` em `tests/GameState.test.ts`, antes do último `})`:

```typescript
  it('maxHearts começa em 3', () => {
    expect(state.maxHearts).toBe(3)
  })

  it('restoreHeart usa maxHearts como limite', () => {
    state.maxHearts = 4
    state.hearts = 3
    state.restoreHeart()
    expect(state.hearts).toBe(4)
    state.restoreHeart()
    expect(state.hearts).toBe(4)  // não ultrapassa maxHearts
  })

  it('reset restaura maxHearts para 3', () => {
    state.maxHearts = 4
    state.reset()
    expect(state.maxHearts).toBe(3)
    expect(state.hearts).toBe(3)
  })

  it('resetAtCheckpoint restaura hearts para maxHearts', () => {
    state.maxHearts = 4
    state.hearts = 1
    state.resetAtCheckpoint()
    expect(state.hearts).toBe(4)
  })

  it('resetLevel restaura hearts para maxHearts', () => {
    state.maxHearts = 4
    state.hearts = 0
    state.resetLevel()
    expect(state.hearts).toBe(4)
  })
```

Run: `npm test -- tests/GameState.test.ts 2>&1 | tail -10`
Expected: FAIL — `state.maxHearts` não existe.

- [ ] **Step 2: Adicionar `maxHearts` ao `src/GameState.ts`**

Linha 10, após `hearts: number = 3` — adicionar:

```typescript
  hearts: number = 3
  maxHearts: number = 3
```

- [ ] **Step 3: Atualizar `restoreHeart()` em `src/GameState.ts`**

```typescript
// ANTES:
  restoreHeart(): void {
    if (this.hearts < 3) this.hearts++
  }

// DEPOIS:
  restoreHeart(): void {
    if (this.hearts < this.maxHearts) this.hearts++
  }
```

- [ ] **Step 4: Atualizar `reset()` em `src/GameState.ts`**

Dentro de `reset()`, após `this.hearts = 3` — adicionar:

```typescript
    this.hearts = 3
    this.maxHearts = 3
```

- [ ] **Step 5: Atualizar `resetAtCheckpoint()` e `resetLevel()` em `src/GameState.ts`**

Em `resetAtCheckpoint()`:
```typescript
// ANTES:
    this.hearts = 3

// DEPOIS:
    this.hearts = this.maxHearts
```

Em `resetLevel()`:
```typescript
// ANTES:
    this.hearts = 3

// DEPOIS:
    this.hearts = this.maxHearts
```

- [ ] **Step 6: Rodar testes**

```bash
npm test
```
Expected: 131 passing, 0 failing.

- [ ] **Step 7: Build**

```bash
npm run build
```
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/GameState.ts tests/GameState.test.ts
git commit -m "feat: add maxHearts to GameState, restoreHeart respects cap"
```

---

### Task 4: ProfileManager — sistema de upgrades

**Files:**
- Modify: `src/storage/ProfileManager.ts:16-26,28-33,60-82`
- Modify: `tests/ProfileManager.test.ts`

- [ ] **Step 1: Escrever testes que falham**

Adicionar novo `describe` ao final de `tests/ProfileManager.test.ts`:

```typescript
describe('ProfileManager upgrades', () => {
  let pm: ProfileManager

  beforeEach(() => {
    localStorageMock.clear()
    pm = new ProfileManager()
  })

  it('hasUpgrade retorna false se não comprado', () => {
    pm.create('Hugo', 'raya')
    expect(pm.hasUpgrade('heart_plus')).toBe(false)
  })

  it('saveUpgrade persiste e hasUpgrade retorna true', () => {
    pm.create('Hugo', 'raya')
    pm.saveUpgrade('heart_plus')
    expect(pm.hasUpgrade('heart_plus')).toBe(true)
  })

  it('hasUpgrade retorna false sem perfil ativo', () => {
    expect(pm.hasUpgrade('dash_fast')).toBe(false)
  })

  it('getTotalGoldenBones soma bones coletados em todos os níveis', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'gold', bestScore: 100, bestTime: 60,
      goldenBones: [true, true, false], totalDeaths: 0, totalEnemiesKilled: 0, playCount: 1,
    })
    pm.saveLevel('0-1', {
      completed: true, medal: 'bronze', bestScore: 50, bestTime: 90,
      goldenBones: [true, false, false], totalDeaths: 0, totalEnemiesKilled: 0, playCount: 1,
    })
    expect(pm.getTotalGoldenBones()).toBe(3)  // 2 + 1
  })

  it('getTotalGoldenBones retorna 0 sem perfil', () => {
    expect(pm.getTotalGoldenBones()).toBe(0)
  })

  it('getSpentBones soma custos dos upgrades comprados', () => {
    pm.create('Hugo', 'raya')
    pm.saveUpgrade('heart_plus')  // custo 8
    pm.saveUpgrade('dash_fast')   // custo 6
    expect(pm.getSpentBones()).toBe(14)
  })

  it('getSpentBones retorna 0 sem upgrades comprados', () => {
    pm.create('Hugo', 'raya')
    expect(pm.getSpentBones()).toBe(0)
  })

  it('getAvailableBones = total - spent', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'gold', bestScore: 100, bestTime: 60,
      goldenBones: [true, true, true], totalDeaths: 0, totalEnemiesKilled: 0, playCount: 1,
    })
    // 3 bones coletados, nenhum gasto → 3 disponíveis
    expect(pm.getAvailableBones()).toBe(3)
    pm.saveUpgrade('swap_fast')  // custo 5
    expect(pm.getAvailableBones()).toBe(-2)
  })

  it('novo perfil inicializa upgrades como objeto vazio', () => {
    const p = pm.create('Hugo', 'raya')
    expect(p.upgrades).toEqual({})
  })
})
```

Run: `npm test -- tests/ProfileManager.test.ts 2>&1 | tail -10`
Expected: FAIL — `pm.hasUpgrade`, `pm.saveUpgrade`, etc. não existem.

- [ ] **Step 2: Adicionar `upgrades` ao `PlayerProfile` em `src/storage/ProfileManager.ts`**

```typescript
// ANTES (interface PlayerProfile):
export interface PlayerProfile {
  id: string
  name: string
  dog: DogType
  createdAt: number
  lastPlayedAt: number
  currentLevel: string
  totalScore: number
  levels: Record<string, LevelRecord>
  version?: number
}

// DEPOIS:
export interface PlayerProfile {
  id: string
  name: string
  dog: DogType
  createdAt: number
  lastPlayedAt: number
  currentLevel: string
  totalScore: number
  levels: Record<string, LevelRecord>
  upgrades: Record<string, boolean>
  version?: number
}
```

- [ ] **Step 3: Adicionar `UPGRADE_COSTS` em `src/storage/ProfileManager.ts`**

Após a linha `const SAVE_VERSION = 2`, adicionar:

```typescript
const UPGRADE_COSTS: Record<string, number> = {
  heart_plus: 8,
  dash_fast:  6,
  bark_wide:  6,
  swap_fast:  5,
  bone_radar: 7,
}
```

- [ ] **Step 4: Atualizar `create()` para inicializar `upgrades: {}`**

Em `src/storage/ProfileManager.ts`, dentro de `create()`, no objeto literal `profile`:

```typescript
// ANTES:
    const profile: PlayerProfile = {
      id: Date.now().toString(),
      name: name.trim() || 'Jogador',
      dog,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      currentLevel: DEFAULT_LEVEL,
      totalScore: 0,
      levels: {},
      version: SAVE_VERSION,
    }

// DEPOIS:
    const profile: PlayerProfile = {
      id: Date.now().toString(),
      name: name.trim() || 'Jogador',
      dog,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      currentLevel: DEFAULT_LEVEL,
      totalScore: 0,
      levels: {},
      upgrades: {},
      version: SAVE_VERSION,
    }
```

- [ ] **Step 5: Adicionar os 5 novos métodos em `ProfileManager`**

Adicionar após o método `getMedal()` e antes do comentário `// ── Cálculo de medalha`:

```typescript
  // ── Upgrades ─────────────────────────────────────────────────────────

  saveUpgrade(key: string): void {
    const all    = this.getAll()
    const active = localStorage.getItem(ACTIVE_KEY)
    if (!active) return
    const idx = all.findIndex(p => p.id === active)
    if (idx === -1) return
    if (!all[idx].upgrades) all[idx].upgrades = {}
    all[idx].upgrades[key] = true
    this._persist(all)
  }

  hasUpgrade(key: string): boolean {
    return this.getActive()?.upgrades?.[key] ?? false
  }

  getTotalGoldenBones(): number {
    const profile = this.getActive()
    if (!profile) return 0
    return Object.values(profile.levels).reduce((sum, lvl) => {
      return sum + (lvl.goldenBones ?? []).filter(Boolean).length
    }, 0)
  }

  getSpentBones(): number {
    const profile = this.getActive()
    if (!profile) return 0
    return Object.keys(profile.upgrades ?? {})
      .filter(k => profile.upgrades[k])
      .reduce((sum, k) => sum + (UPGRADE_COSTS[k] ?? 0), 0)
  }

  getAvailableBones(): number {
    return this.getTotalGoldenBones() - this.getSpentBones()
  }
```

- [ ] **Step 6: Rodar testes**

```bash
npm test
```
Expected: 140 passing, 0 failing.

- [ ] **Step 7: Build**

```bash
npm run build
```
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/storage/ProfileManager.ts tests/ProfileManager.test.ts
git commit -m "feat: add upgrade system to ProfileManager (saveUpgrade, hasUpgrade, bones calc)"
```

---

### Task 5: EnemyHPBar — barra de HP animada

**Files:**
- Create: `src/fx/EnemyHPBar.ts`

- [ ] **Step 1: Criar `src/fx/EnemyHPBar.ts`**

```typescript
import Phaser from 'phaser'
import { Enemy } from '../entities/Enemy'

export class EnemyHPBar {
  private bar: Phaser.GameObjects.Graphics
  private scene: Phaser.Scene
  private fadeTimer: Phaser.Time.TimerEvent | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.bar = scene.add.graphics().setDepth(20)
  }

  show(enemy: Enemy): void {
    // Cancela fade anterior se existir
    this.fadeTimer?.remove()
    this.bar.clear()
    this.bar.setAlpha(1)

    const W = 20, H = 3
    const x = enemy.x - W / 2
    const y = enemy.y - enemy.displayHeight / 2 - 6

    // Fundo cinza
    this.bar.fillStyle(0x333333)
    this.bar.fillRect(x, y, W, H)

    // Barra de HP proporcional: verde > 50%, laranja > 25%, vermelho ≤ 25%
    const ratio = Math.max(0, enemy.hp / enemy.maxHp)
    const color = ratio > 0.5 ? 0x44dd44 : ratio > 0.25 ? 0xffaa00 : 0xff3333
    this.bar.fillStyle(color)
    this.bar.fillRect(x, y, W * ratio, H)

    // Fade após 2500ms
    this.fadeTimer = this.scene.time.delayedCall(2500, () => {
      this.scene.tweens.add({
        targets: this.bar,
        alpha: 0,
        duration: 300,
        onComplete: () => this.bar.clear(),
      })
    })
  }

  destroy(): void {
    this.fadeTimer?.remove()
    this.bar.destroy()
  }
}
```

- [ ] **Step 2: Rodar testes**

```bash
npm test
```
Expected: 140 passing, 0 failing. (EnemyHPBar não tem testes unitários — Phaser-dependente; verificado via build.)

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: sem erros TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/fx/EnemyHPBar.ts
git commit -m "feat: add EnemyHPBar class with fade animation"
```

---

### Task 6: GameScene — bark kill/stun + dash KO + HP bar

**Files:**
- Modify: `src/scenes/GameScene.ts:1-37,39-64,68-,721-804`

- [ ] **Step 1: Adicionar imports em `src/scenes/GameScene.ts`**

Após a linha `import { EffectsManager } from '../fx/EffectsManager'` (linha ~35), adicionar:

```typescript
import { EnemyHPBar } from '../fx/EnemyHPBar'
import { profileManager } from '../storage/ProfileManager'
```

- [ ] **Step 2: Adicionar campo `_enemyHPBar` na classe**

Após a linha `private _am?: AchievementManager` (linha ~61), adicionar:

```typescript
  private _enemyHPBar!: EnemyHPBar
```

- [ ] **Step 3: Instanciar `_enemyHPBar` no `create()`**

Localizar o trecho onde `this._fx` é instanciado no método `create()` de `GameScene.ts`. Adicionar logo após:

```typescript
    this._enemyHPBar = new EnemyHPBar(this)
```

(Se não encontrar `this._fx =`, adicionar logo após a criação do player — antes do bloco de overlaps/events.)

- [ ] **Step 4: Modificar handler do bark — adicionar kill para HP ≤ 1**

Localizar o bloco (linhas ~762-773):

```typescript
        } else if (dist <= PHYSICS.BARK_RADIUS) {
          // Animais: verifica counter window primeiro
          const countered = (e as any).tryCounter?.('cruella', 'bark') ?? false
          if (countered) {
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#22ccff')
          } else {
            e.stun(2000)
            this._fx.barkImpact(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
          }
        }
```

Substituir por:

```typescript
        } else if (dist <= PHYSICS.BARK_RADIUS) {
          // Animais: verifica counter window primeiro
          const countered = (e as any).tryCounter?.('cruella', 'bark') ?? false
          if (countered) {
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#22ccff')
          } else if (e.hp <= 1) {
            e.takeDamage(999)
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'KO! +100', '#22ccff')
            gameState.addScore(100)
          } else {
            e.stun(2000)
            this._fx.barkImpact(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
          }
        }
```

- [ ] **Step 5: Modificar overlap do dash — KO popup + HP bar**

Localizar o bloco (linhas ~792-803):

```typescript
    // Dash de Raya causa dano + verifica counter window
    this.physics.add.overlap(this.player.raya, this.enemyGroup, (_r, enemy) => {
      const e = enemy as Enemy
      if (!this.player.raya.getIsDashing()) return
      const countered = (e as any).tryCounter?.('raya', 'dash') ?? false
      if (countered) {
        this._fx.enemyDeathBurst(e.x, e.y)
        this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#f97316')
      }
      e.takeDamage(1)
      if (!countered) this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
    })
```

Substituir por:

```typescript
    // Dash de Raya causa dano + verifica counter window
    this.physics.add.overlap(this.player.raya, this.enemyGroup, (_r, enemy) => {
      const e = enemy as Enemy
      if (!this.player.raya.getIsDashing()) return
      const countered = (e as any).tryCounter?.('raya', 'dash') ?? false
      if (countered) {
        this._fx.enemyDeathBurst(e.x, e.y)
        this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#f97316')
      }
      e.takeDamage(1)
      if (!countered) {
        if (e.hp <= 0) {
          this._spawnScorePopup(e.x, e.y - 20, 'KO! +100', '#f97316')
          gameState.addScore(100)
        } else {
          this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
          this._enemyHPBar.show(e)
        }
      }
    })
```

- [ ] **Step 6: Rodar testes**

```bash
npm test
```
Expected: 140 passing, 0 failing.

- [ ] **Step 7: Build**

```bash
npm run build
```
Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: bark kills 1HP enemies, dash shows KO popup and HP bar"
```

---

### Task 7: GameScene — _applyUpgrades() + _activateBoneRadar()

**Files:**
- Modify: `src/scenes/GameScene.ts` (adicionar métodos privados + chamada em create)

- [ ] **Step 1: Adicionar `_applyUpgrades()` como método privado em `GameScene`**

Adicionar antes do último `}` da classe (após o último método privado existente):

```typescript
  private _applyUpgrades(): void {
    // Reset PHYSICS ao padrão antes de aplicar upgrades (evita stacking entre fases)
    PHYSICS.BARK_RADIUS  = 120
    PHYSICS.DASH_COOLDOWN = 800
    PHYSICS.SWAP_COOLDOWN = 1500
    gameState.maxHearts  = 3

    if (!profileManager.getActive()) return

    if (profileManager.hasUpgrade('heart_plus'))  gameState.maxHearts = 4
    if (profileManager.hasUpgrade('dash_fast'))   PHYSICS.DASH_COOLDOWN = 500
    if (profileManager.hasUpgrade('bark_wide'))   PHYSICS.BARK_RADIUS = Math.round(120 * 1.5)
    if (profileManager.hasUpgrade('swap_fast'))   PHYSICS.SWAP_COOLDOWN = 900
    if (profileManager.hasUpgrade('bone_radar'))  this._activateBoneRadar()
  }

  private _activateBoneRadar(): void {
    const arrow = this.add.text(0, 0, '▶', {
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(30).setOrigin(0.5).setVisible(false)

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!arrow.active) return

        const bones = (this.itemGroup.getChildren() as Phaser.Physics.Arcade.Image[])
          .filter(item => item.active && item.getData('type') === 'golden_bone')

        if (bones.length === 0) {
          arrow.setVisible(false)
          return
        }

        const dog = gameState.activeDog === 'raya' ? this.player.raya : this.player.cruella
        let nearest = bones[0]
        let minDist = Phaser.Math.Distance.Between(dog.x, dog.y, bones[0].x, bones[0].y)
        for (const bone of bones) {
          const d = Phaser.Math.Distance.Between(dog.x, dog.y, bone.x, bone.y)
          if (d < minDist) { minDist = d; nearest = bone }
        }

        const angle = Math.atan2(nearest.y - dog.y, nearest.x - dog.x)
        arrow.setPosition(dog.x, dog.y - 32)
        arrow.setRotation(angle)
        arrow.setVisible(true)
      },
    })
  }
```

- [ ] **Step 2: Chamar `_applyUpgrades()` no `create()`**

Dentro de `create()`, após a linha `this._enemyHPBar = new EnemyHPBar(this)` (adicionada na Task 6):

```typescript
    this._applyUpgrades()
```

- [ ] **Step 3: Rodar testes**

```bash
npm test
```
Expected: 140 passing, 0 failing.

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add _applyUpgrades() and bone radar to GameScene"
```

---

### Task 8: WorldMapScene — painel de upgrades

**Files:**
- Modify: `src/scenes/WorldMapScene.ts`

- [ ] **Step 1: Adicionar campo `_upgradePanel` na classe `WorldMapScene`**

Após `export class WorldMapScene extends Phaser.Scene {` e `constructor() { ... }`, antes do método `create()`:

```typescript
  private _upgradePanel: Phaser.GameObjects.Container | null = null
```

- [ ] **Step 2: Adicionar botão `[🛒 Upgrades]` no `create()`**

Localizar o trecho de "Instruções" no `create()` (linha ~166):

```typescript
    // ── Instruções ──────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'Clique numa fase para jogar  |  ENTER — iniciar atual  |  ESC — menu', {
```

Adicionar ANTES desse bloco:

```typescript
    // ── Botão Upgrades ──────────────────────────────────────────────────
    const upgradeBtn = this.add.text(16, GAME_HEIGHT - 14, '🛒 Upgrades', {
      fontSize: '11px', color: '#5577cc',
    }).setOrigin(0, 1).setInteractive()
    upgradeBtn.on('pointerover', () => upgradeBtn.setColor('#88aaff'))
    upgradeBtn.on('pointerout',  () => upgradeBtn.setColor('#5577cc'))
    upgradeBtn.on('pointerdown', () => this._renderUpgradePanel())
```

- [ ] **Step 3: Adicionar método `_renderUpgradePanel()` na classe**

Adicionar antes do método `_startLevel()`:

```typescript
  private _renderUpgradePanel(): void {
    if (this._upgradePanel) {
      this._upgradePanel.destroy()
      this._upgradePanel = null
      return
    }

    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2
    const W = 680, H = 330

    const container = this.add.container(cx, cy)
    this._upgradePanel = container

    // Fundo semi-transparente
    const bg = this.add.graphics()
    bg.fillStyle(0x050510, 0.94)
    bg.fillRect(-W / 2, -H / 2, W, H)
    bg.lineStyle(2, 0x3a5a8a)
    bg.strokeRect(-W / 2, -H / 2, W, H)
    container.add(bg)

    // Título
    container.add(this.add.text(0, -H / 2 + 20, '⚡ Upgrades Permanentes', {
      fontSize: '16px', color: '#ffdd88', fontStyle: 'bold',
    }).setOrigin(0.5))

    // Bones disponíveis
    const available = profileManager.getAvailableBones()
    container.add(this.add.text(0, -H / 2 + 44, `🦴 Disponíveis: ${available}`, {
      fontSize: '12px', color: '#aaccff',
    }).setOrigin(0.5))

    // Definição dos 5 upgrades
    const defs = [
      { key: 'heart_plus', name: '❤️ Coração Extra',  effect: 'HP máx 3→4',              cost: 8 },
      { key: 'dash_fast',  name: '⚡ Dash Relâmpago', effect: 'Cooldown dash 800→500ms',  cost: 6 },
      { key: 'bark_wide',  name: '🔊 Latido Amplo',   effect: 'Raio bark ×1.5',           cost: 6 },
      { key: 'swap_fast',  name: '🔄 Troca Rápida',   effect: 'Cooldown troca 1500→900ms',cost: 5 },
      { key: 'bone_radar', name: '🦴 Faro Apurado',   effect: 'Seta → bone mais próximo', cost: 7 },
    ] as const

    const cardW = 124
    const startX = -(defs.length * cardW) / 2 + cardW / 2
    const cardCenterY = 28

    defs.forEach((def, i) => {
      const acquired  = profileManager.hasUpgrade(def.key)
      const canAfford = !acquired && available >= def.cost
      const cx2 = startX + i * cardW
      const top = cardCenterY - 100

      // Fundo do card
      const card = this.add.graphics()
      card.fillStyle(acquired ? 0x0a3020 : 0x0a1a30, 0.9)
      card.lineStyle(1, acquired ? 0x44cc88 : canAfford ? 0x2255aa : 0x1a2a3a)
      card.fillRect(cx2 - cardW / 2 + 4, top, cardW - 8, 200)
      card.strokeRect(cx2 - cardW / 2 + 4, top, cardW - 8, 200)
      container.add(card)

      container.add(this.add.text(cx2, top + 18, def.name, {
        fontSize: '10px', color: '#e0e8ff',
        wordWrap: { width: cardW - 16 }, align: 'center',
      }).setOrigin(0.5))

      container.add(this.add.text(cx2, top + 56, def.effect, {
        fontSize: '10px', color: '#7898b8',
        wordWrap: { width: cardW - 16 }, align: 'center',
      }).setOrigin(0.5))

      container.add(this.add.text(cx2, top + 92, `🦴 ${def.cost}`, {
        fontSize: '13px', color: '#ffdd88',
      }).setOrigin(0.5))

      const btnLabel = acquired
        ? '✓ ADQUIRIDO'
        : canAfford
          ? 'COMPRAR'
          : `Faltam ${def.cost - available}🦴`
      const btnColor = acquired ? '#44cc88' : canAfford ? '#ffffff' : '#664444'

      const btn = this.add.text(cx2, top + 164, btnLabel, {
        fontSize: '11px', color: btnColor,
      }).setOrigin(0.5)
      container.add(btn)

      if (canAfford) {
        btn.setInteractive()
        btn.on('pointerover', () => btn.setColor('#ffdd44'))
        btn.on('pointerout',  () => btn.setColor('#ffffff'))
        btn.on('pointerdown', () => {
          profileManager.saveUpgrade(def.key)
          // Fecha manualmente antes de reabrir — se chamar diretamente,
          // o toggle veria _upgradePanel != null e só fecharia.
          this._upgradePanel?.destroy()
          this._upgradePanel = null
          this._renderUpgradePanel()
        })
      }
    })

    // Botão fechar
    const closeBtn = this.add.text(W / 2 - 12, -H / 2 + 10, '✕', {
      fontSize: '18px', color: '#cc4444',
    }).setOrigin(0.5).setInteractive()
    container.add(closeBtn)
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'))
    closeBtn.on('pointerout',  () => closeBtn.setColor('#cc4444'))
    closeBtn.on('pointerdown', () => {
      this._upgradePanel?.destroy()
      this._upgradePanel = null
    })
  }
```

**Nota sobre o toggle:** O botão 🛒 alterna — se o painel já está aberto, `_renderUpgradePanel()` o fecha (primeiro `if`). Ao comprar, o handler destrói e nulifica `_upgradePanel` explicitamente antes de chamar `_renderUpgradePanel()`, garantindo reabertura com estado atualizado em vez de simples fechamento.

- [ ] **Step 4: Rodar testes**

```bash
npm test
```
Expected: 140 passing, 0 failing.

- [ ] **Step 5: Build**

```bash
npm run build
```
Expected: sem erros TypeScript.

- [ ] **Step 6: Verificação manual**

```bash
npm run dev
```

Confirmar:
- WorldMapScene: botão `🛒 Upgrades` no canto inferior esquerdo
- Clicar abre painel com 5 cards mostrando nome, efeito, custo e estado
- Com bones insuficientes: botão mostra `Faltam X🦴` em vermelho
- Após comprar: card fica verde com `✓ ADQUIRIDO`
- Iniciar fase com upgrade ativo: comportamentos correspondentes funcionam (bark mata com 1 HP, dash cooldown menor, etc.)

- [ ] **Step 7: Commit**

```bash
git add src/scenes/WorldMapScene.ts
git commit -m "feat: add permanent upgrades shop to WorldMapScene"
```
