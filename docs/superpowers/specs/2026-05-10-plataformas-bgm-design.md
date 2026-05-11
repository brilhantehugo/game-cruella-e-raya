# Spec G — Plataformas Móveis + BGM por Mundo

**Data:** 2026-05-10
**Status:** Aprovado

**Goal:** Corrigir o bug de plataformas móveis que não se movem visualmente e adicionar trilhas sonoras procedurais distintas por mundo, tornando o jogo mais vivo e desafiador.

**Architecture:** Dois subsistemas independentes. Plataformas: correção cirúrgica em `GameScene.ts` (2 pontos: `_buildMovingPlatforms()` e colliders com carry). BGM: extensão de `SoundManager.ts` (5 novos tracks) + 3 linhas em `GameScene.create()`. Zero novos arquivos de produção.

**Tech Stack:** TypeScript, Phaser 3 Arcade Physics, Web Audio API

---

## Referências Históricas

| Jogo | Relevância |
|------|-----------|
| DKC (SNES, 1994) | Plataformas móveis com carry preciso — padrão de indústria |
| Kirby's Adventure (NES, 1993) | BGM distinta por mundo cria identidade sonora imediata |
| NSMB Wii (2009) | Plataformas sincronizam com o jogador sem deslize |

---

## Subsistema 1 — Plataformas Móveis

### Problema Raiz

`_buildMovingPlatforms()` usa `this.add.tileSprite() + this.physics.add.existing()`. Em Phaser 3, esse padrão cria um corpo de física que se move, mas o engine **não sincroniza de volta** a posição do corpo para o `x/y` visual do TileSprite — a plataforma fica estática visualmente enquanto o corpo interno se desloca.

### Correção: substituir por `physics.add.image()`

`this.physics.add.image(x, y, KEYS.TILE_PLATFORM)` cria um `Phaser.Physics.Arcade.Image` nativo — posição visual e física são sempre sincronizadas automaticamente pelo Phaser.

Em `_buildMovingPlatforms()`, substituir:
```typescript
// ANTES (quebrado):
const sprite = this.add.tileSprite(cfg.x, cfg.y, cfg.width, 16, KEYS.TILE_PLATFORM)
  .setOrigin(0.5, 0.5).setDepth(2)
this.physics.add.existing(sprite)
const body = sprite.body as Phaser.Physics.Arcade.Body

// DEPOIS (correto):
const sprite = this.physics.add.image(cfg.x, cfg.y, KEYS.TILE_PLATFORM)
  .setOrigin(0.5, 0.5)
  .setDepth(2)
  .setDisplaySize(cfg.width, 16)
const body = sprite.body as Phaser.Physics.Arcade.Body
```

O restante do bloco (setImmovable, setAllowGravity, setVelocity) permanece igual. O update loop de inversão de velocidade (linha ~1092 em GameScene) já está correto — não precisa de alteração.

### Correção: carry do jogador em plataformas horizontais

Quando o jogador está em cima de uma plataforma que se move no eixo X, ele deve deslizar junto. Em plataformas verticais, a física de Phaser já empurra o jogador para cima naturalmente; para baixo, a gravidade segue.

Substituir os colliders atuais (linhas ~725-727 em `create()`):

```typescript
// ANTES:
this.physics.add.collider(this.player.raya,   this._movingPlatformGroup)
this.physics.add.collider(this.player.cruella, this._movingPlatformGroup)

// DEPOIS:
const carryCallback = (
  playerSprite: Phaser.GameObjects.GameObject,
  platform: Phaser.GameObjects.GameObject
) => {
  const pb   = (playerSprite as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
  const platB = (platform    as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
  if (pb.blocked.down && platB.velocity.x !== 0) {
    (playerSprite as Phaser.Physics.Arcade.Image).x += platB.velocity.x / 60
  }
  return true
}

this.physics.add.collider(this.player.raya,   this._movingPlatformGroup, undefined, carryCallback as any, this)
this.physics.add.collider(this.player.cruella, this._movingPlatformGroup, undefined, carryCallback as any, this)
```

> `/ 60` assume 60fps — suficiente para carry suave sem depender do delta explícito no callback.

### Arquivos modificados
- `src/scenes/GameScene.ts` — `_buildMovingPlatforms()` (sprite creation) + colliders (carry callback)

### Comportamento esperado
- Plataformas se movem visualmente no eixo configurado (x ou y)
- Velocidade inverte ao atingir o `range`
- Jogador "anda junto" ao estar em cima de plataforma horizontal
- Jogador é empurrado para cima por plataforma vertical ascendente

---

## Subsistema 2 — BGM por Mundo

### Infraestrutura existente

`SoundManager.playProceduralBgm(type)` aceita `'menu' | 'intro' | 'victory' | 'gameover'`. Cada tipo define:
- `mel: PBeat[]` — melodia (frequência Hz + duração em beats)
- `bass: PBeat[]` — linha de baixo
- `bpm: number`
- `loop: number` — quantos beats até reiniciar

O sistema usa Web Audio API puro — sem arquivos externos.

### 5 novos tracks

Adicionar ao type union: `'world0' | 'world1' | 'world2' | 'world3' | 'boss'`

#### world0 — Lobby/Apartamento (calmo, doméstico)
- BPM: 72 | Modo: Dó maior | Caráter: acolhedor, leve
- Melodia: notas longas, intervalo de terças, movimento conjunto suave
- Baixo: pedal em Dó, movimento simples a cada 2 beats

#### world1 — Rua Diurna (animado, walking)
- BPM: 104 | Modo: Fá maior | Caráter: urbano, enérgico
- Melodia: ritmo sincopado, saltos de quarta/quinta
- Baixo: walking bass em colcheias

#### world2 — Exterior/Telhado (tenso, sincopado)
- BPM: 112 | Modo: Sol mixolídio | Caráter: aventura, ação
- Melodia: ostinato rítmico com nota de tensão (7ª maior)
- Baixo: linha cromática descendente

#### world3 — Rua de Noite (sombrio, esparso)
- BPM: 80 | Modo: Lá menor | Caráter: misterioso, furtivo
- Melodia: notas esparsas, pausa de 2 beats entre frases
- Baixo: pedal em Lá, com nota sensível ocasional

#### boss — Confronto (urgente, ostinato)
- BPM: 140 | Modo: Mi menor | Caráter: intenso, repetitivo
- Melodia: ostinato de 4 notas em loop curto (8 beats)
- Baixo: staccato em semínimas, acento no 1 e 3

### Gatilho em GameScene.create()

Adicionar ao final do bloco de setup (após `_buildMovingPlatforms()`):

```typescript
// BGM por mundo
const worldId = gameState.currentLevel.split('-')[0]  // '0', '1', '2', '3'
const isBoss  = gameState.currentLevel.endsWith('boss')
const bgmType = isBoss ? 'boss' : (`world${worldId}` as 'world0' | 'world1' | 'world2' | 'world3')
SoundManager.playProceduralBgm(bgmType)
```

`SoundManager.stopBgm()` já é chamado em `GameOverScene`, `LevelCompleteScene.shutdown` e nos eventos de pause — sem vazamento de áudio.

### Arquivos modificados
- `src/audio/SoundManager.ts` — type union estendido + 5 constantes de beats + 5 entradas no map
- `src/scenes/GameScene.ts` — 3 linhas em `create()` para disparar BGM

---

## Ordem de Implementação

```
1. Plataformas móveis (GameScene.ts) — correção de bug visível imediatamente
2. BGM — SoundManager.ts (tracks) → GameScene.ts (gatilho)
```

## Fora do Escopo

| Item | Motivo |
|------|--------|
| Indicadores visuais nas plataformas (setas) | Polish futuro — Opção B descartada |
| Crossfade entre tracks | Complexidade extra sem ganho claro |
| MP3 externos | Sem assets disponíveis |
| Novas plataformas em fases adicionais | Dados de level já existem; scope restrito à correção |
