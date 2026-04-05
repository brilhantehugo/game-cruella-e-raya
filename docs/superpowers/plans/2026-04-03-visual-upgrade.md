# Visual Upgrade & UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace geometric placeholders with pixel-art dog sprites, fix movement stuttering, add HowToPlay and IntroCrawl scenes, and fix the Game Over restart flow.

**Architecture:** Pixel art is defined as palette+string grids in `SpriteData.ts` and compiled to `HTMLCanvasElement` in `BootScene` via `makePixelSprite()`. Movement is fixed by using `body.blocked.down` directly instead of the fragile `onGround` flag. Two new scenes (`HowToPlayScene`, `IntroCrawlScene`) are registered in `main.ts` and wired into `MenuScene`. `GameState` gets two new reset methods; `GameOverScene` calls them before restarting.

**Tech Stack:** Phaser 3, TypeScript 5 strict, Vite 5, Vitest (unit tests for GameState only)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/GameState.ts` | Modify | Add `resetAtCheckpoint()` and `resetLevel()` |
| `tests/GameState.test.ts` | Modify | Tests for the two new methods |
| `src/scenes/GameOverScene.ts` | Modify | Call correct reset before restarting |
| `src/scenes/GameScene.ts` | Modify | Remove `fromStart` param from `init()` |
| `src/sprites/SpriteData.ts` | Create | Palette+string pixel art for all characters |
| `src/scenes/BootScene.ts` | Modify | `makePixelSprite()` helper, replace all `makeRect`/`makeCircle` for characters |
| `src/entities/Raya.ts` | Modify | Phaser animations, smaller physics body, `body.blocked.down` ground detection |
| `src/entities/Cruella.ts` | Modify | Phaser animations, smaller physics body, `body.blocked.down` ground detection |
| `src/constants.ts` | Modify | Add `KEYS.INTRO_CRAWL` and `KEYS.HOW_TO_PLAY` |
| `src/scenes/HowToPlayScene.ts` | Create | Full instruction screen |
| `src/scenes/IntroCrawlScene.ts` | Create | Star Wars scroll intro |
| `src/scenes/MenuScene.ts` | Modify | Add H button, route ENTER → IntroCrawl |
| `src/main.ts` | Modify | Register 2 new scenes |

---

## Task 1: GameState — resetAtCheckpoint() and resetLevel()

**Files:**
- Modify: `src/GameState.ts`
- Modify: `tests/GameState.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `tests/GameState.test.ts` (after the last `it` block, before the closing `})`):

```typescript
  describe('resetAtCheckpoint', () => {
    it('restaura corações para 3, limpa power-ups e acessório', () => {
      state.hearts = 0
      state.equippedAccessory = 'laco'
      state.activePowerUp = { type: 'petisco', expiresAt: 99999 }
      state.swapBlockedUntil = 5000
      state.lastHitAt = 1000
      state.resetAtCheckpoint()
      expect(state.hearts).toBe(3)
      expect(state.equippedAccessory).toBeNull()
      expect(state.activePowerUp).toBeNull()
      expect(state.swapBlockedUntil).toBe(0)
      expect(state.lastHitAt).toBe(0)
    })

    it('mantém score, goldenBones e checkpoint', () => {
      state.score = 999
      state.goldenBones = { '1-1': [true, false, true] }
      state.setCheckpoint(400, 300)
      state.hearts = 0
      state.resetAtCheckpoint()
      expect(state.score).toBe(999)
      expect(state.goldenBones['1-1']).toEqual([true, false, true])
      expect(state.checkpointReached).toBe(true)
      expect(state.checkpointX).toBe(400)
      expect(state.checkpointY).toBe(300)
    })
  })

  describe('resetLevel', () => {
    it('restaura corações, limpa checkpoint e power-ups', () => {
      state.hearts = 0
      state.equippedAccessory = 'bandana'
      state.activePowerUp = { type: 'pipoca', expiresAt: 99999 }
      state.setCheckpoint(200, 100)
      state.resetLevel()
      expect(state.hearts).toBe(3)
      expect(state.equippedAccessory).toBeNull()
      expect(state.activePowerUp).toBeNull()
      expect(state.checkpointReached).toBe(false)
      expect(state.checkpointX).toBe(0)
      expect(state.checkpointY).toBe(0)
    })

    it('mantém score e goldenBones mas limpa checkpoint', () => {
      state.score = 500
      state.goldenBones = { '1-1': [true, true, false] }
      state.setCheckpoint(400, 300)
      state.hearts = 0
      state.resetLevel()
      expect(state.score).toBe(500)
      expect(state.goldenBones['1-1']).toEqual([true, true, false])
      expect(state.checkpointReached).toBe(false)
    })
  })
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
/usr/local/bin/node node_modules/.bin/vitest run tests/GameState.test.ts
```

Expected: FAIL — `state.resetAtCheckpoint is not a function`

- [ ] **Step 3: Implement the two methods in GameState.ts**

In `src/GameState.ts`, add after the `resetForCheckpoint()` method (line 121):

```typescript
  resetAtCheckpoint(): void {
    this.hearts = 3
    this.equippedAccessory = null
    this.activePowerUp = null
    this.swapBlockedUntil = 0
    this.lastHitAt = 0
    // keeps: score, goldenBones, collarOfGold, checkpointReached, checkpointX/Y, currentLevel
  }

  resetLevel(): void {
    this.hearts = 3
    this.equippedAccessory = null
    this.activePowerUp = null
    this.swapBlockedUntil = 0
    this.lastHitAt = 0
    this.checkpointReached = false
    this.checkpointX = 0
    this.checkpointY = 0
    // keeps: score, goldenBones, collarOfGold, currentLevel
  }
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
/usr/local/bin/node node_modules/.bin/vitest run tests/GameState.test.ts
```

Expected: All tests PASS (the 14 existing + 4 new)

- [ ] **Step 5: Commit**

```bash
git add src/GameState.ts tests/GameState.test.ts
git commit -m "feat: add resetAtCheckpoint() and resetLevel() to GameState with tests"
```

---

## Task 2: Fix Game Over Restart Flow

**Files:**
- Modify: `src/scenes/GameOverScene.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Fix GameOverScene.ts**

Replace the entire content of `src/scenes/GameOverScene.ts`:

```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'
import { gameState } from '../GameState'

export class GameOverScene extends Phaser.Scene {
  constructor() { super(KEYS.GAME_OVER) }
  create(): void {
    this.add.text(400, 180, 'VOLTA PRA CASA!', { fontSize: '40px', color: '#ff4444' }).setOrigin(0.5)
    this.add.text(400, 270, 'ENTER — recomeçar do checkpoint', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 310, 'R — recomeçar a fase', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5)
    const kb = this.input.keyboard!
    kb.once('keydown-ENTER', () => {
      gameState.resetAtCheckpoint()
      this.scene.start(KEYS.GAME)
    })
    kb.once('keydown-R', () => {
      gameState.resetLevel()
      this.scene.start(KEYS.GAME)
    })
  }
}
```

- [ ] **Step 2: Fix GameScene.init()**

In `src/scenes/GameScene.ts`, replace lines 29–34 (the `init` method):

```typescript
  init(): void {
    // reset is now caller's responsibility (GameOverScene calls gameState.resetAtCheckpoint/resetLevel)
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
/usr/local/bin/node node_modules/.bin/vite build 2>&1 | tail -5
```

Expected: `✓ built in` with no errors

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameOverScene.ts src/scenes/GameScene.ts
git commit -m "fix: game over restart now restores hearts via resetAtCheckpoint/resetLevel"
```

---

## Task 3: SpriteData.ts — Pixel Art Definitions

**Files:**
- Create: `src/sprites/SpriteData.ts`

The sprite data uses a palette+row-string format. Each frame is an array of 32-char strings (one per row). A helper `compile()` converts them to `(string|null)[][][]` for use in BootScene.

- [ ] **Step 1: Create `src/sprites/SpriteData.ts`**

```typescript
export interface CompiledSprite {
  frameWidth: number
  frameHeight: number
  frames: (string | null)[][][]  // [frameIndex][row][col]
}

function compile(
  frameWidth: number,
  frameHeight: number,
  palette: Record<string, string | null>,
  rawFrames: string[][]
): CompiledSprite {
  return {
    frameWidth,
    frameHeight,
    frames: rawFrames.map(rawFrame =>
      rawFrame.map(rowStr =>
        rowStr.split('').map(ch => (ch in palette ? palette[ch] : null))
      )
    ),
  }
}

// ─── Raya (black/gray Pomeranian, yellow bandana) ─────────────────────────────
// 32×32px, 6 frames: idle, walk1, walk2, walk3, walk4, jump
// Palette: . transparent  B black  D dark-gray  G gray  L light-gray
//          Y yellow(bandana)  W white(eye)  A amber(eye)  P pink(nose)

const rP: Record<string, string | null> = {
  '.': null, 'B': '#111111', 'D': '#2e2e2e', 'G': '#5f5f5f',
  'L': '#a0a0a0', 'Y': '#ffd700', 'W': '#f0f0f0', 'A': '#cc8800', 'P': '#bb4455',
}

// Rows 0-24: head, ears, face, bandana, body, tail — same for all walk frames
const rBase: string[] = [
  '................................',  // r00
  '...........BB.....BB............',  // r01 ear tips
  '..........BGDB...BGDB...........',  // r02 ears
  '..........BGGB...BGGB...........',  // r03 ears
  '..........BGGGBBBGGGB...........',  // r04 ears merge
  '..........BGGLLLLLLGGB..........',  // r05 head/face
  '..........BGGLLLLLLGGB..........',  // r06 face
  '..........BGGLWALLLLGPB.........',  // r07 eye(W,A) + nose(P)
  '..........BGGLLLLLLLGGB.........',  // r08 face lower
  '..........BGGGLLLLGGGB..........',  // r09 chin
  '...........BGGGGGGGGB...........',  // r10 chin/neck
  '...........BGYYYYYYGB...........',  // r11 bandana
  '..BBB......BGYYYYYYGB...........',  // r12 tail+bandana
  '.BDDGB.....BGYYYYYGB............',  // r13 tail
  '.BDDGB.....BGGGGGGGB............',  // r14 tail+body top
  '.BDDGB....BDGGGGGGGB............',  // r15 body
  '.BDDGB....BDGGGLLLGGB...........',  // r16 body chest
  '..BDDGB..BDGGGLLLLGGB...........',  // r17 body chest
  '...BDDGBBDGGGGLLLLGGB...........',  // r18 body
  '....BDDGDGGGGGGGGGGB............',  // r19 body
  '.....BDDGGGGGGGGGGB.............',  // r20 body
  '.....BDDGGGGGGGGGGB.............',  // r21 body
  '.....BDGGGGGGGGGGB..............',  // r22 body
  '.....BDGGGGGGGGGB...............',  // r23 body
  '.....BDGGGGGGGGB................',  // r24 body bottom
]

// Leg rows (7 rows: 25-31) for each animation frame
const rLegs: Record<string, string[]> = {
  idle: [
    '.....BDDGBBBBBDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BBBB....BBBB...............',
    '................................',
    '................................',
  ],
  walk1: [
    '.....BDDGBBBBBDDGB..............',
    '...BDDGB.....BDDGB..............',
    '..BDDGB.......BDDGB.............',
    '.BDDGB.........BDDGB............',
    '.BBBB...........BBBB............',
    '................................',
    '................................',
  ],
  walk2: [  // same as idle (mid-step)
    '.....BDDGBBBBBDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BBBB....BBBB...............',
    '................................',
    '................................',
  ],
  walk3: [
    '.....BDDGBBBBBDDGB..............',
    '.......BDDGB.....BDDGB..........',
    '........BDDGB.....BDDGB.........',
    '.........BDDGB.....BDDGB........',
    '.........BBBB......BBBB.........',
    '................................',
    '................................',
  ],
  walk4: [  // same as idle (mid-step)
    '.....BDDGBBBBBDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BBBB....BBBB...............',
    '................................',
    '................................',
  ],
  jump: [
    '................................',
    '....BDDGB.....BDDGB.............',
    '..BDDGB...........BDDGB.........',
    'BDDGB...............BDDGB.......',
    'BBB...................BBB.......',
    '................................',
    '................................',
  ],
}

export const RAYA_SPRITE = compile(32, 32, rP, [
  [...rBase, ...rLegs.idle],
  [...rBase, ...rLegs.walk1],
  [...rBase, ...rLegs.walk2],
  [...rBase, ...rLegs.walk3],
  [...rBase, ...rLegs.walk4],
  [...rBase, ...rLegs.jump],
])

// ─── Cruella (dark Pomeranian, pink bow) ──────────────────────────────────────
// 28×28px, 6 frames: idle, walk1-4, jump
// Palette: . transparent  B black  D very-dark-purple  G dark-purple  L mauve
//          K pink(bow)  W white(eye)  A amber(eye)  P pink(nose)

const cP: Record<string, string | null> = {
  '.': null, 'B': '#110811', 'D': '#2a1a2a', 'G': '#5a3a5a',
  'L': '#9a7a9a', 'K': '#ff69b4', 'W': '#f0f0f0', 'A': '#cc8800', 'P': '#bb4455',
}

// 28-char wide rows, rows 0-21: head, ears, face, bow, body
const cBase: string[] = [
  '............................',  // r00
  '.........BB....BB...........',  // r01 ear tips
  '........BGDB..BGDB..........',  // r02 ears
  '........BGGB..BGGB..........',  // r03 ears
  '........BGGGBBGGGB..........',  // r04 ears merge
  '........BGGLLLLLGGB.........',  // r05 head
  '........BGGLWALLGPB.........',  // r06 eye+nose
  '........BGGLLLLLGGB.........',  // r07 face
  '.........BGGGGGGGGB.........',  // r08 chin
  '.........BGKKKKGGGB.........',  // r09 bow
  '.........BGKKKKKGB..........',  // r10 bow center
  '..BBB....BGKKKKGB...........',  // r11 tail+bow
  '.BDDGB...BGGGGGB............',  // r12 tail
  '.BDDGB...BDGGGGGB...........',  // r13 tail+body
  '.BDDGB..BDGGGLLGB...........',  // r14 body chest
  '..BDDGBBDGGGLLLLGB..........',  // r15 body chest
  '...BDDGDGGGLLLLGB...........',  // r16 body
  '....BDDGGGGGGGGB............',  // r17 body
  '.....BDDGGGGGGGB............',  // r18 body
  '.....BDGGGGGGGGB............',  // r19 body
  '.....BDGGGGGGGB.............',  // r20 body
  '.....BDGGGGGGB..............',  // r21 body bottom
]

const cLegs: Record<string, string[]> = {
  idle: [
    '....BDDGBBBBBDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BBBB....BBBB............',
    '............................',
    '............................',
    '............................',
  ],
  walk1: [
    '....BDDGBBBBBDDGB...........',
    '..BDDGB.....BDDGB...........',
    '.BDDGB.......BDDGB..........',
    '.BBBB.........BBBB..........',
    '............................',
    '............................',
    '............................',
  ],
  walk2: [
    '....BDDGBBBBBDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BBBB....BBBB............',
    '............................',
    '............................',
    '............................',
  ],
  walk3: [
    '....BDDGBBBBBDDGB...........',
    '......BDDGB...BDDGB.........',
    '.......BDDGB...BDDGB........',
    '.......BBBB....BBBB.........',
    '............................',
    '............................',
    '............................',
  ],
  walk4: [
    '....BDDGBBBBBDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BBBB....BBBB............',
    '............................',
    '............................',
    '............................',
  ],
  jump: [
    '............................',
    '...BDDGB.....BDDGB..........',
    '.BDDGB...........BDDGB......',
    '.BBB...............BBB......',
    '............................',
    '............................',
    '............................',
  ],
}

export const CRUELLA_SPRITE = compile(28, 28, cP, [
  [...cBase, ...cLegs.idle],
  [...cBase, ...cLegs.walk1],
  [...cBase, ...cLegs.walk2],
  [...cBase, ...cLegs.walk3],
  [...cBase, ...cLegs.walk4],
  [...cBase, ...cLegs.jump],
])

// ─── Enemies (1 frame each) ───────────────────────────────────────────────────

// GatoMalencarado — gray cat, sitting, 28×28
const gP: Record<string, string | null> = {
  '.': null, 'B': '#222222', 'G': '#777777', 'L': '#bbbbbb',
  'W': '#f0f0f0', 'Y': '#ccaa00', 'P': '#ee6688',
}
export const GATO_SPRITE = compile(28, 28, gP, [[
  '....BBBB.......BBBB.........',  // r00 ears
  '...BGGGGB.....BGGGGB........',  // r01 ears
  '...BGGGGB.....BGGGGB........',  // r02 ears
  '...BGGGGGBBBBBGGGGGB........',  // r03 head
  '...BGGGLLLLLLLLGGGB.........',  // r04 face
  '...BGGGLYWYLYWYGGB..........',  // r05 eyes (Y iris W sclera)
  '...BGGGLLLLLLLLGGGB.........',  // r06 face
  '....BGGGLLLLLLGGG-B.........',  // r07 nose/mouth
  '....BGGGLLLLLLGGGB..........',  // r08 face
  '.....BGGGGGGGGGGB...........',  // r09 chin
  '.....BGGGGGGGGGGB...........',  // r10 neck
  '....BBBBBBBBBBBBBB..........',  // r11 body top
  '....BGGGGGGGGGGGGGB.........',  // r12 body
  '....BGGGLLLLLLLLGGB.........',  // r13 belly
  '....BGGGLLLLLLLLGGB.........',  // r14 belly
  '....BGGGLLLLLLLLGGB.........',  // r15 belly
  '....BGGGLLLLLLLLGGB.........',  // r16 belly
  '....BGGGGGGGGGGGGGB.........',  // r17 body
  '....BBBBBBBBBBBBBBB.........',  // r18 body bottom
  '..BBGGGGGGGGGGGBBB..........',  // r19 tail
  '..BGGGGGGGGGGGGGGB..........',  // r20 tail
  '..BGGGGGGGGGGGGGB...........',  // r21 tail curl
  '....BGGB.....BGGB...........',  // r22 front paws
  '....BGGB.....BGGB...........',  // r23 paws
  '....BBBB.....BBBB...........',  // r24 feet
  '............................',  // r25
  '............................',  // r26
  '............................',  // r27
]])

// PomboAgitado — fat pigeon, wings open, 28×24
const pP: Record<string, string | null> = {
  '.': null, 'B': '#222222', 'G': '#778899', 'L': '#aabbcc',
  'W': '#ffffff', 'R': '#cc3322', 'Y': '#ccaa00',
}
export const POMBO_SPRITE = compile(28, 24, pP, [[
  '...........BBBB.............',  // r00 head
  '..........BGGGB.............',  // r01 head
  '..........BGWRB.............',  // r02 eye+beak
  '..........BGGB..............',  // r03 head
  'BBBBB......BBB.......BBBBB..',  // r04 wing + body + wing
  'BGGGGGBB.BGGGB.BBGGGGGB.....',  // r05 wings spread
  'BGLLLGGGBBGGGBBBGGGLLLLGB...',  // r06 wings
  'BGLLLLGGGBGGGGBGGGLLLLGB....',  // r07 wings
  '.BGLLLLGGGGGGGGGGLLLLGB.....',  // r08 wings inner
  '..BGLLLGGGGGGGGGGLLLGB......',  // r09 wings fold
  '...BGLLLGGGGGGGGLLLGB.......',  // r10 wings fold
  '....BGLLGGGGGGGGLLGB........',  // r11
  '.....BGGGGGGGGGGGGB.........',  // r12 body
  '.....BGGGWWWWWWGGGB.........',  // r13 belly
  '.....BGGGWWWWWWGGGB.........',  // r14 belly
  '.....BGGGWWWWWWGGGB.........',  // r15 belly
  '.....BGGGGGGGGGGB...........',  // r16 body bottom
  '......BBBYYYYYBBB...........',  // r17 feet
  '......BYYB...BYYB...........',  // r18 feet
  '......BYYB...BYYB...........',  // r19 feet
  '......BBYB...BBYB...........',  // r20 toes
  '................................',  // r21
  '................................',  // r22
  '................................',  // r23
]])

// RatoDeCalcada — slim rat, long tail, 24×20
const ratoP: Record<string, string | null> = {
  '.': null, 'B': '#221100', 'G': '#774422', 'L': '#aa7744',
  'P': '#ffaacc', 'W': '#ffddcc', 'R': '#cc2200',
}
export const RATO_SPRITE = compile(24, 20, ratoP, [[
  '.................BBBB...',  // r00 head
  '................BGGGGB..',  // r01 head
  '...............BGGGWRLB.',  // r02 eye+nose
  '...............BGGGGGGB.',  // r03 head
  '....BBB........BGGGGGB..',  // r04 tail + snout
  '...BPPPPB.....BGGGGB....',  // r05 tail
  '..BPPPPPPB..BGGGGB......',  // r06 tail
  '.BPPPPPPPBBGGGGB........',  // r07 tail
  '.BPPPPPPPGGGGGB.........',  // r08 tail+body
  '.BPPPPPPGGGGGB..........',  // r09 body
  '..BPPPPPGGGGGB..........',  // r10 body
  '..BPPPPGGLLLGGB.........',  // r11 belly
  '..BPPPGGLLLLLGB.........',  // r12 belly
  '..BPPGGGGGGGGB..........',  // r13 body
  '..BPGGGGGGGB............',  // r14 body bottom
  '...BBBBBBBB.............',  // r15 legs base
  '...BGGB.BGGB............',  // r16 legs
  '...BGGB.BGGB............',  // r17 legs
  '...BBBB.BBBB............',  // r18 feet
  '........................',  // r19
]])

// DonoNervoso — tall human silhouette, suit, 24×48
const donoP: Record<string, string | null> = {
  '.': null, 'B': '#111133', 'D': '#223366', 'G': '#334499',
  'L': '#ffddcc', 'W': '#ffffff', 'Y': '#ffcc00',
}
export const DONO_SPRITE = compile(24, 48, donoP, [[
  '.........BBBB...........',  // r00 head
  '........BLLLLB..........',  // r01 head
  '........BLLLLB..........',  // r02 head
  '........BLLLLB..........',  // r03 head
  '.........BBBB...........',  // r04 chin
  '........BDDDDDB.........',  // r05 shirt collar
  '.......BDGGGGGGGB.......',  // r06 shoulders
  '.......BDGGWWWGGDB......',  // r07 chest (shirt)
  '.......BDGGWWWGGDB......',  // r08 chest
  '.......BDGGGGGGGGB......',  // r09 chest
  '......BDGGGGGGGGGDB.....',  // r10 jacket
  '......BDGGGGGGGGGDB.....',  // r11 jacket
  '......BDGGGGGGGGGDB.....',  // r12 jacket
  '.....BDGGGGGGGGGGGGB....',  // r13 arms out (upset)
  '....BDGGGGGGGGGGGGGDB...',  // r14 arms wider
  '...BDGGGGGGGGGGGGGGGGB..',  // r15 arms spread
  '..BDGGGLLLLLLLLLGGGGGDB.',  // r16 hands visible
  '..BBBBLLLLLLLLLLBBBBBBB.',  // r17 hands
  '......BDGGGGGGGDB.......',  // r18 waist
  '......BDGGGGGGGDB.......',  // r19 waist
  '......BDGGGGGGGDB.......',  // r20 hips
  '......BDGGGGGGGDB.......',  // r21 hips
  '.......BGGGBGGGB........',  // r22 legs split
  '.......BGGGBGGGB........',  // r23 legs
  '.......BGGGBGGGB........',  // r24 legs
  '.......BGGGBGGGB........',  // r25 legs
  '.......BGGGBGGGB........',  // r26 legs
  '.......BGGGBGGGB........',  // r27 legs
  '.......BGGGBGGGB........',  // r28 legs
  '.......BGGGBGGGB........',  // r29 legs
  '.......BGGGGGGB.........',  // r30 legs merge
  '.......BGGGGGGB.........',  // r31 legs
  '.......BBBBBBBB.........',  // r32 feet
  '........................',  // r33
  '........................',  // r34
  '........................',  // r35
  '........................',  // r36
  '........................',  // r37
  '........................',  // r38
  '........................',  // r39
  '........................',  // r40
  '........................',  // r41
  '........................',  // r42
  '........................',  // r43
  '........................',  // r44
  '........................',  // r45
  '........................',  // r46
  '........................',  // r47
]])

// SeuBigodes — enormous dark cat boss, 48×48
const bigP: Record<string, string | null> = {
  '.': null, 'B': '#111111', 'D': '#1a1a1a', 'G': '#2e2e2e',
  'L': '#555555', 'W': '#f0f0f0', 'Y': '#cc9900', 'P': '#ee3355',
  'R': '#ff0000',
}
export const BIGODES_SPRITE = compile(48, 48, bigP, [[
  '................................................',  // r00
  '......BBBB.......................BBBB...........',  // r01 ears
  '.....BGGGB.......................BGGGB..........',  // r02 ears
  '.....BGGGB.......................BGGGB..........',  // r03 ears
  '.....BGGGBBBBBBBBBBBBBBBBBBBBBBBGGGB...........',  // r04 head
  '.....BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB...........',  // r05 head
  '.....BGGGGGLLLLLLLLLLLLLLLLLLGGGGGB............',  // r06 face
  '.....BGGGGLLLLLLLLLLLLLLLLLLLGGGGB.............',  // r07 face
  '....BGGGGGLLLWYLLYWYLLYWYLLLLGGGGGB............',  // r08 eyes (W sclera Y iris)
  '....BGGGGGLLLLLLLLLLLLLLLLLLGGGGGGB............',  // r09 face
  '....BGGGGGLLLLLLLLLLLLLLLLLGGGGGB.............',  // r10 face
  '....BGGGGGGGGLLLLLLLLLLGGGGGGGGGB.............',  // r11 muzzle
  '...BGGGGGGGGGLLLLPLLLLGGGGGGGGGB..............',  // r12 nose
  '...BGGGGGGGGGLLLLLLLLLLGGGGGGGGGB..............',  // r13 muzzle
  'BBBBBBBGGGGGGGGLLLLLLGGGGGGGBBBBBB.............',  // r14 whiskers
  'BLLLLLLBGGGGGGGGGGGGGGGGGGGGBLLLLLB............',  // r15 whiskers
  '.BLLLLLLBGGGGGGGGGGGGGGGGGGGBLLLLB.............',  // r16 whiskers
  '..BLLLLLBBGGGGGGGGGGGGGGGGGBBLLLLB.............',  // r17 whiskers
  '....BBBBBGGGGGGGGGGGGGGGGGGGBBBBB..............',  // r18 neck
  '....BGGGGGGGGGGGGGGGGGGGGGGGGGGB...............',  // r19 neck
  '....BGGGGGGGGGGGGGGGGGGGGGGGGGGB...............',  // r20 neck
  '...BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............',  // r21 body top
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB............',  // r22 body
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB............',  // r23 body
  '...BGGGGGLLLLLLLLLLLLLLLLLLLLGGGGGB............',  // r24 belly
  '...BGGGGGLLLLLLLLLLLLLLLLLLLLGGGGGB............',  // r25 belly
  '...BGGGGGLLLLLLLLLLLLLLLLLLLLGGGGGB............',  // r26 belly
  '...BGGGGGLLLLLLLLLLLLLLLLLLLLGGGGGB............',  // r27 belly
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB............',  // r28 body
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB............',  // r29 body
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB............',  // r30 body
  '....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............',  // r31 body bottom
  '....BGGGB..BGGGB..BGGGB..BGGGB.................',  // r32 legs
  '....BGGGB..BGGGB..BGGGB..BGGGB.................',  // r33 legs
  '....BGGGB..BGGGB..BGGGB..BGGGB.................',  // r34 legs
  '....BGGGB..BGGGB..BGGGB..BGGGB.................',  // r35 legs
  '....BGGGB..BGGGB..BGGGB..BGGGB.................',  // r36 legs
  '....BBBBB..BBBBB..BBBBB..BBBBB.................',  // r37 paws
  '................................................',  // r38
  '................................................',  // r39
  '................................................',  // r40
  '................................................',  // r41
  '................................................',  // r42
  '................................................',  // r43
  '................................................',  // r44
  '................................................',  // r45
  '................................................',  // r46
  '................................................',  // r47
]])
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
/usr/local/bin/node node_modules/.bin/vite build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors (SpriteData is not yet imported anywhere)

- [ ] **Step 3: Commit**

```bash
git add src/sprites/SpriteData.ts
git commit -m "feat: add SpriteData.ts with pixel-art palette+string definitions for all characters"
```

---

## Task 4: BootScene — makePixelSprite() helper

**Files:**
- Modify: `src/scenes/BootScene.ts`

The helper creates a wide canvas (frameWidth × frames.length width), paints each frame side-by-side pixel by pixel, then registers with `scene.textures.addSpriteSheet()`. Non-player sprites have 1 frame and are registered with `scene.textures.addImage()` equivalent (single-frame spritesheet).

- [ ] **Step 1: Replace BootScene.ts entirely**

```typescript
import Phaser from 'phaser'
import { KEYS, TILE_SIZE } from '../constants'
import { CompiledSprite, RAYA_SPRITE, CRUELLA_SPRITE, GATO_SPRITE, POMBO_SPRITE, RATO_SPRITE, DONO_SPRITE, BIGODES_SPRITE } from '../sprites/SpriteData'

export class BootScene extends Phaser.Scene {
  constructor() { super(KEYS.BOOT) }

  create(): void {
    // ── Pixel sprites ──────────────────────────────────────────────────────────
    this._makePixelSprite(KEYS.RAYA,    RAYA_SPRITE)
    this._makePixelSprite(KEYS.CRUELLA, CRUELLA_SPRITE)
    this._makePixelSprite(KEYS.GATO,    GATO_SPRITE)
    this._makePixelSprite(KEYS.POMBO,   POMBO_SPRITE)
    this._makePixelSprite(KEYS.RATO,    RATO_SPRITE)
    this._makePixelSprite(KEYS.DONO,    DONO_SPRITE)
    this._makePixelSprite(KEYS.BIGODES, BIGODES_SPRITE)

    // ── Geometric tiles and items (unchanged) ──────────────────────────────────
    const g = this.make.graphics({ x: 0, y: 0 })

    const makeRect = (key: string, w: number, h: number, fill: number, stroke?: number) => {
      g.clear()
      g.fillStyle(fill)
      g.fillRect(0, 0, w, h)
      if (stroke !== undefined) {
        g.lineStyle(2, stroke)
        g.strokeRect(1, 1, w - 2, h - 2)
      }
      g.generateTexture(key, w, h)
    }

    const makeCircle = (key: string, r: number, fill: number) => {
      g.clear()
      g.fillStyle(fill)
      g.fillCircle(r, r, r)
      g.generateTexture(key, r * 2, r * 2)
    }

    makeRect(KEYS.TILE_GROUND,    TILE_SIZE,     TILE_SIZE,     0x8b5e3c, 0x5a3a1a)
    makeRect(KEYS.TILE_PLATFORM,  TILE_SIZE,     TILE_SIZE / 2, 0x5a8f3c, 0x3a6020)
    makeCircle(KEYS.BONE,         8,             0xf5f0e0)
    makeCircle(KEYS.GOLDEN_BONE,  10,            0xffd700)
    makeRect(KEYS.PETISCO,        20, 14,        0xff8c00)
    makeRect(KEYS.PIPOCA,         16, 20,        0xfffacd)
    makeRect(KEYS.PIZZA,          22, 22,        0xff6347)
    makeRect(KEYS.CHURRASCO,      24, 18,        0x8b0000)
    makeCircle(KEYS.BOLA,         10,            0xadff2f)
    makeRect(KEYS.FRISBEE,        24, 8,         0x00bcd4)
    makeRect(KEYS.LACO,           16, 12,        0xff69b4)
    makeRect(KEYS.COLEIRA,        24, 8,         0xcd853f)
    makeRect(KEYS.CHAPEU,         24, 14,        0xff1493)
    makeRect(KEYS.BANDANA,        20, 10,        0xff4500)
    makeRect(KEYS.COLLAR_GOLD,    24, 8,         0xffd700, 0xb8860b)
    makeCircle(KEYS.HEART,        12,            0xff3355)
    makeCircle(KEYS.HEART_EMPTY,  12,            0x333333)
    makeRect(KEYS.HYDRANT,        20, 32,        0xff2200, 0xaa0000)
    makeRect(KEYS.EXIT_GATE,      48, 64,        0x8b6914, 0x5a4010)
    makeRect(KEYS.SURPRISE_BLOCK, TILE_SIZE, TILE_SIZE, 0xffd700, 0xb8860b)

    g.destroy()
    this.scene.start(KEYS.MENU)
  }

  private _makePixelSprite(key: string, sprite: CompiledSprite): void {
    const { frameWidth, frameHeight, frames } = sprite
    const canvas = document.createElement('canvas')
    canvas.width  = frameWidth * frames.length
    canvas.height = frameHeight
    const ctx = canvas.getContext('2d')!

    frames.forEach((frame, fi) => {
      const offsetX = fi * frameWidth
      frame.forEach((rowPixels, ry) => {
        rowPixels.forEach((color, rx) => {
          if (color === null) return
          ctx.fillStyle = color
          ctx.fillRect(offsetX + rx, ry, 1, 1)
        })
      })
    })

    this.textures.addSpriteSheet(key, canvas, { frameWidth, frameHeight })
  }
}
```

- [ ] **Step 2: Build to verify no errors**

```bash
/usr/local/bin/node node_modules/.bin/vite build 2>&1 | tail -8
```

Expected: `✓ built in` with no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: BootScene uses makePixelSprite() to register pixel-art spritesheets"
```

---

## Task 5: Raya.ts — animations + physics body fix + movement fix

**Files:**
- Modify: `src/entities/Raya.ts`

Changes:
1. Remove `onGround: boolean` field and `setOnGround()` method
2. Add `private wasGrounded: boolean = false` for edge detection
3. Set smaller physics body in constructor (`setBodySize(22, 26)`, `setOffset(5, 3)`)
4. Add `setScale(2)` so 32px sprite appears as 64px (adjust to taste)
5. Replace ground check in update with `body.blocked.down`
6. Play animations based on movement state

- [ ] **Step 1: Replace Raya.ts entirely**

```typescript
import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'

export class Raya extends Phaser.Physics.Arcade.Sprite {
  private jumpsLeft: number = 2
  private isDashing: boolean = false
  private dashCooldown: boolean = false
  private wasGrounded: boolean = false
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shiftKey!: Phaser.Input.Keyboard.Key

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.RAYA)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.setScale(2)
    // Smaller physics body prevents catching on tile seams
    this.setBodySize(22, 26)
    this.setOffset(5, 3)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

    // Register animations (safe to call multiple times — Phaser skips if already exists)
    if (!scene.anims.exists('raya-idle')) {
      scene.anims.create({ key: 'raya-idle', frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [0] }), frameRate: 1, repeat: -1 })
      scene.anims.create({ key: 'raya-walk', frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [1, 2, 3, 4] }), frameRate: 8, repeat: -1 })
      scene.anims.create({ key: 'raya-jump', frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [5] }), frameRate: 1, repeat: -1 })
    }
    this.play('raya-idle')
  }

  update(speedBonus: number = 0): void {
    if (this.isDashing) return

    const body = this.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down

    // Edge detection: just landed → reset double jump
    if (onGround && !this.wasGrounded) {
      this.jumpsLeft = 2
    }
    this.wasGrounded = onGround

    const speed = PHYSICS.RAYA_SPEED + speedBonus
    let moving = false

    if (this.cursors.left.isDown) {
      this.setVelocityX(-speed)
      this.setFlipX(true)
      moving = true
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(speed)
      this.setFlipX(false)
      moving = true
    } else {
      this.setVelocityX(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.jumpsLeft > 0) {
      this.setVelocityY(PHYSICS.JUMP_VELOCITY)
      this.jumpsLeft--
    }

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.dashCooldown) {
      this.dash()
    }

    // Animation
    if (!onGround) {
      this.play('raya-jump', true)
    } else if (moving) {
      this.play('raya-walk', true)
    } else {
      this.play('raya-idle', true)
    }
  }

  private dash(): void {
    this.isDashing = true
    this.dashCooldown = true
    const dir = this.flipX ? -1 : 1
    this.setVelocityX(dir * PHYSICS.DASH_VELOCITY)
    this.setVelocityY(0)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)

    this.scene.time.delayedCall(PHYSICS.DASH_DURATION, () => {
      this.isDashing = false
      body.setAllowGravity(true)
    })

    this.scene.time.delayedCall(800, () => {
      this.dashCooldown = false
    })
  }

  getIsDashing(): boolean { return this.isDashing }
}
```

- [ ] **Step 2: Check if GameScene or Player.ts references setOnGround — fix if so**

```bash
grep -rn 'setOnGround\|onGround' /Users/apple/Desktop/github/game-cruella-e-raya/src/
```

For each file that references `setOnGround` or calls `raya.setOnGround()`, remove the call. The ground collision callbacks in `GameScene._setupCollisions()` that called `setOnGround(true)` should be removed.

- [ ] **Step 3: Build to verify**

```bash
/usr/local/bin/node node_modules/.bin/vite build 2>&1 | tail -8
```

Expected: `✓ built in` with no errors

- [ ] **Step 4: Commit**

```bash
git add src/entities/Raya.ts
git commit -m "fix: Raya uses body.blocked.down for ground detection, smaller physics body, pixel-art animations"
```

---

## Task 6: Cruella.ts — animations + physics body fix + movement fix

**Files:**
- Modify: `src/entities/Cruella.ts`

Changes mirror Raya: remove `onGround`/`setOnGround`, use `body.blocked.down`, smaller body, animations. Cruella has single jump (not double), no `wasGrounded` needed.

- [ ] **Step 1: Replace Cruella.ts entirely**

```typescript
import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'
import { Enemy } from './Enemy'

export class Cruella extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shiftKey!: Phaser.Input.Keyboard.Key
  private barkCooldown: boolean = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.CRUELLA)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.setScale(2)
    // Smaller body prevents tile-seam stuttering
    this.setBodySize(18, 22)
    this.setOffset(5, 3)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

    if (!scene.anims.exists('cruella-idle')) {
      scene.anims.create({ key: 'cruella-idle', frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [0] }), frameRate: 1, repeat: -1 })
      scene.anims.create({ key: 'cruella-walk', frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [1, 2, 3, 4] }), frameRate: 8, repeat: -1 })
      scene.anims.create({ key: 'cruella-jump', frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [5] }), frameRate: 1, repeat: -1 })
    }
    this.play('cruella-idle')
  }

  update(speedBonus: number = 0): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down
    const speed = PHYSICS.CRUELLA_SPEED + speedBonus
    let moving = false

    if (this.cursors.left.isDown) {
      this.setVelocityX(-speed)
      this.setFlipX(true)
      moving = true
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(speed)
      this.setFlipX(false)
      moving = true
    } else {
      this.setVelocityX(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && onGround) {
      this.setVelocityY(PHYSICS.JUMP_VELOCITY)
    }

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.barkCooldown) {
      this.bark()
    }

    // Animation
    if (!onGround) {
      this.play('cruella-jump', true)
    } else if (moving) {
      this.play('cruella-walk', true)
    } else {
      this.play('cruella-idle', true)
    }
  }

  bark(): void {
    this.barkCooldown = true
    this.emit('bark', this.x, this.y)
    this.scene.time.delayedCall(1500, () => { this.barkCooldown = false })
  }

  checkIntimidation(enemies: Enemy[]): void {
    enemies.forEach(enemy => {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist <= PHYSICS.BARK_RADIUS * 1.5 && Math.random() < 0.02) {
        enemy.flee(this.x)
      }
    })
  }
}
```

- [ ] **Step 2: Check Player.ts for setGrounded() or setOnGround() — remove**

```bash
grep -n 'setGrounded\|setOnGround\|onGround' /Users/apple/Desktop/github/game-cruella-e-raya/src/entities/Player.ts
```

Remove `setGrounded()` from `Player.ts` and any calls to it in `GameScene._setupCollisions()`.

- [ ] **Step 3: Build to verify**

```bash
/usr/local/bin/node node_modules/.bin/vite build 2>&1 | tail -8
```

Expected: `✓ built in` with no errors

- [ ] **Step 4: Commit**

```bash
git add src/entities/Cruella.ts src/entities/Player.ts src/scenes/GameScene.ts
git commit -m "fix: Cruella uses body.blocked.down, smaller physics body, pixel-art animations; remove setOnGround"
```

---

## Task 7: HowToPlayScene + MenuScene H button

**Files:**
- Modify: `src/constants.ts`
- Create: `src/scenes/HowToPlayScene.ts`
- Modify: `src/scenes/MenuScene.ts`

- [ ] **Step 1: Add HOW_TO_PLAY key to constants.ts**

In `src/constants.ts`, in the `KEYS` object after `GALLERY: 'GalleryScene'`:

```typescript
  HOW_TO_PLAY: 'HowToPlayScene',
```

- [ ] **Step 2: Create HowToPlayScene.ts**

```typescript
import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super(KEYS.HOW_TO_PLAY) }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    const cx = GAME_WIDTH / 2
    let y = 30

    const title = (text: string) => {
      this.add.text(cx, y, text, { fontSize: '26px', color: '#ff6b6b', fontStyle: 'bold' }).setOrigin(0.5)
      y += 36
    }
    const section = (text: string) => {
      this.add.text(cx, y, text, { fontSize: '15px', color: '#ffff88', fontStyle: 'bold' }).setOrigin(0.5)
      y += 22
    }
    const line = (text: string, color = '#dddddd') => {
      this.add.text(cx, y, text, { fontSize: '13px', color }).setOrigin(0.5)
      y += 18
    }
    const gap = (n = 8) => { y += n }
    const rule = () => {
      this.add.rectangle(cx, y + 4, GAME_WIDTH - 60, 1, 0x444444)
      y += 12
    }

    title('COMO JOGAR')
    rule()

    section('CONTROLES')
    line('← →     Mover')
    line('ESPAÇO  Pular')
    line('SHIFT   Habilidade especial')
    line('TAB     Trocar cachorra  (cooldown 1.5s)')
    line('ESC     Pausar')
    gap()
    rule()

    section('RAYA')
    line('Pulo duplo', '#ffaaaa')
    line('Dash horizontal (SHIFT) — atravessa inimigos', '#ffaaaa')
    gap()
    section('CRUELLA')
    line('Latido (SHIFT) — atordoa inimigos próximos', '#aaaaff')
    line('Intimidação passiva — inimigos fogem ao se aproximar', '#aaaaff')
    gap()
    rule()

    section('ITENS')
    line('Osso           +10 pts')
    line('Osso Dourado   +500 pts  (3 por fase, secretos)')
    line('Petisco        velocidade +')
    line('Pipoca         pulo mais alto')
    line('Churrasco      invencível 10s')
    line('Pizza          restaura coração')
    gap(12)
    rule()

    this.add.text(cx, GAME_HEIGHT - 22, 'BACKSPACE — voltar', {
      fontSize: '13px', color: '#888888'
    }).setOrigin(0.5)

    this.input.keyboard!.once('keydown-BACKSPACE', () => {
      this.scene.start(KEYS.MENU)
    })
  }
}
```

- [ ] **Step 3: Add H button to MenuScene**

In `src/scenes/MenuScene.ts`, after the `galBtn` definition (around line 50), add:

```typescript
    const howBtn = this.add.text(GAME_WIDTH / 2, 370, '[ H — COMO JOGAR ]', {
      fontSize: '18px', color: '#88ffaa'
    }).setOrigin(0.5).setInteractive()
```

Then in the keyboard/pointer setup section, add:

```typescript
    kb.on('keydown-H', () => { this.scene.start(KEYS.HOW_TO_PLAY) })
    howBtn.on('pointerdown', () => { this.scene.start(KEYS.HOW_TO_PLAY) })
```

And in the `shutdown` cleanup:

```typescript
      kb.off('keydown-H')
```

- [ ] **Step 4: Register HowToPlayScene in main.ts**

In `src/main.ts`, add import:

```typescript
import { HowToPlayScene } from './scenes/HowToPlayScene'
```

And add `HowToPlayScene` to the `scene` array (after `GalleryScene`).

- [ ] **Step 5: Build to verify**

```bash
/usr/local/bin/node node_modules/.bin/vite build 2>&1 | tail -8
```

Expected: `✓ built in`

- [ ] **Step 6: Commit**

```bash
git add src/constants.ts src/scenes/HowToPlayScene.ts src/scenes/MenuScene.ts src/main.ts
git commit -m "feat: HowToPlayScene with full instructions, H key in MenuScene"
```

---

## Task 8: IntroCrawlScene + wire MenuScene + register in main.ts

**Files:**
- Modify: `src/constants.ts`
- Create: `src/scenes/IntroCrawlScene.ts`
- Modify: `src/scenes/MenuScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Add INTRO_CRAWL key to constants.ts**

In `src/constants.ts`, in the `KEYS` object after `HOW_TO_PLAY: 'HowToPlayScene'`:

```typescript
  INTRO_CRAWL: 'IntroCrawlScene',
```

- [ ] **Step 2: Create IntroCrawlScene.ts**

```typescript
import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'

const CRAWL_TEXT = [
  'Em uma tarde ensolarada no bairro...',
  '',
  'Raya, a maior e mais corajosa das duas,',
  'convenceu Cruella de que era absolutamente',
  'necessário investigar o outro lado da rua.',
  '',
  'Cruella, a menor e mais cética,',
  'latiu três vezes em sinal de protesto.',
  'Mas foi mesmo assim.',
  '',
  'O portão estava aberto.',
  'O mundo estava ali.',
  '',
  'Havia gatos que as olhavam com desprezo.',
  'Pombos que não ligavam para ninguém.',
  'Ratos que corriam rápido demais.',
  'E um Dono Nervoso que gritava seus nomes',
  'em cada esquina.',
  '',
  'No fim da rua, dizem os mais velhos,',
  'mora Seu Bigodes — um gato enorme e ranzinza',
  'que guarda o maior depósito de lixo do bairro',
  'como se fosse um tesouro sagrado.',
  '',
  'Ninguém voltou de lá para contar a história.',
  '',
  'Até hoje.',
  '',
  'Boa sorte, pequenas.',
  'Vocês vão precisar.',
]

export class IntroCrawlScene extends Phaser.Scene {
  constructor() { super(KEYS.INTRO_CRAWL) }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000')

    const container = this.add.container(GAME_WIDTH / 2, 0)

    // Build text blocks from bottom to top; lines near top get smaller font (perspective)
    const lineHeight = 26
    const totalLines = CRAWL_TEXT.length
    const textObjects: Phaser.GameObjects.Text[] = []

    CRAWL_TEXT.forEach((txt, i) => {
      // Perspective: lines at the top of the container (lower i = farther away) get smaller
      const progress = i / (totalLines - 1)     // 0 at top, 1 at bottom
      const fontSize = Math.round(14 + progress * 8)  // 14px→22px
      const alpha = 0.6 + progress * 0.4              // 0.6→1.0

      const t = this.add.text(0, i * lineHeight, txt, {
        fontSize: `${fontSize}px`,
        color: '#ffe81f',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5, 0).setAlpha(alpha)
      container.add(t)
      textObjects.push(t)
    })

    const totalHeight = totalLines * lineHeight
    container.setY(GAME_HEIGHT + 60)

    // Scroll tween: 22 seconds, linear
    this.tweens.add({
      targets: container,
      y: -(totalHeight + 60),
      duration: 22000,
      ease: 'Linear',
      onComplete: () => this._start(),
    })

    // Skip with ENTER or SPACE
    const kb = this.input.keyboard!
    kb.once('keydown-ENTER', () => this._start())
    kb.once('keydown-SPACE',  () => this._start())
  }

  private _start(): void {
    this.tweens.killAll()
    this.scene.start(KEYS.GAME)
  }
}
```

- [ ] **Step 3: Redirect ENTER in MenuScene to IntroCrawlScene**

In `src/scenes/MenuScene.ts`, change the `startGame` function body from:

```typescript
      this.scene.start(KEYS.GAME)
```

to:

```typescript
      this.scene.start(KEYS.INTRO_CRAWL)
```

(The `gameState.reset()` and `gameState.currentLevel = '1-1'` lines stay — they happen before the scene change.)

- [ ] **Step 4: Register IntroCrawlScene in main.ts**

Add import:

```typescript
import { IntroCrawlScene } from './scenes/IntroCrawlScene'
```

Add `IntroCrawlScene` to the `scene` array (after `HowToPlayScene`).

- [ ] **Step 5: Build to verify**

```bash
/usr/local/bin/node node_modules/.bin/vite build 2>&1 | tail -8
```

Expected: `✓ built in`

- [ ] **Step 6: Commit and push**

```bash
git add src/constants.ts src/scenes/IntroCrawlScene.ts src/scenes/MenuScene.ts src/main.ts
git commit -m "feat: IntroCrawlScene Star Wars crawl, MenuScene routes to intro before game"
git push origin main
```

---

## Spec Coverage Check

| Requirement | Task |
|---|---|
| Cachorro com aparência real (pixel art) | 3, 4 |
| Inimigos redesenhados | 3, 4 |
| Animações walk/jump/idle | 5, 6 |
| Correção do movimento travando | 5, 6 |
| Tela "Como Jogar" | 7 |
| Intro narrativa estilo Star Wars | 8 |
| Restart do checkpoint funciona (corações restaurados) | 1, 2 |
| Restart da fase funciona (checkpoint limpo) | 1, 2 |
| Testes unitários para resetAtCheckpoint e resetLevel | 1 |
