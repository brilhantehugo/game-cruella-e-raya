# World 2 — Exterior do Prédio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add World 2 (Exterior do Prédio) with 3 regular phases + 1 boss phase (Drone), new parallax backgrounds, and wired into the existing game flow.

**Architecture:** New `World2.ts` mirrors the structure of `World0.ts`/`World1.ts` exactly. New `Drone.ts` boss mirrors `Aspirador.ts` structure (3 phases, `emit('spawnBomb')` / `emit('spawnLaser')`). Background sprites generated in `BootScene.ts` via Canvas API. `GameScene.ts` gets a new `case '2-boss'` block. Tasks 1–2 are independent of each other and can run in parallel.

**Tech Stack:** TypeScript, Phaser 3 Arcade Physics, Vitest

---

## Task 1: Types + KEYS + MEDAL_THRESHOLDS

**Files:**
- Modify: `src/levels/LevelData.ts`
- Modify: `src/constants.ts`

Context: `BackgroundTheme` is a union type in `LevelData.ts`. `KEYS` is a `const` object in `constants.ts`. The BG key pattern is `BG_RUA_1/2/3`, `BG_PRACA_1/2/3`, etc. New patterns: `BG_EXT_1/2/3`, `BG_PATIO_1/2/3`, `BG_TELHADO_1/2/3`.

- [ ] **Step 1: Expand BackgroundTheme in LevelData.ts**

Find line 14 in `src/levels/LevelData.ts`:
```typescript
export type BackgroundTheme = 'rua' | 'praca' | 'mercado' | 'boss' | 'apartamento' | 'apto_boss'
```

Replace with:
```typescript
export type BackgroundTheme = 'rua' | 'praca' | 'mercado' | 'boss' | 'apartamento' | 'apto_boss'
  | 'exterior' | 'patio' | 'telhado'
```

- [ ] **Step 2: Add new KEYS in constants.ts**

Find this block in `src/constants.ts` (around line 103–106):
```typescript
  // parallax — boss aspirador
  BG_APTO_BOSS_1: 'bg_apto_boss_1',
  BG_APTO_BOSS_2: 'bg_apto_boss_2',
  BG_APTO_BOSS_3: 'bg_apto_boss_3',
```

Add immediately after it:
```typescript
  // parallax — exterior do prédio
  BG_EXT_1:       'bg_ext_1',
  BG_EXT_2:       'bg_ext_2',
  BG_EXT_3:       'bg_ext_3',
  // parallax — pátio interior
  BG_PATIO_1:     'bg_patio_1',
  BG_PATIO_2:     'bg_patio_2',
  BG_PATIO_3:     'bg_patio_3',
  // parallax — telhado
  BG_TELHADO_1:   'bg_telhado_1',
  BG_TELHADO_2:   'bg_telhado_2',
  BG_TELHADO_3:   'bg_telhado_3',
  // projéteis do boss Drone
  BOMB:  'bomb',
  LASER: 'laser',
```

- [ ] **Step 3: Add MEDAL_THRESHOLDS for World 2**

Find the end of the `MEDAL_THRESHOLDS` object in `src/constants.ts`:
```typescript
  '1-boss': 1200,  // boss Seu Bigodes + minions estimados
}
```

Replace with:
```typescript
  '1-boss': 1200,  // boss Seu Bigodes + minions estimados
  '2-1':    1900,  // 7 inimigos×50 + 6 ossos×10 + 3 golden×500
  '2-2':    2850,  // 11 inimigos×50 + 8 ossos×10 + 4 golden×500
  '2-3':    3150,  // 14 inimigos×50 + 9 ossos×10 + 4 golden×500
  '2-boss':  500,  // boss Drone apenas
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/levels/LevelData.ts src/constants.ts
git commit -m "feat: add BackgroundTheme exterior/patio/telhado, KEYS for BG+BOMB+LASER, World2 medal thresholds"
```

---

## Task 2: Background sprites + ParallaxBackground

**Files:**
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/background/ParallaxBackground.ts`

Context: In `BootScene.ts`, `g` is a Phaser Graphics object, `clr()` calls `g.clear()`, `gen(key, w, h)` renders the graphics to a texture of size `w×h`. All BG sprites are `480×450`. Parallax layers go sky → mid → near (speed 0.05 → 0.2 → 0.5). In `ParallaxBackground.ts`, `THEME_LAYERS` is a `Record<BackgroundTheme, LayerConfig[]>` — add the 3 new themes before the closing `}`.

- [ ] **Step 1: Add BG_EXT sprites in BootScene.ts**

Find the block that generates `BG_APTO_BOSS_3` (last BG generated before other sections). Find this line:
```typescript
    gen(KEYS.BG_APTO_BOSS_3, 480, 450)
```

Add immediately after it:
```typescript

    // ── BACKGROUNDS — EXTERIOR DO PRÉDIO ──────────────────────────────────────
    // BG_EXT_1: céu noturno azul escuro com estrelas e lua
    clr()
    g.fillStyle(0x0a0a2a); g.fillRect(0, 0, 480, 450)       // céu fundo
    g.fillStyle(0xffffff)
    g.fillCircle(60,  40, 1);  g.fillCircle(120, 20, 1); g.fillCircle(200, 50, 1)
    g.fillCircle(300, 30, 1);  g.fillCircle(380, 60, 1); g.fillCircle(440, 25, 1)
    g.fillCircle(80,  80, 1);  g.fillCircle(240, 10, 1); g.fillCircle(350, 80, 1)
    g.fillStyle(0xffffcc); g.fillCircle(420, 45, 14)         // lua
    g.fillStyle(0x0a0a2a); g.fillCircle(430, 38, 11)         // sombra lua (crescente)
    gen(KEYS.BG_EXT_1, 480, 450)

    // BG_EXT_2: fachada do prédio com janelas iluminadas (layer mid)
    clr()
    g.fillStyle(0x1a1a3a); g.fillRect(0, 0, 480, 450)        // transparente base
    g.fillStyle(0x2a2a4a)                                      // paredes do prédio
    g.fillRect(40, 100, 80, 350); g.fillRect(180, 60, 120, 390); g.fillRect(360, 120, 100, 330)
    g.fillStyle(0xffee88)                                      // janelas iluminadas
    for (let bx = 0; bx < 3; bx++) {
      const bx0 = [50, 190, 370][bx]
      for (let fy = 0; fy < 5; fy++) {
        for (let fx = 0; fx < 2; fx++) {
          if (Math.random() > 0.3) {
            g.fillRect(bx0 + fx * 22, 110 + fy * 42, 14, 18)
          }
        }
      }
    }
    g.fillStyle(0x555577); g.fillRect(0, 380, 480, 70)        // calçada
    gen(KEYS.BG_EXT_2, 480, 450)

    // BG_EXT_3: primeiro plano — arbustos e grades (layer near)
    clr()
    g.fillStyle(0x1a3a1a); g.fillEllipse(60,  400, 80, 40); g.fillEllipse(160, 405, 60, 35)
    g.fillStyle(0x2a4a2a); g.fillEllipse(220, 398, 70, 38); g.fillEllipse(340, 403, 90, 42)
    g.fillStyle(0x1a4a1a); g.fillEllipse(420, 400, 60, 36)
    g.fillStyle(0x555566)                                      // grades
    for (let gx = 270; gx < 330; gx += 10) { g.fillRect(gx, 360, 3, 60) }
    g.fillRect(268, 358, 64, 4); g.fillRect(268, 418, 64, 4)
    gen(KEYS.BG_EXT_3, 480, 450)

    // ── BACKGROUNDS — PÁTIO INTERIOR ─────────────────────────────────────────
    // BG_PATIO_1: muro de tijolo escuro ao fundo
    clr()
    g.fillStyle(0x1a0f08); g.fillRect(0, 0, 480, 450)         // fundo escuro
    g.fillStyle(0x2a1810)                                      // tijolo base
    g.fillRect(0, 50, 480, 400)
    g.fillStyle(0x1a1008)
    for (let row = 0; row < 12; row++) {
      const offset = (row % 2) * 30
      for (let col = -1; col < 9; col++) {
        g.fillRect(col * 60 + offset, 50 + row * 32, 58, 30)
      }
    }
    g.fillStyle(0x0a0806)                                      // argamassa (linhas)
    for (let row = 0; row <= 12; row++) { g.fillRect(0, 50 + row * 32, 480, 2) }
    gen(KEYS.BG_PATIO_1, 480, 450)

    // BG_PATIO_2: varal de roupa (layer mid)
    clr()
    g.fillStyle(0x2a1810); g.fillRect(0, 0, 480, 450)
    g.lineStyle(2, 0x6a4a30); g.lineBetween(0, 180, 480, 200)
    g.lineStyle(2, 0x6a4a30); g.lineBetween(0, 280, 480, 260)
    const clothColors = [0xff6644, 0x4488cc, 0xffee66, 0x44cc88, 0xee88aa]
    const clothPos = [40, 110, 180, 260, 340, 400]
    clothPos.forEach((cx, i) => {
      const col = clothColors[i % clothColors.length]
      g.fillStyle(col)
      if (i % 2 === 0) {
        g.fillRect(cx, 180, 22, 34)    // camisola
      } else {
        g.fillRect(cx, 180, 18, 40)    // calça
      }
      g.fillStyle(0x888888); g.fillRect(cx + 9, 176, 2, 6) // mola
    })
    gen(KEYS.BG_PATIO_2, 480, 450)

    // BG_PATIO_3: chão de paralelepípedo cinza (layer near)
    clr()
    g.fillStyle(0x2a2a2a); g.fillRect(0, 360, 480, 90)        // base chão
    g.fillStyle(0x383838)
    for (let row = 0; row < 3; row++) {
      const offset = (row % 2) * 20
      for (let col = -1; col < 13; col++) {
        g.fillRect(col * 40 + offset, 360 + row * 28, 38, 26)
      }
    }
    g.fillStyle(0x1a1a1a)
    for (let row = 0; row <= 3; row++) { g.fillRect(0, 360 + row * 28, 480, 2) }
    gen(KEYS.BG_PATIO_3, 480, 450)

    // ── BACKGROUNDS — TELHADO ────────────────────────────────────────────────
    // BG_TELHADO_1: céu noturno com estrelas e nuvens
    clr()
    g.fillStyle(0x05050f); g.fillRect(0, 0, 480, 450)          // céu noturno
    g.fillStyle(0xffffff)
    for (let s = 0; s < 40; s++) {
      const sx = (s * 97) % 480; const sy = (s * 53) % 300
      g.fillCircle(sx, sy, s % 3 === 0 ? 2 : 1)
    }
    g.fillStyle(0x1a1a30); g.fillEllipse(80, 120, 140, 50)     // nuvem escura
    g.fillStyle(0x141428); g.fillEllipse(320, 90, 160, 60)
    gen(KEYS.BG_TELHADO_1, 480, 450)

    // BG_TELHADO_2: antenas e caixas d'água (layer mid)
    clr()
    g.fillStyle(0x0a0a1a); g.fillRect(0, 0, 480, 450)
    g.fillStyle(0x333344)                                       // antenas
    g.fillRect(60,  200, 4, 160);  g.fillRect(55, 196, 14, 4)  // antena esq
    g.fillRect(58,  200, 2, 60);   g.fillRect(64, 200, 2, 60)  // braços
    g.fillRect(250, 210, 4, 150);  g.fillRect(245, 206, 14, 4)
    g.fillRect(400, 190, 4, 170);  g.fillRect(395, 186, 14, 4)
    g.fillStyle(0x2a2a3a)                                       // caixas d'água
    g.fillRect(120, 270, 50, 40)   // caixa 1
    g.fillRect(115, 266, 60, 6)    // tampa
    g.fillRect(122, 310, 8, 20)    // suporte
    g.fillRect(136, 310, 8, 20)
    g.fillRect(320, 260, 60, 45)   // caixa 2
    g.fillRect(315, 256, 70, 6)
    g.fillRect(326, 305, 10, 25)
    g.fillRect(354, 305, 10, 25)
    gen(KEYS.BG_TELHADO_2, 480, 450)

    // BG_TELHADO_3: superfície do telhado com telhas (layer near)
    clr()
    g.fillStyle(0x1a1a24); g.fillRect(0, 350, 480, 100)        // base telhado
    g.fillStyle(0x2a2a36)
    for (let row = 0; row < 4; row++) {
      const offset = (row % 2) * 24
      for (let col = -1; col < 11; col++) {
        g.fillRect(col * 48 + offset, 350 + row * 24, 46, 22)
      }
    }
    g.fillStyle(0x0f0f1a)
    for (let row = 0; row <= 4; row++) { g.fillRect(0, 350 + row * 24, 480, 2) }
    gen(KEYS.BG_TELHADO_3, 480, 450)
```

- [ ] **Step 2: Add BOMB and LASER sprites in BootScene.ts**

Find the block that generates `BLADE`:
```typescript
    gen(KEYS.BLADE, 12, 12)
```

Add immediately after it:
```typescript

    // BOMB: projétil do Drone — círculo preto com faísca laranja 10×10
    clr()
    g.fillStyle(0x111111); g.fillCircle(5, 5, 5)
    g.lineStyle(1, 0x333333); g.strokeCircle(5, 5, 5)
    g.fillStyle(0xff8800); g.fillTriangle(7, 0, 10, 4, 5, 2)   // faísca
    g.fillStyle(0xffcc00); g.fillTriangle(8, 1, 10, 3, 7, 1)   // brilho
    gen(KEYS.BOMB, 10, 10)

    // LASER: projétil do Drone — linha vermelha fina 16×4
    clr()
    g.fillStyle(0xff0000); g.fillRect(0, 1, 16, 2)
    g.fillStyle(0xff6666); g.fillRect(0, 1, 4, 2)              // brilho na ponta
    g.fillStyle(0xffaaaa); g.fillRect(0, 1, 2, 2)
    gen(KEYS.LASER, 16, 4)
```

- [ ] **Step 3: Add new themes to ParallaxBackground.ts**

In `src/background/ParallaxBackground.ts`, find the closing `}` of `THEME_LAYERS` (after `apto_boss` entry):
```typescript
  apto_boss: [
    { key: KEYS.BG_APTO_BOSS_1, speed: 0.02, y: 0, height: 450 },
    { key: KEYS.BG_APTO_BOSS_2, speed: 0.1,  y: 0, height: 450 },
    { key: KEYS.BG_APTO_BOSS_3, speed: 0.35, y: 0, height: 450 },
  ],
}
```

Replace with:
```typescript
  apto_boss: [
    { key: KEYS.BG_APTO_BOSS_1, speed: 0.02, y: 0, height: 450 },
    { key: KEYS.BG_APTO_BOSS_2, speed: 0.1,  y: 0, height: 450 },
    { key: KEYS.BG_APTO_BOSS_3, speed: 0.35, y: 0, height: 450 },
  ],
  exterior: [
    { key: KEYS.BG_EXT_1,     speed: 0.04, y: 0, height: 450 },
    { key: KEYS.BG_EXT_2,     speed: 0.18, y: 0, height: 450 },
    { key: KEYS.BG_EXT_3,     speed: 0.45, y: 0, height: 450 },
  ],
  patio: [
    { key: KEYS.BG_PATIO_1,   speed: 0.03, y: 0, height: 450 },
    { key: KEYS.BG_PATIO_2,   speed: 0.12, y: 0, height: 450 },
    { key: KEYS.BG_PATIO_3,   speed: 0.4,  y: 0, height: 450 },
  ],
  telhado: [
    { key: KEYS.BG_TELHADO_1, speed: 0.02, y: 0, height: 450 },
    { key: KEYS.BG_TELHADO_2, speed: 0.1,  y: 0, height: 450 },
    { key: KEYS.BG_TELHADO_3, speed: 0.35, y: 0, height: 450 },
  ],
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/BootScene.ts src/background/ParallaxBackground.ts
git commit -m "feat: generate BG sprites for exterior/patio/telhado themes + BOMB and LASER projectile sprites"
```

---

## Task 3: Create World2.ts

**Files:**
- Create: `src/levels/World2.ts`

Context: Follow the exact same pattern as `World1.ts`:
- File-level helpers `emptyRow`, `groundRow`, `platformRow` use file-level `const COLS = 80`
- Levels 2-2 and 2-3 use per-level `mkHelpers(cols)` factories
- Export `WORLD2_LEVELS` record at bottom
- `G = 416` is the ground surface y (same as all other world files)
- `tileWidthCols` must match the helper's `cols` for each level

- [ ] **Step 1: Create src/levels/World2.ts**

```typescript
import { LevelData } from './LevelData'

const G = 416 // ground surface y

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
const r22 = mkHelpers(100)   // LEVEL_2_2: 100 cols = 3200px
const r23 = mkHelpers(110)   // LEVEL_2_3: 110 cols = 3520px

export const LEVEL_2_1: LevelData = {
  id: '2-1', name: 'Passeio Público', bgColor: 0x1a1a3a,
  backgroundTheme: 'exterior' as const, timeLimit: 180, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    platformRow(8, 5),  emptyRow(),
    platformRow(20, 4), platformRow(35, 5), emptyRow(),
    platformRow(45, 4), platformRow(58, 5), emptyRow(),
    platformRow(68, 5), emptyRow(), emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 300, exitX: 2496, exitY: 370,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'rato',    x: 300,  y: 390 },
    { type: 'gato',    x: 600,  y: 390 },
    { type: 'zelador', x: 1100, y: 390 },
    { type: 'rato',    x: 800,  y: 390 },
    { type: 'gato',    x: 1400, y: 390 },
    { type: 'rato',    x: 1800, y: 390 },
    { type: 'dono',    x: 2100, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 160,  y: 380 },
    { type: 'bone',           x: 400,  y: 380 },
    { type: 'petisco',        x: 550,  y: 380 },
    { type: 'bone',           x: 700,  y: 380 },
    { type: 'surprise_block', x: 900,  y: 310 },
    { type: 'bone',           x: 1200, y: 380 },
    { type: 'petisco',        x: 1600, y: 380 },
    { type: 'surprise_block', x: 1700, y: 310 },
    { type: 'pizza',          x: 1400, y: 380 },
    { type: 'laco',           x: 2100, y: 380 },
    { type: 'bone',           x: 1900, y: 380 },
  ],
  goldenBones: [
    { x: 320,  y: 96 },
    { x: 1152, y: 80 },
    { x: 1984, y: 64 },
  ],
  nextLevel: '2-2',
  intro: {
    complexity: 2,
    dialogue: [
      'O passeio está cheio de ratos à noite. Cuidado com o zelador!',
      'Que horror. Eu mereço um táxi, não isto.',
    ],
  },
  decorations: [
    { type: 'poste',   x: 200,  y: G },
    { type: 'lixeira', x: 450,  y: G },
    { type: 'arvore',  x: 700,  y: G },
    { type: 'banco',   x: 950,  y: G },
    { type: 'poste',   x: 1200, y: G },
    { type: 'lixeira', x: 1700, y: G },
    { type: 'arvore',  x: 1950, y: G },
    { type: 'grade',   x: 2200, y: G },
    { type: 'placa',   x: 1450, y: G },
    { type: 'grade',   x: 2400, y: G },
  ],
}

export const LEVEL_2_2: LevelData = {
  id: '2-2', name: 'Pátio Interior', bgColor: 0x2a1a0a,
  backgroundTheme: 'patio' as const, timeLimit: 200, tileWidthCols: 100,
  tiles: [
    r22.e(), r22.e(), r22.e(),
    r22.mp([5,4], [55,4], [82,4]), r22.e(),
    r22.p(18, 5), r22.mp([40,3], [68,3]), r22.e(),
    r22.mp([28,6], [75,5]), r22.p(50, 4), r22.e(),
    r22.mp([62,5], [85,4]), r22.e(), r22.e(),
    r22.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3136, exitY: 370,
  checkpointX: 1600, checkpointY: 380,
  enemies: [
    { type: 'gato',    x: 400,  y: 390 },
    { type: 'rato',    x: 650,  y: 390 },
    { type: 'morador', x: 1100, y: 390 },
    { type: 'rato',    x: 1300, y: 390 },
    { type: 'gato',    x: 900,  y: 390 },
    { type: 'zelador', x: 1600, y: 390 },
    { type: 'gato',    x: 1800, y: 390 },
    { type: 'rato',    x: 2200, y: 390 },
    { type: 'gato',    x: 2600, y: 390 },
    { type: 'morador', x: 2900, y: 390 },
    { type: 'dono',    x: 3000, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 200,  y: 380 },
    { type: 'bone',           x: 500,  y: 380 },
    { type: 'bone',           x: 1000, y: 380 },
    { type: 'bone',           x: 1500, y: 380 },
    { type: 'bone',           x: 2100, y: 380 },
    { type: 'bone',           x: 2700, y: 380 },
    { type: 'petisco',        x: 750,  y: 380 },
    { type: 'petisco',        x: 2400, y: 380 },
    { type: 'surprise_block', x: 1200, y: 310 },
    { type: 'surprise_block', x: 2600, y: 310 },
    { type: 'chapeu',         x: 1800, y: 380 },
    { type: 'frisbee',        x: 2300, y: 380 },
    { type: 'bola',           x: 3000, y: 380 },
  ],
  goldenBones: [
    { x: 288,  y: 64 },
    { x: 1344, y: 96 },
    { x: 2240, y: 64 },
    { x: 2944, y: 80 },
  ],
  nextLevel: '2-3',
  intro: {
    complexity: 2,
    dialogue: [
      'O pátio... parece que tem gatos em todo lado.',
      'Óptimo. Uma visita guiada ao inferno felino.',
    ],
  },
  decorations: [
    { type: 'carro',    x: 300,  y: G, blocking: true },
    { type: 'lixeira',  x: 550,  y: G },
    { type: 'saco_lixo',x: 650,  y: G },
    { type: 'carro',    x: 1100, y: G, blocking: true },
    { type: 'poste',    x: 800,  y: G },
    { type: 'lixeira',  x: 1450, y: G },
    { type: 'grade',    x: 1700, y: G },
    { type: 'arvore',   x: 1250, y: G },
    { type: 'carro',    x: 2000, y: G, blocking: true },
    { type: 'poste',    x: 2100, y: G },
    { type: 'lixeira',  x: 2350, y: G },
    { type: 'saco_lixo',x: 2500, y: G },
    { type: 'arvore',   x: 2650, y: G },
    { type: 'grade',    x: 2900, y: G },
  ],
}

export const LEVEL_2_3: LevelData = {
  id: '2-3', name: 'Escadas de Emergência', bgColor: 0x0a0a1a,
  backgroundTheme: 'exterior' as const, timeLimit: 200, tileWidthCols: 110,
  tiles: [
    r23.e(), r23.e(),
    r23.mp([8,5], [22,4]),
    r23.mp([35,5], [48,3]), r23.e(),
    r23.mp([58,6], [70,4]), r23.e(),
    r23.mp([78,5], [90,4], [103,4]),
    r23.mp([82,3], [95,3], [106,4]),
    r23.e(), r23.e(), r23.e(), r23.e(),
    r23.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3456, exitY: 370,
  checkpointX: 1760, checkpointY: 380,
  enemies: [
    { type: 'rato',    x: 350,  y: 390 },
    { type: 'pombo',   x: 500,  y: 120 },
    { type: 'gato',    x: 800,  y: 390 },
    { type: 'morador', x: 1000, y: 390 },
    { type: 'pombo',   x: 1200, y: 120 },
    { type: 'rato',    x: 1400, y: 390 },
    { type: 'gato',    x: 1600, y: 390 },
    { type: 'dono',    x: 1800, y: 390 },
    { type: 'pombo',   x: 2000, y: 120 },
    { type: 'morador', x: 2600, y: 390 },
    { type: 'gato',    x: 2400, y: 390 },
    { type: 'rato',    x: 2200, y: 390 },
    { type: 'pombo',   x: 2800, y: 120 },
    { type: 'dono',    x: 3200, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 160,  y: 380 },
    { type: 'bone',           x: 450,  y: 380 },
    { type: 'petisco',        x: 650,  y: 380 },
    { type: 'bone',           x: 900,  y: 380 },
    { type: 'surprise_block', x: 1100, y: 300 },
    { type: 'bone',           x: 1350, y: 380 },
    { type: 'pizza',          x: 1600, y: 380 },
    { type: 'bone',           x: 1900, y: 380 },
    { type: 'surprise_block', x: 2000, y: 300 },
    { type: 'petisco',        x: 2150, y: 380 },
    { type: 'bone',           x: 2450, y: 380 },
    { type: 'bandana',        x: 2700, y: 380 },
    { type: 'bone',           x: 3100, y: 380 },
    { type: 'surprise_block', x: 3000, y: 300 },
    { type: 'coleira',        x: 3300, y: 380 },
  ],
  goldenBones: [
    { x: 352,  y: 64 },
    { x: 1664, y: 96 },
    { x: 2560, y: 192 },
    { x: 3200, y: 64 },
  ],
  nextLevel: '2-boss',
  intro: {
    complexity: 3,
    dialogue: [
      'As escadas de emergência — vamos subir andar a andar!',
      'Sempre soube que morreria a subir escadas. Vamos lá.',
    ],
  },
  decorations: [
    { type: 'poste',    x: 200,  y: G },
    { type: 'saco_lixo',x: 400,  y: G },
    { type: 'grade',    x: 500,  y: G },
    { type: 'arvore',   x: 750,  y: G },
    { type: 'lixeira',  x: 1000, y: G },
    { type: 'grade',    x: 1200, y: G },
    { type: 'placa',    x: 1300, y: G },
    { type: 'saco_lixo',x: 1500, y: G },
    { type: 'arvore',   x: 1800, y: G },
    { type: 'poste',    x: 2000, y: G },
    { type: 'lixeira',  x: 2200, y: G },
    { type: 'grade',    x: 2400, y: G },
    { type: 'saco_lixo',x: 2700, y: G },
    { type: 'grade',    x: 3100, y: G },
    { type: 'lixeira',  x: 3000, y: G },
    { type: 'placa',    x: 2900, y: G },
  ],
}

export const LEVEL_2_BOSS: LevelData = {
  id: '2-boss', name: 'Telhado — Drone Ataca!', bgColor: 0x050510,
  backgroundTheme: 'telhado' as const, timeLimit: 0, tileWidthCols: 60,
  tiles: (() => {
    const BC = 60
    return [
      Array(BC).fill(0), Array(BC).fill(0), Array(BC).fill(0), Array(BC).fill(0),
      // plataforma lateral esquerda
      [...Array(6).fill(0), ...Array(5).fill(1), ...Array(BC - 11).fill(0)],
      // plataforma lateral direita
      [...Array(BC - 11).fill(0), ...Array(5).fill(1), ...Array(6).fill(0)],
      Array(BC).fill(0), Array(BC).fill(0), Array(BC).fill(0),
      Array(BC).fill(0), Array(BC).fill(0), Array(BC).fill(0),
      Array(BC).fill(0),
      Array(BC).fill(1),  // chão
    ]
  })(),
  spawnX: 64, spawnY: 300, exitX: 1856, exitY: 370,
  checkpointX: 80, checkpointY: 300,
  enemies: [], items: [], goldenBones: [],
  nextLevel: null, isBossLevel: true,
  intro: {
    complexity: 3,
    dialogue: [
      'Um drone de vigilância — tem câmeras em todo lado!',
      'Eu comprei um drone igual a este. O meu era mais elegante.',
    ],
  },
  decorations: [
    { type: 'poste',   x: 200,  y: G },
    { type: 'poste',   x: 600,  y: G },
    { type: 'lixeira', x: 900,  y: G },
    { type: 'poste',   x: 1300, y: G },
    { type: 'lixeira', x: 1700, y: G },
  ],
}

export const WORLD2_LEVELS: Record<string, LevelData> = {
  '2-1': LEVEL_2_1, '2-2': LEVEL_2_2, '2-3': LEVEL_2_3, '2-boss': LEVEL_2_BOSS,
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors. Note: `LEVEL_2_BOSS` tile array must have exactly 14 rows (4 empty + 2 platform + 6 empty + 1 empty + 1 ground = 14 ✓). LEVEL_2_2 tiles: 3 empty + (mp+e) + (p+mp+e) + (mp+p+e) + (mp+e+e) + g = 3+2+3+3+3+1 = 15 — **this is wrong, check carefully.** Correct tile count for 2-2: `r22.e(), r22.e(), r22.e()` = 3; `r22.mp(...), r22.e()` = 2; `r22.p(18,5), r22.mp(...), r22.e()` = 3; `r22.mp(...), r22.p(50,4), r22.e()` = 3; `r22.mp(...), r22.e(), r22.e()` = 3; `r22.g()` = 1 → total = **15 rows**. Must be 14. Fix by removing one `r22.e()` — remove the final `r22.e()` from the last row group before `r22.g()`:

If tsc reports no error but tiles are wrong, correct the `tiles` for `LEVEL_2_2`:
```typescript
  tiles: [
    r22.e(), r22.e(), r22.e(),
    r22.mp([5,4], [55,4], [82,4]), r22.e(),
    r22.p(18, 5), r22.mp([40,3], [68,3]), r22.e(),
    r22.mp([28,6], [75,5]), r22.p(50, 4), r22.e(),
    r22.mp([62,5], [85,4]), r22.e(),
    r22.g(),
  ],
```
This gives 3+2+3+3+2+1 = **14 rows** ✓.

And for `LEVEL_2_3`, count: `r23.e(), r23.e()` = 2; `r23.mp(...)` = 1; `r23.mp(...), r23.e()` = 2; `r23.mp(...), r23.e()` = 2; `r23.mp(...)` = 1; `r23.mp(...)` = 1; `r23.e() ×4` = 4; `r23.g()` = 1 → total = **14 rows** ✓.

Write the file with LEVEL_2_2 using the corrected 14-row tiles:

```typescript
  tiles: [
    r22.e(), r22.e(), r22.e(),
    r22.mp([5,4], [55,4], [82,4]), r22.e(),
    r22.p(18, 5), r22.mp([40,3], [68,3]), r22.e(),
    r22.mp([28,6], [75,5]), r22.p(50, 4), r22.e(),
    r22.mp([62,5], [85,4]), r22.e(),
    r22.g(),
  ],
```

Re-run `npx tsc --noEmit` after fixing.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All existing tests still pass (World2.ts has no test file — tile structure is validated by TypeScript + visual QA).

- [ ] **Step 4: Commit**

```bash
git add src/levels/World2.ts
git commit -m "feat: create World2 levels (2-1 Passeio, 2-2 Pátio, 2-3 Escadas, 2-boss Drone)"
```

---

## Task 4: Create Drone boss

**Files:**
- Create: `src/entities/enemies/Drone.ts`

Context: Model after `src/entities/enemies/Aspirador.ts`. Key differences:
- `body.setGravityY(-800)` in constructor → drone floats
- Phase thresholds: 67%/34% (same as Wall-E)
- Attacks: `_throwBomb()` (arc, gravity normal on projectile) and `_throwLaser()` (straight, gravity -800)
- No `_charge()` — drone does not physically charge
- `onDeath()`: fall + shrink animation

The `Enemy` base class has `hp`, `takeDamage()`, `speed`, `direction`, `isStunned()`, `onDeath()`. Constructor signature: `super(scene, x, y, textureKey, hp, speed)`.

- [ ] **Step 1: Create src/entities/enemies/Drone.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

type Phase = 1 | 2 | 3

export class Drone extends Enemy {
  private readonly MAX_HP = 20
  private phase: Phase = 1
  private _isDying = false
  private _playerX: number = 400
  private _playerY: number = 200
  private _attackTimer: number = 3000

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.DRONE, 20, 100)
    this.setScale(2)
    ;(this.body as Phaser.Physics.Arcade.Body)
      .setSize(28, 16)
      .setOffset(2, 2)
      .setGravityY(-800)   // cancela gravidade do mundo — drone flutua
    this.setCollideWorldBounds(true)
    this.setVelocityX(100)
  }

  takeDamage(amount: number = 1): void {
    if (this._isDying) return
    super.takeDamage(Math.min(amount, 2))
  }

  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  update(time: number, _delta: number): void {
    if (this._isDying || this.isStunned()) return

    this._checkPhaseTransition()

    const body = this.body as Phaser.Physics.Arcade.Body

    // Patrulha horizontal — rebate nas paredes
    if (body.blocked.left)  { this.direction = 1;  this.setVelocityX(this.speed) }
    if (body.blocked.right) { this.direction = -1; this.setVelocityX(-this.speed) }
    if (Math.abs(body.velocity.x) < 10) this.setVelocityX(this.direction * this.speed)

    this.setFlipX(this.direction === -1)

    // Ataques baseados em timer
    if (time > this._attackTimer) {
      if (this.phase === 1) {
        this._throwBomb()
      } else if (this.phase === 2) {
        this._throwBomb()
        this.scene.time.delayedCall(400, () => { if (this.active) this._throwBomb() })
      } else {
        this._throwBomb()
        this.scene.time.delayedCall(300, () => { if (this.active) this._throwLaser() })
      }
      this._attackTimer = time + (this.phase === 1 ? 3000 : this.phase === 2 ? 2200 : 2000)
    }
  }

  private _checkPhaseTransition(): void {
    const hpPct = this.hp / this.MAX_HP
    if (hpPct <= 0.34 && this.phase < 3) {
      this.phase = 3
      this.speed = 180
      this.setTint(0xff4444)
    } else if (hpPct <= 0.67 && this.phase < 2) {
      this.phase = 2
      this.speed = 140
      this.setTint(0xff8800)
    }
  }

  /** Lança bomba em arco descendente em direção ao jogador */
  private _throwBomb(): void {
    if (!this.scene || !this.active) return
    const dx = this._playerX - this.x
    // arco forçado: ângulo para baixo com dy fixo em 200 para garantir parábola
    const angle = Math.atan2(200, dx)
    const speed = 180
    const vx = Math.cos(angle) * speed
    const vy = -160  // sobe ligeiramente antes de descer (gravidade normal no projétil)
    this.emit('spawnBomb', { x: this.x, y: this.y + 8, vx, vy })
  }

  /** Lança laser horizontal reto em direção ao jogador */
  private _throwLaser(): void {
    if (!this.scene || !this.active) return
    const dx = this._playerX - this.x > 0 ? 1 : -1
    this.emit('spawnLaser', { x: this.x + dx * 16, y: this.y, vx: dx * 320, vy: 0 })
  }

  protected onDeath(): void {
    this._isDying = true
    ;(this.body as Phaser.Physics.Arcade.Body).setEnable(false)
    this.setTint(0xff4444)
    // Queda + encolhimento
    ;(this.body as Phaser.Physics.Arcade.Body).setGravityY(0)  // deixa cair naturalmente
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: 180,
      duration: 900,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.emit('died', this)
        this.destroy()
      },
    })
  }
}
```

- [ ] **Step 2: Add KEYS.DRONE sprite to BootScene.ts**

The Drone needs a texture key `KEYS.DRONE`. First add the key to `src/constants.ts`.

Find in `src/constants.ts`:
```typescript
  ASPIRADOR: 'aspirador',
```

Add immediately after it:
```typescript
  DRONE:     'drone',
```

Then in `src/scenes/BootScene.ts`, find the ASPIRADOR sprite generation block and add a DRONE sprite after it. Search for:
```typescript
    gen(KEYS.ASPIRADOR, 36, 20)
```

Add immediately after it:
```typescript

    // DRONE: robô voador — retângulo cinza escuro com hélices 32×18
    clr()
    g.fillStyle(0x333344); g.fillRect(2, 6, 28, 10)    // corpo principal
    g.fillStyle(0x444455); g.fillRect(4, 7, 24, 8)     // detalhe superior
    g.fillStyle(0x22ccff); g.fillRect(13, 8, 6, 6)     // câmera (azul ciano)
    g.fillStyle(0x222233); g.fillRect(0, 4, 6, 4)      // hélice esq
    g.fillStyle(0x222233); g.fillRect(26, 4, 6, 4)     // hélice dir
    g.lineStyle(1, 0x5555aa); g.strokeRect(2, 6, 28, 10)
    gen(KEYS.DRONE, 32, 18)
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
git add src/entities/enemies/Drone.ts src/constants.ts src/scenes/BootScene.ts
git commit -m "feat: create Drone boss (3 phases, spawnBomb/spawnLaser) and DRONE sprite"
```

---

## Task 5: Wire World 2 into the game

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/scenes/WorldMapScene.ts`
- Modify: `src/levels/World1.ts`

Context:
- `GameScene.ts` line 53: `const ALL_LEVELS = { ...WORLD0_LEVELS, ...WORLD1_LEVELS }` — add `WORLD2_LEVELS`
- `GameScene.ts` boss dispatch is an `if / else if` chain around line 340–410 that checks `this.currentLevel.id`
- `WorldMapScene.ts` line 60: `const worlds = ['Mundo 0 — Apartamento', 'Mundo 1 — Cidade']` — add Mundo 2
- `WorldMapScene.ts` line 61: `const worldStartY = [70, 200]` — add y:330
- `World1.ts`: `LEVEL_1_BOSS.nextLevel: null → '2-1'`

- [ ] **Step 1: Import WORLD2_LEVELS in GameScene.ts**

Find in `src/scenes/GameScene.ts`:
```typescript
import { WORLD1_LEVELS } from '../levels/World1'
import { WORLD0_LEVELS } from '../levels/World0'
```

Replace with:
```typescript
import { WORLD1_LEVELS } from '../levels/World1'
import { WORLD0_LEVELS } from '../levels/World0'
import { WORLD2_LEVELS } from '../levels/World2'
```

- [ ] **Step 2: Add WORLD2_LEVELS to ALL_LEVELS in GameScene.ts**

Find in `src/scenes/GameScene.ts`:
```typescript
    const ALL_LEVELS = { ...WORLD0_LEVELS, ...WORLD1_LEVELS }
```

Replace with:
```typescript
    const ALL_LEVELS = { ...WORLD0_LEVELS, ...WORLD1_LEVELS, ...WORLD2_LEVELS }
```

- [ ] **Step 3: Add Drone boss handler in GameScene.ts**

Also import `Drone` at the top of `GameScene.ts`. Find:
```typescript
import { Aspirador } from '../entities/enemies/Aspirador'
```

Replace with:
```typescript
import { Aspirador } from '../entities/enemies/Aspirador'
import { Drone } from '../entities/enemies/Drone'
```

Now find the SeuBigodes boss block (around line 398–415):
```typescript
      } else {
        // Seu Bigodes boss
        const boss = new SeuBigodes(this, 480, 360)
        this.enemyGroup.add(boss)
        boss.on('died', (b: Enemy) => {
```

Add a new `else if` for the Drone boss BEFORE the final `else`. Find the `if` that starts the boss dispatch. The structure looks like:

```typescript
      if (this.currentLevel.id === '0-boss') {
        // Aspirador block
        ...
      } else {
        // Seu Bigodes block
        ...
      }
```

Replace that structure with:
```typescript
      if (this.currentLevel.id === '0-boss') {
        // Wall-E (Aspirador) boss
        const boss = new Aspirador(this, mapWidth / 2, 360)
        this.enemyGroup.add(boss)

        // Grupo de projéteis do Aspirador
        this._bossProjectileGroup = this.physics.add.group()
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

        boss.on('spawnBlade', (data: { x: number; y: number; vx: number; vy: number }) => {
          if (!this._bossProjectileGroup || !this.scene.isActive(KEYS.GAME)) return
          const blade = this.physics.add.image(data.x, data.y, KEYS.BLADE)
          blade.setDepth(5)
          const body = blade.body as Phaser.Physics.Arcade.Body
          body.setVelocity(data.vx, data.vy)
          body.setGravityY(-800)
          blade.setAngularVelocity(480)
          this._bossProjectileGroup.add(blade)
          this.time.delayedCall(4000, () => { if (blade.active) blade.destroy() })
        })

        boss.on('died', (b: Enemy) => {
          gameState.addScore(500)
          gameState.sessionEnemiesKilled++
          this._fx.enemyDeathBurst(b.x, b.y)
          this._spawnScorePopup(b.x, b.y - 30, '+500', '#22ccff')
          this._levelComplete()
        })

        this.time.addEvent({
          delay: 100, loop: true, callback: () => {
            if (boss.active && this.player) boss.setPlayerPos(this.player.x, this.player.y)
          },
        })

      } else if (this.currentLevel.id === '2-boss') {
        // Drone boss
        const boss = new Drone(this, mapWidth / 2, 180)
        this.enemyGroup.add(boss)

        this._bossProjectileGroup = this.physics.add.group()

        boss.on('spawnBomb', (data: { x: number; y: number; vx: number; vy: number }) => {
          if (!this._bossProjectileGroup || !this.scene.isActive(KEYS.GAME)) return
          const bomb = this.physics.add.image(data.x, data.y, KEYS.BOMB)
          bomb.setDepth(5)
          const body = bomb.body as Phaser.Physics.Arcade.Body
          body.setVelocity(data.vx, data.vy)
          // gravidade normal → projétil cai em parábola
          this._bossProjectileGroup.add(bomb)
          this.time.delayedCall(4000, () => { if (bomb.active) bomb.destroy() })
        })

        boss.on('spawnLaser', (data: { x: number; y: number; vx: number; vy: number }) => {
          if (!this._bossProjectileGroup || !this.scene.isActive(KEYS.GAME)) return
          const laser = this.physics.add.image(data.x, data.y, KEYS.LASER)
          laser.setDepth(5)
          const body = laser.body as Phaser.Physics.Arcade.Body
          body.setVelocity(data.vx, data.vy)
          body.setGravityY(-800)   // tiro reto horizontal
          this._bossProjectileGroup.add(laser)
          this.time.delayedCall(3000, () => { if (laser.active) laser.destroy() })
        })

        boss.on('died', (b: Enemy) => {
          gameState.addScore(500)
          gameState.sessionEnemiesKilled++
          this._fx.enemyDeathBurst(b.x, b.y)
          this._spawnScorePopup(b.x, b.y - 30, '+500', '#22ccff')
          this._levelComplete()
        })

        this.time.addEvent({
          delay: 100, loop: true, callback: () => {
            if (boss.active && this.player) boss.setPlayerPos(this.player.x, this.player.y)
          },
        })

      } else {
        // Seu Bigodes boss
        const boss = new SeuBigodes(this, 480, 360)
        this.enemyGroup.add(boss)
        boss.on('died', (b: Enemy) => {
          gameState.addScore(1000)
          gameState.sessionEnemiesKilled++
          gameState.collarOfGold = true
          this._fx.enemyDeathBurst(b.x, b.y)
          this._spawnScorePopup(b.x, b.y - 30, '+1000', '#22c55e')
          this._levelComplete()
        })
        boss.on('spawnMinion', (minion: Enemy) => {
          this.enemyGroup.add(minion)
          minion.on('died', (e: Enemy) => {
            gameState.addScore(SCORING.ENEMY_KILL)
            gameState.sessionEnemiesKilled++
            this._fx.enemyDeathBurst(e.x, e.y)
          })
        })
        this.time.addEvent({
          delay: 100, loop: true, callback: () => {
            if (boss.active && this.player) boss.setPlayerPos(this.player.x, this.player.y)
          },
        })
      }
```

**Note:** Read the actual GameScene.ts boss dispatch section carefully before editing. The replacement above mirrors the existing pattern exactly. Only add the `else if ('2-boss')` block — do not change any existing Aspirador or SeuBigodes logic.

- [ ] **Step 4: Add Mundo 2 to WorldMapScene.ts**

Find in `src/scenes/WorldMapScene.ts`:
```typescript
  // World 1
  { levelId: '1-1',    label: 'Rua',       world: 'Mundo 1 — Cidade',       x: 80,  y: 0 },
  { levelId: '1-2',    label: 'Praça',     world: 'Mundo 1 — Cidade',       x: 200, y: 0 },
  { levelId: '1-3',    label: 'Mercado',   world: 'Mundo 1 — Cidade',       x: 320, y: 0 },
  { levelId: '1-boss', label: 'Boss',      world: 'Mundo 1 — Cidade',       x: 440, y: 0 },
]
```

Replace with:
```typescript
  // World 1
  { levelId: '1-1',    label: 'Rua',       world: 'Mundo 1 — Cidade',       x: 80,  y: 0 },
  { levelId: '1-2',    label: 'Praça',     world: 'Mundo 1 — Cidade',       x: 200, y: 0 },
  { levelId: '1-3',    label: 'Mercado',   world: 'Mundo 1 — Cidade',       x: 320, y: 0 },
  { levelId: '1-boss', label: 'Boss',      world: 'Mundo 1 — Cidade',       x: 440, y: 0 },
  // World 2
  { levelId: '2-1',    label: 'Passeio',   world: 'Mundo 2 — Exterior',     x: 80,  y: 0 },
  { levelId: '2-2',    label: 'Pátio',     world: 'Mundo 2 — Exterior',     x: 200, y: 0 },
  { levelId: '2-3',    label: 'Escadas',   world: 'Mundo 2 — Exterior',     x: 320, y: 0 },
  { levelId: '2-boss', label: 'Drone',     world: 'Mundo 2 — Exterior',     x: 440, y: 0 },
]
```

Find:
```typescript
    const worlds = ['Mundo 0 — Apartamento', 'Mundo 1 — Cidade']
    const worldStartY = [70, 200]
```

Replace with:
```typescript
    const worlds = ['Mundo 0 — Apartamento', 'Mundo 1 — Cidade', 'Mundo 2 — Exterior']
    const worldStartY = [70, 200, 330]
```

- [ ] **Step 5: Wire LEVEL_1_BOSS.nextLevel in World1.ts**

Find in `src/levels/World1.ts`:
```typescript
  nextLevel: null, isBossLevel: true,
```

Replace with:
```typescript
  nextLevel: '2-1', isBossLevel: true,
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
git add src/scenes/GameScene.ts src/scenes/WorldMapScene.ts src/levels/World1.ts
git commit -m "feat: wire World2 into GameScene + WorldMapScene, Drone boss handlers, World1 chain to 2-1"
```

---

## Final Verification

After all 5 tasks:

- [ ] `npx tsc --noEmit` — no errors
- [ ] `npx vitest run` — all pass
- [ ] Visual smoke tests:
  - WorldMapScene shows Mundo 2 row with 4 locked nodes
  - Phase 2-1 loads (dark blue sky, parallax layers visible)
  - Phase 2-2 loads (patio brick background)
  - Phase 2-boss loads Drone floating at y:180, bombs arc down, lasers fire straight
  - After 1-boss, nextLevel leads to 2-1
