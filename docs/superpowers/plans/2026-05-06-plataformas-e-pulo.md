# Plataformas e Pulo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir altura do pulo de ambos os personagens de -450 para -350, adicionar plataformas estáticas extras via sistema de tiles existente, e introduzir plataformas dinâmicas (movimento x/y) em todos os 4 mundos.

**Architecture:** Jump velocity muda em 1 constante. Plataformas estáticas extras usam o sistema de `tiles: number[][]` já existente (val=2 = `TILE_PLATFORM`, collider já configurado). Plataformas dinâmicas usam novo campo `movingPlatforms?: MovingPlatformSpawn[]` em `LevelData`, novo `_movingPlatformGroup` (Arcade Group dinâmico com `setImmovable`+`setAllowGravity(false)`), e loop de inversão de velocidade em `update()`.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript, Vitest

---

## Arquivos modificados

| Arquivo | Operação |
|---|---|
| `src/constants.ts` | `JUMP_VELOCITY: -450` → `-350` |
| `src/levels/LevelData.ts` | Nova interface `MovingPlatformSpawn` + campo `movingPlatforms?` em `LevelData` |
| `src/scenes/GameScene.ts` | Private fields + `_buildMovingPlatforms()` + collider + update loop |
| `src/levels/World0.ts` | Tiles estáticos extras + `movingPlatforms` em 0-1, 0-2, 0-boss |
| `src/levels/World1.ts` | Tiles estáticos extras + `movingPlatforms` em 1-1, 1-2, 1-3 |
| `src/levels/World2.ts` | Tiles estáticos extras + `movingPlatforms` em 2-1, 2-2, 2-3 |
| `src/levels/World3.ts` | Tiles estáticos extras + `movingPlatforms` em 3-1, 3-2, 3-3 |
| `tests/PlatformSystem.test.ts` | TDD — interface + dados por fase + lógica de movimento |

---

## Task 1: constants.ts — JUMP_VELOCITY -350

**Files:**
- Modify: `src/constants.ts` (linha 158)

- [ ] **Step 1: Alterar JUMP_VELOCITY**

Em `src/constants.ts`, linha 158:

```typescript
// Antes:
JUMP_VELOCITY: -450,

// Depois:
JUMP_VELOCITY: -350,
```

- [ ] **Step 2: Build para verificar sem erros**

```bash
npm run build 2>&1 | tail -3
```
Esperado: `✓ built in Xs`

- [ ] **Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat(physics): reduzir JUMP_VELOCITY -450 -> -350 para ambos os personagens"
```

---

## Task 2: LevelData.ts — interface MovingPlatformSpawn

**Files:**
- Modify: `src/levels/LevelData.ts`

- [ ] **Step 1: Adicionar interface após `DecorationSpawn`**

Em `src/levels/LevelData.ts`, após a linha `export interface DecorationSpawn ...`:

```typescript
export interface MovingPlatformSpawn {
  x: number       // posição X inicial (centro da plataforma)
  y: number       // posição Y inicial (centro da plataforma)
  width: number   // largura em px (usa tileSprite, não stretching)
  axis: 'x' | 'y'
  range: number   // deslocamento máximo em px (positivo = direita/baixo)
  speed: number   // velocidade em px/s
}
```

- [ ] **Step 2: Adicionar campo opcional em `LevelData`**

No final da interface `LevelData`, após `miniBoss?: MiniBossConfig`:

```typescript
  movingPlatforms?: MovingPlatformSpawn[]
```

- [ ] **Step 3: Build para verificar**

```bash
npm run build 2>&1 | tail -3
```

- [ ] **Step 4: Commit**

```bash
git add src/levels/LevelData.ts
git commit -m "feat(platform): interface MovingPlatformSpawn em LevelData"
```

---

## Task 3: Testes TDD — PlatformSystem.test.ts (escrever antes da implementação)

**Files:**
- Create: `tests/PlatformSystem.test.ts`

- [ ] **Step 1: Criar arquivo de teste**

```typescript
import { describe, it, expect } from 'vitest'
import type { MovingPlatformSpawn } from '../src/levels/LevelData'
import { WORLD0_LEVELS } from '../src/levels/World0'
import { WORLD1_LEVELS } from '../src/levels/World1'
import { WORLD2_LEVELS } from '../src/levels/World2'
import { WORLD3_LEVELS } from '../src/levels/World3'

// ── Interface ──────────────────────────────────────────────────────────────────

describe('MovingPlatformSpawn interface', () => {
  it('plataforma eixo-x é válida', () => {
    const p: MovingPlatformSpawn = { x: 500, y: 300, width: 96, axis: 'x', range: 120, speed: 80 }
    expect(p.axis).toBe('x')
    expect(p.speed).toBeGreaterThan(0)
    expect(p.range).toBeGreaterThan(0)
  })

  it('plataforma eixo-y é válida', () => {
    const p: MovingPlatformSpawn = { x: 800, y: 250, width: 96, axis: 'y', range: 60, speed: 50 }
    expect(p.axis).toBe('y')
    expect(p.width).toBeGreaterThan(0)
  })
})

// ── Presença por mundo ────────────────────────────────────────────────────────

describe('World0 tem movingPlatforms em fases de apartamento', () => {
  it('0-1 tem ao menos 2 plataformas dinâmicas', () => {
    expect((WORLD0_LEVELS['0-1'].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
  })
  it('0-2 tem ao menos 2 plataformas dinâmicas', () => {
    expect((WORLD0_LEVELS['0-2'].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
  })
  it('0-boss tem ao menos 1 plataforma dinâmica', () => {
    expect((WORLD0_LEVELS['0-boss'].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(1)
  })
})

describe('World1 tem movingPlatforms', () => {
  for (const id of ['1-1', '1-2', '1-3']) {
    it(`${id} tem ao menos 2 plataformas dinâmicas`, () => {
      expect((WORLD1_LEVELS[id].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
    })
  }
})

describe('World2 tem movingPlatforms', () => {
  for (const id of ['2-1', '2-2', '2-3']) {
    it(`${id} tem ao menos 2 plataformas dinâmicas`, () => {
      expect((WORLD2_LEVELS[id].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
    })
  }
})

describe('World3 tem movingPlatforms', () => {
  for (const id of ['3-1', '3-2', '3-3']) {
    it(`${id} tem ao menos 2 plataformas dinâmicas`, () => {
      expect((WORLD3_LEVELS[id].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
    })
  }
})

// ── Validação de dados ────────────────────────────────────────────────────────

describe('Dados de movingPlatforms são válidos', () => {
  const allLevels = [
    ...Object.values(WORLD0_LEVELS),
    ...Object.values(WORLD1_LEVELS),
    ...Object.values(WORLD2_LEVELS),
    ...Object.values(WORLD3_LEVELS),
  ]

  it('todas as plataformas dinâmicas têm speed > 0 e range > 0', () => {
    for (const level of allLevels) {
      for (const p of level.movingPlatforms ?? []) {
        expect(p.speed).toBeGreaterThan(0)
        expect(p.range).toBeGreaterThan(0)
        expect(p.width).toBeGreaterThan(0)
      }
    }
  })

  it('axis é sempre x ou y', () => {
    for (const level of allLevels) {
      for (const p of level.movingPlatforms ?? []) {
        expect(['x', 'y']).toContain(p.axis)
      }
    }
  })
})
```

- [ ] **Step 2: Rodar e confirmar que FALHAM (TDD red)**

```bash
npm test -- tests/PlatformSystem.test.ts 2>&1 | tail -8
```
Esperado: múltiplos FAIL (dados ainda não adicionados nos WorldN)

- [ ] **Step 3: Commit dos testes**

```bash
git add tests/PlatformSystem.test.ts
git commit -m "test(platform): TDD tests para MovingPlatformSpawn — falham antes da implementação"
```

---

## Task 4: GameScene.ts — _buildMovingPlatforms() + collider + update

**Files:**
- Modify: `src/scenes/GameScene.ts`

O arquivo tem as seguintes posições importantes:
- Linha 66: último campo privado (`_mainBoss`)
- Linha 114: `this._buildDecorations()` no `create()`
- Linha 664: início de `_setupCollisions()`
- Linha 672: último collider com `platformLayer`
- Linha 936: início de `update()`
- Linha 1000: início do ghost trail (bom ponto de inserção do moving platform update)

- [ ] **Step 1: Adicionar campos privados**

Após a linha com `private _mainBoss: Enemy | null = null` (linha ~66), adicionar:

```typescript
  private _movingPlatformGroup!: Phaser.Physics.Arcade.Group
  private _movingPlatformData: Array<{
    sprite: Phaser.Physics.Arcade.Image
    axis: 'x' | 'y'
    range: number
    speed: number
    originX: number
    originY: number
  }> = []
```

- [ ] **Step 2: Adicionar chamada em create()**

Na linha ~115, após `this._buildDecorations()`:

```typescript
    this._buildDecorations()
    this._buildMovingPlatforms()   // ← adicionar esta linha
    this._buildTilemap()
```

- [ ] **Step 3: Adicionar método _buildMovingPlatforms()**

Após o método `_buildDecorations()` (que termina em linha ~283), adicionar:

```typescript
  private _buildMovingPlatforms(): void {
    this._movingPlatformGroup = this.physics.add.group()
    this._movingPlatformData = []

    const defs = this.currentLevel.movingPlatforms ?? []
    for (const cfg of defs) {
      const sprite = this.add.tileSprite(cfg.x, cfg.y, cfg.width, 16, KEYS.TILE_PLATFORM)
        .setOrigin(0.5, 0.5)
        .setDepth(2)

      this.physics.add.existing(sprite)
      const body = sprite.body as Phaser.Physics.Arcade.Body
      body.setImmovable(true)
      body.setAllowGravity(false)

      const vel = cfg.speed
      if (cfg.axis === 'x') {
        body.setVelocityX(vel)
      } else {
        body.setVelocityY(vel)
      }

      this._movingPlatformGroup.add(sprite as any)
      this._movingPlatformData.push({
        sprite: sprite as any,
        axis: cfg.axis,
        range: cfg.range,
        speed: cfg.speed,
        originX: cfg.x,
        originY: cfg.y,
      })
    }
  }
```

- [ ] **Step 4: Adicionar collider em _setupCollisions()**

Na função `_setupCollisions()`, após o collider existente `this.physics.add.collider(this.enemyGroup, this.platformLayer)` (linha ~672):

```typescript
    // Plataformas dinâmicas — jogadores (não inimigos, evita ficarem presos)
    if (this._movingPlatformGroup.getLength() > 0) {
      this.physics.add.collider(this.player.raya,   this._movingPlatformGroup)
      this.physics.add.collider(this.player.cruella, this._movingPlatformGroup)
    }
```

- [ ] **Step 5: Adicionar loop de inversão em update()**

No método `update()`, antes do bloco do ghost trail (linha ~1000):

```typescript
    // Plataformas dinâmicas — inversão de velocidade ao atingir range
    for (const mp of this._movingPlatformData) {
      const body = mp.sprite.body as Phaser.Physics.Arcade.Body
      if (mp.axis === 'x') {
        const dist = mp.sprite.x - mp.originX
        if (Math.abs(dist) >= mp.range) {
          body.setVelocityX(-Math.sign(dist) * mp.speed)
        }
      } else {
        const dist = mp.sprite.y - mp.originY
        if (Math.abs(dist) >= mp.range) {
          body.setVelocityY(-Math.sign(dist) * mp.speed)
        }
      }
    }
```

- [ ] **Step 6: Build para verificar**

```bash
npm run build 2>&1 | tail -5
```
Esperado: `✓ built in Xs` sem erros TypeScript

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(platform): _buildMovingPlatforms() + collider + update loop em GameScene"
```

---

## Task 5: World0.ts — tiles estáticos extras + movingPlatforms

**Files:**
- Modify: `src/levels/World0.ts`

Referência de layout (TILE_SIZE=32, COLS=96):
- Cada coluna = 32px; col N começa em pixel X = N*32
- `multiPlatRow([startCol, length])` cria plataformas de val=2 nesses cols
- y dos tiles: `py = row * 32 + 16` → row 4 = y=144, row 6 = y=208, row 8 = y=272, row 10 = y=336

Para plataformas dinâmicas, use as y-coordinates correspondentes às linhas de plataforma existentes (row 9 = y=304, row 11 = y=368).

- [ ] **Step 1: Adicionar tiles estáticos em LEVEL_0_1**

No array `tiles` de `LEVEL_0_1`, os rows existentes são:
```
[0] emptyRow  [1] emptyRow  [2] emptyRow
[3] multiPlatRow([6,5],[65,5])  [4] emptyRow
[5] multiPlatRow([16,4],[76,4]) [6] emptyRow
[7] multiPlatRow([28,5],[86,5]) [8] emptyRow
[9] multiPlatRow([40,4])        [10] emptyRow
[11] multiPlatRow([50,5])       [12] emptyRow
[13] groundRow
```

Substituir as emptyRows nas posições [4], [6], [8] por platforms que preenchem os gaps:

```typescript
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    multiPlatRow([6,5],  [65,5]),   // row 3
    multiPlatRow([33,4], [80,4]),   // row 4 — NOVO: preenche gap cols 33-36, 80-83
    multiPlatRow([16,4], [76,4]),   // row 5
    multiPlatRow([45,4]),           // row 6 — NOVO: preenche gap cols 45-48
    multiPlatRow([28,5], [86,5]),   // row 7
    emptyRow(),                     // row 8
    multiPlatRow([40,4]),           // row 9
    emptyRow(),                     // row 10
    multiPlatRow([50,5]),           // row 11
    emptyRow(),                     // row 12
    groundRow(),                    // row 13
  ],
```

- [ ] **Step 2: Adicionar movingPlatforms em LEVEL_0_1**

No objeto `LEVEL_0_1`, após o campo `decorations`, adicionar:

```typescript
  movingPlatforms: [
    { x: 1440, y: 304, width: 96, axis: 'x', range: 160, speed: 80 },
    { x: 2240, y: 368, width: 96, axis: 'y', range: 48, speed: 55 },
    { x: 2720, y: 304, width: 96, axis: 'x', range: 120, speed: 70 },
  ],
```

- [ ] **Step 3: Adicionar tiles estáticos em LEVEL_0_2**

`LEVEL_0_2` tem 70 colunas e `tileWidthCols: 70`. Tiles atuais:

```
row 3: c70.mp([5,3], [35,3], [60,3])   cols 5-7, 35-37, 60-62
row 4: c70.e()                          ← substituir por ponte
row 5: c70.mp([15,4], [45,4])          cols 15-18, 45-48
row 6: c70.e()                          ← substituir por ponte
row 7: c70.mp([25,3], [55,3])          cols 25-27, 55-57
rows 8-11: c70.e()
row 12: c70.g()
```

Substituir:

```typescript
  tiles: [
    c70.e(), c70.e(), c70.e(),
    c70.mp([5,3], [35,3], [60,3]),
    c70.mp([10,4], [40,4]),              // row 4 — NOVO: ponte entre cols 10-13, 40-43
    c70.mp([15,4], [45,4]),
    c70.mp([22,3], [52,3]),              // row 6 — NOVO: ponte entre cols 22-24, 52-54
    c70.mp([25,3], [55,3]),
    c70.e(), c70.e(), c70.e(), c70.e(),
    c70.g(),
  ],
```

Adicionar após `decorations`:
```typescript
  movingPlatforms: [
    { x: 640,  y: 304, width: 96, axis: 'x', range: 130, speed: 75 },
    { x: 1600, y: 336, width: 96, axis: 'y', range: 48,  speed: 50 },
  ],
```

- [ ] **Step 4: Adicionar movingPlatforms em LEVEL_0_BOSS**

No objeto `LEVEL_0_BOSS`, após `decorations`:

```typescript
  movingPlatforms: [
    { x: 800,  y: 320, width: 96, axis: 'x', range: 150, speed: 90 },
    { x: 1440, y: 280, width: 96, axis: 'y', range: 60,  speed: 60 },
  ],
```

- [ ] **Step 5: Rodar teste parcial**

```bash
npm test -- tests/PlatformSystem.test.ts 2>&1 | grep -E "World0|FAIL|PASS" | head -10
```
Esperado: testes World0 passando

- [ ] **Step 6: Build + commit**

```bash
npm run build 2>&1 | tail -3
git add src/levels/World0.ts
git commit -m "feat(platform): World0 — tiles estáticos extras + movingPlatforms em 0-1, 0-2, 0-boss"
```

---

## Task 6: World1.ts — tiles estáticos extras + movingPlatforms

**Files:**
- Modify: `src/levels/World1.ts`

Referência LEVEL_1_1 (COLS=96, tileWidthCols=COLS):
```
tiles: [
  emptyRow(), emptyRow(), emptyRow(),            // rows 0-2
  platformRow(10, 5), emptyRow(),                // rows 3-4
  platformRow(20, 6), emptyRow(),                // rows 5-6
  platformRow(35, 4), platformRow(48, 5), emptyRow(), // rows 7-9
  platformRow(60, 6), emptyRow(), emptyRow(),    // rows 10-12
  groundRow(),                                   // row 13
]
```
`platformRow(start, len)` = `multiPlatRow([start, len])` neste arquivo.

- [ ] **Step 1: Adicionar tiles em LEVEL_1_1**

Substituir emptyRows nas posições que criam pontes entre grupos de platforms existentes:

```typescript
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    platformRow(10, 5), emptyRow(),
    platformRow(20, 6), emptyRow(),
    platformRow(35, 4), platformRow(48, 5), emptyRow(),
    platformRow(60, 6), platformRow(74, 4), emptyRow(),  // row 11: NOVO platformRow(74,4)
    emptyRow(),
    groundRow(),
  ],
```

Adicionar após `decorations`:
```typescript
  movingPlatforms: [
    { x: 480,  y: 336, width: 96, axis: 'x', range: 140, speed: 85 },
    { x: 1760, y: 272, width: 96, axis: 'y', range: 52,  speed: 60 },
    { x: 2400, y: 336, width: 96, axis: 'x', range: 120, speed: 75 },
  ],
```

- [ ] **Step 2: Adicionar em LEVEL_1_2**

Ler `LEVEL_1_2` e adicionar após `decorations`:

```typescript
  movingPlatforms: [
    { x: 640,  y: 300, width: 96, axis: 'x', range: 130, speed: 80 },
    { x: 1500, y: 340, width: 96, axis: 'y', range: 50,  speed: 55 },
    { x: 2200, y: 300, width: 96, axis: 'x', range: 100, speed: 70 },
  ],
```

- [ ] **Step 3: Adicionar em LEVEL_1_3**

Ler `LEVEL_1_3` e adicionar após `decorations`:

```typescript
  movingPlatforms: [
    { x: 700,  y: 320, width: 96, axis: 'y', range: 60,  speed: 65 },
    { x: 1400, y: 280, width: 96, axis: 'x', range: 150, speed: 90 },
    { x: 2100, y: 340, width: 96, axis: 'x', range: 110, speed: 75 },
  ],
```

- [ ] **Step 4: Teste parcial**

```bash
npm test -- tests/PlatformSystem.test.ts 2>&1 | grep -E "World1|FAIL|PASS" | head -10
```

- [ ] **Step 5: Build + commit**

```bash
npm run build 2>&1 | tail -3
git add src/levels/World1.ts
git commit -m "feat(platform): World1 — tiles extras + movingPlatforms em 1-1, 1-2, 1-3"
```

---

## Task 7: World2.ts — tiles estáticos extras + movingPlatforms

**Files:**
- Modify: `src/levels/World2.ts`

- [ ] **Step 1: Adicionar em LEVEL_2_1**

Adicionar após `decorations` em `LEVEL_2_1`:

```typescript
  movingPlatforms: [
    { x: 480,  y: 336, width: 96, axis: 'x', range: 120, speed: 70 },
    { x: 1280, y: 288, width: 96, axis: 'y', range: 56,  speed: 60 },
    { x: 2100, y: 336, width: 96, axis: 'x', range: 130, speed: 80 },
  ],
```

- [ ] **Step 2: Adicionar em LEVEL_2_2**

Adicionar após `decorations` em `LEVEL_2_2`:

```typescript
  movingPlatforms: [
    { x: 640,  y: 304, width: 96, axis: 'x', range: 150, speed: 80 },
    { x: 1600, y: 272, width: 96, axis: 'y', range: 48,  speed: 55 },
    { x: 2400, y: 320, width: 96, axis: 'x', range: 110, speed: 70 },
  ],
```

- [ ] **Step 3: Adicionar em LEVEL_2_3**

Adicionar após `decorations` em `LEVEL_2_3`:

```typescript
  movingPlatforms: [
    { x: 560,  y: 336, width: 96, axis: 'y', range: 60,  speed: 65 },
    { x: 1440, y: 296, width: 96, axis: 'x', range: 130, speed: 85 },
    { x: 2200, y: 336, width: 96, axis: 'x', range: 100, speed: 70 },
  ],
```

- [ ] **Step 4: Teste parcial**

```bash
npm test -- tests/PlatformSystem.test.ts 2>&1 | grep -E "World2|FAIL|PASS" | head -10
```

- [ ] **Step 5: Build + commit**

```bash
npm run build 2>&1 | tail -3
git add src/levels/World2.ts
git commit -m "feat(platform): World2 — tiles extras + movingPlatforms em 2-1, 2-2, 2-3"
```

---

## Task 8: World3.ts — tiles estáticos extras + movingPlatforms

**Files:**
- Modify: `src/levels/World3.ts`

**Nota:** World3 usa `y: 388` para decorações. Plataformas dinâmicas devem usar y's das linhas de tiles (ex: row 8 = y=272, row 10 = y=336).

- [ ] **Step 1: Adicionar em LEVEL_3_1**

Adicionar após `decorations` em `LEVEL_3_1`:

```typescript
  movingPlatforms: [
    { x: 640,  y: 304, width: 96, axis: 'x', range: 140, speed: 90 },
    { x: 1500, y: 256, width: 96, axis: 'y', range: 64,  speed: 60 },
    { x: 2200, y: 304, width: 96, axis: 'x', range: 120, speed: 75 },
  ],
```

- [ ] **Step 2: Adicionar em LEVEL_3_2**

```typescript
  movingPlatforms: [
    { x: 500,  y: 320, width: 96, axis: 'x', range: 130, speed: 85 },
    { x: 1300, y: 272, width: 96, axis: 'y', range: 56,  speed: 60 },
    { x: 2000, y: 320, width: 96, axis: 'x', range: 110, speed: 70 },
  ],
```

- [ ] **Step 3: Adicionar em LEVEL_3_3**

```typescript
  movingPlatforms: [
    { x: 600,  y: 288, width: 96, axis: 'y', range: 60,  speed: 65 },
    { x: 1400, y: 320, width: 96, axis: 'x', range: 150, speed: 95 },
    { x: 2100, y: 288, width: 96, axis: 'x', range: 120, speed: 80 },
  ],
```

- [ ] **Step 4: Todos os testes devem passar**

```bash
npm test 2>&1 | tail -6
```
Esperado: todos os testes passando (330 anteriores + novos PlatformSystem)

- [ ] **Step 5: Build + commit**

```bash
npm run build 2>&1 | tail -3
git add src/levels/World3.ts
git commit -m "feat(platform): World3 — tiles extras + movingPlatforms em 3-1, 3-2, 3-3"
```

---

## Task 9: Push final

- [ ] **Step 1: Rodar suite completa**

```bash
npm test 2>&1 | tail -5
```
Esperado: `Tests X passed (X)` — todos passando.

- [ ] **Step 2: Push**

```bash
git push origin main
```
