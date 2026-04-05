# Câmera + HUD + Habilidades — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar game feel com câmera responsiva, feedback visual rico e habilidades com mais profundidade mecânica (incluindo combo Dash→Swap→Impulso).

**Architecture:** Três blocos sequenciais. Câmera vive inteiramente em `GameScene.ts`. HUD/Feedback divide-se entre `GameScene` (popups, hit stop) e `UIScene` (timer, flash, barra de power-up). Habilidades distribuem-se em `Raya.ts`, `Cruella.ts`, `Player.ts`, `GameScene.ts` e `UIScene.ts` — o evento `'dashed'` em Raya é o ponto de integração do combo.

**Tech Stack:** Phaser 3.90, TypeScript, Vitest 1.6

---

## Mapa de Arquivos

| Arquivo | Mudanças |
|---------|----------|
| `src/scenes/GameScene.ts` | Camera dead zone/lookahead, boss cinematic, score popups, hit stop, dash-damage overlap, emit 'start-timer' |
| `src/scenes/UIScene.ts` | Timer de fase, flash de dano, barra visual de power-up, cooldown visual de habilidade |
| `src/levels/LevelData.ts` | Adicionar campo `timeLimit: number` |
| `src/levels/World1.ts` | Definir `timeLimit` em todas as fases |
| `src/GameState.ts` | Adicionar `abilityUsedAt: number`, `abilityCooldownMs: number` |
| `src/entities/Raya.ts` | Emitir evento `'dashed'` após dash |
| `src/entities/Cruella.ts` | Bark adiciona stun 500ms + tint amarelo |
| `src/entities/Player.ts` | Combo window: ouvir 'dashed', verificar janela em `_performSwap` |
| `tests/timer.test.ts` | Testes da lógica pura do timer |
| `tests/combo.test.ts` | Testes da janela de combo |

---

## Task 1: Câmera — Dead Zone e Lookahead

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Adicionar propriedade `_camOffsetX` à classe `GameScene`**

  Em `src/scenes/GameScene.ts`, após a linha `private _mKey!: Phaser.Input.Keyboard.Key`:

  ```typescript
  private _camOffsetX: number = 0
  private _followingSprite: Phaser.Physics.Arcade.Sprite | null = null
  ```

- [ ] **Step 2: Refatorar `_setupCamera()` para incluir dead zone**

  Substituir o método `_setupCamera()` inteiro:

  ```typescript
  private _setupCamera(): void {
    const mapWidth = this.currentLevel.tileWidthCols * TILE_SIZE
    this.physics.world.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    this.cameras.main.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    this.cameras.main.setDeadzone(160, 80)
    this._followingSprite = this.player.active
    this.cameras.main.startFollow(this._followingSprite, true, 0.1, 0.1)
  }
  ```

- [ ] **Step 3: Atualizar `update()` para lookahead e troca de câmera por swap**

  No método `update()`, substituir a linha `this.cameras.main.startFollow(this.player.active, true, 0.1, 0.1)` por:

  ```typescript
  // Lookahead: câmera adianta na direção do movimento
  const targetOffsetX = this.player.active.flipX ? -80 : 80
  this._camOffsetX = Phaser.Math.Linear(this._camOffsetX, targetOffsetX, 0.05)
  this.cameras.main.setFollowOffset(-this._camOffsetX, 0)

  // Re-segue sprite ativa se o swap mudou a cachorra
  if (this._followingSprite !== this.player.active) {
    this._followingSprite = this.player.active
    this.cameras.main.startFollow(this._followingSprite, true, 0.1, 0.1)
  }
  ```

- [ ] **Step 4: Verificar compilação TypeScript**

  ```bash
  cd /Users/apple/Desktop/github/game-cruella-e-raya
  node node_modules/.bin/tsc --noEmit
  ```
  Esperado: sem erros.

- [ ] **Step 5: Teste manual — verificar dead zone e lookahead**

  Iniciar o servidor (`npm run dev`), abrir `http://localhost:5173`, iniciar o jogo e verificar:
  - Pequenos movimentos não movem a câmera (dead zone)
  - Ao andar para direita, câmera mostra mais área à frente (~80px)
  - Ao andar para esquerda, câmera inverte o lookahead
  - Ao fazer swap, câmera passa a seguir a nova cachorra

- [ ] **Step 6: Commit**

  ```bash
  git add src/scenes/GameScene.ts
  git commit -m "feat: add camera dead zone and lookahead to GameScene"
  ```

---

## Task 2: Câmera — Boss Intro Cinemática + Arena Lock

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Adicionar propriedade `_cinematicActive`**

  Em `src/scenes/GameScene.ts`, após `private _followingSprite`:

  ```typescript
  private _cinematicActive: boolean = false
  ```

- [ ] **Step 2: Adicionar método `_runBossIntro()`**

  Adicionar antes de `_buildDecorations()`:

  ```typescript
  private _runBossIntro(): void {
    this._cinematicActive = true
    const cam = this.cameras.main
    const mapWidth = this.currentLevel.tileWidthCols * TILE_SIZE

    // Etapa 1 (0–500ms): para de seguir o player, zoom out suave
    cam.stopFollow()
    this.tweens.add({
      targets: cam,
      zoom: 0.85,
      duration: 500,
      ease: 'Sine.easeInOut',
    })

    // Etapa 2 (500–1500ms): pan até o boss (centro da arena)
    this.time.delayedCall(500, () => {
      const bossX = mapWidth / 2
      const bossY = GAME_HEIGHT / 2
      this.tweens.add({
        targets: cam,
        scrollX: bossX - GAME_WIDTH / 2 / 0.85,
        scrollY: bossY - GAME_HEIGHT / 2 / 0.85,
        duration: 800,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          cam.shake(200, 0.003)
        },
      })
    })

    // Etapa 3 (1500–2000ms): volta ao player, restaura zoom, libera controle
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: cam,
        zoom: 1,
        duration: 500,
        ease: 'Sine.easeInOut',
      })
      this._followingSprite = this.player.active
      cam.startFollow(this._followingSprite, true, 0.1, 0.1)
      cam.setDeadzone(160, 80)
    })

    this.time.delayedCall(2000, () => {
      this._cinematicActive = false
      // Trava a câmera dentro dos limites da arena
      cam.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    })
  }
  ```

- [ ] **Step 3: Chamar `_runBossIntro()` no `create()` para boss levels**

  No método `create()`, após a linha `SoundManager.playBgm(bgmKey, this)`, adicionar:

  ```typescript
  // Boss intro cinemática
  if (this.currentLevel.isBossLevel) {
    this._runBossIntro()
  }
  ```

- [ ] **Step 4: Bloquear input do player durante cinemática no `update()`**

  No início do bloco de update após o check de ESC, antes de `this._parallax.update(...)`:

  ```typescript
  if (this._cinematicActive) return
  ```

- [ ] **Step 5: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```
  Esperado: sem erros.

- [ ] **Step 6: Teste manual — boss intro**

  No jogo, chegar ao boss level (1-boss). Verificar:
  - Ao entrar na fase, o player não responde a input por ~2s
  - Câmera faz pan revelando Seu Bigodes com leve zoom out
  - Camera shake ao revelar o boss
  - Controle é liberado após 2s
  - Câmera não sai dos bounds da arena após a intro

- [ ] **Step 7: Commit**

  ```bash
  git add src/scenes/GameScene.ts
  git commit -m "feat: add boss cinematic intro and arena camera lock"
  ```

---

## Task 3: LevelData + World1 — Campo `timeLimit`

**Files:**
- Modify: `src/levels/LevelData.ts`
- Modify: `src/levels/World1.ts`

- [ ] **Step 1: Escrever teste que espera `timeLimit` na interface**

  Criar `tests/timer.test.ts`:

  ```typescript
  import { describe, it, expect } from 'vitest'
  import { LEVEL_1_1, LEVEL_1_2, LEVEL_1_3, LEVEL_1_BOSS } from '../src/levels/World1'

  describe('LevelData.timeLimit', () => {
    it('fases normais têm timeLimit de 200s', () => {
      expect(LEVEL_1_1.timeLimit).toBe(200)
      expect(LEVEL_1_2.timeLimit).toBe(200)
      expect(LEVEL_1_3.timeLimit).toBe(200)
    })

    it('boss level tem timeLimit 0 (sem limite)', () => {
      expect(LEVEL_1_BOSS.timeLimit).toBe(0)
    })
  })

  describe('getTimerColor', () => {
    function getTimerColor(remaining: number): string {
      if (remaining <= 10) return 'red'
      if (remaining <= 30) return 'orange'
      return 'white'
    }

    it('retorna white para tempo acima de 30s', () => {
      expect(getTimerColor(200)).toBe('white')
      expect(getTimerColor(31)).toBe('white')
    })

    it('retorna orange entre 11s e 30s', () => {
      expect(getTimerColor(30)).toBe('orange')
      expect(getTimerColor(15)).toBe('orange')
      expect(getTimerColor(11)).toBe('orange')
    })

    it('retorna red com 10s ou menos', () => {
      expect(getTimerColor(10)).toBe('red')
      expect(getTimerColor(1)).toBe('red')
      expect(getTimerColor(0)).toBe('red')
    })
  })
  ```

- [ ] **Step 2: Rodar teste para confirmar falha**

  ```bash
  node node_modules/.bin/vitest run tests/timer.test.ts
  ```
  Esperado: FAIL — `timeLimit` is undefined.

- [ ] **Step 3: Adicionar `timeLimit` à interface `LevelData`**

  Em `src/levels/LevelData.ts`, adicionar após o campo `bgColor`:

  ```typescript
  timeLimit: number  // segundos — 0 = sem limite (boss level)
  ```

- [ ] **Step 4: Adicionar `timeLimit` em todos os níveis de World1**

  Em `src/levels/World1.ts`:
  - `LEVEL_1_1`: adicionar `timeLimit: 200,` após `backgroundTheme: 'rua' as const,`
  - `LEVEL_1_2`: adicionar `timeLimit: 200,` após `backgroundTheme: 'praca' as const,`
  - `LEVEL_1_3`: adicionar `timeLimit: 200,` após `backgroundTheme: 'mercado' as const,`
  - `LEVEL_1_BOSS`: adicionar `timeLimit: 0,` após `backgroundTheme: 'boss' as const,`

- [ ] **Step 5: Rodar teste para confirmar aprovação**

  ```bash
  node node_modules/.bin/vitest run tests/timer.test.ts
  ```
  Esperado: PASS — todos os testes verdes.

- [ ] **Step 6: Rodar todos os testes**

  ```bash
  node node_modules/.bin/vitest run
  ```
  Esperado: todos os testes existentes continuam passando.

- [ ] **Step 7: Commit**

  ```bash
  git add src/levels/LevelData.ts src/levels/World1.ts tests/timer.test.ts
  git commit -m "feat: add timeLimit field to LevelData and World1 levels"
  ```

---

## Task 4: UIScene — Timer de Fase

**Files:**
- Modify: `src/scenes/UIScene.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Adicionar estado do timer à `UIScene`**

  Em `src/scenes/UIScene.ts`, adicionar propriedades após `private powerUpText!: Phaser.GameObjects.Text`:

  ```typescript
  private timerText!: Phaser.GameObjects.Text
  private _timeRemaining: number = 0
  private _timerActive: boolean = false
  ```

- [ ] **Step 2: Criar o texto do timer em `UIScene.create()`**

  No final de `create()`, após a linha que cria `powerUpText`:

  ```typescript
  this.timerText = this.add.text(GAME_WIDTH / 2 + 80, 10, '', {
    fontSize: '14px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'monospace'
  }).setScrollFactor(0)

  // Escuta evento de início de timer emitido por GameScene
  this.scene.get(KEYS.GAME).events.on('start-timer', (seconds: number) => {
    this._timeRemaining = seconds
    this._timerActive = seconds > 0
  })
  ```

- [ ] **Step 3: Atualizar o timer em `UIScene.update()`**

  No final do método `update()`, após o bloco de power-up text:

  ```typescript
  // Timer de fase
  if (this._timerActive) {
    this._timeRemaining -= this.game.loop.delta / 1000
    if (this._timeRemaining <= 0) {
      this._timeRemaining = 0
      this._timerActive = false
      gameState.hearts = 0
    }
    const secs = Math.ceil(this._timeRemaining)
    const color = secs <= 10 ? '#ef4444' : secs <= 30 ? '#f97316' : '#ffffff'
    this.timerText.setText(`⏱ ${String(secs).padStart(3, '0')}`).setColor(color)

    // Pisca abaixo de 10s
    if (secs <= 10) {
      this.timerText.setAlpha(Math.sin(now * 0.008) * 0.5 + 0.5)
    } else {
      this.timerText.setAlpha(1)
    }
  } else {
    this.timerText.setText('')
  }
  ```

- [ ] **Step 4: Emitir `'start-timer'` no `GameScene.create()`**

  Em `src/scenes/GameScene.ts`, no final de `create()`, após `this.scene.launch(KEYS.UI)`:

  ```typescript
  // Inicia timer (delayedCall para garantir que UIScene já inicializou)
  this.time.delayedCall(100, () => {
    this.events.emit('start-timer', this.currentLevel.timeLimit)
  })
  ```

- [ ] **Step 5: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```
  Esperado: sem erros.

- [ ] **Step 6: Teste manual — timer**

  Iniciar o jogo, entrar na fase 1-1. Verificar:
  - Timer aparece no HUD com contagem regressiva de 200s
  - Abaixo de 30s o texto fica laranja
  - Abaixo de 10s o texto pisca vermelho
  - Boss level (1-boss) não exibe timer

- [ ] **Step 7: Commit**

  ```bash
  git add src/scenes/UIScene.ts src/scenes/GameScene.ts
  git commit -m "feat: add phase timer to UIScene with color alerts"
  ```

---

## Task 5: GameScene — Score Popups + Hit Stop

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Adicionar helper `_spawnScorePopup`**

  Em `src/scenes/GameScene.ts`, adicionar antes de `_buildDecorations()`:

  ```typescript
  _spawnScorePopup(x: number, y: number, text: string, color: string = '#ffffff'): void {
    const popup = this.add.text(x, y, text, {
      fontSize: '16px', color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(10)
    this.tweens.add({
      targets: popup,
      y: y - 48,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy(),
    })
  }
  ```

- [ ] **Step 2: Adicionar popups em `_handleItemCollect()`**

  No método `_handleItemCollect()`, adicionar chamadas após cada coleta:

  ```typescript
  case 'bone':
    gameState.addScore(10)
    SoundManager.play('collectBone')
    this._spawnScorePopup(item.x, item.y - 16, '+10')
    break
  case 'golden_bone':
    gameState.collectGoldenBone(gameState.currentLevel, (item as GoldenBone).boneIndex)
    gameState.addScore(500)
    SoundManager.play('collectGolden')
    this._spawnScorePopup(item.x, item.y - 16, '+500', '#ffd700')
    break
  case 'pizza':
    gameState.restoreHeart()
    this._spawnScorePopup(item.x, item.y - 16, '❤️', '#ff6b6b')
    break
  case 'laco': case 'coleira': case 'chapeu': case 'bandana':
    gameState.equipAccessory(type as any)
    this._spawnScorePopup(item.x, item.y - 16, '✨', '#00ffff')
    break
  default:
    gameState.applyPowerUp(type, now)
    SoundManager.play('powerUp')
    this._spawnScorePopup(item.x, item.y - 16, '✨', '#00ffff')
  ```

- [ ] **Step 3: Adicionar popups em kills de inimigos**

  No método `_spawnEnemies()`, substituir os handlers de `'died'`:

  ```typescript
  // Para inimigos normais:
  enemy.on('died', (e: Enemy) => {
    gameState.addScore(50)
    this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
  })

  // Para o boss:
  boss.on('died', (b: Enemy) => {
    gameState.addScore(1000)
    gameState.collarOfGold = true
    this._spawnScorePopup(b.x, b.y - 30, '+1000', '#22c55e')
    this._levelComplete()
  })
  ```

  > **Nota:** `enemy.on('died', () => {...})` atualmente não recebe a entidade como argumento. Verificar em `src/entities/Enemy.ts` — o método `onDeath()` emite `this.emit('died', this)`. O argumento `e: Enemy` acima está correto pois o evento passa `this`.

- [ ] **Step 4: Adicionar hit stop no stomp kill**

  No método `_setupCollisions()`, no handler do stomp (após `e.takeDamage(999)`):

  ```typescript
  if (pBody.velocity.y > 50 && pBody.bottom <= eBody.top + 12) {
    e.takeDamage(999)
    pBody.setVelocityY(-380)
    SoundManager.play('stomp')
    // Hit stop: pausa física por 80ms para dar peso ao golpe
    this.physics.pause()
    this.time.delayedCall(80, () => this.physics.resume())
    return
  }
  ```

- [ ] **Step 5: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```
  Esperado: sem erros.

- [ ] **Step 6: Teste manual**

  No jogo verificar:
  - Coletar osso → popup "+10" branco voa para cima
  - Coletar osso dourado → popup "+500" dourado maior
  - Matar inimigo com stomp → popup "+50" laranja + pausa perceptível de 80ms
  - Matar boss → popup "+1000" verde

- [ ] **Step 7: Commit**

  ```bash
  git add src/scenes/GameScene.ts
  git commit -m "feat: add score popups and hit stop to GameScene"
  ```

---

## Task 6: UIScene — Flash de Dano + Barra Visual de Power-up

**Files:**
- Modify: `src/scenes/UIScene.ts`

- [ ] **Step 1: Remover `powerUpText` e adicionar novas propriedades**

  Em `src/scenes/UIScene.ts`:

  a) Remover a linha `private powerUpText!: Phaser.GameObjects.Text` da classe.

  b) Adicionar no lugar (após `private cooldownBar!`):

  ```typescript
  private _puIcon!: Phaser.GameObjects.Text
  private _puBarBg!: Phaser.GameObjects.Rectangle
  private _puBar!: Phaser.GameObjects.Rectangle
  private _damageFlash!: Phaser.GameObjects.Rectangle
  private _lastHitAtTracked: number = 0
  ```

- [ ] **Step 2: Disparar flash quando `gameState.lastHitAt` muda**

  No método `update()`, após o loop de corações:

  ```typescript
  // Flash de dano
  if (gameState.lastHitAt !== this._lastHitAtTracked && gameState.lastHitAt > 0) {
    this._lastHitAtTracked = gameState.lastHitAt
    this._damageFlash.setAlpha(0.35)
    this.tweens.add({
      targets: this._damageFlash,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
    })
  }
  ```

- [ ] **Step 3: Substituir criação de `powerUpText` em `create()` pelas novas views**

  Em `create()`:

  a) Remover a linha `this.powerUpText = this.add.text(140, 24, '', ...)`.

  b) Adicionar no lugar:

  ```typescript
  this._puIcon   = this.add.text(140, 24, '', { fontSize: '14px' }).setScrollFactor(0)
  this._puBarBg  = this.add.rectangle(185, 31, 60, 7, 0x333333).setScrollFactor(0)
  this._puBar    = this.add.rectangle(185, 31, 60, 7, 0x06b6d4).setScrollFactor(0).setOrigin(0.5)
  ```

- [ ] **Step 4: Atualizar a barra de power-up em `update()`**

  Substituir o bloco `if (gameState.hasAnyPowerUp(now) && gameState.activePowerUp)` por:

  ```typescript
  if (gameState.hasAnyPowerUp(now) && gameState.activePowerUp) {
    const puIcons: Record<string, string> = {
      petisco: '🍖', pipoca: '🍿', churrasco: '🥩', bola: '🎾', frisbee: '🥏'
    }
    const fraction = Math.max(0, (gameState.activePowerUp.expiresAt - now) / 10000)
    const barColor = fraction < 0.2 ? 0xef4444 : 0x06b6d4
    this._puIcon.setText(puIcons[gameState.activePowerUp.type] ?? '⚡')
    this._puBar.setDisplaySize(60 * fraction, 7).setFillStyle(barColor)
    this._puBarBg.setVisible(true)
    this._puBar.setVisible(true)
    this._puIcon.setVisible(true)
  } else {
    this._puBarBg.setVisible(false)
    this._puBar.setVisible(false)
    this._puIcon.setVisible(false)
  }
  ```

- [ ] **Step 5: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```
  Esperado: sem erros.

- [ ] **Step 6: Teste manual**

  No jogo verificar:
  - Tomar dano → borda da tela pisca vermelho e desaparece
  - Pegar power-up (ex: petisco) → ícone + barra aparecem, barra esgota em 10s
  - Abaixo de 20% da duração, barra fica vermelha

- [ ] **Step 7: Commit**

  ```bash
  git add src/scenes/UIScene.ts
  git commit -m "feat: add damage flash overlay and power-up bar to UIScene"
  ```

---

## Task 7: GameState — Campos de Cooldown de Habilidade

**Files:**
- Modify: `src/GameState.ts`

- [ ] **Step 1: Adicionar campos de cooldown à classe `GameState`**

  Em `src/GameState.ts`, após `muted: boolean = false`:

  ```typescript
  abilityUsedAt: number = 0      // timestamp do último uso da habilidade especial
  abilityCooldownMs: number = 800 // duração do cooldown em ms (800 Raya, 1500 Cruella)
  ```

  Em `reset()`, após o comentário sobre `muted`:
  ```typescript
  this.abilityUsedAt = 0
  this.abilityCooldownMs = 800
  ```

- [ ] **Step 2: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```
  Esperado: sem erros.

- [ ] **Step 3: Commit**

  ```bash
  git add src/GameState.ts
  git commit -m "feat: add abilityUsedAt and abilityCooldownMs fields to GameState"
  ```

---

## Task 8: Raya — Emitir Evento `'dashed'` + Atualizar GameState

**Files:**
- Modify: `src/entities/Raya.ts`

- [ ] **Step 1: Importar `gameState` em `Raya.ts`** (já está importado — confirmar)

  Verificar que `import { gameState } from '../GameState'` existe. Já está na linha 3.

- [ ] **Step 2: Emitir evento `'dashed'` e atualizar `gameState` no método `dash()`**

  No método `private dash()`, após a linha `SoundManager.play('dash')`:

  ```typescript
  private dash(): void {
    SoundManager.play('dash')
    const dir = this.flipX ? -1 : 1

    // Atualiza cooldown no GameState para UIScene exibir
    gameState.abilityUsedAt = this.scene.time.now
    gameState.abilityCooldownMs = 800

    // Emite evento para Player registrar janela de combo
    this.emit('dashed', { dir, time: this.scene.time.now })

    this.isDashing = true
    this.dashCooldown = true
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
  ```

- [ ] **Step 3: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/entities/Raya.ts
  git commit -m "feat: Raya emits 'dashed' event and updates GameState cooldown"
  ```

---

## Task 9: GameScene — Overlap de Dash Dano

**Files:**
- Modify: `src/scenes/GameScene.ts`

> **Pré-requisito:** Task 5 deve estar concluída — `_spawnScorePopup()` precisa existir em `GameScene`.

- [ ] **Step 1: Adicionar overlap de dash dano em `_setupCollisions()`**

  Em `src/scenes/GameScene.ts`, no final de `_setupCollisions()`, após o handler de `'bark'`:

  ```typescript
  // Dash de Raya causa dano em inimigos durante o movimento
  this.physics.add.overlap(this.player.raya, this.enemyGroup, (_r, enemy) => {
    const e = enemy as Enemy
    if (this.player.raya.getIsDashing()) {
      e.takeDamage(1)
      this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
    }
  })
  ```

- [ ] **Step 2: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```

- [ ] **Step 3: Teste manual — dash dano**

  No jogo com Raya, usar Shift para dar dash em direção a um inimigo:
  - Inimigo perde HP (gato morre com 1 acerto, dono precisa de mais)
  - Popup "+50" laranja aparece
  - Raya não perde vida na colisão

- [ ] **Step 4: Commit**

  ```bash
  git add src/scenes/GameScene.ts
  git commit -m "feat: Raya dash deals damage to enemies on overlap"
  ```

---

## Task 10: Cruella — Bark Stun + Tint Amarelo

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/entities/Cruella.ts`

- [ ] **Step 1: Atualizar `gameState` cooldown no `bark()` de Cruella**

  Em `src/entities/Cruella.ts`, no método `bark()`, após `SoundManager.play('bark')`:

  ```typescript
  bark(): void {
    SoundManager.play('bark')
    // Atualiza cooldown no GameState para UIScene
    gameState.abilityUsedAt = this.scene.time.now
    gameState.abilityCooldownMs = 1500

    this.barkCooldown = true
    this.emit('bark', this.x, this.y)
    this.scene.time.delayedCall(1500, () => { this.barkCooldown = false })
  }
  ```

  Confirmar que `gameState` está importado em `Cruella.ts` (linha 3 já importa).

- [ ] **Step 2: Adicionar stun 500ms + tint amarelo no handler de `'bark'` em `GameScene`**

  Em `src/scenes/GameScene.ts`, substituir o handler de `'bark'` em `_setupCollisions()`:

  ```typescript
  this.player.cruella.on('bark', (bx: number, by: number) => {
    (this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
      const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
      if (dist <= PHYSICS.BARK_RADIUS) {
        e.stun(500)
        e.setTint(0xffff44)
        this.time.delayedCall(500, () => { if (e.active) e.clearTint() })
      }
    })
  })
  ```

- [ ] **Step 3: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```

- [ ] **Step 4: Teste manual — bark stun**

  No jogo com Cruella, usar Shift perto de inimigos:
  - Inimigos dentro do raio ficam com tint amarelo por ~500ms
  - Inimigos param de se mover durante o stun
  - Tint some após 500ms e inimigos retomam movimento

- [ ] **Step 5: Commit**

  ```bash
  git add src/entities/Cruella.ts src/scenes/GameScene.ts
  git commit -m "feat: Cruella bark stuns enemies 500ms with yellow tint"
  ```

---

## Task 11: UIScene — Cooldown Visual da Habilidade

**Files:**
- Modify: `src/scenes/UIScene.ts`

- [ ] **Step 1: Adicionar propriedades do cooldown arc em `UIScene`**

  Adicionar após `private _damageFlash!`:

  ```typescript
  private _cdGraphics!: Phaser.GameObjects.Graphics
  private _cdIcon!: Phaser.GameObjects.Text
  ```

- [ ] **Step 2: Criar o cooldown arc em `create()`**

  No final de `create()`:

  ```typescript
  // Cooldown visual da habilidade (Shift)
  this._cdGraphics = this.add.graphics().setScrollFactor(0).setDepth(5)
  this._cdIcon = this.add.text(292, 22, '⚡', {
    fontSize: '14px'
  }).setScrollFactor(0).setDepth(6).setOrigin(0.5)
  ```

- [ ] **Step 3: Atualizar o arc em `update()`**

  No final de `update()`:

  ```typescript
  // Cooldown arc da habilidade especial
  const cdFraction = Math.min(1, (now - gameState.abilityUsedAt) / Math.max(1, gameState.abilityCooldownMs))
  const cx = 292, cy = 22, r = 13
  this._cdGraphics.clear()
  // Círculo de fundo
  this._cdGraphics.fillStyle(0x222222, 0.85)
  this._cdGraphics.fillCircle(cx, cy, r)
  // Arco de progresso
  if (cdFraction >= 1) {
    this._cdGraphics.fillStyle(0x22c55e, 1)
    this._cdGraphics.fillCircle(cx, cy, r)
  } else {
    this._cdGraphics.fillStyle(0x7c3aed, 0.9)
    this._cdGraphics.slice(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + cdFraction * Math.PI * 2, false)
    this._cdGraphics.fillPath()
  }
  // Círculo interno (efeito de anel)
  this._cdGraphics.fillStyle(0x1a1a2e, 1)
  this._cdGraphics.fillCircle(cx, cy, r - 4)
  // Ícone muda por cachorra ativa
  this._cdIcon.setText(gameState.activeDog === 'raya' ? '⚡' : '🔊')
  ```

- [ ] **Step 4: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```

- [ ] **Step 5: Teste manual — cooldown arc**

  No jogo verificar:
  - Com Raya: ícone ⚡, arco roxo preenchendo após dash (800ms), fica verde quando pronto
  - Com Cruella: ícone 🔊, arco roxo preenchendo após bark (1500ms), fica verde quando pronto
  - Ao fazer swap, ícone muda imediatamente

- [ ] **Step 6: Commit**

  ```bash
  git add src/scenes/UIScene.ts
  git commit -m "feat: add ability cooldown arc visual to UIScene"
  ```

---

## Task 12: Player — Combo Dash→Swap→Impulso

**Files:**
- Modify: `src/entities/Player.ts`
- Create: `tests/combo.test.ts`

- [ ] **Step 1: Escrever teste do combo window**

  Criar `tests/combo.test.ts`:

  ```typescript
  import { describe, it, expect } from 'vitest'

  // Lógica pura da janela de combo extraída para teste
  function isComboActive(dashTime: number, swapTime: number, windowMs: number = 600): boolean {
    return swapTime < dashTime + windowMs
  }

  describe('Combo Dash→Swap window', () => {
    it('ativa combo quando swap ocorre dentro de 600ms do dash', () => {
      expect(isComboActive(1000, 1400)).toBe(true)  // 400ms depois
      expect(isComboActive(1000, 1599)).toBe(true)  // 599ms depois
    })

    it('não ativa combo quando swap ocorre exatamente em 600ms ou depois', () => {
      expect(isComboActive(1000, 1600)).toBe(false) // exatamente 600ms
      expect(isComboActive(1000, 1700)).toBe(false) // 700ms depois
    })

    it('não ativa combo sem dash anterior (dashTime = 0)', () => {
      // swapTime > 0 + 600 = 600, então qualquer swapTime > 600 falha
      expect(isComboActive(0, 800)).toBe(false)
    })
  })
  ```

- [ ] **Step 2: Rodar teste para confirmar que passa (lógica pura)**

  ```bash
  node node_modules/.bin/vitest run tests/combo.test.ts
  ```
  Esperado: PASS — os testes passam imediatamente (testam lógica pura sem Phaser).

- [ ] **Step 3: Adicionar propriedades do combo em `Player`**

  Em `src/entities/Player.ts`, após `private scene: Phaser.Scene`:

  ```typescript
  private _dashComboWindowUntil: number = 0
  private _lastDashDir: number = 1
  ```

- [ ] **Step 4: Registrar listener do evento `'dashed'` no `constructor` de `Player`**

  No `constructor`, após `this.tabKey = scene.input.keyboard!.addKey(...)`:

  ```typescript
  // Ouve evento de dash para registrar janela de combo
  this.raya.on('dashed', ({ dir, time }: { dir: number; time: number }) => {
    this._dashComboWindowUntil = time + 600
    this._lastDashDir = dir
  })
  ```

- [ ] **Step 5: Verificar janela de combo em `_performSwap()` e adicionar `_activateDashCombo()`**

  Modificar `_performSwap()` para verificar a janela após o swap:

  ```typescript
  private _performSwap(): void {
    SoundManager.play('swap')
    const prev = this.active
    const next = this.ghost

    next.setPosition(prev.x, prev.y)
    next.setVelocity(
      (prev.body as Phaser.Physics.Arcade.Body).velocity.x,
      (prev.body as Phaser.Physics.Arcade.Body).velocity.y
    )
    ;(next.body as Phaser.Physics.Arcade.Body).setEnable(true)
    next.setAlpha(1)
    next.setActive(true)

    prev.setAlpha(0.35)
    prev.setActive(false)
    ;(prev.body as Phaser.Physics.Arcade.Body).setEnable(false)

    this.scene.cameras.main.flash(80, 255, 255, 255)

    // Verifica janela de combo: Raya dasheu → swap → impulso em Cruella
    if (this.scene.time.now < this._dashComboWindowUntil && gameState.activeDog === 'cruella') {
      this._activateDashCombo()
    }
  }
  ```

  Adicionar o método `_activateDashCombo()`:

  ```typescript
  private _activateDashCombo(): void {
    // Aplica impulso na direção do dash original
    this.cruella.setVelocityX(this._lastDashDir * 440)

    // VFX: pulse de escala em Cruella
    this.scene.tweens.add({
      targets: this.cruella,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    })

    // Flash adicional de câmera para indicar combo
    this.scene.cameras.main.flash(120, 255, 200, 50)

    // Reseta janela para não acionar combo duplo
    this._dashComboWindowUntil = 0
  }
  ```

- [ ] **Step 6: Verificar compilação**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```
  Esperado: sem erros.

- [ ] **Step 7: Rodar todos os testes**

  ```bash
  node node_modules/.bin/vitest run
  ```
  Esperado: todos os testes passam.

- [ ] **Step 8: Teste manual — combo**

  No jogo, com Raya ativa:
  1. Pressionar Shift (dash)
  2. Dentro de 600ms, pressionar TAB (swap para Cruella)
  3. Cruella deve receber impulso visível na direção do dash + pulse de escala + flash amarelo

  Verificar que o combo **não ativa** se o TAB for pressionado mais de 600ms após o dash.

- [ ] **Step 9: Commit final**

  ```bash
  git add src/entities/Player.ts tests/combo.test.ts
  git commit -m "feat: add Dash→Swap combo mechanic to Player"
  ```

---

## Task 13: Verificação Final e Push

**Files:** nenhum arquivo novo

- [ ] **Step 1: Rodar todos os testes**

  ```bash
  node node_modules/.bin/vitest run
  ```
  Esperado: todos os testes passam.

- [ ] **Step 2: Verificar compilação final**

  ```bash
  node node_modules/.bin/tsc --noEmit
  ```

- [ ] **Step 3: Build de produção**

  ```bash
  node node_modules/.bin/vite build
  ```
  Esperado: build sem erros, `dist/` gerado.

- [ ] **Step 4: Smoke test visual completo**

  Iniciar `npm run dev` e verificar checklist completo:
  - [ ] Dead zone perceptível ao andar
  - [ ] Lookahead revela área à frente
  - [ ] Boss intro executa e libera controle após 2s
  - [ ] Timer conta regressivamente, muda cor corretamente
  - [ ] Popups aparecem ao coletar cada tipo de item
  - [ ] Flash vermelho ao tomar dano
  - [ ] Barra de power-up substitui texto
  - [ ] Cooldown arc ⚡/🔊 funciona para ambas as cachorras
  - [ ] Dash de Raya danifica inimigos + popup +50
  - [ ] Bark de Cruella aplica tint amarelo + stun
  - [ ] Combo Dash→Swap propulsa Cruella

- [ ] **Step 5: Push para remote**

  ```bash
  git push
  ```
