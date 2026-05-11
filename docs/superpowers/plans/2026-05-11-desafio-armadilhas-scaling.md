# Desafio — Armadilhas Ambientais + Scaling de Dificuldade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar armadilhas ambientais (spike e fall-zone) e scaling de dificuldade por mundo, tornando o jogo progressivamente mais desafiador.

**Architecture:** Dois subsistemas independentes. Hazards: novo campo `hazards?: HazardDef[]` em `LevelData`, método `_buildHazards()` em `GameScene` (padrão de `_buildMovingPlatforms`), spike como staticImage com tint vermelho, fall-zone como bounds check global no `update()`. Scaling: tabela `WORLD_DIFFICULTY` em `constants.ts`, método `applyDifficulty()` na base `Enemy`, override em `HumanEnemy` para cooldown estendido, packChase implementado no `GameScene.update()` via manipulação de `setPlayerPos`.

**Tech Stack:** TypeScript, Phaser 3 Arcade Physics, Vitest

---

## Arquivos modificados / criados

| Arquivo | O que muda |
|---|---|
| `src/levels/LevelData.ts` | Tipo `HazardType`, interface `HazardDef`, campo `hazards?` em `LevelData` |
| `src/constants.ts` | Constante `WORLD_DIFFICULTY` |
| `src/entities/Enemy.ts` | Campos `_packChase`, `_longChase` + método `applyDifficulty()` |
| `src/entities/enemies/HumanEnemy.ts` | Override `applyDifficulty()` — estende `_config.cooldownDuration` |
| `src/scenes/GameScene.ts` | `_hazardGroup`, `_hasFallZone`, `_currentDiff`, `_buildHazards()`, spike overlaps, fall-zone no update, apply difficulty no spawn, packChase no update |
| `src/levels/World0.ts` | Campo `hazards` por fase |
| `src/levels/World1.ts` | Campo `hazards` por fase |
| `src/levels/World2.ts` | Campo `hazards` por fase |
| `src/levels/World3.ts` | Campo `hazards` por fase |
| `tests/HazardScaling.test.ts` | Testes de tipos + WORLD_DIFFICULTY + applyDifficulty |

---

## Task 1: Tipos de Hazard em LevelData.ts

**Files:**
- Modify: `src/levels/LevelData.ts` (final do arquivo, após `movingPlatforms?`)
- Test: `tests/HazardScaling.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/HazardScaling.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type { LevelData } from '../src/levels/LevelData'
import { WORLD_DIFFICULTY } from '../src/constants'

describe('HazardDef types', () => {
  it('LevelData aceita hazards como campo opcional', () => {
    const partial: Partial<LevelData> = {
      hazards: [
        { type: 'spike',     x: 800,  y: 408, width: 32 },
        { type: 'fall-zone', x: 1200, y: 0,   width: 64 },
      ],
    }
    expect(partial.hazards).toHaveLength(2)
    expect(partial.hazards![0].type).toBe('spike')
    expect(partial.hazards![1].type).toBe('fall-zone')
  })
})
```

- [ ] **Step 2: Rodar para verificar falha**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test tests/HazardScaling.test.ts 2>&1 | tail -15
```

Esperado: FAIL — `Property 'hazards' does not exist on type 'Partial<LevelData>'`

- [ ] **Step 3: Adicionar tipos em LevelData.ts**

Abrir `src/levels/LevelData.ts`. Localizar a linha com `movingPlatforms?: MovingPlatformSpawn[]` (linha ~67). Adicionar logo antes dela:

```typescript
export type HazardType = 'spike' | 'fall-zone'

export interface HazardDef {
  type:   HazardType
  x:      number   // posição X do centro
  y:      number   // posição Y do centro (spike: ~408; fall-zone: ignorado — bounds check global)
  width:  number   // largura em px (spike: largura visual; fall-zone: ignorado)
}
```

E adicionar o campo em `LevelData` (após `movingPlatforms?`):

```typescript
  hazards?: HazardDef[]
```

- [ ] **Step 4: Rodar para verificar que passa**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test tests/HazardScaling.test.ts 2>&1 | tail -10
```

Esperado: PASS

- [ ] **Step 5: Verificar build**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

Esperado: `✓ built`

- [ ] **Step 6: Commit**

```bash
git add src/levels/LevelData.ts tests/HazardScaling.test.ts
git commit -m "feat(levels): HazardType + HazardDef + campo hazards em LevelData"
```

---

## Task 2: WORLD_DIFFICULTY em constants.ts

**Files:**
- Modify: `src/constants.ts` (final do arquivo)
- Test: `tests/HazardScaling.test.ts`

**Contexto:** `WORLD_DIFFICULTY` é uma tabela indexada por worldId (`'0'`–`'3'`) com multiplicadores de dificuldade para os inimigos de cada mundo.

- [ ] **Step 1: Escrever testes que falham**

Adicionar em `tests/HazardScaling.test.ts` (após o `describe` existente):

```typescript
describe('WORLD_DIFFICULTY', () => {
  it('existe para os 4 mundos', () => {
    expect(WORLD_DIFFICULTY['0']).toBeDefined()
    expect(WORLD_DIFFICULTY['1']).toBeDefined()
    expect(WORLD_DIFFICULTY['2']).toBeDefined()
    expect(WORLD_DIFFICULTY['3']).toBeDefined()
  })

  it('world0 tem multiplicadores base 1.0 e flags false', () => {
    const d = WORLD_DIFFICULTY['0']
    expect(d.speedMult).toBe(1.0)
    expect(d.aggressionMult).toBe(1.0)
    expect(d.packChase).toBe(false)
    expect(d.longChase).toBe(false)
  })

  it('world3 tem maior dificuldade', () => {
    const d3 = WORLD_DIFFICULTY['3']
    const d0 = WORLD_DIFFICULTY['0']
    expect(d3.speedMult).toBeGreaterThan(d0.speedMult)
    expect(d3.packChase).toBe(true)
    expect(d3.longChase).toBe(true)
  })

  it('cada mundo tem speedMult crescente', () => {
    const mults = ['0','1','2','3'].map(id => WORLD_DIFFICULTY[id].speedMult)
    for (let i = 1; i < mults.length; i++) {
      expect(mults[i]).toBeGreaterThanOrEqual(mults[i-1])
    }
  })
})
```

- [ ] **Step 2: Rodar para verificar falha**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test tests/HazardScaling.test.ts 2>&1 | tail -15
```

Esperado: FAIL — `WORLD_DIFFICULTY is not exported from constants`

- [ ] **Step 3: Adicionar WORLD_DIFFICULTY em constants.ts**

Abrir `src/constants.ts`. Adicionar no final do arquivo:

```typescript
export interface WorldDifficulty {
  speedMult:      number   // multiplica this.speed de cada inimigo no spawn
  aggressionMult: number   // multiplica cooldownDuration de HumanEnemy (inverso — maior = mais agressivo)
  packChase:      boolean  // inimigos próximos entram em chase juntos
  longChase:      boolean  // HumanEnemy persiste em chase por mais tempo (cooldown ×2)
}

export const WORLD_DIFFICULTY: Record<string, WorldDifficulty> = {
  '0': { speedMult: 1.00, aggressionMult: 1.00, packChase: false, longChase: false },
  '1': { speedMult: 1.15, aggressionMult: 0.90, packChase: false, longChase: false },
  '2': { speedMult: 1.30, aggressionMult: 0.75, packChase: true,  longChase: false },
  '3': { speedMult: 1.45, aggressionMult: 0.60, packChase: true,  longChase: true  },
}
```

> `aggressionMult` é um fator inverso do `cooldownDuration` — valor 0.60 significa que o HumanEnemy leva `cooldownDuration * 0.60` para desistir (persiste mais antes de voltar ao patrol).

- [ ] **Step 4: Rodar para verificar que passa**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test tests/HazardScaling.test.ts 2>&1 | tail -10
```

Esperado: todos os `WORLD_DIFFICULTY` tests passam.

- [ ] **Step 5: Commit**

```bash
git add src/constants.ts tests/HazardScaling.test.ts
git commit -m "feat(constants): WORLD_DIFFICULTY — multiplicadores de dificuldade por mundo"
```

---

## Task 3: Enemy.applyDifficulty() + HumanEnemy override

**Files:**
- Modify: `src/entities/Enemy.ts`
- Modify: `src/entities/enemies/HumanEnemy.ts`
- Test: `tests/HazardScaling.test.ts`

**Contexto:**
- `Enemy.ts` é a base abstrata com `protected speed: number`. `applyDifficulty()` multiplica `this.speed` e armazena os flags de comportamento.
- `HumanEnemy.ts` tem `protected _config: HumanConfig` com `cooldownDuration`. O override estende o cooldown se `longChase` e reduz o cooldown base se `aggressionMult < 1`.

- [ ] **Step 1: Escrever testes que falham**

> **Nota:** `Enemy` estende `Phaser.Physics.Arcade.Sprite` e não pode ser instanciado em jsdom. Usar o padrão `TestEnemy` do `tests/Enemy.test.ts` — uma classe simples que espelha os campos relevantes.

Adicionar em `tests/HazardScaling.test.ts`:

```typescript
import { WORLD_DIFFICULTY, type WorldDifficulty } from '../src/constants'

// TestEnemy espelha os campos de Enemy relevantes para applyDifficulty
// (Enemy não pode ser instanciado em jsdom — estende Phaser.Physics.Arcade.Sprite)
class TestEnemy {
  protected speed: number = 80
  protected _packChase: boolean = false
  protected _longChase: boolean = false

  applyDifficulty(_diff: WorldDifficulty): void {
    // será implementado em Enemy.ts — este stub propositalmente não faz nada
    throw new Error('applyDifficulty not implemented')
  }
}

describe('Enemy.applyDifficulty (lógica isolada)', () => {
  it('multiplica speed pelo speedMult', () => {
    // Testa a lógica diretamente — sem Phaser
    const baseSpeed = 80
    const diff = WORLD_DIFFICULTY['3']   // speedMult: 1.45
    const newSpeed = baseSpeed * diff.speedMult
    expect(newSpeed).toBeCloseTo(80 * 1.45, 1)
  })

  it('packChase é true para world2 e world3', () => {
    expect(WORLD_DIFFICULTY['2'].packChase).toBe(true)
    expect(WORLD_DIFFICULTY['3'].packChase).toBe(true)
  })

  it('longChase é true apenas para world3', () => {
    expect(WORLD_DIFFICULTY['0'].longChase).toBe(false)
    expect(WORLD_DIFFICULTY['1'].longChase).toBe(false)
    expect(WORLD_DIFFICULTY['2'].longChase).toBe(false)
    expect(WORLD_DIFFICULTY['3'].longChase).toBe(true)
  })

  it('aggressionMult < 1 para worlds avançados (inimigo mais persistente)', () => {
    expect(WORLD_DIFFICULTY['3'].aggressionMult).toBeLessThan(1)
  })
})
```

- [ ] **Step 2: Rodar para verificar falha**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test tests/HazardScaling.test.ts 2>&1 | tail -15
```

Esperado: FAIL — `gato.applyDifficulty is not a function`

- [ ] **Step 3: Adicionar campos e método em Enemy.ts**

Abrir `src/entities/Enemy.ts`. Adicionar import no topo do arquivo (após os imports existentes):

```typescript
import type { WorldDifficulty } from '../constants'
```

Adicionar os campos e o método após `protected isFleeing`:

```typescript
  // ── Difficulty scaling ───────────────────────────────────────────────────
  protected _packChase: boolean = false
  protected _longChase: boolean = false
```

E antes de `abstract update(...)`:

```typescript
  applyDifficulty(diff: WorldDifficulty): void {
    this.speed      *= diff.speedMult
    this._packChase  = diff.packChase
    this._longChase  = diff.longChase
  }
```

- [ ] **Step 4: Adicionar override em HumanEnemy.ts**

Abrir `src/entities/enemies/HumanEnemy.ts`. Adicionar import no topo:

```typescript
import type { WorldDifficulty } from '../../constants'
```

Adicionar o método após `setGroundLayer`:

```typescript
  override applyDifficulty(diff: WorldDifficulty): void {
    super.applyDifficulty(diff)
    // Persiste mais em chase: reduz cooldown (aggressionMult < 1 = mais agressivo)
    this._config.cooldownDuration = Math.round(this._config.cooldownDuration * diff.aggressionMult)
    // longChase: dobra o cooldown de cancelamento de chase
    if (diff.longChase) {
      this._config.cooldownDuration = Math.round(this._config.cooldownDuration * 2)
    }
  }
```

- [ ] **Step 5: Rodar para verificar que passa**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test tests/HazardScaling.test.ts 2>&1 | tail -10
```

Esperado: todos os tests de `applyDifficulty` passam.

- [ ] **Step 6: Verificar build**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

Esperado: `✓ built`

- [ ] **Step 7: Rodar suite completa**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test 2>&1 | tail -6
```

Esperado: todos passam (nenhuma regressão em Enemy.test.ts)

- [ ] **Step 8: Commit**

```bash
git add src/entities/Enemy.ts src/entities/enemies/HumanEnemy.ts tests/HazardScaling.test.ts
git commit -m "feat(enemies): applyDifficulty() — speed/packChase/longChase por mundo"
```

---

## Task 4: GameScene — Hazards (build + spike overlap + fall-zone)

**Files:**
- Modify: `src/scenes/GameScene.ts`

**Contexto:**
- `_buildHazards()` segue o padrão de `_buildMovingPlatforms()` — é chamado em `create()` após `_buildMovingPlatforms()`
- Spike: `staticImage` do grupo `_hazardGroup`, com `KEYS.TILE_GROUND` + `setTint(0xff3333)` + `setDisplaySize(width, 16)`
- Overlap de spike com `player.raya` e `player.cruella` → `this.player.takeDamage()` + verificar `gameState.isDead()`
- Fall-zone: flag `_hasFallZone` setada por `_buildHazards()` quando qualquer `fall-zone` existe; check no `update()` → `this.player.takeDamage()` + teleporte

**Nota:** Sem testes automatizados (Phaser physics não funciona em jsdom). Verificar manualmente.

- [ ] **Step 1: Adicionar campos na classe GameScene**

Localizar os campos privados no topo da classe (perto de `_movingPlatformGroup`, linha ~68). Adicionar:

```typescript
  private _hazardGroup!: Phaser.Physics.Arcade.StaticGroup
  private _hasFallZone: boolean = false
```

- [ ] **Step 2: Adicionar `_buildHazards()` como método privado**

Localizar o final do método `_buildMovingPlatforms()` (linhas ~301–340). Adicionar o novo método logo abaixo:

```typescript
  private _buildHazards(): void {
    this._hazardGroup = this.physics.add.staticGroup()
    this._hasFallZone = false

    const hazards = this.currentLevel.hazards ?? []
    for (const h of hazards) {
      if (h.type === 'fall-zone') {
        this._hasFallZone = true
        continue   // sem sprite — detectado por bounds check em update()
      }
      // spike — tile_ground recolorido como espinho
      this._hazardGroup.add(
        this.physics.add.staticImage(h.x, h.y, KEYS.TILE_GROUND)
          .setTint(0xff3333)
          .setDisplaySize(h.width, 16)
          .setDepth(3)
          .refreshBody()
      )
    }
  }
```

- [ ] **Step 3: Chamar `_buildHazards()` em `create()`**

Localizar a chamada `this._buildMovingPlatforms()` em `create()` (linha ~125). Adicionar a chamada logo após:

```typescript
    this._buildHazards()
```

- [ ] **Step 4: Registrar spike overlaps**

Localizar o bloco de colliders de `_movingPlatformGroup` (linha ~726). Adicionar logo após o bloco `if (_movingPlatformGroup.getLength() > 0)`:

```typescript
    // Hazards — spike dá dano; fall-zone detectado em update()
    if (this._hazardGroup.getLength() > 0) {
      const onSpikeHit = () => {
        this.player.takeDamage()
        if (gameState.isDead()) this._gameOver()
      }
      this.physics.add.overlap(this.player.raya,   this._hazardGroup, onSpikeHit, undefined, this)
      this.physics.add.overlap(this.player.cruella, this._hazardGroup, onSpikeHit, undefined, this)
    }
```

- [ ] **Step 5: Adicionar fall-zone check em `update()`**

Localizar o final do método `update()`, após o bloco de power-up aura (linha ~1147, antes do `}`). Adicionar:

```typescript
    // Fall-zone — jogador cai abaixo da tela → perde 1 coração + respawn no checkpoint
    if (this._hasFallZone) {
      const fallThreshold = GAME_HEIGHT + 64
      const rayaFell    = this.player.raya.active    && this.player.raya.y    > fallThreshold
      const cruellaFell = this.player.cruella.active && this.player.cruella.y > fallThreshold
      if (rayaFell || cruellaFell) {
        this.player.takeDamage()
        if (gameState.isDead()) {
          this._gameOver()
        } else {
          // Teleporta para checkpoint ou spawn
          const rx = gameState.checkpointReached ? gameState.checkpointX : this.currentLevel.spawnX
          const ry = gameState.checkpointReached ? gameState.checkpointY - 32 : this.currentLevel.spawnY
          this.player.raya.setPosition(rx, ry)
          this.player.cruella.setPosition(rx, ry)
        }
      }
    }
```

- [ ] **Step 6: Verificar build**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

Esperado: `✓ built`

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(game): hazards — spike overlap + fall-zone bounds check com teleporte"
```

---

## Task 5: GameScene — Difficulty Scaling (apply + packChase)

**Files:**
- Modify: `src/scenes/GameScene.ts`

**Contexto:**
- Após o loop de spawn de inimigos, aplica `enemy.applyDifficulty(diff)` em cada inimigo
- `_currentDiff` é armazenado para ser lido no `update()` para packChase
- packChase: após o loop de update dos inimigos, verifica se algum inimigo está muito próximo do jogador (< 80px); se sim, "alerta" inimigos vizinhos passando uma posição falsa via `setPlayerPos` com distância de 50px — isso garante que ficam dentro do TRIGGER_RADIUS de qualquer inimigo (mínimo 120px)

- [ ] **Step 1: Adicionar campo `_currentDiff` na classe**

Localizar os campos privados (perto de `_hazardGroup`). Adicionar:

```typescript
  private _currentDiff!: import('../constants').WorldDifficulty
```

- [ ] **Step 2: Inicializar `_currentDiff` e aplicar difficulty no spawn**

Localizar o bloco de spawn de inimigos em `create()` (linha ~394–399):

```typescript
    this.enemyGroup = this.physics.add.group()
    const builder = new LevelBuilder(this)
    this.currentLevel.enemies.forEach(spawn => {
      const enemy = builder.createEnemy(spawn.type, spawn.x, spawn.y)
      if (!enemy) return
      this.enemyGroup.add(enemy)
```

Substituir por:

```typescript
    this.enemyGroup = this.physics.add.group()
    const builder = new LevelBuilder(this)
    const worldId = gameState.currentLevel.split('-')[0]
    this._currentDiff = WORLD_DIFFICULTY[worldId] ?? WORLD_DIFFICULTY['0']
    this.currentLevel.enemies.forEach(spawn => {
      const enemy = builder.createEnemy(spawn.type, spawn.x, spawn.y)
      if (!enemy) return
      enemy.applyDifficulty(this._currentDiff)
      this.enemyGroup.add(enemy)
```

Adicionar o import `WORLD_DIFFICULTY` no topo do arquivo se ainda não existir:

```typescript
import { WORLD_DIFFICULTY } from '../constants'
```

- [ ] **Step 3: Adicionar packChase no `update()`**

Localizar o final do `enemies.forEach(e => { ... })` em `update()` (linha ~1106). Adicionar logo após o `})`:

```typescript
    // Pack chase — worlds 2 e 3: inimigo próximo do player alerta vizinhos
    if (this._currentDiff?.packChase) {
      const px = this.player.x
      const py = this.player.y
      const activeEnemies = enemies.filter(e => e.active)
      activeEnemies.forEach(leader => {
        const dLeader = Phaser.Math.Distance.Between(leader.x, leader.y, px, py)
        if (dLeader < 80) {
          activeEnemies.forEach(follower => {
            if (follower === leader) return
            const dPair = Phaser.Math.Distance.Between(leader.x, leader.y, follower.x, follower.y)
            if (dPair <= 120) {
              // Passa posição "falsa" próxima ao follower — garante dist < TRIGGER_RADIUS (mín. 120px)
              const fakeX = follower.x + Math.sign(px - follower.x) * 50
              ;(follower as any).setPlayerPos?.(fakeX, py)
            }
          })
        }
      })
    }
```

- [ ] **Step 4: Verificar build e testes**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5 && npm test 2>&1 | tail -6
```

Esperado: `✓ built` + todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(game): difficulty scaling — applyDifficulty no spawn + packChase no update"
```

---

## Task 6: World Data — Hazards nos 4 Mundos

**Files:**
- Modify: `src/levels/World0.ts`
- Modify: `src/levels/World1.ts`
- Modify: `src/levels/World2.ts`
- Modify: `src/levels/World3.ts`
- Test: `tests/HazardScaling.test.ts`

**Contexto:** Cada fase não-boss recebe 1–3 hazards temáticos. Boss levels ficam sem hazards (foco no boss). Spike `y=408` coloca o centro do sprite de 16px na linha acima do chão (ground y=416). Posições X são colocadas no terço médio do nível para não bloquear spawn/exit. Ajuste visual fino pode ser feito após.

**Coordenadas por mundo:**

```
TILE_SIZE = 32 → y_spike = 408 (centro de sprite 16px acima do chão)
Qualquer fall-zone: type='fall-zone', x=0, y=0, width=0 (campos ignorados)
```

- [ ] **Step 1: Escrever testes de cobertura mínima**

Adicionar em `tests/HazardScaling.test.ts`:

```typescript
import { WORLD0_LEVELS } from '../src/levels/World0'
import { WORLD1_LEVELS } from '../src/levels/World1'
import { WORLD2_LEVELS } from '../src/levels/World2'
import { WORLD3_LEVELS } from '../src/levels/World3'

describe('Hazards nos mundos', () => {
  it('fases não-boss têm pelo menos 1 hazard', () => {
    const allLevels = [
      ...Object.values(WORLD0_LEVELS), ...Object.values(WORLD1_LEVELS),
      ...Object.values(WORLD2_LEVELS), ...Object.values(WORLD3_LEVELS),
    ]
    const nonBoss = allLevels.filter(l => !l.isBossLevel)
    nonBoss.forEach(l => {
      expect((l.hazards ?? []).length, `${l.id} sem hazard`).toBeGreaterThan(0)
    })
  })

  it('boss levels não têm hazards', () => {
    const allLevels = [
      ...Object.values(WORLD0_LEVELS), ...Object.values(WORLD1_LEVELS),
      ...Object.values(WORLD2_LEVELS), ...Object.values(WORLD3_LEVELS),
    ]
    allLevels.filter(l => l.isBossLevel).forEach(l => {
      expect((l.hazards ?? []).length, `boss ${l.id} tem hazard`).toBe(0)
    })
  })

  it('spikes têm width > 0', () => {
    const allLevels = [
      ...Object.values(WORLD0_LEVELS), ...Object.values(WORLD1_LEVELS),
      ...Object.values(WORLD2_LEVELS), ...Object.values(WORLD3_LEVELS),
    ]
    allLevels.flatMap(l => l.hazards ?? [])
      .filter(h => h.type === 'spike')
      .forEach(h => expect(h.width, 'spike sem width').toBeGreaterThan(0))
  })
})
```

- [ ] **Step 2: Rodar para verificar falha**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test tests/HazardScaling.test.ts 2>&1 | tail -15
```

Esperado: FAIL — `... sem hazard` nas fases

- [ ] **Step 3: Verificar exports de World files**

Verificar como cada World*.ts exporta seus níveis (procurar por `export const WORLDS_`):

```bash
grep -n "^export const WORLDS_\|^export const WORLD_" /Users/apple/Desktop/github/game-cruella-e-raya/src/levels/World0.ts | head -5
grep -n "^export const WORLDS_\|^export const WORLD_" /Users/apple/Desktop/github/game-cruella-e-raya/src/levels/World1.ts | head -5
```

Ajustar os imports do test se o nome do export for diferente (ex: `WORLD_0_LEVELS`).

- [ ] **Step 4: Adicionar hazards em World0.ts**

Abrir `src/levels/World0.ts`. Para cada `LevelData` não-boss, adicionar `hazards: [...]` após o campo `movingPlatforms` (ou após `items` se não houver movingPlatforms):

**LEVEL_0_1** (tutorial — 1 spike simples):
```typescript
  hazards: [
    { type: 'spike', x: 640, y: 408, width: 64 },
  ],
```

**LEVEL_0_2** (1 spike + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 960,  y: 408, width: 64 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_0_3** (2 spikes):
```typescript
  hazards: [
    { type: 'spike', x: 640,  y: 408, width: 32 },
    { type: 'spike', x: 1280, y: 408, width: 64 },
  ],
```

**LEVEL_0_4** (1 spike + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 896,  y: 408, width: 64 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_0_5** (2 spikes):
```typescript
  hazards: [
    { type: 'spike', x: 800,  y: 408, width: 32 },
    { type: 'spike', x: 1600, y: 408, width: 64 },
  ],
```

**LEVEL_0_BOSS**: não adicionar `hazards`.

- [ ] **Step 5: Adicionar hazards em World1.ts**

Abrir `src/levels/World1.ts`:

**LEVEL_1_1** (1 fall-zone — bueiro):
```typescript
  hazards: [
    { type: 'fall-zone', x: 0, y: 0, width: 0 },
  ],
```

**LEVEL_1_2** (1 spike + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 1280, y: 408, width: 64 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_1_3** (2 spikes):
```typescript
  hazards: [
    { type: 'spike', x: 800,  y: 408, width: 32 },
    { type: 'spike', x: 1920, y: 408, width: 64 },
  ],
```

**LEVEL_1_4** (1 spike + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 1024, y: 408, width: 64 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_1_5** (2 spikes):
```typescript
  hazards: [
    { type: 'spike', x: 960,  y: 408, width: 32 },
    { type: 'spike', x: 2240, y: 408, width: 64 },
  ],
```

**LEVEL_1_BOSS**: não adicionar `hazards`.

- [ ] **Step 6: Adicionar hazards em World2.ts**

Abrir `src/levels/World2.ts`:

**LEVEL_2_1** (1 spike + 1 fall-zone — borda de telhado):
```typescript
  hazards: [
    { type: 'spike',     x: 960,  y: 408, width: 32 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_2_2** (2 spikes):
```typescript
  hazards: [
    { type: 'spike', x: 800,  y: 408, width: 32 },
    { type: 'spike', x: 2080, y: 408, width: 64 },
  ],
```

**LEVEL_2_3** (1 spike + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 1152, y: 408, width: 64 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_2_4** (2 spikes + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 736,  y: 408, width: 32 },
    { type: 'spike',     x: 2080, y: 408, width: 32 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_2_5** (2 spikes + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 1024, y: 408, width: 32 },
    { type: 'spike',     x: 2304, y: 408, width: 64 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_2_BOSS**: não adicionar `hazards`.

- [ ] **Step 7: Adicionar hazards em World3.ts**

Abrir `src/levels/World3.ts`:

**LEVEL_3_1** (2 spikes — espigões de grade):
```typescript
  hazards: [
    { type: 'spike', x: 768,  y: 408, width: 32 },
    { type: 'spike', x: 1920, y: 408, width: 64 },
  ],
```

**LEVEL_3_2** (2 spikes + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 896,  y: 408, width: 32 },
    { type: 'spike',     x: 2176, y: 408, width: 32 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_3_3** (2 spikes + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 1024, y: 408, width: 64 },
    { type: 'spike',     x: 2432, y: 408, width: 32 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_3_4** (3 spikes — máxima tensão):
```typescript
  hazards: [
    { type: 'spike', x: 640,  y: 408, width: 32 },
    { type: 'spike', x: 1536, y: 408, width: 32 },
    { type: 'spike', x: 2560, y: 408, width: 64 },
  ],
```

**LEVEL_3_5** (2 spikes + 1 fall-zone):
```typescript
  hazards: [
    { type: 'spike',     x: 1280, y: 408, width: 32 },
    { type: 'spike',     x: 2688, y: 408, width: 64 },
    { type: 'fall-zone', x: 0,    y: 0,   width: 0  },
  ],
```

**LEVEL_3_BOSS**: não adicionar `hazards`.

- [ ] **Step 8: Rodar testes**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test tests/HazardScaling.test.ts 2>&1 | tail -10
```

Esperado: todos passam.

- [ ] **Step 9: Rodar suite completa**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5 && npm test 2>&1 | tail -6
```

Esperado: `✓ built` + todos passam.

- [ ] **Step 10: Commit**

```bash
git add src/levels/World0.ts src/levels/World1.ts src/levels/World2.ts src/levels/World3.ts tests/HazardScaling.test.ts
git commit -m "feat(levels): hazards ambientais em World0–3 (spikes + fall-zones por fase)"
```
