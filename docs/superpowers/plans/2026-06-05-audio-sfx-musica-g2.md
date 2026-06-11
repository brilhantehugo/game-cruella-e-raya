# Áudio: Toggles Separados Música/Efeitos (G2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir silenciar música e efeitos independentemente, com a tecla M como mute master, via `sfxMuted`/`musicMuted` + getter `muted` derivado.

**Architecture:** `GameState` troca o campo `muted` por `sfxMuted`+`musicMuted` e um getter `muted` (= ambos). `SoundManager` roteia checagens de SFX para `sfxMuted` e de BGM para `musicMuted`; `setMuted` (master) seta ambos, e novos `setMusicMuted`/`setSfxMuted` dão controle granular via `_applyMusicMute` (lógica de BGM extraída). `SettingsOverlay` ganha 2 toggles de áudio (Música/Efeitos) no lugar de 1.

**Tech Stack:** TypeScript, Phaser 3, Web Audio, Vitest

---

## Estrutura de arquivos

| Arquivo | Mudança |
|---|---|
| `src/GameState.ts` | `sfxMuted`/`musicMuted` + getter `muted`; resets |
| `tests/GameState.test.ts` | Atualizar 2 testes de mute |
| `src/audio/SoundManager.ts` | Rotear SFX/música; `setMuted`/`setMusicMuted`/`setSfxMuted`/`_applyMusicMute` |
| `src/ui/SettingsOverlay.ts` | 2 toggles de áudio + re-layout 3 toggles |

---

## Task 1: GameState — sfxMuted/musicMuted + getter muted (TDD)

**Files:**
- Modify: `src/GameState.ts`
- Modify: `tests/GameState.test.ts`

- [ ] **Step 1: Atualizar testes de mute em `tests/GameState.test.ts`**

Localizar (linhas ~140-148):
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
Substituir por:
```typescript
  it('muted começa false', () => {
    expect(state.muted).toBe(false)
  })

  it('muted é true só quando sfx e música silenciados', () => {
    state.sfxMuted = true
    expect(state.muted).toBe(false)   // música ainda ativa
    state.musicMuted = true
    expect(state.muted).toBe(true)    // ambos → master mutado
  })
```

- [ ] **Step 2: Rodar para verificar que falha**

```bash
npx vitest run tests/GameState.test.ts
```

Esperado: FAIL — `sfxMuted`/`musicMuted` não existem; `muted` ainda é campo gravável.

- [ ] **Step 3: Atualizar `src/GameState.ts`**

Localizar (linha ~21) `muted: boolean = false` e substituir por:
```typescript
  sfxMuted: boolean = false
  musicMuted: boolean = false
```

Adicionar o getter logo após a lista de campos (antes do primeiro método; por exemplo após `introSeen: Set<string> = new Set()`):
```typescript
  /** Master mute derivado — true só quando ambos silenciados. Usado pela tecla M. */
  get muted(): boolean { return this.sfxMuted && this.musicMuted }
```

> `sfxMuted`/`musicMuted` NÃO são reatribuídos em `reset()`/`resetAtCheckpoint()`/`resetLevel()` — persistem entre partidas (como o antigo `muted`). Atualizar o comentário no fim de `reset()`:
> ```typescript
>     // sfxMuted/musicMuted/reducedMotion são preferências — persistem entre partidas
> ```

- [ ] **Step 4: Rodar para verificar que passa**

```bash
npx vitest run tests/GameState.test.ts
```

Esperado: todos passam.

- [ ] **Step 5: Build (SoundManager terá erro por escrever `gameState.muted`)**

```bash
npm run build 2>&1 | grep "error TS" | head -10
```

Esperado: erro TS em `src/audio/SoundManager.ts` (escreve `gameState.muted = muted` num getter sem setter) — **esperado**, corrigido na Task 2. Se houver erro em outro arquivo, investigar.

- [ ] **Step 6: Commit**

```bash
git add src/GameState.ts tests/GameState.test.ts
git commit -m "feat: split muted into sfxMuted/musicMuted with derived muted getter"
```

---

## Task 2: SoundManager — rotear SFX/música + métodos granulares

**Files:**
- Modify: `src/audio/SoundManager.ts`

- [ ] **Step 1: Rotear checagens de SFX para `sfxMuted`**

Trocar `gameState.muted` por `gameState.sfxMuted` nestas 5 ocorrências:
- linha ~30 (`playTone`): `if (gameState.muted) return` → `if (gameState.sfxMuted) return`
- linha ~48 (`playArpeggio`): `if (gameState.muted) return` → `if (gameState.sfxMuted) return`
- linha ~67 (`playNoise`): `if (gameState.muted) return` → `if (gameState.sfxMuted) return`
- linha ~412 (`dashAbility`): `if (gameState.muted) break` → `if (gameState.sfxMuted) break`
- linha ~419 (`barkAbility`): `if (gameState.muted) break` → `if (gameState.sfxMuted) break`

- [ ] **Step 2: Rotear checagens de música para `musicMuted`**

Trocar `gameState.muted` por `gameState.musicMuted` nestas 3 ocorrências:
- linha ~372 (`_runProc`): `if (!_procActive || gameState.muted) return` → `if (!_procActive || gameState.musicMuted) return`
- linha ~449 (`playBgm`): `if (gameState.muted) return` → `if (gameState.musicMuted) return`
- linha ~465 (`playProceduralBgm`): `if (gameState.muted) return` → `if (gameState.musicMuted) return`

- [ ] **Step 3: Substituir `setMuted` por master + granulares + `_applyMusicMute`**

Localizar o método `setMuted` completo (linhas ~492-527):
```typescript
  setMuted(muted: boolean): void {
    gameState.muted = muted
    if (muted) {
      if (_currentBgm) { _currentBgm.stop(); _currentBgm.destroy(); _currentBgm = null }
      _stopProcLoop()
      // Mantém _procType e _lastBgmKey* para retomar ao desmutar
    } else if (_lastBgmKey && _lastBgmScene) {
      // Retoma MP3
      try {
        _currentBgm = _lastBgmScene.sound.add(_lastBgmKey, { loop: _lastBgmLoop, volume: 0.5 })
        _currentBgm.play()
      } catch {
        _currentBgm = null; _lastBgmKey = null; _lastBgmScene = null
      }
    } else if (_procType) {
      // Retoma procedural — cria nó mestre novo
      _procActive = true
      const c2 = getCtx()
      _procGainNode = c2.createGain()
      _procGainNode.gain.value = 1
      _procGainNode.connect(c2.destination)
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
      const [mel, bass, bpm, loop] = map[_procType]
      _runProc(mel, bass, bpm, loop)
    }
  },
```

Substituir por (master + granulares + `_applyMusicMute` com o mesmo corpo):
```typescript
  setMuted(muted: boolean): void {
    gameState.sfxMuted = muted
    gameState.musicMuted = muted
    this._applyMusicMute(muted)
  },

  setMusicMuted(muted: boolean): void {
    gameState.musicMuted = muted
    this._applyMusicMute(muted)
  },

  setSfxMuted(muted: boolean): void {
    gameState.sfxMuted = muted   // SFX checam o flag em cada play; nada a parar/retomar
  },

  _applyMusicMute(muted: boolean): void {
    if (muted) {
      if (_currentBgm) { _currentBgm.stop(); _currentBgm.destroy(); _currentBgm = null }
      _stopProcLoop()
      // Mantém _procType e _lastBgmKey* para retomar ao desmutar
    } else if (_lastBgmKey && _lastBgmScene) {
      // Retoma MP3
      try {
        _currentBgm = _lastBgmScene.sound.add(_lastBgmKey, { loop: _lastBgmLoop, volume: 0.5 })
        _currentBgm.play()
      } catch {
        _currentBgm = null; _lastBgmKey = null; _lastBgmScene = null
      }
    } else if (_procType) {
      // Retoma procedural — cria nó mestre novo
      _procActive = true
      const c2 = getCtx()
      _procGainNode = c2.createGain()
      _procGainNode.gain.value = 1
      _procGainNode.connect(c2.destination)
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
      const [mel, bass, bpm, loop] = map[_procType]
      _runProc(mel, bass, bpm, loop)
    }
  },
```

- [ ] **Step 4: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -10
npx vitest run 2>&1 | grep -E "Test Files|Tests "
```

Esperado: 0 erros TS, todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/audio/SoundManager.ts
git commit -m "feat: route SFX/music mute separately; add setMusicMuted/setSfxMuted"
```

---

## Task 3: SettingsOverlay — 2 toggles de áudio + re-layout

**Files:**
- Modify: `src/ui/SettingsOverlay.ts`

> Contexto: O overlay tem `_muteBtn` (py+62) e `_reduceBtn` (py+86), separador py+126, controles py+138/156. Trocamos `_muteBtn` por `_musicBtn`+`_sfxBtn`, descemos o resto para acomodar 3 toggles.

- [ ] **Step 1: Trocar os campos**

Localizar:
```typescript
  private _muteBtn: Phaser.GameObjects.Text
  private _reduceBtn: Phaser.GameObjects.Text
```
Substituir por:
```typescript
  private _musicBtn: Phaser.GameObjects.Text
  private _sfxBtn: Phaser.GameObjects.Text
  private _reduceBtn: Phaser.GameObjects.Text
```

- [ ] **Step 2: Substituir a criação do toggle de mute e reposicionar**

Localizar o bloco do `_muteBtn` e `_reduceBtn` (comentários `// 3. Mute toggle button` e `// 3b. Reduce-motion toggle`):
```typescript
    // 3. Mute toggle button
    this._muteBtn = scene.add.text(px + 20, py + 62, this._muteLabel(), {
      fontSize: '15px', color: this._muteColor(),
    }).setInteractive({ useHandCursor: true })
    this._muteBtn.on('pointerdown', () => {
      SoundManager.setMuted(!gameState.muted)
      this._muteBtn.setText(this._muteLabel())
      this._muteBtn.setColor(this._muteColor())
    })

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
Substituir por:
```typescript
    // 3. Music toggle
    this._musicBtn = scene.add.text(px + 20, py + 62, this._musicLabel(), {
      fontSize: '15px', color: this._musicColor(),
    }).setInteractive({ useHandCursor: true })
    this._musicBtn.on('pointerdown', () => {
      SoundManager.setMusicMuted(!gameState.musicMuted)
      this._musicBtn.setText(this._musicLabel())
      this._musicBtn.setColor(this._musicColor())
    })

    // 3b. SFX toggle
    this._sfxBtn = scene.add.text(px + 20, py + 86, this._sfxLabel(), {
      fontSize: '15px', color: this._sfxColor(),
    }).setInteractive({ useHandCursor: true })
    this._sfxBtn.on('pointerdown', () => {
      SoundManager.setSfxMuted(!gameState.sfxMuted)
      this._sfxBtn.setText(this._sfxLabel())
      this._sfxBtn.setColor(this._sfxColor())
    })

    // 3c. Reduce-motion toggle
    this._reduceBtn = scene.add.text(px + 20, py + 110, this._reduceLabel(), {
      fontSize: '15px', color: this._reduceColor(),
    }).setInteractive({ useHandCursor: true })
    this._reduceBtn.on('pointerdown', () => {
      gameState.reducedMotion = !gameState.reducedMotion
      this._reduceBtn.setText(this._reduceLabel())
      this._reduceBtn.setColor(this._reduceColor())
    })
```

- [ ] **Step 3: Descer separador, título e controles**

Localizar e ajustar os Y:
- Separador (`sep.lineBetween(px + 20, py + 126, ...)`) → `py + 150`:
```typescript
    sep.lineBetween(px + 20, py + 150, cx + w / 2 - 20, py + 150)
```
- Título controles (`scene.add.text(px + 20, py + 138, 'CONTROLES', ...)`) → `py + 162`:
```typescript
    const ctrlTitle = scene.add.text(px + 20, py + 162, 'CONTROLES', {
      fontSize: '13px', color: '#aaaaaa',
    })
```
- Tabela (`scene.add.text(px + 20, py + 156 + i * 20, line, ...)`) → `py + 180`:
```typescript
      scene.add.text(px + 20, py + 180 + i * 20, line, {
        fontSize: '12px', color: '#cccccc',
      })
```

- [ ] **Step 4: Atualizar a linha 'M' da tabela de controles**

Na lista `CONTROL_LINES`, trocar:
```typescript
      'M         Silenciar música',
```
por:
```typescript
      'M         Silenciar tudo',
```

- [ ] **Step 5: Substituir labels/cores e o container/show**

Substituir os métodos `_muteLabel`/`_muteColor`:
```typescript
  private _muteLabel(): string {
    return gameState.muted ? '🔇  Música: SILENCIADA' : '🔊  Música: ATIVADA'
  }

  private _muteColor(): string {
    return gameState.muted ? '#ff6666' : '#88ffaa'
  }
```
por:
```typescript
  private _musicLabel(): string {
    return gameState.musicMuted ? '🔇  Música: SILENCIADA' : '🎵  Música: ATIVADA'
  }

  private _musicColor(): string {
    return gameState.musicMuted ? '#ff6666' : '#88ffaa'
  }

  private _sfxLabel(): string {
    return gameState.sfxMuted ? '🔇  Efeitos: SILENCIADOS' : '🔊  Efeitos: ATIVADOS'
  }

  private _sfxColor(): string {
    return gameState.sfxMuted ? '#ff6666' : '#88ffaa'
  }
```

No array do container, trocar `this._muteBtn` por `this._musicBtn, this._sfxBtn`:
```typescript
    this._container = scene.add.container(0, 0, [
      bg, title, this._musicBtn, this._sfxBtn, this._reduceBtn, sep, ctrlTitle, ...ctrlTexts, closeBtn,
    ])
```

Em `show()`, substituir as 2 linhas do `_muteBtn` por:
```typescript
    this._musicBtn.setText(this._musicLabel())
    this._musicBtn.setColor(this._musicColor())
    this._sfxBtn.setText(this._sfxLabel())
    this._sfxBtn.setColor(this._sfxColor())
```
(mantendo as 2 linhas do `_reduceBtn` e o `this._container.setVisible(true)`).

- [ ] **Step 6: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -10
npx vitest run 2>&1 | grep -E "Test Files|Tests "
```

Esperado: 0 erros TS, todos os testes passando.

- [ ] **Step 7: Commit**

```bash
git add src/ui/SettingsOverlay.ts
git commit -m "feat: separate Música/Efeitos toggles in settings overlay"
```
