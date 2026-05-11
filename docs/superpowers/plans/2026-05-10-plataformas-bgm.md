# Plataformas Móveis + BGM por Mundo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o bug de plataformas móveis que ficam estáticas visualmente e adicionar trilhas musicais procedurais distintas para cada mundo.

**Architecture:** Quatro tarefas independentes em dois arquivos de produção. Plataformas: substituir `TileSprite + physics.add.existing()` por `physics.add.image()` em `GameScene._buildMovingPlatforms()`, depois adicionar carry callback nos colliders. BGM: estender `SoundManager.ts` com 5 constantes PBeat + type union, depois substituir a chamada `playBgm()` em `GameScene.create()` por `playProceduralBgm()`. Sem novos arquivos de produção.

**Tech Stack:** TypeScript, Phaser 3 Arcade Physics, Web Audio API, Vitest

---

## Arquivos modificados

| Arquivo | O que muda |
|---|---|
| `src/scenes/GameScene.ts` | `_buildMovingPlatforms()` (sprite) + colliders (carry) + BGM call |
| `src/audio/SoundManager.ts` | Type union + `_procType` + 5 PBeat constants + map em `playProceduralBgm` + map em `setMuted` |

---

## Task 1: Corrigir criação da sprite de plataforma móvel

**Files:**
- Modify: `src/scenes/GameScene.ts` — método `_buildMovingPlatforms()` (linha ~301)

**Contexto:** O método atual usa `this.add.tileSprite() + this.physics.add.existing()`. Em Phaser 3, isso cria um corpo de física que se move mas o engine NÃO sincroniza de volta a posição para o TileSprite visual. Substituir por `this.physics.add.image()` que sincroniza automaticamente.

- [ ] **Step 1: Localizar o bloco a substituir**

Em `src/scenes/GameScene.ts`, localizar exatamente (linha ~307):
```typescript
      const sprite = this.add.tileSprite(cfg.x, cfg.y, cfg.width, 16, KEYS.TILE_PLATFORM)
        .setOrigin(0.5, 0.5)
        .setDepth(2)

      this.physics.add.existing(sprite)
      const body = sprite.body as Phaser.Physics.Arcade.Body
```

- [ ] **Step 2: Substituir pela versão com physics.add.image()**

Substituir o trecho acima por:
```typescript
      const sprite = this.physics.add.image(cfg.x, cfg.y, KEYS.TILE_PLATFORM)
        .setOrigin(0.5, 0.5)
        .setDepth(2)
        .setDisplaySize(cfg.width, 16)

      const body = sprite.body as Phaser.Physics.Arcade.Body
      body.setSize(cfg.width, 16)
```

> `setDisplaySize` ajusta o visual; `body.setSize` ajusta o hitbox para cobrir toda a largura da plataforma.

- [ ] **Step 3: Verificar build**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 4: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add src/scenes/GameScene.ts
git commit -m "fix(game): plataformas móveis — substituir TileSprite por physics.add.image()"
```

---

## Task 2: Carry — jogador se move junto com plataforma horizontal

**Files:**
- Modify: `src/scenes/GameScene.ts` — bloco de colliders de plataformas dinâmicas (linha ~725)

**Contexto:** Em plataformas verticais, a física do Phaser já empurra o jogador para cima. Em plataformas horizontais, o jogador fica parado enquanto a plataforma passa por baixo. O carry é aplicado via process callback no collider: quando `body.blocked.down` e a plataforma tem velocidade X, soma a velocidade da plataforma ao X do jogador.

- [ ] **Step 1: Localizar o bloco a substituir**

Em `src/scenes/GameScene.ts`, localizar exatamente (linha ~725):
```typescript
    if (this._movingPlatformGroup.getLength() > 0) {
      this.physics.add.collider(this.player.raya,    this._movingPlatformGroup)
      this.physics.add.collider(this.player.cruella, this._movingPlatformGroup)
    }
```

- [ ] **Step 2: Substituir com carry callback**

```typescript
    if (this._movingPlatformGroup.getLength() > 0) {
      const carryCallback = (
        playerSprite: Phaser.GameObjects.GameObject,
        platform: Phaser.GameObjects.GameObject
      ): boolean => {
        const pb    = (playerSprite as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
        const platB = (platform    as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
        if (pb.blocked.down && platB.velocity.x !== 0) {
          (playerSprite as Phaser.Physics.Arcade.Image).x += platB.velocity.x / 60
        }
        return true
      }
      this.physics.add.collider(this.player.raya,   this._movingPlatformGroup, undefined, carryCallback as any, this)
      this.physics.add.collider(this.player.cruella, this._movingPlatformGroup, undefined, carryCallback as any, this)
    }
```

> `/ 60` assume 60fps — suficiente para carry suave sem usar delta no process callback (que não recebe delta).

- [ ] **Step 3: Verificar build**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 4: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add src/scenes/GameScene.ts
git commit -m "feat(game): carry — jogador se move junto com plataforma horizontal"
```

---

## Task 3: Adicionar 5 tracks BGM procedurais ao SoundManager

**Files:**
- Modify: `src/audio/SoundManager.ts`

**Contexto:** `playProceduralBgm` aceita `'menu' | 'intro' | 'victory' | 'gameover'`. O tipo `_procType` (linha ~190) controla qual track retomar após unmute. Ambos precisam ser estendidos. Os tracks são arrays de `PBeat = [freq_hz, beat_offset, duration_beats, gain]`.

- [ ] **Step 1: Estender o type union de `playProceduralBgm`**

Localizar (linha ~319):
```typescript
  playProceduralBgm(type: 'menu' | 'intro' | 'victory' | 'gameover'): void {
```

Substituir por:
```typescript
  playProceduralBgm(type: 'menu' | 'intro' | 'victory' | 'gameover' | 'world0' | 'world1' | 'world2' | 'world3' | 'boss'): void {
```

- [ ] **Step 2: Estender `_procType`**

Localizar (linha ~190):
```typescript
let _procType: 'menu' | 'intro' | null = null
```

Substituir por:
```typescript
let _procType: 'menu' | 'intro' | 'world0' | 'world1' | 'world2' | 'world3' | 'boss' | null = null
```

- [ ] **Step 3: Adicionar as constantes PBeat dos 5 novos tracks**

Localizar o bloco de constantes procedurais (depois do `_INTRO_BASS` e antes de `let _procActive`). Adicionar:

```typescript
// ── World 0 — Dó maior, 72 BPM, loop 16 beats (calmo, doméstico) ───────────
const _WORLD0_BPM  = 72
const _WORLD0_LOOP = 16
const _WORLD0_MEL: PBeat[] = [
  [261.6, 0,    1.0, 0.14], // C4
  [329.6, 1,    0.7, 0.12], // E4
  [392.0, 2,    0.7, 0.13], // G4
  [349.2, 3,    1.0, 0.12], // F4
  [329.6, 4,    1.2, 0.13], // E4
  [261.6, 5.5,  0.6, 0.11], // C4
  [293.7, 6,    0.7, 0.12], // D4
  [329.6, 7,    1.3, 0.13], // E4
  [392.0, 9,    0.7, 0.14], // G4
  [440.0, 10,   0.7, 0.13], // A4
  [392.0, 11,   0.6, 0.12], // G4
  [349.2, 12,   1.0, 0.13], // F4
  [329.6, 13,   0.7, 0.12], // E4
  [261.6, 14,   1.8, 0.14], // C4
]
const _WORLD0_BASS: PBeat[] = [
  [65.4,  0,  3.5, 0.16], // C2
  [87.3,  4,  3.5, 0.15], // F2
  [65.4,  8,  3.5, 0.16], // C2
  [98.0,  12, 3.5, 0.15], // G2
]

// ── World 1 — Fá maior, 104 BPM, loop 8 beats (animado, walking) ────────────
const _WORLD1_BPM  = 104
const _WORLD1_LOOP = 8
const _WORLD1_MEL: PBeat[] = [
  [349.2, 0,    0.35, 0.15], // F4
  [440.0, 0.5,  0.35, 0.13], // A4
  [523.3, 1,    0.35, 0.15], // C5
  [493.9, 1.5,  0.35, 0.13], // B4
  [440.0, 2,    0.50, 0.14], // A4
  [392.0, 2.75, 0.30, 0.12], // G4
  [349.2, 3,    0.70, 0.15], // F4
  [392.0, 4,    0.35, 0.13], // G4
  [440.0, 4.5,  0.35, 0.14], // A4
  [466.2, 5,    0.35, 0.13], // Bb4
  [523.3, 5.5,  0.35, 0.15], // C5
  [466.2, 6,    0.35, 0.13], // Bb4
  [440.0, 6.5,  0.30, 0.12], // A4
  [349.2, 7,    0.80, 0.15], // F4
]
const _WORLD1_BASS: PBeat[] = [
  [87.3,  0, 0.6, 0.17], // F2
  [130.8, 1, 0.6, 0.16], // C3
  [87.3,  2, 0.6, 0.17], // F2
  [110.0, 3, 0.6, 0.16], // A2
  [87.3,  4, 0.6, 0.17], // F2
  [130.8, 5, 0.6, 0.16], // C3
  [174.6, 6, 0.6, 0.17], // F3
  [196.0, 7, 0.6, 0.16], // G3
]

// ── World 2 — Sol mixolídio, 112 BPM, loop 8 beats (tenso, sincopado) ───────
const _WORLD2_BPM  = 112
const _WORLD2_LOOP = 8
const _WORLD2_MEL: PBeat[] = [
  [392.0, 0,    0.30, 0.16], // G4
  [440.0, 0.5,  0.30, 0.14], // A4
  [523.3, 1,    0.40, 0.16], // C5
  [523.3, 1.5,  0.30, 0.14], // C5
  [493.9, 2,    0.60, 0.15], // B4
  [466.2, 3,    0.40, 0.14], // Bb4
  [440.0, 3.5,  0.40, 0.14], // A4
  [392.0, 4,    0.30, 0.16], // G4
  [349.2, 4.5,  0.30, 0.14], // F4
  [392.0, 5,    0.50, 0.15], // G4
  [466.2, 6,    0.40, 0.14], // Bb4
  [440.0, 6.5,  0.30, 0.13], // A4
  [392.0, 7,    0.80, 0.16], // G4
]
const _WORLD2_BASS: PBeat[] = [
  [98.0,  0, 0.55, 0.18], // G2
  [130.8, 1, 0.55, 0.17], // C3
  [98.0,  2, 0.55, 0.18], // G2
  [87.3,  3, 0.55, 0.17], // F2
  [98.0,  4, 0.55, 0.18], // G2
  [130.8, 5, 0.55, 0.17], // C3
  [87.3,  6, 0.55, 0.18], // F2
  [98.0,  7, 0.55, 0.17], // G2
]

// ── World 3 — Lá menor, 80 BPM, loop 16 beats (sombrio, esparso) ────────────
const _WORLD3_BPM  = 80
const _WORLD3_LOOP = 16
const _WORLD3_MEL: PBeat[] = [
  [440.0, 0,    1.2, 0.13], // A4
  [392.0, 2,    0.8, 0.12], // G4
  [349.2, 3,    1.0, 0.12], // F4
  [329.6, 4,    1.5, 0.14], // E4
  [293.7, 6,    0.8, 0.12], // D4
  [261.6, 7,    1.0, 0.11], // C4
  [220.0, 8,    2.0, 0.14], // A3
  [261.6, 11,   0.8, 0.11], // C4
  [293.7, 12,   0.7, 0.12], // D4
  [329.6, 13,   0.7, 0.12], // E4
  [349.2, 14,   0.6, 0.11], // F4
  [440.0, 15,   0.8, 0.13], // A4
]
const _WORLD3_BASS: PBeat[] = [
  [55.0,  0,  5.5, 0.18], // A1
  [65.4,  6,  4.5, 0.16], // C2
  [55.0,  12, 3.5, 0.18], // A1
  [61.7,  15, 0.8, 0.16], // B1
]

// ── Boss — Mi menor, 140 BPM, loop 8 beats (urgente, ostinato) ───────────────
const _BOSS_BPM  = 140
const _BOSS_LOOP = 8
const _BOSS_MEL: PBeat[] = [
  [329.6, 0,    0.25, 0.18], // E4
  [329.6, 0.5,  0.25, 0.17], // E4
  [392.0, 1,    0.25, 0.18], // G4
  [440.0, 1.5,  0.35, 0.19], // A4
  [392.0, 2,    0.25, 0.17], // G4
  [329.6, 2.5,  0.25, 0.17], // E4
  [293.7, 3,    0.45, 0.18], // D4
  [329.6, 3.5,  0.25, 0.17], // E4
  [349.2, 4,    0.25, 0.18], // F4
  [329.6, 4.5,  0.25, 0.16], // E4
  [293.7, 5,    0.35, 0.18], // D4
  [261.6, 5.5,  0.25, 0.17], // C4
  [329.6, 6,    0.25, 0.18], // E4
  [293.7, 6.5,  0.25, 0.16], // D4
  [261.6, 7,    0.50, 0.19], // C4
]
const _BOSS_BASS: PBeat[] = [
  [82.4, 0, 0.4, 0.20], // E2
  [82.4, 1, 0.4, 0.20], // E2
  [98.0, 2, 0.4, 0.19], // G2
  [82.4, 3, 0.4, 0.20], // E2
  [82.4, 4, 0.4, 0.20], // E2
  [82.4, 5, 0.4, 0.19], // E2
  [73.4, 6, 0.4, 0.20], // D2
  [82.4, 7, 0.4, 0.20], // E2
]
```

- [ ] **Step 4: Atualizar o map em `playProceduralBgm()`**

Localizar (dentro de `playProceduralBgm`, linha ~331):
```typescript
    const map: Record<string, [PBeat[], PBeat[], number, number]> = {
      menu:     [_MENU_MEL,     _MENU_BASS,     _MENU_BPM,     _MENU_LOOP],
      intro:    [_INTRO_MEL,    _INTRO_BASS,    _INTRO_BPM,    _INTRO_LOOP],
      victory:  [_VICTORY_MEL,  _VICTORY_BASS,  _VICTORY_BPM,  _VICTORY_LOOP],
      gameover: [_GAMEOVER_MEL, _GAMEOVER_BASS, _GAMEOVER_BPM, _GAMEOVER_LOOP],
    }
```

Substituir por:
```typescript
    const map: Record<string, [PBeat[], PBeat[], number, number]> = {
      menu:     [_MENU_MEL,     _MENU_BASS,     _MENU_BPM,     _MENU_LOOP],
      intro:    [_INTRO_MEL,    _INTRO_BASS,    _INTRO_BPM,    _INTRO_LOOP],
      victory:  [_VICTORY_MEL,  _VICTORY_BASS,  _VICTORY_BPM,  _VICTORY_LOOP],
      gameover: [_GAMEOVER_MEL, _GAMEOVER_BASS, _GAMEOVER_BPM, _GAMEOVER_LOOP],
      world0:   [_WORLD0_MEL,   _WORLD0_BASS,   _WORLD0_BPM,   _WORLD0_LOOP],
      world1:   [_WORLD1_MEL,   _WORLD1_BASS,   _WORLD1_BPM,   _WORLD1_LOOP],
      world2:   [_WORLD2_MEL,   _WORLD2_BASS,   _WORLD2_BPM,   _WORLD2_LOOP],
      world3:   [_WORLD3_MEL,   _WORLD3_BASS,   _WORLD3_BPM,   _WORLD3_LOOP],
      boss:     [_BOSS_MEL,     _BOSS_BASS,     _BOSS_BPM,     _BOSS_LOOP],
    }
```

- [ ] **Step 5: Atualizar o map em `setMuted()`**

Localizar (dentro de `setMuted`, linha ~368):
```typescript
      const map: Record<string, [PBeat[], PBeat[], number, number]> = {
        menu:     [_MENU_MEL,     _MENU_BASS,     _MENU_BPM,     _MENU_LOOP],
        intro:    [_INTRO_MEL,    _INTRO_BASS,    _INTRO_BPM,    _INTRO_LOOP],
        victory:  [_VICTORY_MEL,  _VICTORY_BASS,  _VICTORY_BPM,  _VICTORY_LOOP],
        gameover: [_GAMEOVER_MEL, _GAMEOVER_BASS, _GAMEOVER_BPM, _GAMEOVER_LOOP],
      }
```

Substituir por (mesmo map do Step 4):
```typescript
      const map: Record<string, [PBeat[], PBeat[], number, number]> = {
        menu:     [_MENU_MEL,     _MENU_BASS,     _MENU_BPM,     _MENU_LOOP],
        intro:    [_INTRO_MEL,    _INTRO_BASS,    _INTRO_BPM,    _INTRO_LOOP],
        victory:  [_VICTORY_MEL,  _VICTORY_BASS,  _VICTORY_BPM,  _VICTORY_LOOP],
        gameover: [_GAMEOVER_MEL, _GAMEOVER_BASS, _GAMEOVER_BPM, _GAMEOVER_LOOP],
        world0:   [_WORLD0_MEL,   _WORLD0_BASS,   _WORLD0_BPM,   _WORLD0_LOOP],
        world1:   [_WORLD1_MEL,   _WORLD1_BASS,   _WORLD1_BPM,   _WORLD1_LOOP],
        world2:   [_WORLD2_MEL,   _WORLD2_BASS,   _WORLD2_BPM,   _WORLD2_LOOP],
        world3:   [_WORLD3_MEL,   _WORLD3_BASS,   _WORLD3_BPM,   _WORLD3_LOOP],
        boss:     [_BOSS_MEL,     _BOSS_BASS,     _BOSS_BPM,     _BOSS_LOOP],
      }
```

- [ ] **Step 6: Verificar build**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 7: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add src/audio/SoundManager.ts
git commit -m "feat(audio): BGM procedural para World0–3 e Boss (5 tracks via Web Audio)"
```

---

## Task 4: Wiring — disparar BGM correto em GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts` — bloco `// BGM` em `create()` (linha ~104)

**Contexto:** `GameScene.create()` já tem uma chamada `SoundManager.playBgm(bgmKey, this)` que tenta carregar um arquivo MP3 (que não existe). Essa chamada precisa ser substituída pela nova `playProceduralBgm()` que deriva o tipo do mundo a partir de `gameState.currentLevel`.

- [ ] **Step 1: Localizar e substituir a chamada BGM atual**

Localizar (linha ~104):
```typescript
    // BGM
    const bgmKey = this.currentLevel.isBossLevel ? KEYS.BGM_BOSS : KEYS.BGM_WORLD1
    SoundManager.playBgm(bgmKey, this)
```

Substituir por:
```typescript
    // BGM procedural por mundo
    const _worldId = gameState.currentLevel.split('-')[0]  // '0', '1', '2', '3'
    const _isBoss  = gameState.currentLevel.endsWith('boss')
    const _bgmType = _isBoss
      ? 'boss'
      : (`world${_worldId}` as 'world0' | 'world1' | 'world2' | 'world3')
    SoundManager.playProceduralBgm(_bgmType)
```

- [ ] **Step 2: Verificar build e testes**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5 && npm test 2>&1 | tail -6
```

Esperado: `✓ built` e `X passed (X)` sem regressões.

- [ ] **Step 3: Checklist de comportamento manual**

Verificar no browser (qualquer fase):
- ✅ Música começa ao entrar na fase (distinta do menu)
- ✅ Fase de World 1 tem ritmo mais animado que World 3
- ✅ Fase boss tem música mais intensa
- ✅ Tecla M silencia/retoma a música de gameplay corretamente
- ✅ Plataformas se movem visualmente
- ✅ Personagem "anda junto" ao ficar em cima de plataforma horizontal
- ✅ Plataforma inverte direção ao atingir o range configurado

- [ ] **Step 4: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add src/scenes/GameScene.ts
git commit -m "feat(game): BGM procedural por mundo — World0–3 e Boss com trilhas distintas"
```
