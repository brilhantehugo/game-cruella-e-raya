# GameScene Decomposition B2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair `_runBossIntro()`, `_setupCollisions()` e `_handleItemCollect()` de GameScene para 3 novos módulos (`BossIntro`, `CollisionSetup`, `ItemCollectHandler`), reduzindo GameScene de 1094 para ~780 linhas sem alterar comportamento.

**Architecture:** Mesmo padrão de BossSetup (Spec B1): cada módulo é uma classe estática que recebe `scene: GameScene` via `import type`, acessa campos agora `/*internal*/`. GameScene chama `Module.method(this)` em vez do método privado original. Refactoring puro — sem nova lógica.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## Estrutura de arquivos

| Arquivo | Mudança |
|---|---|
| `src/scenes/GameScene.ts` | Relaxar 10 membros; remover 3 métodos; substituir 2 chamadas; adicionar 2 imports; remover 2 imports |
| `src/scenes/BossIntro.ts` | **Criar** — cinematic de intro do boss |
| `src/scenes/ItemCollectHandler.ts` | **Criar** — lógica de coleta de itens |
| `src/scenes/CollisionSetup.ts` | **Criar** — toda a física e reações de combate |

---

## Task 1: Relaxar private modifiers em GameScene.ts

**Files:**
- Modify: `src/scenes/GameScene.ts` (linhas 36–70, 884)

> Contexto: BossIntro, CollisionSetup e ItemCollectHandler precisam acessar campos de GameScene. Os campos abaixo saem de `private` para `/*internal*/`. Não alterar nenhum outro campo.

- [ ] **Step 1: Alterar os 10 membros em `src/scenes/GameScene.ts`**

Localizar cada linha e substituir `private` por `/*internal*/` **apenas nos membros listados**:

```typescript
// linha 36:
  /*internal*/ groundLayer!: Phaser.Physics.Arcade.StaticGroup
// linha 37:
  /*internal*/ platformLayer!: Phaser.Physics.Arcade.StaticGroup
// linha 38:
  /*internal*/ decorationLayer!: Phaser.Physics.Arcade.StaticGroup
// linha 40:
  /*internal*/ itemGroup!: Phaser.Physics.Arcade.StaticGroup
// linha 48:
  /*internal*/ _followingSprite: Phaser.Physics.Arcade.Sprite | null = null
// linha 49:
  /*internal*/ _cinematicActive: boolean = false
// linha 59:
  /*internal*/ _enemyHPBar!: EnemyHPBar
// linha 67:
  /*internal*/ _hazardGroup!: Phaser.Physics.Arcade.StaticGroup
// linha 70:
  /*internal*/ _movingPlatformGroup!: Phaser.Physics.Arcade.Group
```

Localizar o método `_gameOver()` (linha ~884) e alterar:
```typescript
  /*internal*/ _gameOver(): void {
```

- [ ] **Step 2: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -10
```

Esperado: nenhuma linha de saída.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "refactor: relax private modifiers for BossIntro/CollisionSetup/ItemCollectHandler"
```

---

## Task 2: Criar BossIntro.ts + wire em GameScene

**Files:**
- Create: `src/scenes/BossIntro.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Criar `src/scenes/BossIntro.ts`**

```typescript
import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../constants'
import type { GameScene } from './GameScene'

const BOSS_SPEECHES: Record<string, { header: string; hColor: string; speech: string; sColor: string }> = {
  '0-boss': { header: '🧹 ZELADOR DO PRÉDIO 🧹', hColor: '#ffa040',
              speech: '"Ninguém passa enquanto eu estiver de guarda!"', sColor: '#ffcc88' },
  '1-boss': { header: '🐱 SEU BIGODES 🐱',       hColor: '#ff8800',
              speech: '"Meu território, minha lixeira! Não vão a lugar algum!"', sColor: '#ffcc88' },
  '2-boss': { header: '🤖 DRONE DE VIGILÂNCIA 🤖', hColor: '#22ccff',
              speech: '"Intruso detectado. A activar protocolo de eliminação."', sColor: '#aaeeff' },
  '3-boss': { header: '🏍️ SEGURANÇA EM MOTO 🏍️', hColor: '#ff4444',
              speech: '"Desta vez não escapam. Acabou!"', sColor: '#ffaaaa' },
}

export class BossIntro {
  /** Executa a cinematic de intro do boss. Chamado por GameScene.create(). */
  static run(scene: GameScene): void {
    scene._cinematicActive = true
    const cam = scene.cameras.main
    const mapWidth = scene.currentLevel.tileWidthCols * TILE_SIZE

    // Etapa 1 (0–500ms): para de seguir o player, zoom out suave
    cam.stopFollow()
    scene.tweens.add({
      targets: cam,
      zoom: 0.85,
      duration: 500,
      ease: 'Sine.easeInOut',
    })

    // Etapa 2 (500–1500ms): pan até o boss
    // 3-boss nasce à direita; todos os outros ficam no centro da arena
    const bossWorldX = scene.currentLevel.id === '3-boss'
      ? mapWidth - 100
      : mapWidth / 2
    scene.time.delayedCall(500, () => {
      if (!scene.scene.isActive(KEYS.GAME)) return
      const bossX = bossWorldX
      const bossY = GAME_HEIGHT / 2
      // scrollX = worldX - (viewportWidth / zoom / 2) para centrar o boss na tela
      const scrollX = Phaser.Math.Clamp(bossX - GAME_WIDTH / 2 / 0.85, 0, mapWidth - GAME_WIDTH)
      const scrollY = bossY - GAME_HEIGHT / 2 / 0.85
      scene.tweens.add({
        targets: cam,
        scrollX,
        scrollY,
        duration: 800,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          cam.shake(200, 0.003)
        },
      })
    })

    // Etapa 2.5 (1100ms): fala do boss
    const bossData = BOSS_SPEECHES[scene.currentLevel.id]
    if (bossData) {
      scene.time.delayedCall(1100, () => {
        if (!scene.scene.isActive(KEYS.GAME)) return
        const header = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10,
          bossData.header, {
            fontSize: '20px', color: bossData.hColor, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4,
            backgroundColor: '#000000ee', padding: { x: 16, y: 8 },
          }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)
        const speech = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 36,
          bossData.speech, {
            fontSize: '14px', color: bossData.sColor, fontStyle: 'italic',
            stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#000000cc', padding: { x: 12, y: 6 },
          }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)
        scene.tweens.add({ targets: [header, speech], alpha: 1, duration: 300 })
        scene.time.delayedCall(3000, () => {
          if (!scene.scene.isActive(KEYS.GAME)) return
          scene.tweens.add({
            targets: [header, speech], alpha: 0, duration: 400,
            onComplete: () => {
              if (header.active) header.destroy()
              if (speech.active) speech.destroy()
            },
          })
        })
      })
    }

    // Etapa 3 (1500–2000ms): volta ao player, restaura zoom, libera controle
    scene.time.delayedCall(1500, () => {
      if (!scene.scene.isActive(KEYS.GAME)) return
      scene.tweens.add({
        targets: cam,
        zoom: 1,
        duration: 500,
        ease: 'Sine.easeInOut',
      })
      scene._followingSprite = scene.player.active
      cam.startFollow(scene._followingSprite, true, 0.1, 0.1)
      cam.setDeadzone(160, 80)
    })

    scene.time.delayedCall(2000, () => {
      if (!scene.scene.isActive(KEYS.GAME)) return
      // Activa o boss agora que a cinemática terminou
      if (scene._mainBoss) {
        scene._mainBoss.setVisible(true)
        ;(scene._mainBoss.body as Phaser.Physics.Arcade.Body).enable = true
      }
      scene._cinematicActive = false
      // Trava a câmera dentro dos limites da arena
      cam.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    })
  }
}
```

- [ ] **Step 2: Adicionar import de BossIntro em GameScene.ts**

Após a linha `import { BossSetup } from './BossSetup'` (linha ~32), adicionar:

```typescript
import { BossIntro } from './BossIntro'
```

- [ ] **Step 3: Substituir chamada em GameScene.ts + remover `_runBossIntro()`**

Localizar a chamada `this._runBossIntro()` (linha ~176 em `create()`) e substituir por:

```typescript
      BossIntro.run(this)
```

Em seguida, **remover o método `_runBossIntro()` completo** (linha ~192 até linha ~296, inclusive o `}`). Esse bloco começa com `private _runBossIntro(): void {` e termina no `}` antes de `/*internal*/ _spawnScorePopup`.

- [ ] **Step 4: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -10
npx vitest run 2>&1 | tail -4
```

Esperado: 0 erros TS, 783 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BossIntro.ts src/scenes/GameScene.ts
git commit -m "refactor: extract _runBossIntro into BossIntro module"
```

---

## Task 3: Criar ItemCollectHandler.ts

**Files:**
- Create: `src/scenes/ItemCollectHandler.ts`

> Contexto: ItemCollectHandler não é usado diretamente por GameScene — é chamado por CollisionSetup (Task 4). Criamos o arquivo agora para que CollisionSetup possa importá-lo.

- [ ] **Step 1: Criar `src/scenes/ItemCollectHandler.ts`**

```typescript
import Phaser from 'phaser'
import { POWERUP_LABEL } from '../constants'
import { gameState } from '../GameState'
import { GoldenBone } from '../items/GoldenBone'
import { SoundManager } from '../audio/SoundManager'
import type { GameScene } from './GameScene'

export class ItemCollectHandler {
  /** Processa a coleta de um item pelo player. Chamado por CollisionSetup. */
  static handle(scene: GameScene, type: string, item: Phaser.Physics.Arcade.Image): void {
    const now = scene.time.now
    switch (type) {
      case 'checkpoint':
        if (!gameState.checkpointReached) {
          gameState.setCheckpoint(item.x, item.y)
          SoundManager.play('checkpoint')
          scene._fx.checkpointSparkle(item.x, item.y)
          scene._spawnScorePopup(item.x, item.y - 32, '✅ checkpoint!', '#00ffcc')
        }
        return // don't destroy
      case 'exit':
        scene._levelComplete()
        return
      case 'bone':
        gameState.addScore(10)
        SoundManager.play('collectBone')
        scene._fx.boneSpark(item.x, item.y)
        scene._spawnScorePopup(item.x, item.y - 16, '+10', '#ffff00')
        scene._am?.notify('item_collected', { type: 'bone' })
        break
      case 'golden_bone':
        gameState.collectGoldenBone(gameState.currentLevel, (item as unknown as GoldenBone).boneIndex)
        gameState.addScore(500)
        SoundManager.play('collectGolden')
        scene._fx.goldenBoneBurst(item.x, item.y)
        scene._spawnScorePopup(item.x, item.y - 16, '+500', '#ffd700')
        scene._am?.notify('golden_bone')
        break
      case 'pizza':
        gameState.restoreHeart()
        scene._spawnScorePopup(item.x, item.y - 16, '❤️', '#ff6b6b')
        scene._am?.notify('item_collected', { type: 'pizza' })
        break
      case 'heart':
        gameState.restoreHeart()
        SoundManager.play('powerUp')
        scene._spawnScorePopup(item.x, item.y - 16, '❤️ +vida!', '#ff4466')
        scene._am?.notify('item_collected', { type: 'heart' })
        break
      case 'laco':
        gameState.equipAccessory(type as any)
        scene._spawnScorePopup(item.x, item.y - 16, '🎀 laço!',   '#ff88cc')
        break
      case 'coleira':
        gameState.equipAccessory(type as any)
        scene._spawnScorePopup(item.x, item.y - 16, '📿 coleira!', '#88ccff')
        break
      case 'chapeu':
        gameState.equipAccessory(type as any)
        scene._spawnScorePopup(item.x, item.y - 16, '🎩 chapéu!', '#ccaa44')
        break
      case 'bandana':
        gameState.equipAccessory(type as any)
        scene._spawnScorePopup(item.x, item.y - 16, '🏴 bandana!', '#ff4444')
        break
      default: {
        gameState.applyPowerUp(type, now)
        SoundManager.play('powerUp')
        scene._fx.powerUpBurst(scene.player.x, scene.player.y, type)
        const lbl = POWERUP_LABEL[type] ?? { text: '✨', color: '#00ffff' }
        scene._spawnScorePopup(item.x, item.y - 16, lbl.text, lbl.color)
        scene._am?.notify('item_collected', { type })
      }
    }
    item.destroy()
  }
}
```

- [ ] **Step 2: Build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -10
```

Esperado: nenhum erro.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ItemCollectHandler.ts
git commit -m "feat: add ItemCollectHandler module (extracted from GameScene)"
```

---

## Task 4: Criar CollisionSetup.ts + wire em GameScene

**Files:**
- Create: `src/scenes/CollisionSetup.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Criar `src/scenes/CollisionSetup.ts`**

```typescript
import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'
import { gameState } from '../GameState'
import { Enemy } from '../entities/Enemy'
import { HumanEnemy } from '../entities/enemies/HumanEnemy'
import { SoundManager } from '../audio/SoundManager'
import { resolveBarkHit, resolveDashHit, resolveStompHit } from '../systems/CombatResolver'
import { ItemCollectHandler } from './ItemCollectHandler'
import type { GameScene } from './GameScene'

export class CollisionSetup {
  /** Registra todos os colliders e overlaps da cena. Chamado por GameScene.create(). */
  static setup(scene: GameScene): void {
    const playerSprites = [scene.player.raya, scene.player.cruella]

    scene.physics.add.collider(scene.player.raya,   scene.groundLayer)
    scene.physics.add.collider(scene.player.cruella, scene.groundLayer)
    scene.physics.add.collider(scene.player.raya,   scene.platformLayer)
    scene.physics.add.collider(scene.player.cruella, scene.platformLayer)
    scene.physics.add.collider(scene.enemyGroup, scene.groundLayer)
    scene.physics.add.collider(scene.enemyGroup, scene.platformLayer)

    // Plataformas dinâmicas — jogadores (não inimigos, evita ficarem presos)
    if (scene._movingPlatformGroup.getLength() > 0) {
      const carryCallback = (
        playerSprite: Phaser.GameObjects.GameObject,
        platform: Phaser.GameObjects.GameObject
      ): boolean => {
        const pb    = (playerSprite as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
        const platB = (platform    as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
        if (pb.blocked.down && platB.velocity.x !== 0) {
          (playerSprite as Phaser.Physics.Arcade.Image).x += platB.velocity.x * (scene.game.loop.delta / 1000)
        }
        return true
      }
      scene.physics.add.collider(scene.player.raya,   scene._movingPlatformGroup, undefined, carryCallback as any, scene)
      scene.physics.add.collider(scene.player.cruella, scene._movingPlatformGroup, undefined, carryCallback as any, scene)
    }

    // Hazards — spike dá dano; fall-zone detectado em update()
    if (scene._hazardGroup.getLength() > 0) {
      const onSpikeHit = () => {
        scene.player.takeDamage()
        if (gameState.isDead()) scene._gameOver()
      }
      scene.physics.add.overlap(scene.player.raya,    scene._hazardGroup, onSpikeHit, undefined, scene)
      scene.physics.add.overlap(scene.player.cruella, scene._hazardGroup, onSpikeHit, undefined, scene)
    }

    // Decorações sólidas (móveis, grades) bloqueiam personagens e inimigos
    if (scene.decorationLayer.getLength() > 0) {
      scene.physics.add.collider(scene.player.raya,   scene.decorationLayer)
      scene.physics.add.collider(scene.player.cruella, scene.decorationLayer)
      // Boss e mini-boss não colidem com decorações para não ficarem presos entre os móveis
      if (!scene.currentLevel.isBossLevel && !scene.currentLevel.miniBoss) {
        scene.physics.add.collider(scene.enemyGroup, scene.decorationLayer)
      }
    }

    playerSprites.forEach(sprite => {
      scene.physics.add.overlap(sprite, scene.enemyGroup, (ps, enemy) => {
        const e = enemy as Enemy
        const pBody = (ps as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body
        const eBody = e.body as Phaser.Physics.Arcade.Body

        // Stomp / NPC push — decisão delegada ao CombatResolver
        const stompResult = resolveStompHit({
          velocityY: pBody.velocity.y,
          pBottom: pBody.bottom,
          eTop: eBody.top,
          isNPC: e.isNPC,
        })
        if (stompResult.action === 'stomp') {
          // Counter check is intentionally here (not in resolveStompHit): the resolver
          // only decides IF a stomp occurred; the counter reaction is a post-stomp effect.
          const countered = (e as any).tryCounter?.('raya', 'jump') ?? false
          e.takeDamage(999)
          SoundManager.play('stomp')
          if (countered) scene._spawnScorePopup(e.x, e.y - 28, 'COUNTER!', '#22ccff')
          scene.physics.pause()
          scene.time.delayedCall(80, () => scene.physics.resume())
          pBody.setVelocityY(-380)
          return
        }
        if (stompResult.action === 'npc_push') {
          const pushDir = (ps as Phaser.Physics.Arcade.Sprite).x < e.x ? -1 : 1
          pBody.setVelocityX(pushDir * 340)
          pBody.setVelocityY(-220)
          scene.player.takeDamage()
          SoundManager.play('damage')
          if (gameState.isDead()) scene._gameOver()
          return
        }

        if (gameState.hasPowerUp('churrasco', scene.time.now)) {
          e.takeDamage(999)
          return
        }
        scene.player.takeDamage()
        SoundManager.play('damage')
        if (gameState.isDead()) scene._gameOver()
      })

      scene.physics.add.overlap(sprite, scene.itemGroup, (_s, item) => {
        const go = item as Phaser.Physics.Arcade.Image
        const t  = go.getData('type') as string
        if (!t) return
        ItemCollectHandler.handle(scene, t, go)
      })
    })

    scene.player.cruella.on('bark', (bx: number, by: number) => {
      // ── Visual shockwave — circle 1: cyan, fast ─────────────────────────
      const wave1 = scene.add.graphics()
      wave1.lineStyle(4, 0x22ccff, 0.9)
      wave1.strokeCircle(0, 0, PHYSICS.BARK_RADIUS * 0.08)
      wave1.setPosition(bx, by)
      scene.tweens.add({
        targets: wave1,
        scaleX: 13, scaleY: 13,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => { if (wave1.active) wave1.destroy() },
      })

      // ── Visual shockwave — circle 2: white, delayed, slower ────────────
      scene.time.delayedCall(80, () => {
        if (!scene.scene.isActive(KEYS.GAME)) return
        const wave2 = scene.add.graphics()
        wave2.lineStyle(3, 0xffffff, 0.75)
        wave2.strokeCircle(0, 0, PHYSICS.BARK_RADIUS * 0.06)
        wave2.setPosition(bx, by)
        scene.tweens.add({
          targets: wave2,
          scaleX: 11, scaleY: 11,
          alpha: 0,
          duration: 400,
          ease: 'Quad.easeOut',
          onComplete: () => { if (wave2.active) wave2.destroy() },
        })
      })

      // ── Camera shake ───────────────────────────────────────────────────
      scene.cameras.main.shake(150, 0.007)

      // ── Indicador de raio de intimidação (BARK_RADIUS * 1.5) ───────────────
      const rangeGfx = scene.add.graphics()
      rangeGfx.setDepth(6)
      rangeGfx.lineStyle(2, 0xffffff, 0.6)
      rangeGfx.strokeCircle(bx, by, PHYSICS.BARK_RADIUS * 1.5)
      scene.tweens.add({
        targets: rangeGfx,
        alpha: 0,
        duration: 400,
        onComplete: () => { if (rangeGfx.active) rangeGfx.destroy() },
      })

      // ── Enemy reactions ao bark ────────────────────────────────────────────
      ;(scene.enemyGroup.getChildren() as Enemy[]).forEach(e => {
        const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
        if (e instanceof HumanEnemy) {
          e.onBarkHeard(dist)
          return
        }
        const countered = (e as any).tryCounter?.('cruella', 'bark') ?? false
        const result = resolveBarkHit({ hp: e.hp, dist, barkRadius: PHYSICS.BARK_RADIUS, countered, isNPC: e.isNPC })
        switch (result.action) {
          case 'counter':
            scene._fx.enemyDeathBurst(e.x, e.y)
            scene._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#22ccff')
            break
          case 'ko':
            e.takeDamage(999)
            scene._fx.enemyDeathBurst(e.x, e.y)
            scene._spawnScorePopup(e.x, e.y - 24, 'KO! +100', '#22ccff')
            gameState.addScore(50) // 'died' event already adds +50; net = +100
            break
          case 'stun':
            e.stun(result.duration)
            scene._fx.barkImpact(e.x, e.y)
            scene._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
            break
          // 'nothing': sem ação
        }
      })
    })

    // Projéteis dos bosses — colidem com chão e danificam jogador
    if (scene._bossProjectileGroup) {
      scene.physics.add.collider(scene._bossProjectileGroup, scene.groundLayer, (proj) => {
        ;(proj as Phaser.Physics.Arcade.Image).destroy()
      })
      playerSprites.forEach(sprite => {
        scene.physics.add.overlap(sprite, scene._bossProjectileGroup!, (_s, proj) => {
          ;(proj as Phaser.Physics.Arcade.Image).destroy()
          scene.player.takeDamage()
          SoundManager.play('damage')
          if (gameState.isDead()) scene._gameOver()
        })
      })
    }

    // Dash de Raya causa dano + verifica counter window
    scene.physics.add.overlap(scene.player.raya, scene.enemyGroup, (_r, enemy) => {
      const e = enemy as Enemy
      if (!scene.player.raya.getIsDashing()) return
      const countered = (e as any).tryCounter?.('raya', 'dash') ?? false
      e.takeDamage(1)
      const result = resolveDashHit({ hpAfterDamage: e.hp, countered })
      switch (result.action) {
        case 'counter':
          scene._fx.enemyDeathBurst(e.x, e.y)
          scene._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#f97316')
          break
        case 'ko':
          scene._spawnScorePopup(e.x, e.y - 20, 'KO! +100', '#f97316')
          gameState.addScore(50) // 'died' event already adds +50; net = +100
          break
        case 'damage':
          scene._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
          if (e.active) scene._enemyHPBar.show(e)
          break
      }
    })
  }
}
```

- [ ] **Step 2: Adicionar import de CollisionSetup em GameScene.ts**

Após `import { BossIntro } from './BossIntro'`, adicionar:

```typescript
import { CollisionSetup } from './CollisionSetup'
```

- [ ] **Step 3: Substituir chamada + remover `_setupCollisions()` de GameScene.ts**

Localizar a chamada `this._setupCollisions()` (em `create()`, após `_spawnItems()`) e substituir por:

```typescript
    CollisionSetup.setup(this)
```

Em seguida, **remover o método `_setupCollisions()` completo** (linha ~559 até ~774, bloco que começa com `private _setupCollisions(): void {` e termina no `}` antes de `private _handleItemCollect`).

- [ ] **Step 4: Build + testes**

```bash
npm run build 2>&1 | grep "error TS" | head -10
npx vitest run 2>&1 | tail -4
```

Esperado: 0 erros TS, 783 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/CollisionSetup.ts src/scenes/GameScene.ts
git commit -m "refactor: extract _setupCollisions into CollisionSetup module"
```

---

## Task 5: Remover _handleItemCollect + limpar imports em GameScene.ts

**Files:**
- Modify: `src/scenes/GameScene.ts`

> Contexto: `_handleItemCollect` era chamado por `_setupCollisions`. Como `_setupCollisions` foi removido e CollisionSetup chama `ItemCollectHandler.handle()` diretamente, `_handleItemCollect` em GameScene está morto. Os imports de `resolveBarkHit/resolveDashHit/resolveStompHit` e `POWERUP_LABEL` também ficaram sem uso.

- [ ] **Step 1: Remover `_handleItemCollect()` de GameScene.ts**

Localizar e remover o método completo `private _handleItemCollect(...)` (bloco de ~67 linhas após `_setupCamera()`).

- [ ] **Step 2: Remover imports não mais usados de GameScene.ts**

Remover da linha de imports de `CombatResolver`:
```typescript
import { resolveBarkHit, resolveDashHit, resolveStompHit } from '../systems/CombatResolver'
```

Na linha de imports de `constants`, remover `POWERUP_LABEL` da lista:
```typescript
// Antes:
import { KEYS, TILE_SIZE, GAME_WIDTH, GAME_HEIGHT, PHYSICS, SCORING, POWERUP_LABEL, WORLD_DIFFICULTY, type WorldDifficulty } from '../constants'
// Depois:
import { KEYS, TILE_SIZE, GAME_WIDTH, GAME_HEIGHT, PHYSICS, SCORING, WORLD_DIFFICULTY, type WorldDifficulty } from '../constants'
```

> ⚠️ Não remover: `PHYSICS` (usado em `_applyUpgrades`), `HumanEnemy` (usado em `_spawnEnemies` e `update()`), `GoldenBone` (usado em `_spawnItems()`).

- [ ] **Step 3: Build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -10
```

Esperado: nenhum erro.

- [ ] **Step 4: Rodar todos os testes**

```bash
npx vitest run 2>&1 | tail -4
```

Esperado: 783 testes passando.

- [ ] **Step 5: Confirmar tamanho final de GameScene.ts**

```bash
wc -l src/scenes/GameScene.ts
```

Esperado: ~780 linhas (antes deste spec: 1094).

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "refactor: remove _handleItemCollect and clean unused imports from GameScene"
```
