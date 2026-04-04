# Audio + Parallax Background — Design Spec
**Data:** 2026-04-04
**Projeto:** Cruella & Raya (Phaser 3 TypeScript platformer)
**Escopo:** Sistema de som híbrido (SFX procedural + BGM .mp3) e parallax de fundo temático por fase

---

## 1. Visão Geral

Adicionar ao jogo:
1. **Som** — efeitos sonoros gerados via Web Audio API + músicas de fundo em arquivos `.mp3` livres de direitos (CC0)
2. **Parallax** — fundos com 3 camadas de profundidade, desenhados proceduralmente no BootScene, temáticos por fase

Ambos sem alterar a filosofia atual do projeto (zero assets externos para visuais; áudio é a única exceção).

---

## 2. Sistema de Som

### 2.1 SoundManager (`src/audio/SoundManager.ts`)

Singleton exportado. Encapsula a Web Audio API sem depender do Phaser Sound Manager para SFX (mais controle de timing e síntese). Para BGM usa o Phaser Sound Manager normalmente.

```typescript
export const SoundManager = {
  init(scene: Phaser.Scene): void                              // inicializa AudioContext
  play(key: SfxKey): void                                      // toca SFX procedural
  playBgm(key: string, scene: Phaser.Scene, loop?: boolean): void  // loop=true por padrão
  stopBgm(scene: Phaser.Scene): void
  setMuted(muted: boolean): void                               // toggle M
}
```

`AudioContext` é criado na primeira interação do usuário (requisito do browser) e reutilizado.

### 2.2 SFX Procedurais

Todos gerados via `AudioContext.createOscillator()` + `createGain()`. Duração máxima: 400ms. Sem arquivos.

| Chave (`SfxKey`) | Forma de onda | Freq. inicial → final | Duração |
|------------------|---------------|-----------------------|---------|
| `jump` | sine | 350 → 600 Hz | 120ms |
| `doubleJump` | sine | 600 → 950 Hz | 100ms |
| `dash` | sawtooth | 300 → 150 Hz | 180ms |
| `bark` | square | 220 Hz | 80ms |
| `collectBone` | sine | 900 Hz (fixo) | 80ms |
| `collectGolden` | sine | arpejo: 523→659→784 Hz | 300ms |
| `damage` | square | 180 → 80 Hz vibrato | 250ms |
| `stomp` | — | noise burst | 100ms |
| `powerUp` | sine | arpejo ascendente 5 notas | 400ms |
| `swap` | sine | 500 → 750 Hz | 120ms |
| `gameOver` | sine | 440 → 220 → 110 Hz | 600ms |
| `levelComplete` | sine | arpejo 5 notas ascendente | 500ms |
| `checkpoint` | sine | 440 → 880 Hz | 200ms |

### 2.3 BGM (arquivos .mp3)

4 faixas CC0 a serem baixadas de **opengameart.org** e salvas em `public/audio/`:

| Arquivo | Chave Phaser | Usado em |
|---------|-------------|---------|
| `bgm_menu.mp3` | `bgm_menu` | MenuScene, CharacterSelectScene |
| `bgm_world1.mp3` | `bgm_world1` | GameScene (fases 1-1 a 1-3) |
| `bgm_boss.mp3` | `bgm_boss` | GameScene (fase boss) |
| `bgm_fanfare.mp3` | `bgm_fanfare` | LevelCompleteScene (sem loop) |

Carregados em `BootScene.preload()`:
```typescript
this.load.audio('bgm_menu',     'audio/bgm_menu.mp3')
this.load.audio('bgm_world1',   'audio/bgm_world1.mp3')
this.load.audio('bgm_boss',     'audio/bgm_boss.mp3')
this.load.audio('bgm_fanfare',  'audio/bgm_fanfare.mp3')
```

### 2.4 Integração por Cena

- **MenuScene** — `playBgm('bgm_menu')` no `create()`, `stopBgm()` no `shutdown`
- **GameScene** — `playBgm('bgm_boss')` se `currentLevel === '1-boss'`, senão `'bgm_world1'`. Stop no `shutdown`.
- **LevelCompleteScene** — `playBgm('bgm_fanfare', scene, false)` (sem loop)
- **GameOverScene** — sem BGM (silêncio dramático)
- **SFX** — chamados diretamente nos métodos relevantes: `Player.ts`, `GameScene.ts` (stomp/damage/item collect), `GameState.ts` (swap)

### 2.5 Controle de Mute

Tecla `M` no `GameScene` e `MenuScene` faz toggle de mute. Estado salvo em `gameState.muted: boolean`.

---

## 3. Parallax de Fundo

### 3.1 ParallaxBackground (`src/background/ParallaxBackground.ts`)

Classe simples instanciada no `GameScene.create()` antes de `_buildDecorations()`.

```typescript
export class ParallaxBackground {
  constructor(scene: Phaser.Scene, theme: BackgroundTheme)
  update(cameraScrollX: number): void
}
```

Internamente cria 3 `TileSprite` com `setDepth(-2)` (atrás das decorações em `-1`).

### 3.2 Temas e Camadas

Cada textura de fundo é 200×450px, desenhada no `BootScene` com a API Graphics existente e registrada com `generateTexture()`.

#### Tema `rua` (1-1 — Rua Residencial)
| Camada | Chave | Speed | Conteúdo |
|--------|-------|-------|----------|
| 1 (fundo) | `bg_rua_1` | 0.05 | Céu azul degradê + 3 nuvens brancas |
| 2 (meio) | `bg_rua_2` | 0.2 | Prédios altos cinzas com janelas |
| 3 (frente) | `bg_rua_3` | 0.5 | Casas menores + copa de árvores |

#### Tema `praca` (1-2 — Praça com Jardim)
| Camada | Chave | Speed | Conteúdo |
|--------|-------|-------|----------|
| 1 | `bg_praca_1` | 0.05 | Céu claro + nuvens suaves |
| 2 | `bg_praca_2` | 0.2 | Colinas verdes + árvores altas |
| 3 | `bg_praca_3` | 0.5 | Arbustos baixos + cercas de madeira |

#### Tema `mercado` (1-3 — Mercadinho)
| Camada | Chave | Speed | Conteúdo |
|--------|-------|-------|----------|
| 1 | `bg_mercado_1` | 0.05 | Céu laranja/entardecer |
| 2 | `bg_mercado_2` | 0.2 | Galpões + banners coloridos |
| 3 | `bg_mercado_3` | 0.5 | Barracas de feira + caixotes |

#### Tema `boss`
| Camada | Chave | Speed | Conteúdo |
|--------|-------|-------|----------|
| 1 | `bg_boss_1` | 0.05 | Céu escuro/roxo + lua |
| 2 | `bg_boss_2` | 0.2 | Sombras de prédios altos |
| 3 | `bg_boss_3` | 0.5 | Grades + cercas metálicas |

### 3.3 Integração com LevelData

```typescript
export interface LevelData {
  // ...campos existentes...
  backgroundTheme: 'rua' | 'praca' | 'mercado' | 'boss'
}
```

Atribuições:
- `1-1` → `'rua'`
- `1-2` → `'praca'`
- `1-3` → `'mercado'`
- `1-boss` → `'boss'`

### 3.4 Update Loop

No `GameScene.update()`:
```typescript
this.parallax.update(this.cameras.main.scrollX)
```

Dentro de `ParallaxBackground.update()`:
```typescript
this.layers.forEach(({ sprite, speed }) => {
  sprite.tilePositionX = cameraScrollX * speed
})
```

---

## 4. Ordem de Implementação

1. **BootScene** — adicionar 12 texturas de parallax (bg_rua_*, bg_praca_*, bg_mercado_*, bg_boss_*)
2. **LevelData.ts** — adicionar campo `backgroundTheme`
3. **World1.ts** — atribuir tema a cada fase
4. **ParallaxBackground.ts** — criar classe com TileSprites
5. **GameScene.ts** — instanciar ParallaxBackground, chamar update()
6. **SoundManager.ts** — criar singleton com SFX procedurais + wrappers BGM
7. **BootScene** — adicionar `load.audio()` para 4 BGMs
8. **Integração SFX** — Player.ts, Raya.ts, Cruella.ts, GameScene.ts, GameOverScene.ts, LevelCompleteScene.ts
9. **Integração BGM** — MenuScene, GameScene, LevelCompleteScene
10. **Mute toggle** — gameState + tecla M
11. **Download BGMs** — 4 arquivos CC0 de opengameart.org → `public/audio/`

---

## 5. Arquivos Modificados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/scenes/BootScene.ts` | Adicionar 12 texturas parallax + load.audio (4 BGMs) |
| `src/levels/LevelData.ts` | Adicionar campo `backgroundTheme` |
| `src/levels/World1.ts` | Atribuir `backgroundTheme` a cada fase |
| `src/background/ParallaxBackground.ts` | **Novo arquivo** |
| `src/audio/SoundManager.ts` | **Novo arquivo** |
| `src/scenes/GameScene.ts` | Instanciar parallax + BGM + SFX de combate |
| `src/scenes/MenuScene.ts` | BGM menu |
| `src/scenes/LevelCompleteScene.ts` | BGM fanfare + SFX |
| `src/scenes/GameOverScene.ts` | SFX game over |
| `src/entities/Player.ts` | SFX swap |
| `src/entities/Raya.ts` | SFX jump, dash |
| `src/entities/Cruella.ts` | SFX jump, bark |
| `src/GameState.ts` | Campo `muted` |

---

## 6. Fora do Escopo

- Controle de volume por slider (apenas mute/unmute)
- Sons para inimigos individuais (apenas stomp/damage do lado do jogador)
- Mais de 4 faixas de BGM
- Parallax vertical (scroll Y)
- Animação das nuvens no parallax (apenas scroll horizontal)
