# Boss Fixes + Phase Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Hugo/Hannah invisibility bug, HUD overlap, and boss arena bugs; rename boss to Wall-E; add rotating blade projectile; expand World 0 and World 1 phases to be longer and more complex.

**Architecture:** Pure data changes for level expansion (LevelData arrays), targeted fixes in EnemyStateMachine and HumanEnemy, new sprite + projectile method in Aspirador + BootScene, and a new `spawnBlade` event handled in GameScene. No new files — all changes are in existing files.

**Tech Stack:** TypeScript, Phaser 3 (Arcade Physics), Vitest (tests), Canvas API (sprite generation in BootScene)

---

## File Map

| File | Change |
|------|--------|
| `src/entities/enemies/EnemyStateMachine.ts` | Init `_stateEnteredAt = getNow()` in constructor |
| `src/entities/enemies/HumanEnemy.ts` | Add `setDepth(3)` in constructor |
| `src/scenes/UIScene.ts` | Move `_levelNameText` to y:30, 10px, #aaa |
| `src/constants.ts` | Add `BLADE: 'blade'` to KEYS |
| `src/scenes/BootScene.ts` | Generate BLADE sprite (12×12, ciano) after DIRT_BALL |
| `src/entities/enemies/Aspirador.ts` | Phase thresholds 66%/33%, `_throwBlade()`, blade timer |
| `src/scenes/GameScene.ts` | Add `spawnBlade` listener in 0-boss handler |
| `src/levels/World0.ts` | Rename boss, arena 60 cols, expand 0-1/0-2 to 96 cols |
| `src/levels/World1.ts` | Densify 1-1, expand 1-2 to 100 cols, 1-3 to 110 cols |
| `tests/EnemyStateMachine.test.ts` | Add test for initial `timeInState()` ≈ 0 |

---

## Task 1: Fix EnemyStateMachine — initial timeInState = 0 bug

**Files:**
- Modify: `src/entities/enemies/EnemyStateMachine.ts:108-110`
- Test: `tests/EnemyStateMachine.test.ts`

**Problem:** `_stateEnteredAt` is declared as `= 0`. On first update, `timeInState()` returns `scene.time.now - 0` which is thousands of ms, causing immediate state transitions.

- [ ] **Step 1: Write the failing test**

Open `tests/EnemyStateMachine.test.ts` and add this test inside the `describe('EnemyStateMachine class')` block (or create the block if it doesn't exist, at the bottom of the file):

```typescript
import { EnemyStateMachine } from '../src/entities/enemies/EnemyStateMachine'

describe('EnemyStateMachine class', () => {
  it('timeInState() retorna ~0 imediatamente após construção', () => {
    let fakeNow = 1500  // simula scene.time.now > 0 ao criar
    const sm = new EnemyStateMachine(() => fakeNow)
    expect(sm.timeInState()).toBeLessThan(5)
  })

  it('timeInState() acumula tempo após transição', () => {
    let fakeNow = 1500
    const sm = new EnemyStateMachine(() => fakeNow)
    sm.transition('DETECT')
    fakeNow = 1800
    expect(sm.timeInState()).toBeCloseTo(300, -1)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
npx vitest run tests/EnemyStateMachine.test.ts --reporter=verbose
```

Expected: FAIL — first test shows `timeInState()` returns ~1500, not ~0.

- [ ] **Step 3: Apply fix in EnemyStateMachine.ts**

Current constructor (lines 108–110):
```typescript
constructor(getNow: () => number) {
  this._getNow = getNow
}
```

Replace with:
```typescript
constructor(getNow: () => number) {
  this._getNow = getNow
  this._stateEnteredAt = this._getNow()
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/EnemyStateMachine.test.ts --reporter=verbose
```

Expected: All tests PASS (the 17 existing + 2 new = 19 tests).

- [ ] **Step 5: Commit**

```bash
git add src/entities/enemies/EnemyStateMachine.ts tests/EnemyStateMachine.test.ts
git commit -m "fix: init EnemyStateMachine._stateEnteredAt to getNow() to prevent ghost elapsed time on spawn"
```

---

## Task 2: Fix HumanEnemy depth — sprites invisible behind decorations

**Files:**
- Modify: `src/entities/enemies/HumanEnemy.ts:33-39`

- [ ] **Step 1: Add setDepth(3) to constructor**

Find this block in `HumanEnemy.ts` (constructor body, around line 33):
```typescript
super(scene, x, y, texture, 999, config.patrolSpeed)
this._config = config
this._sm = new EnemyStateMachine(() => this.scene.time.now)
this._patrolLeft  = x - config.patrolRange
this._patrolRight = x + config.patrolRange
this.setScale(1.6)
this.setVelocityX(this.speed)
```

Replace with:
```typescript
super(scene, x, y, texture, 999, config.patrolSpeed)
this._config = config
this._sm = new EnemyStateMachine(() => this.scene.time.now)
this._patrolLeft  = x - config.patrolRange
this._patrolRight = x + config.patrolRange
this.setScale(1.6)
this.setDepth(3)
this.setVelocityX(this.speed)
```

- [ ] **Step 2: Verify manually**

Start the dev server (`npm run dev`), load level `0-1` (Sala de Estar). Hugo and Hannah must be visible when the phase starts, not hidden behind chairs or counters.

- [ ] **Step 3: Commit**

```bash
git add src/entities/enemies/HumanEnemy.ts
git commit -m "fix: set HumanEnemy depth to 3 so NPCs render above furniture decorations"
```

---

## Task 3: Fix UIScene HUD — level name overlaps character name

**Files:**
- Modify: `src/scenes/UIScene.ts:64-67`

**Problem:** `dogText` is at `GAME_WIDTH/2, y:10` and `_levelNameText` is at `GAME_WIDTH/2, y:8` — identical position, causing overlap.

- [ ] **Step 1: Update _levelNameText creation**

Find this block in `UIScene.ts` (around line 63–67):
```typescript
this._levelNameText = this.add.text(GAME_WIDTH / 2, 8, '', {
  fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
  stroke: '#000000', strokeThickness: 2,
}).setOrigin(0.5, 0).setScrollFactor(0).setDepth(6).setAlpha(0)
```

Replace with:
```typescript
this._levelNameText = this.add.text(GAME_WIDTH / 2, 30, '', {
  fontSize: '10px', color: '#aaaaaa',
  stroke: '#000000', strokeThickness: 1,
}).setOrigin(0.5, 0).setScrollFactor(0).setDepth(6).setAlpha(0)
```

- [ ] **Step 2: Verify manually**

Start the dev server, enter any level. The HUD should show:
- Line 1 (y≈10): `RAYA` or `CRUELLA` in colored bold text
- Line 2 (y≈30): level name (e.g. "Sala de Estar") in small grey text, fading to 30% alpha

The two texts must not overlap.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/UIScene.ts
git commit -m "fix: move level name text to y:30 in HUD to prevent overlap with character name"
```

---

## Task 4: Add KEYS.BLADE + generate BLADE sprite in BootScene

**Files:**
- Modify: `src/constants.ts` (KEYS object)
- Modify: `src/scenes/BootScene.ts` (after DIRT_BALL generation, around line 516)

- [ ] **Step 1: Add BLADE key to constants.ts**

Find this block in `constants.ts`:
```typescript
  // projéteis de boss
  DIRT_BALL: 'dirt_ball',
```

Replace with:
```typescript
  // projéteis de boss
  DIRT_BALL: 'dirt_ball',
  BLADE:     'blade',
```

- [ ] **Step 2: Generate BLADE sprite in BootScene.ts**

Find this block in `BootScene.ts` (around line 511–516):
```typescript
// DIRT_BALL: projétil do Aspirador — torrão de terra 12×12
clr()
g.fillStyle(0x5a3a1a); g.fillCircle(6, 6, 6)
g.fillStyle(0x7a5a2a); g.fillCircle(4, 4, 3)
g.fillStyle(0x3a2010); g.fillCircle(8, 8, 2)
gen(KEYS.DIRT_BALL, 12, 12)
```

Add immediately after `gen(KEYS.DIRT_BALL, 12, 12)`:
```typescript

// BLADE: pá giratória do Wall-E — cruz ciana 12×12
clr()
g.lineStyle(2.5, 0x22ccff, 1)
g.beginPath(); g.moveTo(2, 6); g.lineTo(10, 6); g.strokePath()   // linha horizontal
g.beginPath(); g.moveTo(6, 2); g.lineTo(6, 10);  g.strokePath()  // linha vertical
g.lineStyle(1, 0x88eeff, 0.7)
g.beginPath(); g.moveTo(3, 3); g.lineTo(9, 9);   g.strokePath()  // diagonal
g.beginPath(); g.moveTo(9, 3); g.lineTo(3, 9);   g.strokePath()  // diagonal
gen(KEYS.BLADE, 12, 12)
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors related to `KEYS.BLADE`.

- [ ] **Step 4: Commit**

```bash
git add src/constants.ts src/scenes/BootScene.ts
git commit -m "feat: add KEYS.BLADE and generate rotating blade sprite in BootScene"
```

---

## Task 5: Add _throwBlade() to Aspirador and update phase logic

**Files:**
- Modify: `src/entities/enemies/Aspirador.ts`

**Changes:**
- Phase thresholds: 50%/25% → 67%/34% (so Wall-E gets harder sooner)
- Dirt throw: simplify to 1 per timer tick across all phases (multi-blast removed)
- Add `_bladeTimer` field and `_throwBlade()` method
- Call blades in phases 2 and 3

- [ ] **Step 1: Update private fields block**

Find this block (around line 10–16):
```typescript
private phase: Phase = 1
private actionTimer: number = 0
private _isDying = false
private _chargeDir: number = 1
private _playerX: number = 400
private _playerY: number = 360
private _throwTimer: number = 2500
```

Replace with:
```typescript
private phase: Phase = 1
private actionTimer: number = 0
private _isDying = false
private _chargeDir: number = 1
private _playerX: number = 400
private _playerY: number = 360
private _throwTimer: number = 2500
private _bladeTimer: number = 5000
```

- [ ] **Step 2: Update the throw section in update()**

Find this block (around line 62–71):
```typescript
// Lança projéteis de sujeira em direção ao jogador (independente do timer principal)
if (time > this._throwTimer) {
  const count = this.phase === 3 ? 3 : this.phase === 2 ? 2 : 1
  for (let i = 0; i < count; i++) {
    this.scene.time.delayedCall(i * 250, () => {
      if (this.active) this._throwDirt()
    })
  }
  this._throwTimer = time + (this.phase === 3 ? 1500 : this.phase === 2 ? 2000 : 2800)
}
```

Replace with:
```typescript
// Lança projétil de sujeira (arco alto) em todas as fases
if (time > this._throwTimer) {
  this._throwDirt()
  this._throwTimer = time + (this.phase === 3 ? 2000 : 2500)
}

// Lança pá giratória (blade, tiro reto) nas fases 2 e 3
if (this.phase >= 2 && time > this._bladeTimer) {
  if (this.phase === 3) {
    // 2 blades em ângulos ligeiramente diferentes
    this._throwBlade(0)
    this.scene.time.delayedCall(200, () => { if (this.active) this._throwBlade(-12) })
  } else {
    this._throwBlade(0)
  }
  this._bladeTimer = time + (this.phase === 3 ? 2500 : 3000)
}
```

- [ ] **Step 3: Update phase thresholds in _checkPhaseTransition()**

Find this block (around line 74–85):
```typescript
private _checkPhaseTransition(): void {
  const hpPct = this.hp / this.MAX_HP
  if (hpPct <= 0.25 && this.phase < 3) {
    this.phase = 3
    this.speed = 160
    this.setTint(0xff4444)
  } else if (hpPct <= 0.5 && this.phase < 2) {
    this.phase = 2
    this.speed = 120
    this.setTint(0xff8800)
  }
}
```

Replace with:
```typescript
private _checkPhaseTransition(): void {
  const hpPct = this.hp / this.MAX_HP
  if (hpPct <= 0.34 && this.phase < 3) {
    this.phase = 3
    this.speed = 160
    this.setTint(0xff4444)
  } else if (hpPct <= 0.67 && this.phase < 2) {
    this.phase = 2
    this.speed = 120
    this.setTint(0xff8800)
  }
}
```

- [ ] **Step 4: Add _throwBlade() method after _throwDirt()**

Find this block (after _throwDirt, around line 97):
```typescript
/** Visual vacuum pulse — expands circle ring */
```

Insert before it:
```typescript
/** Lança pá giratória em direção ao jogador (tiro reto + spin visual) */
private _throwBlade(angleOffsetDeg: number = 0): void {
  if (!this.scene || !this.active) return
  const dx = this._playerX - this.x
  const dy = this._playerY - this.y
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const speed = this.phase === 3 ? 280 : 220
  const baseAngle = Math.atan2(dy, dx)
  const angle = baseAngle + (angleOffsetDeg * Math.PI / 180)
  const vx = Math.cos(angle) * speed
  const vy = Math.sin(angle) * speed
  this.emit('spawnBlade', { x: this.x, y: this.y - 12, vx, vy })
}

```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/entities/enemies/Aspirador.ts
git commit -m "feat: add Wall-E blade projectile (_throwBlade) and update phase thresholds to 67%/34%"
```

---

## Task 6: Update GameScene to handle spawnBlade event

**Files:**
- Modify: `src/scenes/GameScene.ts` (0-boss handler, around line 351–360)

- [ ] **Step 1: Add spawnBlade listener after spawnProjectile listener**

Find this block (around line 350–360):
```typescript
boss.on('spawnProjectile', (data: { x: number; y: number; vx: number; vy: number }) => {
  if (!this._bossProjectileGroup || !this.scene.isActive(KEYS.GAME)) return
  const proj = this.physics.add.image(data.x, data.y, KEYS.DIRT_BALL)
  proj.setDepth(5)
  const body = proj.body as Phaser.Physics.Arcade.Body
  body.setVelocity(data.vx, data.vy)
  body.setGravityY(600)
  this._bossProjectileGroup.add(proj)
  this.time.delayedCall(3000, () => { if (proj.active) proj.destroy() })
})
```

Add immediately after the closing `})`:
```typescript

boss.on('spawnBlade', (data: { x: number; y: number; vx: number; vy: number }) => {
  if (!this._bossProjectileGroup || !this.scene.isActive(KEYS.GAME)) return
  const blade = this.physics.add.image(data.x, data.y, KEYS.BLADE)
  blade.setDepth(5)
  const body = blade.body as Phaser.Physics.Arcade.Body
  body.setVelocity(data.vx, data.vy)
  body.setGravityY(-300)   // cancela gravidade para tiro reto
  body.angularVelocity = 480
  this._bossProjectileGroup.add(blade)
  this.time.delayedCall(4000, () => { if (blade.active) blade.destroy() })
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Manual smoke test**

Start dev server (`npm run dev`). Enter level `0-boss`. Damage the boss:
- At HP ≤ 5 (phase 2): blades should start appearing as straight cyan projectiles
- At HP ≤ 2 (phase 3): two blades per burst, both spinning, moving at angle toward player

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: handle spawnBlade event in GameScene — straight cyan blade projectiles with spin"
```

---

## Task 7: Expand boss arena and rename to Wall-E

**Files:**
- Modify: `src/levels/World0.ts` (LEVEL_0_BOSS, around line 134–158)
- Modify: `src/constants.ts` (MEDAL_THRESHOLDS)

**New arena: 60 tiles = 1920px. exitX: 1856. New tile layout with 4 high shelves + 4 medium shelves + 2 long bancadas.**

- [ ] **Step 1: Replace LEVEL_0_BOSS entirely**

Find the full `LEVEL_0_BOSS` export in `World0.ts` (lines 134–158). Replace it with:

```typescript
// ── 0-boss: Cozinha — batalha contra o Wall-E ────────────────────────────────
export const LEVEL_0_BOSS: LevelData = {
  id: '0-boss', name: 'Cozinha — Wall-E Ataca!', bgColor: 0xf0f0e8,
  backgroundTheme: 'apto_boss' as const, timeLimit: 0, tileWidthCols: 60,
  tiles: (() => {
    const BC = 60
    const be = (): number[] => Array(BC).fill(0)
    const bg = (): number[] => Array(BC).fill(1)
    const bpm = (...ranges: [number, number][]): number[] => {
      const r = be()
      for (const [x, len] of ranges) for (let i = x; i < x + len; i++) r[i] = 2
      return r
    }
    return [
      be(), be(), be(),
      bpm([4,4], [18,4], [33,4], [48,4]),  // row 3: 4 prateleiras altas
      be(),
      bpm([11,4], [25,4], [40,4], [54,4]), // row 5: 4 prateleiras médias (offset)
      be(), be(), be(), be(),
      bpm([7,6], [32,6]),                   // row 10: 2 bancadas longas de cozinha
      be(), be(), bg(),
    ]
  })(),
  spawnX: 64, spawnY: 300, exitX: 1856, exitY: 370,
  checkpointX: 80, checkpointY: 300,
  enemies: [], items: [], goldenBones: [],
  nextLevel: '0-2', isBossLevel: true,
  intro: {
    complexity: 3,
    dialogue: [
      'Cuidado — esse robô de limpeza virou selvagem!',
      'Wall-E?! Eu preferia um Roomba com melhor gosto.',
    ],
  },
  decorations: [
    { type: 'balcao',    x: 150,  y: G, blocking: true },
    { type: 'mesa',      x: 400,  y: G, blocking: true },
    { type: 'fogao',     x: 650,  y: G, blocking: true },
    { type: 'geladeira', x: 900,  y: G, blocking: true },
    { type: 'balcao',    x: 1100, y: G, blocking: true },
    { type: 'mesa',      x: 1350, y: G, blocking: true },
    { type: 'fogao',     x: 1550, y: G, blocking: true },
    { type: 'geladeira', x: 1750, y: G, blocking: true },
    { type: 'balcao',    x: 1900, y: G, blocking: true },
  ],
}
```

- [ ] **Step 2: Update MEDAL_THRESHOLDS in constants.ts**

Find:
```typescript
  '0-boss':  500,  // boss Aspirador apenas
```

Replace with:
```typescript
  '0-boss':  500,  // boss Wall-E apenas
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/levels/World0.ts src/constants.ts
git commit -m "feat: expand 0-boss arena to 60 tiles (1920px) and rename Aspirador to Wall-E"
```

---

## Task 8: Expand World 0 regular phases (0-1 and 0-2)

**Files:**
- Modify: `src/levels/World0.ts` (LEVEL_0_1 and LEVEL_0_2, and `const COLS`)
- Modify: `src/constants.ts` (MEDAL_THRESHOLDS)

**Key change:** `const COLS = 64 → 96` — this automatically expands both levels since all tile helpers use COLS. Must add platforms + enemies + items for cols 65–95.

- [ ] **Step 1: Change COLS and add multiPlatRow helper in World0.ts**

Find the top of `World0.ts` (lines 1–10):
```typescript
import { LevelData } from './LevelData'

const G = 416 // ground surface y

const COLS = 64
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function platformRow(x: number, len: number): number[] {
  const row = emptyRow(); for (let i = x; i < x + len; i++) row[i] = 2; return row
}
```

Replace with:
```typescript
import { LevelData } from './LevelData'

const G = 416 // ground surface y

const COLS = 96  // expanded: 3072px
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function platformRow(x: number, len: number): number[] {
  const row = emptyRow(); for (let i = x; i < x + len; i++) row[i] = 2; return row
}
function multiPlatRow(...ranges: [number, number][]): number[] {
  const row = emptyRow()
  for (const [x, len] of ranges) for (let i = x; i < x + len; i++) row[i] = 2
  return row
}
```

- [ ] **Step 2: Update LEVEL_0_1 tiles, positions, enemies, items, goldenBones, decorations**

Find the full `LEVEL_0_1` export. Replace with:

```typescript
export const LEVEL_0_1: LevelData = {
  id: '0-1', name: 'Sala de Estar', bgColor: 0xf5e6c8,
  backgroundTheme: 'apartamento' as const, timeLimit: 180, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    multiPlatRow([6,5],  [65,5]),  emptyRow(),  // sofá alto na 2ª metade
    multiPlatRow([16,4], [76,4]),  emptyRow(),  // prateleira de livros
    multiPlatRow([28,5], [86,5]),  emptyRow(),  // mesa de jantar
    multiPlatRow([40,4]),          emptyRow(),
    multiPlatRow([50,5]),          emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3008, exitY: 370,
  checkpointX: 1536, checkpointY: 380,
  checkpointSprite: 'vaso',
  enemies: [
    { type: 'hugo',    x: 500,  y: 390 },
    { type: 'hannah',  x: 1200, y: 390 },
    { type: 'hugo',    x: 1650, y: 390 },
    // 2ª metade — mais NPCs
    { type: 'hannah',  x: 2100, y: 390 },
    { type: 'hugo',    x: 2500, y: 390 },
    { type: 'hannah',  x: 2800, y: 390 },
    { type: 'zelador', x: 2950, y: 390 },  // zelador difícil perto da saída
  ],
  items: [
    { type: 'bone',           x: 160,  y: 380 },
    { type: 'bone',           x: 400,  y: 380 },
    { type: 'petisco',        x: 650,  y: 380 },
    { type: 'bone',           x: 850,  y: 380 },
    { type: 'surprise_block', x: 1000, y: 310 },
    { type: 'laco',           x: 1200, y: 380 },
    { type: 'bone',           x: 1400, y: 380 },
    { type: 'pizza',          x: 1700, y: 380 },
    { type: 'bone',           x: 1900, y: 380 },
    // 2ª metade
    { type: 'bone',           x: 2050, y: 380 },
    { type: 'petisco',        x: 2250, y: 380 },
    { type: 'surprise_block', x: 2400, y: 310 },
    { type: 'bone',           x: 2600, y: 380 },
    { type: 'laco',           x: 2750, y: 380 },
    { type: 'bone',           x: 2900, y: 380 },
  ],
  goldenBones: [
    { x: 220,  y: 80 },
    { x: 1100, y: 96 },
    { x: 1760, y: 80 },
    { x: 2700, y: 80 },  // novo golden bone na 2ª metade
  ],
  nextLevel: '0-boss',
  intro: {
    complexity: 1,
    dialogue: [
      'Precisamos passar pela sala sem que Hugo e Hannah nos vejam!',
      'Deixa comigo, eu sei latir bem alto para distraí-los!',
    ],
  },
  decorations: [
    { type: 'cadeira',   x: 180,  y: G, blocking: true },
    { type: 'mesa',      x: 380,  y: G, blocking: true },
    { type: 'vaso',      x: 580,  y: G, blocking: true },
    { type: 'balcao',    x: 800,  y: G, blocking: true },
    { type: 'balcao',    x: 1080, y: G, blocking: true },
    { type: 'fogao',     x: 1280, y: G, blocking: true },
    { type: 'geladeira', x: 1480, y: G, blocking: true },
    { type: 'balcao',    x: 1680, y: G, blocking: true },
    { type: 'grade',     x: 1900, y: G, blocking: true },
    // Extensão da sala — zona sala de jantar + escritório
    { type: 'cadeira',   x: 2000, y: G, blocking: true },
    { type: 'mesa',      x: 2200, y: G, blocking: true },
    { type: 'estante',   x: 2420, y: G, blocking: true },
    { type: 'vaso',      x: 2620, y: G, blocking: true },
    { type: 'balcao',    x: 2820, y: G, blocking: true },
    { type: 'grade',     x: 2950, y: G, blocking: true },
  ],
}
```

- [ ] **Step 3: Update LEVEL_0_2 tiles, positions, enemies, items, decorations**

Find the full `LEVEL_0_2` export. Replace with:

```typescript
export const LEVEL_0_2: LevelData = {
  id: '0-2', name: 'Estacionamento do Prédio', bgColor: 0x2e2e40,
  backgroundTheme: 'apto_boss' as const, timeLimit: 200, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    emptyRow(), emptyRow(), emptyRow(),
    emptyRow(), emptyRow(), emptyRow(),
    emptyRow(), multiPlatRow([20,5], [50,5], [75,6]),  // tetos de carros + rampa
    emptyRow(), emptyRow(), groundRow(),
  ],
  spawnX: 64, spawnY: 350, exitX: 3008, exitY: 370,
  checkpointX: 1536, checkpointY: 380,
  enemies: [
    { type: 'gato',    x: 400,  y: 390 },
    { type: 'zelador', x: 700,  y: 390 },
    { type: 'gato',    x: 1000, y: 390 },
    { type: 'morador', x: 1200, y: 390 },
    { type: 'zelador', x: 1500, y: 390 },
    { type: 'gato',    x: 1750, y: 390 },
    // 2ª metade
    { type: 'zelador', x: 2000, y: 390 },
    { type: 'gato',    x: 2300, y: 390 },
    { type: 'morador', x: 2550, y: 390 },
    { type: 'gato',    x: 2800, y: 390 },
  ],
  items: [
    { type: 'bone',    x: 160,  y: 380 },
    { type: 'bone',    x: 360,  y: 380 },
    { type: 'petisco', x: 700,  y: 380 },
    { type: 'bone',    x: 960,  y: 380 },
    { type: 'bone',    x: 1150, y: 380 },
    { type: 'pizza',   x: 1400, y: 380 },
    { type: 'bone',    x: 1640, y: 380 },
    { type: 'bone',    x: 1820, y: 380 },
    // 2ª metade
    { type: 'bone',           x: 2000, y: 380 },
    { type: 'petisco',        x: 2200, y: 380 },
    { type: 'surprise_block', x: 2400, y: 310 },
    { type: 'bone',           x: 2600, y: 380 },
    { type: 'bone',           x: 2850, y: 380 },
  ],
  goldenBones: [
    { x: 272,  y: 64 },
    { x: 1024, y: 64 },
    { x: 1760, y: 64 },
    { x: 2650, y: 64 },  // novo
  ],
  nextLevel: '1-1',
  intro: {
    complexity: 2,
    dialogue: [
      'O estacionamento! Zelador e porteiro estão de olho. Não nos peguem!',
      'E eu que achei que o pior era o aspirador… Vamos logo, Raya!',
    ],
  },
  decorations: [
    { type: 'carro',  x: 224,  y: G, blocking: true },
    { type: 'carro',  x: 544,  y: G, blocking: true },
    { type: 'poste',  x: 720,  y: G },
    { type: 'carro',  x: 864,  y: G, blocking: true },
    { type: 'carro',  x: 1120, y: G, blocking: true },
    { type: 'poste',  x: 1280, y: G },
    { type: 'carro',  x: 1440, y: G, blocking: true },
    { type: 'carro',  x: 1664, y: G, blocking: true },
    // Extensão estacionamento
    { type: 'carro',  x: 1900, y: G, blocking: true },
    { type: 'poste',  x: 2080, y: G },
    { type: 'carro',  x: 2240, y: G, blocking: true },
    { type: 'carro',  x: 2464, y: G, blocking: true },
    { type: 'poste',  x: 2640, y: G },
    { type: 'carro',  x: 2800, y: G, blocking: true },
    // Portão triplo de saída
    { type: 'grade',  x: 2900, y: G, blocking: true },
    { type: 'grade',  x: 2940, y: G, blocking: true },
    { type: 'grade',  x: 2980, y: G, blocking: true },
  ],
}
```

- [ ] **Step 4: Update MEDAL_THRESHOLDS in constants.ts**

Find:
```typescript
  '0-1':    1690,  // 3 inimigos×50 + 4 ossos×10 + 3 golden×500
```

Replace with:
```typescript
  '0-1':    2600,  // 7 inimigos×50 + 10 ossos×10 + 4 golden×500 (expandido)
  '0-2':    2350,  // 10 inimigos×50 + 8 ossos×10 + 4 golden×500 (expandido)
```

Note: `'0-2'` may not exist yet in the map — add it. Find the MEDAL_THRESHOLDS object and add both entries.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add src/levels/World0.ts src/constants.ts
git commit -m "feat: expand World0 phases to 96 cols (3072px) with more enemies and platforms in 2nd half"
```

---

## Task 9: Expand World 1 phases

**Files:**
- Modify: `src/levels/World1.ts`
- Modify: `src/constants.ts` (MEDAL_THRESHOLDS)

**Strategy:**
- `1-1` (80 cols): keep width, densify 2nd half only
- `1-2` (80 → 100 cols): add level-specific helper `r12`
- `1-3` (80 → 110 cols): add level-specific helper `r13`

- [ ] **Step 1: Add per-level helpers to World1.ts**

Find the top of `World1.ts`:
```typescript
const COLS = 80
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function platformRow(x: number, len: number): number[] {
  const row = emptyRow(); for (let i = x; i < x + len; i++) row[i] = 2; return row
}
```

Replace with:
```typescript
const COLS = 80
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function platformRow(x: number, len: number): number[] {
  const row = emptyRow(); for (let i = x; i < x + len; i++) row[i] = 2; return row
}

// Helpers para fases expandidas
function mkHelpers(cols: number) {
  const e = (): number[] => Array(cols).fill(0)
  const g = (): number[] => Array(cols).fill(1)
  const p = (x: number, len: number): number[] => {
    const r = e(); for (let i = x; i < x + len; i++) r[i] = 2; return r
  }
  const mp = (...ranges: [number, number][]): number[] => {
    const r = e()
    for (const [x, len] of ranges) for (let i = x; i < x + len; i++) r[i] = 2
    return r
  }
  return { e, g, p, mp }
}
const r12 = mkHelpers(100)   // LEVEL_1_2: 100 cols = 3200px
const r13 = mkHelpers(110)   // LEVEL_1_3: 110 cols = 3520px
```

- [ ] **Step 2: Densify LEVEL_1_1 second half (no tile changes needed)**

Find `LEVEL_1_1` enemies block and replace with:
```typescript
enemies: [
  { type: 'rato',    x: 320,  y: 390 },
  { type: 'morador', x: 600,  y: 390 },
  { type: 'rato',    x: 900,  y: 390 },
  { type: 'morador', x: 1200, y: 390 },
  { type: 'rato',    x: 1500, y: 390 },
  { type: 'dono',    x: 1900, y: 390 },
  { type: 'rato',    x: 2200, y: 390 },
  // 2ª metade densificada
  { type: 'morador', x: 1700, y: 390 },
  { type: 'morador', x: 2000, y: 390 },
  { type: 'dono',    x: 2400, y: 390 },
],
```

Also add to LEVEL_1_1 items block, after existing items:
```typescript
{ type: 'bone',    x: 1600, y: 380 },
{ type: 'petisco', x: 2050, y: 380 },
{ type: 'bone',    x: 2350, y: 380 },
```

- [ ] **Step 3: Replace LEVEL_1_2 with expanded 100-col version**

Find the full `LEVEL_1_2` export. Replace with:

```typescript
export const LEVEL_1_2: LevelData = {
  id: '1-2', name: 'Praça com Jardim', bgColor: 0x90EE90,
  backgroundTheme: 'praca' as const, timeLimit: 200, tileWidthCols: 100,
  tiles: [
    r12.e(), r12.e(),
    r12.mp([5,4], [72,4], [87,4]),  // row 2: plataformas + zona aérea de árvores
    r12.e(),
    r12.p(15, 5), r12.mp([28,3], [78,3]), r12.e(),
    r12.mp([38,6], [90,5]), r12.p(52, 4), r12.e(),
    r12.mp([65,5], [80,4]), r12.e(), r12.e(),
    r12.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3136, exitY: 370,
  checkpointX: 1600, checkpointY: 380,
  enemies: [
    { type: 'pombo',   x: 400,  y: 160 },
    { type: 'morador', x: 700,  y: 390 },
    { type: 'pombo',   x: 1000, y: 140 },
    { type: 'rato',    x: 1300, y: 390 },
    { type: 'pombo',   x: 1600, y: 150 },
    { type: 'dono',    x: 1900, y: 390 },
    { type: 'gato',    x: 2200, y: 390 },
    // 2ª metade
    { type: 'pombo',   x: 2400, y: 140 },
    { type: 'morador', x: 2600, y: 390 },
    { type: 'pombo',   x: 2800, y: 150 },
    { type: 'dono',    x: 3000, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 200,  y: 380 },
    { type: 'bone',           x: 500,  y: 380 },
    { type: 'pipoca',         x: 750,  y: 380 },
    { type: 'surprise_block', x: 1000, y: 310 },
    { type: 'coleira',        x: 1300, y: 380 },
    { type: 'bone',           x: 1500, y: 380 },
    { type: 'bone',           x: 1800, y: 380 },
    { type: 'chapeu',         x: 2100, y: 380 },
    { type: 'bone',           x: 2300, y: 380 },
    // 2ª metade
    { type: 'bone',           x: 2500, y: 380 },
    { type: 'petisco',        x: 2700, y: 380 },
    { type: 'surprise_block', x: 2850, y: 310 },
    { type: 'bone',           x: 3000, y: 380 },
  ],
  goldenBones: [
    { x: 192,  y: 64 },
    { x: 1248, y: 96 },
    { x: 2112, y: 160 },
    { x: 2880, y: 64 },  // novo
  ],
  nextLevel: '1-3',
  intro: {
    complexity: 2,
    dialogue: [
      'Uma praça cheia de ratos! Vamos usar o jardim como cobertura.',
      'Jardim? Eu preferia um spa, mas... vamos nessa, querida!',
    ],
  },
  decorations: [
    { type: 'banco',    x: 150,  y: G },
    { type: 'canteiro', x: 350,  y: G },
    { type: 'arvore',   x: 580,  y: G },
    { type: 'banco',    x: 780,  y: G },
    { type: 'canteiro', x: 980,  y: G },
    { type: 'poste',    x: 1180, y: G },
    { type: 'arvore',   x: 1400, y: G },
    { type: 'banco',    x: 1620, y: G },
    { type: 'canteiro', x: 1850, y: G },
    { type: 'arvore',   x: 2100, y: G },
    { type: 'banco',    x: 2320, y: G },
    // Extensão da praça
    { type: 'canteiro', x: 2520, y: G },
    { type: 'arvore',   x: 2720, y: G },
    { type: 'banco',    x: 2940, y: G },
    { type: 'poste',    x: 3100, y: G },
  ],
}
```

- [ ] **Step 4: Replace LEVEL_1_3 with expanded 110-col version**

Find the full `LEVEL_1_3` export. Replace with:

```typescript
export const LEVEL_1_3: LevelData = {
  id: '1-3', name: 'Mercadinho / Feirinha', bgColor: 0xFFD700,
  backgroundTheme: 'mercado' as const, timeLimit: 200, tileWidthCols: 110,
  tiles: [
    r13.e(), r13.e(), r13.mp([8,5], [20,4]),
    r13.mp([32,5], [45,3]), r13.e(),
    r13.mp([55,6], [65,4]), r13.e(),
    // Zona interior de barraca (cols 70–100): plataformas densas
    r13.mp([70,5], [83,4], [96,4]),
    r13.mp([75,3], [89,3], [103,4]),
    r13.e(), r13.e(), r13.e(), r13.e(),
    r13.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3456, exitY: 370,
  checkpointX: 1760, checkpointY: 380,
  enemies: [
    { type: 'rato',    x: 300,  y: 390 }, { type: 'gato',    x: 600,  y: 390 },
    { type: 'morador', x: 800,  y: 390 }, { type: 'pombo',   x: 1000, y: 120 },
    { type: 'dono',    x: 1200, y: 390 }, { type: 'rato',    x: 1500, y: 390 },
    { type: 'gato',    x: 1700, y: 390 }, { type: 'pombo',   x: 1900, y: 150 },
    { type: 'morador', x: 2100, y: 390 },
    // Zona de barraca interior
    { type: 'gato',    x: 2400, y: 390 },
    { type: 'rato',    x: 2650, y: 390 },
    { type: 'gato',    x: 2900, y: 390 },
    { type: 'morador', x: 3100, y: 390 },
    { type: 'dono',    x: 3300, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 160,  y: 380 }, { type: 'petisco',  x: 400,  y: 380 },
    { type: 'surprise_block', x: 700,  y: 310 }, { type: 'bola',     x: 950,  y: 380 },
    { type: 'bone',           x: 1100, y: 380 }, { type: 'frisbee',  x: 1350, y: 380 },
    { type: 'bandana',        x: 1600, y: 380 }, { type: 'bone',     x: 1850, y: 380 },
    { type: 'surprise_block', x: 2100, y: 300 }, { type: 'bone',     x: 2300, y: 380 },
    // Zona de barraca interior
    { type: 'bone',           x: 2500, y: 380 },
    { type: 'petisco',        x: 2700, y: 380 },
    { type: 'bone',           x: 2900, y: 380 },
    { type: 'surprise_block', x: 3100, y: 300 },
    { type: 'bone',           x: 3300, y: 380 },
  ],
  goldenBones: [
    { x: 288,  y: 64 },
    { x: 1472, y: 96 },
    { x: 2048, y: 192 },
    { x: 3100, y: 64 },  // novo
  ],
  nextLevel: '1-boss',
  intro: {
    complexity: 2,
    dialogue: [
      'O mercadinho está infestado! Donos nervosos por todo lado.',
      'Aquele cheiro de churrasco é perturbador... e delicioso.',
    ],
  },
  decorations: [
    { type: 'barraca',   x: 150,  y: G },
    { type: 'lixeira',   x: 400,  y: G },
    { type: 'poste',     x: 600,  y: G },
    { type: 'barraca',   x: 800,  y: G },
    { type: 'saco_lixo', x: 1050, y: G },
    { type: 'barraca',   x: 1250, y: G },
    { type: 'lixeira',   x: 1500, y: G },
    { type: 'barraca',   x: 1700, y: G },
    { type: 'poste',     x: 1950, y: G },
    { type: 'barraca',   x: 2150, y: G },
    { type: 'lixeira',   x: 2380, y: G },
    // Zona interior
    { type: 'barraca',   x: 2550, y: G },
    { type: 'saco_lixo', x: 2750, y: G },
    { type: 'barraca',   x: 2950, y: G },
    { type: 'lixeira',   x: 3150, y: G },
    { type: 'barraca',   x: 3350, y: G },
  ],
}
```

- [ ] **Step 5: Update MEDAL_THRESHOLDS in constants.ts**

Find the existing 1-1, 1-2, 1-3 thresholds:
```typescript
  '1-1':    1950,  // 7 inimigos×50 + 5 ossos×10 + 3 golden×500
  '1-2':    1950,  // 8 inimigos×50 + 5 ossos×10 + 3 golden×500
  '1-3':    2050,  // 9 inimigos×50 + 5 ossos×10 + 3 golden×500
```

Replace with:
```typescript
  '1-1':    2200,  // 10 inimigos×50 + 7 ossos×10 + 3 golden×500 (densificado)
  '1-2':    2750,  // 11 inimigos×50 + 8 ossos×10 + 4 golden×500 (100 cols)
  '1-3':    3000,  // 15 inimigos×50 + 9 ossos×10 + 4 golden×500 (110 cols)
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add src/levels/World1.ts src/constants.ts
git commit -m "feat: expand World1 phases — densify 1-1, expand 1-2 to 100 cols, 1-3 to 110 cols"
```

---

## Final Verification

After all 9 tasks:

- [ ] Run full test suite: `npx vitest run` — all pass
- [ ] TypeScript clean: `npx tsc --noEmit` — no errors
- [ ] Manual smoke test:
  - Level `0-1`: Hugo e Hannah visíveis, não correm imediatamente para fora do ecrã
  - HUD: nome da fase na 2ª linha, sem sobreposição
  - Level `0-boss` (Wall-E): arena larga, boss não sai do ecrã, blades aparecem nas fases 2/3, saída aparece após boss morrer
  - Levels `1-2` e `1-3`: jogáveis até ao fim sem sair dos bounds do mapa
- [ ] Push: `git push origin main`
