# Audio + Parallax Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add procedural Web Audio SFX, `.mp3` BGM, and per-level parallax backgrounds to the Cruella & Raya Phaser 3 game.

**Architecture:** A `SoundManager` singleton handles all audio (Web Audio API oscillators for SFX, Phaser Sound Manager for BGM). A `ParallaxBackground` class renders 3 TileSprite layers themed per level. Both are consumed from existing scenes with minimal coupling.

**Tech Stack:** Phaser 3.87, TypeScript 5 strict, Vite 5, Vitest 1 (unit tests on GameState only — Web Audio API and Phaser are not available in Vitest's Node environment)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/constants.ts` | Modify | Add 12 background texture keys |
| `src/GameState.ts` | Modify | Add `muted: boolean` field |
| `tests/GameState.test.ts` | Modify | Tests for `muted` field |
| `src/audio/SoundManager.ts` | Create | Web Audio SFX + Phaser BGM wrapper |
| `src/scenes/BootScene.ts` | Modify | Add `preload()` for BGM + 12 parallax textures in `create()` |
| `src/levels/LevelData.ts` | Modify | Add `backgroundTheme` field |
| `src/levels/World1.ts` | Modify | Assign `backgroundTheme` to each level |
| `src/background/ParallaxBackground.ts` | Create | 3-layer TileSprite parallax |
| `src/scenes/GameScene.ts` | Modify | Parallax, BGM, mute key, combat SFX |
| `src/scenes/MenuScene.ts` | Modify | Menu BGM, mute key |
| `src/entities/Raya.ts` | Modify | SFX: jump, doubleJump, dash |
| `src/entities/Cruella.ts` | Modify | SFX: jump, bark |
| `src/entities/Player.ts` | Modify | SFX: swap |
| `src/scenes/LevelCompleteScene.ts` | Modify | BGM fanfare + SFX levelComplete |
| `src/scenes/GameOverScene.ts` | Modify | SFX gameOver |
| `public/audio/` | Create dir | BGM .mp3 files (see Task 9) |

---

## Task 1: GameState.muted field

**Files:**
- Modify: `src/GameState.ts`
- Modify: `tests/GameState.test.ts`

- [ ] **Step 1: Add `muted` field to GameState class**

In `src/GameState.ts`, add `muted: boolean = false` after `goldenBones` line and add it to `reset()`:

```typescript
// After line: goldenBones: Record<string, boolean[]> = {}
muted: boolean = false
```

In `reset()`, add after `this.checkpointY = 0`:
```typescript
// muted is intentionally NOT reset — persists across game sessions
```
_(No change needed to reset — muted persists by design)_

- [ ] **Step 2: Add test for muted field**

In `tests/GameState.test.ts`, add inside the `describe('GameState', ...)` block:

```typescript
it('muted começa false', () => {
  expect(state.muted).toBe(false)
})

it('muted pode ser alternado', () => {
  state.muted = true
  expect(state.muted).toBe(true)
  state.muted = false
  expect(state.muted).toBe(false)
})
```

- [ ] **Step 3: Run tests**

```bash
npm run test
```
Expected: All tests pass, including 2 new muted tests.

- [ ] **Step 4: Commit**

```bash
git add src/GameState.ts tests/GameState.test.ts
git commit -m "feat: add muted field to GameState"
```

---

## Task 2: SoundManager singleton

**Files:**
- Create: `src/audio/SoundManager.ts`

- [ ] **Step 1: Create the SoundManager file**

Create `src/audio/SoundManager.ts`:

```typescript
import { gameState } from '../GameState'

export type SfxKey =
  | 'jump' | 'doubleJump' | 'dash' | 'bark'
  | 'collectBone' | 'collectGolden' | 'damage' | 'stomp'
  | 'powerUp' | 'swap' | 'gameOver' | 'levelComplete' | 'checkpoint'

let _ctx: AudioContext | null = null
let _currentBgm: Phaser.Sound.BaseSound | null = null

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') void _ctx.resume()
  return _ctx
}

function playTone(
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  durationMs: number,
  gainVal = 0.25
): void {
  if (gameState.muted) return
  const c = getCtx()
  const now = c.currentTime
  const dur = durationMs / 1000
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freqStart, now)
  if (freqEnd !== freqStart) osc.frequency.linearRampToValueAtTime(freqEnd, now + dur)
  gain.gain.setValueAtTime(gainVal, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now)
  osc.stop(now + dur)
}

function playArpeggio(freqs: number[], noteDurMs: number, gainVal = 0.22): void {
  if (gameState.muted) return
  const c = getCtx()
  freqs.forEach((freq, i) => {
    const t = c.currentTime + i * (noteDurMs / 1000)
    const dur = noteDurMs / 1000
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(gainVal, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + dur)
  })
}

function playNoise(durationMs: number, gainVal = 0.15): void {
  if (gameState.muted) return
  const c = getCtx()
  const sampleCount = Math.ceil(c.sampleRate * durationMs / 1000)
  const buf = c.createBuffer(1, sampleCount, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < sampleCount; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const gain = c.createGain()
  gain.gain.setValueAtTime(gainVal, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durationMs / 1000)
  src.connect(gain)
  gain.connect(c.destination)
  src.start()
}

export const SoundManager = {
  play(key: SfxKey): void {
    switch (key) {
      case 'jump':          playTone('sine',     350,  600, 120);                     break
      case 'doubleJump':    playTone('sine',     600,  950, 100);                     break
      case 'dash':          playTone('sawtooth', 300,  150, 180);                     break
      case 'bark':          playTone('square',   220,  220,  80, 0.3);               break
      case 'collectBone':   playTone('sine',     900,  900,  80, 0.2);               break
      case 'collectGolden': playArpeggio([523, 659, 784], 100);                      break
      case 'damage':        playTone('square',   180,   80, 250, 0.3);              break
      case 'stomp':         playNoise(100);                                           break
      case 'powerUp':       playArpeggio([523, 587, 659, 698, 784], 80);            break
      case 'swap':          playTone('sine',     500,  750, 120);                    break
      case 'gameOver':      playArpeggio([440, 330, 220], 200, 0.3);               break
      case 'levelComplete': playArpeggio([523, 659, 784, 880, 1047], 100);          break
      case 'checkpoint':    playTone('sine',     440,  880, 200);                    break
    }
  },

  playBgm(key: string, scene: Phaser.Scene, loop = true): void {
    if (_currentBgm) {
      _currentBgm.stop()
      _currentBgm.destroy()
      _currentBgm = null
    }
    if (gameState.muted) return
    _currentBgm = scene.sound.add(key, { loop, volume: 0.5 })
    _currentBgm.play()
  },

  stopBgm(): void {
    if (_currentBgm) {
      _currentBgm.stop()
      _currentBgm.destroy()
      _currentBgm = null
    }
  },

  setMuted(muted: boolean): void {
    gameState.muted = muted
    if (muted) this.stopBgm()
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```
Expected: No errors referencing `SoundManager.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/audio/SoundManager.ts
git commit -m "feat: add SoundManager with procedural SFX and BGM wrapper"
```

---

## Task 3: Background texture keys in constants.ts

**Files:**
- Modify: `src/constants.ts`

- [ ] **Step 1: Add 12 background texture keys**

In `src/constants.ts`, inside the `KEYS` object, add after the `POSTE` line:

```typescript
  // parallax de fundo
  BG_RUA_1:     'bg_rua_1',
  BG_RUA_2:     'bg_rua_2',
  BG_RUA_3:     'bg_rua_3',
  BG_PRACA_1:   'bg_praca_1',
  BG_PRACA_2:   'bg_praca_2',
  BG_PRACA_3:   'bg_praca_3',
  BG_MERCADO_1: 'bg_mercado_1',
  BG_MERCADO_2: 'bg_mercado_2',
  BG_MERCADO_3: 'bg_mercado_3',
  BG_BOSS_1:    'bg_boss_1',
  BG_BOSS_2:    'bg_boss_2',
  BG_BOSS_3:    'bg_boss_3',
  // áudio BGM
  BGM_MENU:    'bgm_menu',
  BGM_WORLD1:  'bgm_world1',
  BGM_BOSS:    'bgm_boss',
  BGM_FANFARE: 'bgm_fanfare',
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -10
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat: add background texture and BGM keys to constants"
```

---

## Task 4: BootScene — parallax textures + BGM preload

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: Add preload() method for BGM audio**

In `src/scenes/BootScene.ts`, add a `preload()` method BEFORE `create()`:

```typescript
preload(): void {
  this.load.audio(KEYS.BGM_MENU,    'audio/bgm_menu.mp3')
  this.load.audio(KEYS.BGM_WORLD1,  'audio/bgm_world1.mp3')
  this.load.audio(KEYS.BGM_BOSS,    'audio/bgm_boss.mp3')
  this.load.audio(KEYS.BGM_FANFARE, 'audio/bgm_fanfare.mp3')
}
```

_(Audio files will be placed in `public/audio/` in Task 9. Phaser silently skips missing files — game works without them until then.)_

- [ ] **Step 2: Add 12 parallax textures at end of create()**

At the very end of `create()`, just before the closing brace, add:

```typescript
// ── PARALLAX BACKGROUNDS ───────────────────────────────────────────────────

// bg_rua_1: blue sky + clouds
clr()
g.fillStyle(0x5b8dd9); g.fillRect(0, 0, 200, 450)
g.fillStyle(0xffffff)
g.fillEllipse(40, 80, 80, 30); g.fillEllipse(65, 70, 50, 20); g.fillEllipse(20, 82, 40, 18)
g.fillEllipse(150, 50, 70, 25); g.fillEllipse(175, 42, 45, 18); g.fillEllipse(130, 55, 35, 14)
g.fillEllipse(100, 130, 60, 22); g.fillEllipse(120, 124, 40, 16)
gen(KEYS.BG_RUA_1, 200, 450)

// bg_rua_2: distant gray buildings (transparent base)
clr()
g.fillStyle(0x8a8a9a); g.fillRect(0, 180, 50, 270)    // building 1
g.fillStyle(0x6a6a7a); g.fillRect(0, 100, 50, 80)      // building 1 tall part
g.fillStyle(0x7a7a8a); g.fillRect(55, 220, 60, 230)    // building 2
g.fillStyle(0x5a5a6a); g.fillRect(55, 130, 60, 90)     // building 2 upper
g.fillStyle(0x9a9aaa); g.fillRect(120, 250, 45, 200)   // building 3
g.fillStyle(0x6a6a7a); g.fillRect(170, 200, 30, 250)   // building 4
// windows (light)
g.fillStyle(0xd0d8f0)
g.fillRect(8, 110, 8, 6);  g.fillRect(20, 110, 8, 6);  g.fillRect(32, 110, 8, 6)
g.fillRect(8, 125, 8, 6);  g.fillRect(20, 125, 8, 6);  g.fillRect(32, 125, 8, 6)
g.fillRect(62, 142, 10, 7); g.fillRect(76, 142, 10, 7); g.fillRect(90, 142, 10, 7)
g.fillRect(62, 158, 10, 7); g.fillRect(76, 158, 10, 7); g.fillRect(90, 158, 10, 7)
gen(KEYS.BG_RUA_2, 200, 450)

// bg_rua_3: near houses + tree tops (transparent base)
clr()
// house 1
g.fillStyle(0xd4a57a); g.fillRect(10, 300, 50, 150)
g.fillStyle(0xc03030); g.fillTriangle(5, 300, 35, 268, 65, 300)
g.fillStyle(0x87ceeb); g.fillRect(18, 315, 14, 10); g.fillRect(37, 315, 14, 10)
// house 2
g.fillStyle(0xe8c090); g.fillRect(80, 320, 60, 130)
g.fillStyle(0x902020); g.fillTriangle(75, 320, 110, 285, 145, 320)
g.fillStyle(0x87ceeb); g.fillRect(88, 334, 16, 12); g.fillRect(112, 334, 16, 12)
// tree top
g.fillStyle(0x5a3a1a); g.fillRect(155, 310, 8, 100)
g.fillStyle(0x3a7a2a); g.fillCircle(159, 295, 28)
g.fillStyle(0x4a9a3a); g.fillCircle(155, 280, 18)
gen(KEYS.BG_RUA_3, 200, 450)

// bg_praca_1: light blue sky + soft clouds
clr()
g.fillStyle(0x87ceeb); g.fillRect(0, 0, 200, 450)
g.fillStyle(0xffffff)
g.fillEllipse(50, 60, 90, 32); g.fillEllipse(80, 52, 55, 22); g.fillEllipse(25, 65, 45, 20)
g.fillEllipse(160, 100, 75, 28); g.fillEllipse(185, 93, 48, 20)
gen(KEYS.BG_PRACA_1, 200, 450)

// bg_praca_2: green hills + tall trees (transparent base)
clr()
// hills
g.fillStyle(0x5a9a40)
g.fillEllipse(60, 430, 180, 130)
g.fillStyle(0x4a8a30)
g.fillEllipse(160, 440, 160, 100)
// tall trees (trunk + crown)
g.fillStyle(0x5a3a1a); g.fillRect(20, 240, 8, 120)
g.fillStyle(0x2a6a20); g.fillCircle(24, 228, 30)
g.fillStyle(0x3a8030); g.fillCircle(20, 212, 20)
g.fillStyle(0x5a3a1a); g.fillRect(110, 260, 8, 100)
g.fillStyle(0x2a6a20); g.fillCircle(114, 248, 28)
g.fillStyle(0x3a8030); g.fillCircle(110, 234, 18)
g.fillStyle(0x5a3a1a); g.fillRect(170, 250, 8, 110)
g.fillStyle(0x2a6a20); g.fillCircle(174, 238, 26)
gen(KEYS.BG_PRACA_2, 200, 450)

// bg_praca_3: bushes + wooden fence (transparent base)
clr()
// fence
g.fillStyle(0xc8a060)
g.fillRect(0, 350, 200, 8)    // horizontal rail
g.fillRect(10, 338, 10, 30); g.fillRect(40, 338, 10, 30)
g.fillRect(70, 338, 10, 30);  g.fillRect(100, 338, 10, 30)
g.fillRect(130, 338, 10, 30); g.fillRect(160, 338, 10, 30)
g.fillRect(190, 338, 10, 30)
// bushes
g.fillStyle(0x3a8a2a)
g.fillEllipse(25, 360, 55, 40); g.fillEllipse(50, 355, 45, 35)
g.fillEllipse(100, 362, 60, 38); g.fillEllipse(125, 357, 48, 33)
g.fillEllipse(170, 360, 50, 36); g.fillEllipse(185, 356, 35, 28)
gen(KEYS.BG_PRACA_3, 200, 450)

// bg_mercado_1: sunset sky orange/amber
clr()
g.fillStyle(0xff7a20); g.fillRect(0, 0, 200, 200)
g.fillStyle(0xff9a3c); g.fillRect(0, 200, 200, 150)
g.fillStyle(0xffd060); g.fillRect(0, 350, 200, 100)
// sun glow
g.fillStyle(0xffee80); g.fillCircle(150, 200, 60)
g.fillStyle(0xffcc40); g.fillCircle(150, 200, 40)
gen(KEYS.BG_MERCADO_1, 200, 450)

// bg_mercado_2: warehouses + colorful banners (transparent base)
clr()
// warehouses
g.fillStyle(0x6a6060); g.fillRect(0, 200, 90, 250)
g.fillStyle(0x5a5050); g.fillRect(0, 200, 90, 8)   // roof edge
g.fillStyle(0x7a7070); g.fillRect(100, 240, 100, 210)
g.fillStyle(0x6a6060); g.fillRect(100, 240, 100, 8)
// banners
g.fillStyle(0xff3333); g.fillRect(10, 220, 60, 12)
g.fillStyle(0x33cc33); g.fillRect(10, 236, 60, 12)
g.fillStyle(0x3399ff); g.fillRect(10, 252, 60, 12)
g.fillStyle(0xffcc00); g.fillRect(110, 258, 70, 12)
g.fillStyle(0xff6600); g.fillRect(110, 274, 70, 12)
gen(KEYS.BG_MERCADO_2, 200, 450)

// bg_mercado_3: market stalls + crates (transparent base)
clr()
// stall 1 roof (striped awning)
g.fillStyle(0xff4444); g.fillRect(0, 300, 90, 20)
g.fillStyle(0xffffff); g.fillRect(10, 300, 12, 20); g.fillRect(34, 300, 12, 20); g.fillRect(58, 300, 12, 20)
g.fillStyle(0x8b6030); g.fillRect(0, 320, 90, 80)  // stall body
// stall 2 roof
g.fillStyle(0x44aaff); g.fillRect(105, 310, 95, 20)
g.fillStyle(0xffffff); g.fillRect(115, 310, 12, 20); g.fillRect(140, 310, 12, 20); g.fillRect(165, 310, 12, 20)
g.fillStyle(0x8b6030); g.fillRect(105, 330, 95, 70) // stall body
// crates
g.fillStyle(0xc8903a)
g.fillRect(10, 370, 28, 28); g.fillRect(42, 370, 28, 28)
g.lineStyle(1, 0x9a6020)
g.strokeRect(10, 370, 28, 28); g.strokeRect(42, 370, 28, 28)
g.lineBetween(24, 370, 24, 398); g.lineBetween(10, 384, 38, 384)
g.lineBetween(56, 370, 56, 398); g.lineBetween(42, 384, 70, 384)
gen(KEYS.BG_MERCADO_3, 200, 450)

// bg_boss_1: dark purple sky + moon + stars
clr()
g.fillStyle(0x1a0033); g.fillRect(0, 0, 200, 450)
g.fillStyle(0xd4d0a0); g.fillCircle(150, 80, 30)  // moon
g.fillStyle(0x1a0033); g.fillCircle(162, 72, 24)  // crescent cutout
// stars
g.fillStyle(0xffffff)
g.fillRect(20, 30, 2, 2);  g.fillRect(55, 15, 2, 2);  g.fillRect(80, 60, 2, 2)
g.fillRect(100, 20, 2, 2); g.fillRect(30, 90, 2, 2);  g.fillRect(170, 30, 2, 2)
g.fillRect(10, 120, 2, 2); g.fillRect(60, 110, 2, 2); g.fillRect(120, 50, 2, 2)
g.fillRect(185, 70, 2, 2); g.fillRect(40, 140, 2, 2); g.fillRect(95, 130, 2, 2)
gen(KEYS.BG_BOSS_1, 200, 450)

// bg_boss_2: dark building silhouettes (transparent base)
clr()
g.fillStyle(0x1a1a2a); g.fillRect(0, 180, 45, 270)
g.fillStyle(0x111120); g.fillRect(0, 100, 45, 80)   // tall tower
g.fillRect(25, 90, 20, 90)
g.fillStyle(0x1a1a2a); g.fillRect(50, 220, 70, 230)
g.fillStyle(0x111120); g.fillRect(70, 150, 30, 70)
g.fillStyle(0x1a1a2a); g.fillRect(130, 260, 40, 190)
g.fillStyle(0x111120); g.fillRect(175, 200, 25, 250)
// faint window glow
g.fillStyle(0xffaa00, 0.3)
g.fillRect(10, 115, 6, 4); g.fillRect(22, 115, 6, 4)
g.fillRect(60, 165, 8, 5); g.fillRect(75, 165, 8, 5)
gen(KEYS.BG_BOSS_2, 200, 450)

// bg_boss_3: metal fence + bars (transparent base)
clr()
g.fillStyle(0x3a3a4a)
// horizontal rails
g.fillRect(0, 330, 200, 8)
g.fillRect(0, 355, 200, 6)
// vertical bars
for (let bx = 5; bx < 200; bx += 18) {
  g.fillRect(bx, 310, 6, 80)
  g.fillStyle(0x505060); g.fillRect(bx + 1, 310, 2, 80)
  g.fillStyle(0x3a3a4a)
}
// spikes on top
g.fillStyle(0x505060)
for (let sx = 8; sx < 200; sx += 18) {
  g.fillTriangle(sx, 310, sx + 4, 295, sx + 8, 310)
}
gen(KEYS.BG_BOSS_3, 200, 450)
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -20
```
Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: add parallax textures and BGM preload to BootScene"
```

---

## Task 5: LevelData.backgroundTheme + World1 themes

**Files:**
- Modify: `src/levels/LevelData.ts`
- Modify: `src/levels/World1.ts`

- [ ] **Step 1: Add backgroundTheme to LevelData interface**

In `src/levels/LevelData.ts`, add `backgroundTheme` to the `LevelData` interface, after `decorations`:

```typescript
export type BackgroundTheme = 'rua' | 'praca' | 'mercado' | 'boss'

export interface LevelData {
  id: string
  name: string
  bgColor: number
  backgroundTheme: BackgroundTheme
  tiles: number[][]
  tileWidthCols: number
  spawnX: number
  spawnY: number
  exitX: number
  exitY: number
  checkpointX: number
  checkpointY: number
  enemies: EnemySpawn[]
  items: ItemSpawn[]
  goldenBones: Array<{ x: number; y: number }>
  nextLevel: string | null
  isBossLevel?: boolean
  decorations: DecorationSpawn[]
}
```

- [ ] **Step 2: Assign backgroundTheme to each level in World1.ts**

In `src/levels/World1.ts`, add `backgroundTheme` to each level object:

- Level `'1-1'`: add `backgroundTheme: 'rua',` after `bgColor`
- Level `'1-2'`: add `backgroundTheme: 'praca',` after `bgColor`
- Level `'1-3'`: add `backgroundTheme: 'mercado',` after `bgColor`
- Level `'1-boss'`: add `backgroundTheme: 'boss',` after `bgColor`

- [ ] **Step 3: Verify build catches missing fields**

```bash
npm run build 2>&1 | grep -i error
```
Expected: No TypeScript errors (all 4 levels have `backgroundTheme` assigned).

- [ ] **Step 4: Commit**

```bash
git add src/levels/LevelData.ts src/levels/World1.ts
git commit -m "feat: add backgroundTheme to LevelData and assign to World1 levels"
```

---

## Task 6: ParallaxBackground class

**Files:**
- Create: `src/background/ParallaxBackground.ts`

- [ ] **Step 1: Create ParallaxBackground class**

Create `src/background/ParallaxBackground.ts`:

```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'
import { BackgroundTheme } from '../levels/LevelData'

interface LayerConfig {
  key: string
  speed: number
  y: number
  height: number
}

const THEME_LAYERS: Record<BackgroundTheme, LayerConfig[]> = {
  rua: [
    { key: KEYS.BG_RUA_1,   speed: 0.05, y: 0,   height: 450 },
    { key: KEYS.BG_RUA_2,   speed: 0.2,  y: 0,   height: 450 },
    { key: KEYS.BG_RUA_3,   speed: 0.5,  y: 0,   height: 450 },
  ],
  praca: [
    { key: KEYS.BG_PRACA_1, speed: 0.05, y: 0,   height: 450 },
    { key: KEYS.BG_PRACA_2, speed: 0.2,  y: 0,   height: 450 },
    { key: KEYS.BG_PRACA_3, speed: 0.5,  y: 0,   height: 450 },
  ],
  mercado: [
    { key: KEYS.BG_MERCADO_1, speed: 0.05, y: 0, height: 450 },
    { key: KEYS.BG_MERCADO_2, speed: 0.2,  y: 0, height: 450 },
    { key: KEYS.BG_MERCADO_3, speed: 0.5,  y: 0, height: 450 },
  ],
  boss: [
    { key: KEYS.BG_BOSS_1,  speed: 0.05, y: 0,   height: 450 },
    { key: KEYS.BG_BOSS_2,  speed: 0.2,  y: 0,   height: 450 },
    { key: KEYS.BG_BOSS_3,  speed: 0.5,  y: 0,   height: 450 },
  ],
}

export class ParallaxBackground {
  private layers: Array<{ sprite: Phaser.GameObjects.TileSprite; speed: number }> = []

  constructor(scene: Phaser.Scene, theme: BackgroundTheme) {
    const configs = THEME_LAYERS[theme]
    configs.forEach((cfg, i) => {
      const depth = -5 + i  // sky=-5, mid=-4, near=-3 (decorations are -1)
      const sprite = scene.add.tileSprite(0, cfg.y, 800, cfg.height, cfg.key)
      sprite.setOrigin(0, 0)
      sprite.setDepth(depth)
      this.layers.push({ sprite, speed: cfg.speed })
    })
  }

  update(cameraScrollX: number): void {
    this.layers.forEach(({ sprite, speed }) => {
      sprite.tilePositionX = cameraScrollX * speed
    })
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -15
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/background/ParallaxBackground.ts
git commit -m "feat: add ParallaxBackground class with per-theme TileSprite layers"
```

---

## Task 7: GameScene — parallax + BGM + mute + combat SFX

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Add imports**

At the top of `src/scenes/GameScene.ts`, add:

```typescript
import { ParallaxBackground } from '../background/ParallaxBackground'
import { SoundManager } from '../audio/SoundManager'
```

- [ ] **Step 2: Add class property**

In the `GameScene` class body, after `private _gameOverPending = false`, add:

```typescript
private _parallax!: ParallaxBackground
private _mKey!: Phaser.Input.Keyboard.Key
```

- [ ] **Step 3: Initialize parallax, BGM, mute key, and shutdown handler in create()**

In `create()`, add these lines at the START of the method (before `this._buildDecorations()`):

```typescript
// Parallax (before decorations so depth order is correct)
this._parallax = new ParallaxBackground(this, this.currentLevel.backgroundTheme)

// BGM
const bgmKey = this.currentLevel.isBossLevel ? KEYS.BGM_BOSS : KEYS.BGM_WORLD1
SoundManager.playBgm(bgmKey, this)

// Mute key
this._mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M)

// Stop BGM when scene shuts down
this.events.once('shutdown', () => SoundManager.stopBgm())
```

- [ ] **Step 4: Update parallax and mute in update()**

In the `update()` method, add BEFORE `const enemies = ...`:

```typescript
// Mute toggle
if (Phaser.Input.Keyboard.JustDown(this._mKey)) {
  SoundManager.setMuted(!gameState.muted)
}
// Parallax scroll
this._parallax.update(this.cameras.main.scrollX)
```

- [ ] **Step 5: Add combat SFX**

In `_setupCollisions()`, inside the player-enemy overlap callback:

After `e.takeDamage(999)` (stomp branch), add:
```typescript
SoundManager.play('stomp')
```

After the churrasco branch `e.takeDamage(999)`, no SFX needed (churrasco already has powerUp effect).

After `this.player.takeDamage()`, add:
```typescript
SoundManager.play('damage')
```

In `_handleItemCollect()`:
- After `gameState.addScore(10)` (bone): add `SoundManager.play('collectBone')`
- After `gameState.collectGoldenBone(...)` (golden_bone): add `SoundManager.play('collectGolden')`
- After `gameState.applyPowerUp(...)` (default): add `SoundManager.play('powerUp')`
- After `gameState.setCheckpoint(...)` (checkpoint): add `SoundManager.play('checkpoint')`

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -20
```
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: integrate parallax, BGM, mute toggle, and combat SFX in GameScene"
```

---

## Task 8: MenuScene — BGM + mute

**Files:**
- Modify: `src/scenes/MenuScene.ts`

- [ ] **Step 1: Add imports**

At the top of `src/scenes/MenuScene.ts`, add:

```typescript
import { SoundManager } from '../audio/SoundManager'
import { KEYS } from '../constants'
import { gameState } from '../GameState'
```

_(KEYS and gameState may already be imported — add only the missing ones)_

- [ ] **Step 2: Start BGM, mute key, and shutdown in create()**

At the END of `create()` (before the closing brace), add:

```typescript
// Menu BGM
SoundManager.playBgm(KEYS.BGM_MENU, this)

// Mute toggle with M key
const mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M)
this.events.on('update', () => {
  if (Phaser.Input.Keyboard.JustDown(mKey)) SoundManager.setMuted(!gameState.muted)
})

// Stop BGM on leave
this.events.once('shutdown', () => SoundManager.stopBgm())
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/MenuScene.ts
git commit -m "feat: add menu BGM and mute toggle to MenuScene"
```

---

## Task 9: Entity SFX — Raya, Cruella, Player

**Files:**
- Modify: `src/entities/Raya.ts`
- Modify: `src/entities/Cruella.ts`
- Modify: `src/entities/Player.ts`

- [ ] **Step 1: Raya — jump and dash SFX**

In `src/entities/Raya.ts`, add import at top:
```typescript
import { SoundManager } from '../audio/SoundManager'
```

In `update()`, find the jump block:
```typescript
if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.jumpsLeft > 0) {
```
After `this.jumpsLeft--`, add:
```typescript
SoundManager.play(this.jumpsLeft === 0 ? 'doubleJump' : 'jump')
```
_(Note: `jumpsLeft` is already decremented, so `0` means this was the 2nd jump)_

In `dash()`, at the very start of the method, add:
```typescript
SoundManager.play('dash')
```

- [ ] **Step 2: Cruella — jump and bark SFX**

In `src/entities/Cruella.ts`, add import at top:
```typescript
import { SoundManager } from '../audio/SoundManager'
```

In `update()`, find the jump block:
```typescript
if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && onGround) {
```
After `this.setVelocityY(jumpVel)`, add:
```typescript
SoundManager.play('jump')
```

In `bark()`, at the very start of the method, add:
```typescript
SoundManager.play('bark')
```

- [ ] **Step 3: Player — swap SFX**

In `src/entities/Player.ts`, add import at top:
```typescript
import { SoundManager } from '../audio/SoundManager'
```

In `_performSwap()`, at the very start of the method, add:
```typescript
SoundManager.play('swap')
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -15
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/entities/Raya.ts src/entities/Cruella.ts src/entities/Player.ts
git commit -m "feat: add SFX to Raya (jump/dash), Cruella (jump/bark), Player (swap)"
```

---

## Task 10: Scene SFX — LevelComplete + GameOver

**Files:**
- Modify: `src/scenes/LevelCompleteScene.ts`
- Modify: `src/scenes/GameOverScene.ts`

- [ ] **Step 1: LevelCompleteScene — fanfare BGM + levelComplete SFX**

In `src/scenes/LevelCompleteScene.ts`, add imports:
```typescript
import { SoundManager } from '../audio/SoundManager'
import { KEYS } from '../constants'
```

At the START of `create()`, add:
```typescript
SoundManager.play('levelComplete')
SoundManager.playBgm(KEYS.BGM_FANFARE, this, false)
this.events.once('shutdown', () => SoundManager.stopBgm())
```

- [ ] **Step 2: GameOverScene — gameOver SFX**

In `src/scenes/GameOverScene.ts`, add import:
```typescript
import { SoundManager } from '../audio/SoundManager'
```

At the START of `create()`, add:
```typescript
SoundManager.play('gameOver')
```

- [ ] **Step 3: Verify full build**

```bash
npm run build 2>&1
```
Expected: Clean build, 0 errors, 0 warnings about missing types.

- [ ] **Step 4: Run all tests**

```bash
npm run test
```
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/LevelCompleteScene.ts src/scenes/GameOverScene.ts
git commit -m "feat: add levelComplete and gameOver SFX to scene transitions"
```

---

## Task 11: BGM audio files

**Files:**
- Create: `public/audio/` directory with 4 `.mp3` files

The game is functional without these (Phaser silently skips missing audio). Add them to enable music.

- [ ] **Step 1: Create the audio directory**

```bash
mkdir -p public/audio
```

- [ ] **Step 2: Download CC0 tracks from opengameart.org**

Suggested search terms and placement:

| File to create | Search on opengameart.org | Suggested tracks |
|----------------|--------------------------|-----------------|
| `public/audio/bgm_menu.mp3` | "chiptune menu loop CC0" | "Happy Chiptune Loop" by Juhani Junkala |
| `public/audio/bgm_world1.mp3` | "chiptune platformer loop CC0" | "Platformer Game Music" by yd |
| `public/audio/bgm_boss.mp3` | "chiptune boss battle CC0" | "Boss Battle Theme" by Matthew Pablo |
| `public/audio/bgm_fanfare.mp3` | "chiptune level complete CC0" | Any short fanfare under 5s |

Rules: license must be CC0, CC-BY, or CC-BY-SA. Keep files under 1MB each (use online MP3 compressor if needed).

- [ ] **Step 3: Add public/audio to .gitignore (optional, if files are large)**

If the total audio size exceeds 2MB, add to `.gitignore`:
```
public/audio/*.mp3
```
And document the download instructions in a `public/audio/README.md`.

- [ ] **Step 4: Final build + test**

```bash
npm run build 2>&1 && npm run test
```
Expected: Clean build, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add public/audio/ src/
git commit -m "feat: complete audio + parallax background system"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ SFX procedurais (13 sons) — Task 2, 9, 10
- ✅ BGM 4 faixas — Task 4 (preload), Task 7/8/10 (playBgm calls)
- ✅ Mute toggle (M) — Task 7 (GameScene), Task 8 (MenuScene)
- ✅ Parallax 3 camadas × 4 temas = 12 texturas — Task 4, 6
- ✅ backgroundTheme em LevelData — Task 5
- ✅ GameState.muted — Task 1
- ✅ BGM stop on shutdown — Tasks 7, 8, 10

**Type consistency:**
- `SfxKey` defined in Task 2, used in Tasks 9 and 10 via `SoundManager.play()`
- `BackgroundTheme` defined in Task 5 (`LevelData.ts`), imported in Task 6 (`ParallaxBackground.ts`)
- `KEYS.BG_RUA_1` etc. defined in Task 3, used in Task 6
- `KEYS.BGM_*` defined in Task 3, used in Tasks 7, 8, 10
