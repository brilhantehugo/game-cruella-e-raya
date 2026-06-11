# Spec G2 — Áudio: Toggles Separados de Música e Efeitos

**Data:** 2026-06-05
**Status:** Aprovado

**Goal:** Permitir silenciar música e efeitos sonoros independentemente, mantendo a tecla M como mute master, sem construir UI de slider.

---

## Contexto

O áudio tem mute binário único (`gameState.muted`) checado em todos os pontos de SFX (Web Audio) e BGM (Phaser MP3 + procedural). Não há como silenciar só a música mantendo os efeitos (preferência comum). `muted` é referenciado em ~25 sítios (8 arquivos), a maioria a tecla M de quick-mute.

Escopo: **toggles separados** Música/Efeitos (Opção A). Sliders de volume (B/C) ficam fora.

---

## Seção 1 — GameState: `sfxMuted` + `musicMuted` + getter `muted`

Trocar o campo `muted: boolean = false` por dois sub-flags + um getter derivado:

```typescript
sfxMuted: boolean = false
musicMuted: boolean = false

/** Master mute derivado — true só quando ambos silenciados. Usado pela tecla M. */
get muted(): boolean { return this.sfxMuted && this.musicMuted }
```

- `muted` vira **getter computado** (não mais campo gravável). Todos os leitores externos (`gameState.muted`) continuam funcionando.
- O único writer anterior (`SoundManager.setMuted`, `gameState.muted = muted`) passa a escrever os sub-flags (Seção 2).
- **Persistência:** `sfxMuted`/`musicMuted` ficam fora dos `reset()`/`resetAtCheckpoint()`/`resetLevel()` (preferências persistem entre partidas, como o antigo `muted`). Atualizar o comentário no fim de `reset()`.

**Testes (`tests/GameState.test.ts`):** substituir `'muted começa false'` e `'muted pode ser alternado'` (linhas ~140-148) por:
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

---

## Seção 2 — SoundManager: rotear SFX vs Música

### SFX → `sfxMuted`

| Linha | Função | Antes | Depois |
|---|---|---|---|
| 30 | `playTone` | `if (gameState.muted) return` | `if (gameState.sfxMuted) return` |
| 48 | `playArpeggio` | `if (gameState.muted) return` | `if (gameState.sfxMuted) return` |
| 67 | `playNoise` | `if (gameState.muted) return` | `if (gameState.sfxMuted) return` |
| 412 | `dashAbility` | `if (gameState.muted) break` | `if (gameState.sfxMuted) break` |
| 419 | `barkAbility` | `if (gameState.muted) break` | `if (gameState.sfxMuted) break` |

### Música → `musicMuted`

| Linha | Função | Antes | Depois |
|---|---|---|---|
| 372 | `_runProc` | `if (!_procActive || gameState.muted) return` | `if (!_procActive || gameState.musicMuted) return` |
| 449 | `playBgm` (MP3) | `if (gameState.muted) return` | `if (gameState.musicMuted) return` |
| 465 | `playProceduralBgm` | `if (gameState.muted) return` | `if (gameState.musicMuted) return` |

### `setMuted` (master, tecla M) + métodos granulares

Extrair a lógica de start/stop de BGM (hoje dentro de `setMuted`) para `_applyMusicMute(muted)`, e:

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
  // Lógica atual de setMuted: parar BGM quando muted; retomar MP3/procedural quando !muted.
  // (mover o corpo de setMuted após a linha `gameState.muted = muted` para cá, sem alterá-la)
}
```

`SoundManager` é um objeto literal; `_applyMusicMute` é um método do objeto (chamado via `this`).

> Comportamento preservado: a tecla M continua mutando tudo; silenciar só música via Settings para/retoma o BGM sem afetar SFX.

---

## Seção 3 — SettingsOverlay: 3 toggles (Música, Efeitos, Movimento)

O `_muteBtn` único vira dois: `_musicBtn` + `_sfxBtn`. Mais o `_reduceBtn` existente = 3 toggles.

**Campos:**
```typescript
private _musicBtn: Phaser.GameObjects.Text
private _sfxBtn: Phaser.GameObjects.Text
private _reduceBtn: Phaser.GameObjects.Text
```

**Layout (cabe em h=320):**
| Elemento | Y | Ação |
|---|---|---|
| 🎵 Música | `py + 62` | `SoundManager.setMusicMuted(!gameState.musicMuted)` |
| 🔊 Efeitos | `py + 86` | `SoundManager.setSfxMuted(!gameState.sfxMuted)` |
| ♿ Reduzir movimento | `py + 110` | `gameState.reducedMotion = !...` |
| separador | `py + 150` | |
| título CONTROLES | `py + 162` | |
| tabela (6 linhas) | `py + 180 + i*20` | última em py+280 (close em py+302) |

**Labels/cores:**
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

(`_muteLabel`/`_muteColor` removidos.)

**Tabela de controles:** linha `'M         Silenciar música'` → `'M         Silenciar tudo'`.

**Toggles** seguem o padrão do `_reduceBtn`: criar interativo, `pointerdown` chama a ação + atualiza próprio texto/cor. `show()` reatualiza os 3. Container inclui `_musicBtn`, `_sfxBtn`, `_reduceBtn`.

**Tecla M (inalterada):** os callers em MenuScene/HowToPlayScene/GameScene/UIScene seguem chamando `SoundManager.setMuted(!gameState.muted)` — master toggle.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/GameState.ts` | `sfxMuted`/`musicMuted` + getter `muted`; resets/persistência |
| `tests/GameState.test.ts` | Atualizar 2 testes de mute |
| `src/audio/SoundManager.ts` | Rotear SFX/música; `setMuted`/`setMusicMuted`/`setSfxMuted`/`_applyMusicMute` |
| `src/ui/SettingsOverlay.ts` | 2 toggles de áudio + re-layout |

---

## Estratégia de Teste

- `tests/GameState.test.ts`: getter `muted` derivado nos 2 estados.
- `npm run build` sem erros.
- `npx vitest run` — suíte verde.
- Smoke manual: silenciar só música em Settings → SFX continuam; tecla M muta/desmuta tudo.

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Sliders de volume 0–100% (Opção B/C) | Exige componente de slider + roteamento por gain mestre; spec separada |
| Persistir mute em localStorage | Espelha comportamento atual (sessão) |
| Mute por categoria de SFX | Granularidade desnecessária |
