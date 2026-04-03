# Visual Upgrade & UX — Raya & Cruella Game

**Data:** 2026-04-03
**Escopo:** Sprites pixel art, correção de movimento, inimigos redesenhados, tela "Como Jogar", intro Star Wars

---

## Contexto

O jogo atualmente usa retângulos coloridos como personagens e inimigos. O movimento trava esporadicamente. Faltam duas telas de UX importantes: instruções e uma intro narrativa. Este spec cobre as 5 melhorias acordadas.

---

## 1. Sprites Pixel Art com Animação

### Abordagem

Sprites definidos como matrizes de pixels em TypeScript. O `BootScene` renderiza cada frame num `HTMLCanvasElement` via API Canvas nativa, depois registra como spritesheet no Phaser com `scene.textures.addSpriteSheet()`. Nenhum arquivo PNG externo é necessário.

### Arquivo novo: `src/sprites/SpriteData.ts`

Define todos os sprites do jogo como objetos com:
- `frameWidth` / `frameHeight` — dimensões de cada frame
- `frames` — array de frames, cada frame é uma matriz 2D de strings hex de cor (ex: `'#000000'` para preto, `null` para transparente)

### Personagens

**Raya** (Pomerânia maior, preto e cinza, bandana amarela):
- Frames: `idle` (1), `walk` (4 frames — patas alternadas), `jump` (1)
- Tamanho: 32×32px por frame, spritesheet 192×32px (6 frames)
- Corpo físico: 22×26px centralizado (menor que o sprite para evitar frestas de tile)
- Animações Phaser: `raya-idle`, `raya-walk` (8 fps, loop), `raya-jump`

**Cruella** (Pomerânia menor, pelagem escura, laço rosa):
- Frames: `idle` (1), `walk` (4 frames), `jump` (1)
- Tamanho: 28×28px por frame, spritesheet 168×28px
- Corpo físico: 18×22px centralizado
- Animações Phaser: `cruella-idle`, `cruella-walk` (8 fps, loop), `cruella-jump`

### Inimigos (sem frames de animação — MVP)

Cada inimigo tem 1 sprite estático reconhecível pelo silhueta:

| Inimigo | Visual | Tamanho |
|---|---|---|
| GatoMalencarado | Gato sentado com orelhas pontudas, pelagem cinza, olhos amarelos | 28×28px |
| PomboAgitado | Pombo gordo com asas abertas, cinza-azulado | 28×24px |
| RatoDeCalcada | Rato esguio com cauda longa, marrom | 24×20px |
| DonoNervoso | Silhueta humana de terno, braços erguidos | 24×48px |
| SeuBigodes | Gato enorme com bigodes proeminentes, escuro | 48×48px (escala 2×) |

### Onde as animações são tocadas

Em `Raya.update()` e `Cruella.update()`:
- Movendo horizontalmente → `play('raya-walk', true)`
- Parado → `play('raya-idle', true)`
- `body.blocked.down === false` → `play('raya-jump', true)`

### BootScene

Substituir todos os `makeRect(KEYS.RAYA, ...)` por chamadas a um helper `makePixelSprite(key, frames, frameWidth, frameHeight)` que:
1. Cria um `HTMLCanvasElement` com largura `frameWidth * frames.length`
2. Para cada frame, pinta pixel a pixel com `ctx.fillRect(x*1, y*1, 1, 1)` (cada "pixel" da matriz = 1px real — o Phaser escalará via `setScale`)
3. Registra com `scene.textures.addSpriteSheet(key, canvas, { frameWidth, frameHeight })`

---

## 2. Correção do Movimento

### Causas identificadas

**Causa 1 — Corpo físico retangular trava em frestas entre tiles.**
Tiles adjacentes de 32×32px criam pequenos degraus nas quinas que o corpo retangular grande do jogador bate. Solução: reduzir o corpo físico em `Raya` e `Cruella` para ser menor que o sprite visual.

**Causa 2 — `onGround` nunca retorna a `false`.**
O estado `onGround` é setado para `true` pelo callback de colisão mas não tem mecanismo para voltar a `false` quando o jogador está no ar. Isso causa inconsistências no jump de Cruella após swap.

### Fix em `Raya.ts` e `Cruella.ts`

1. No constructor, após `scene.physics.add.existing(this)`:
   ```typescript
   // Raya
   this.setBodySize(22, 26)
   this.setOffset(5, 6)
   // Cruella
   this.setBodySize(18, 22)
   this.setOffset(5, 6)
   ```

2. Substituir todas as verificações `this.onGround` por `body.blocked.down` diretamente dentro de `update()`:
   ```typescript
   // Cruella — jump
   const body = this.body as Phaser.Physics.Arcade.Body
   if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && body.blocked.down) { ... }

   // Raya — reset jumpsLeft ao pousar (detecção de borda: era no ar, agora está no chão)
   const body = this.body as Phaser.Physics.Arcade.Body
   if (body.blocked.down && !this.wasGrounded) this.jumpsLeft = 2
   this.wasGrounded = body.blocked.down
   ```

3. Remover o campo `onGround: boolean` de `Raya` e `Cruella`. Adicionar `private wasGrounded: boolean = false` apenas em `Raya` (necessário para detecção de borda de pouso).

4. Remover `setOnGround(value: boolean)` de `Raya` e `Cruella` — não é mais necessário. Remover também `Player.setGrounded()` e os callbacks de colisão que a chamavam em `GameScene._setupCollisions()`.

---

## 3. Inimigos Redesenhados

Os 5 inimigos recebem sprites pixel art no mesmo sistema descrito na Seção 1. Apenas `BootScene.ts` muda — cada arquivo de inimigo continua usando o mesmo `KEYS.GATO` etc., que agora apontam para texturas com aparência de verdade.

Nenhuma mudança na lógica de IA de nenhum inimigo.

---

## 4. Tela "Como Jogar" (`HowToPlayScene`)

### Novo arquivo: `src/scenes/HowToPlayScene.ts`

Cena com fundo escuro, acessada pelo menu via `[ H — COMO JOGAR ]`.

**Seções da tela:**

```
COMO JOGAR
──────────────────────────────────────

CONTROLES
  ← →     Mover
  ESPAÇO  Pular
  SHIFT   Habilidade especial
  TAB     Trocar cachorra (cooldown 1.5s)
  ESC     Pausar

RAYA 🐾
  ✦ Pulo duplo
  ✦ Dash horizontal (SHIFT) — atravessa inimigos

CRUELLA 🐾
  ✦ Latido (SHIFT) — atordoa inimigos próximos
  ✦ Intimidação passiva — inimigos fogem ao se aproximar

ITENS
  🦴 Osso           +10 pts
  🦴 Osso Dourado   +500 pts (3 por fase, secretos)
  🍖 Petisco        velocidade +
  🍿 Pipoca         pulo mais alto
  🥩 Churrasco      invencível (10s)
  🍕 Pizza          restaura coração

──────────────────────────────────────
         BACKSPACE — voltar
```

### Integração no menu

`MenuScene` ganha terceiro botão:
```
[ H — COMO JOGAR ]
```
Com `kb.on('keydown-H', ...)` e `pointerdown`. O botão fica entre Jogar e Galeria.

### `main.ts`

Adicionar `HowToPlayScene` à lista de cenas registradas.

---

## 5. Intro Star Wars (`IntroCrawlScene`)

### Novo arquivo: `src/scenes/IntroCrawlScene.ts`

Aparece após o jogador pressionar ENTER no menu, antes do `GameScene`.

**Fluxo:**
```
MenuScene → IntroCrawlScene → GameScene
```

**Visual:**
- Fundo preto puro
- Texto em amarelo dourado (`#ffe81f`), fonte bold, centralizado
- Efeito de scroll vertical: Phaser não suporta perspectiva 3D nativa. O efeito Star Wars é simulado com um `Container` que contém todos os blocos de texto empilhados verticalmente, com tween de `y` de `GAME_HEIGHT + 200` até `-(alturaTotal + 200)` em ~22 segundos, `ease: 'Linear'`
- Para profundidade visual, linhas mais próximas do topo do container usam `fontSize` ligeiramente menor (escala de 20px → 14px de baixo para cima), criando ilusão de perspectiva sem transformações 3D

**Texto da intro:**

```
Em uma tarde ensolarada no bairro...

Raya, a maior e mais corajosa das duas,
convenceu Cruella de que era absolutamente
necessário investigar o outro lado da rua.

Cruella, a menor e mais cética,
latiu três vezes em sinal de protesto.
Mas foi mesmo assim.

O portão estava aberto.
O mundo estava ali.

Havia gatos que as olhavam com desprezo.
Pombos que não ligavam para ninguém.
Ratos que corriam rápido demais.
E um Dono Nervoso que gritava seus nomes
em cada esquina.

No fim da rua, dizem os mais velhos,
mora Seu Bigodes — um gato enorme e ranzinza
que guarda o maior depósito de lixo do bairro
como se fosse um tesouro sagrado.

Ninguém voltou de lá para contar a história.

Até hoje.

Boa sorte, pequenas.
Vocês vão precisar.
```

**Controles:**
- ENTER ou ESPAÇO: pula a intro imediatamente
- Ao fim do tween (ou skip): `this.scene.start(KEYS.GAME)`

**Integração no menu:**
`MenuScene.startGame()` passa a chamar `this.scene.start(KEYS.INTRO_CRAWL)` em vez de `KEYS.GAME`.

### `main.ts`

Adicionar `IntroCrawlScene` à lista de cenas.

### `constants.ts`

Adicionar `KEYS.INTRO_CRAWL = 'IntroCrawlScene'` e `KEYS.HOW_TO_PLAY = 'HowToPlayScene'`.

---

## Mapa de Arquivos

| Arquivo | Ação | Mudança |
|---|---|---|
| `src/sprites/SpriteData.ts` | Criar | Dados de pixel art de todos os personagens e inimigos |
| `src/scenes/BootScene.ts` | Modificar | Substituir makeRect/makeCircle por makePixelSprite |
| `src/entities/Raya.ts` | Modificar | Animações, corpo físico menor, fix de movimento |
| `src/entities/Cruella.ts` | Modificar | Animações, corpo físico menor, fix de movimento |
| `src/scenes/HowToPlayScene.ts` | Criar | Tela de instruções |
| `src/scenes/IntroCrawlScene.ts` | Criar | Intro estilo Star Wars |
| `src/scenes/MenuScene.ts` | Modificar | Botões H e fluxo para IntroCrawlScene |
| `src/scenes/GameOverScene.ts` | Modificar | Correção do restart — chamar resetAtCheckpoint/resetLevel |
| `src/scenes/GameScene.ts` | Modificar | Remover lógica de fromStart do init() |
| `src/main.ts` | Modificar | Registrar 2 novas cenas |
| `src/constants.ts` | Modificar | Adicionar KEYS.INTRO_CRAWL e KEYS.HOW_TO_PLAY |
| `src/GameState.ts` | Modificar | Adicionar resetAtCheckpoint() e resetLevel() |
| `tests/GameState.test.ts` | Modificar | Testes para os 2 novos métodos |

**Não alterados:** `UIScene.ts`, todos os inimigos (exceto texturas), `Player.ts`, `World1.ts`.

---

## 6. Correção do Fluxo de Restart (Game Over)

### Bugs identificados

**Bug 1 — ENTER não restaura corações:**
`GameOverScene` chama `this.scene.start(KEYS.GAME)` sem passar dados. `GameScene.init()` não reseta nada. O jogador reentra com 0 corações e morre imediatamente de novo.

**Bug 2 — R não restaura corações:**
`R` passa `{ fromStart: true }`, que chama `gameState.resetForCheckpoint()`. Esse método tem `// Keep hearts` — mantém 0 corações. Mesmo bug.

**Bug 3 — `resetForCheckpoint()` não serve para morte:**
Foi projetado para "manter progresso ao chegar num checkpoint vivo", não para "ressuscitar após game over". Precisa ser separado em dois comportamentos distintos.

### Correções em `GameState.ts`

Adicionar método `resetAtCheckpoint()` — para usar quando o jogador morre e reinicia do checkpoint:
```typescript
resetAtCheckpoint(): void {
  this.hearts = 3                // restaura vida
  this.equippedAccessory = null
  this.activePowerUp = null
  this.swapBlockedUntil = 0
  this.lastHitAt = 0
  // mantém: score, goldenBones, collarOfGold, checkpointReached, checkpointX/Y, currentLevel
}
```

Adicionar método `resetLevel()` — para usar quando o jogador reinicia a fase do zero:
```typescript
resetLevel(): void {
  this.hearts = 3
  this.equippedAccessory = null
  this.activePowerUp = null
  this.swapBlockedUntil = 0
  this.lastHitAt = 0
  this.checkpointReached = false
  this.checkpointX = 0
  this.checkpointY = 0
  // mantém: score, goldenBones, collarOfGold, currentLevel
}
```

### Correções em `GameOverScene.ts`

```typescript
// ENTER — volta ao checkpoint
kb.once('keydown-ENTER', () => {
  gameState.resetAtCheckpoint()
  this.scene.start(KEYS.GAME)
})

// R — recomeça a fase do início
kb.once('keydown-R', () => {
  gameState.resetLevel()
  this.scene.start(KEYS.GAME)
})
```

### Correções em `GameScene.init()`

Remover o parâmetro `fromStart` — o reset agora é responsabilidade de quem chama `scene.start(KEYS.GAME)`, não do `init()`. O `init()` fica vazio ou só loga para debug.

### Testes unitários em `GameState.test.ts`

Adicionar testes para `resetAtCheckpoint()` e `resetLevel()`:
- `resetAtCheckpoint()` deve restaurar corações para 3, limpar power-ups, manter score/checkpoint/goldenBones
- `resetLevel()` deve restaurar corações, limpar checkpoint, manter score/goldenBones

---

## Checklist de Cobertura

| Requisito | Seção |
|---|---|
| Cachorro com aparência real (pixel art) | 1 |
| Inimigos redesenhados | 3 |
| Animações de walk/jump/idle | 1 |
| Correção do movimento travando | 2 |
| Tela "Como Jogar" | 4 |
| Intro narrativa estilo Star Wars | 5 |
| Restart do checkpoint funciona (corações restaurados) | 6 |
| Restart da fase funciona (checkpoint limpo, corações restaurados) | 6 |
| Testes unitários para resetAtCheckpoint e resetLevel | 6 |
