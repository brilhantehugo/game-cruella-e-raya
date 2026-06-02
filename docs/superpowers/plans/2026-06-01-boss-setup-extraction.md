# BossSetup Extraction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover os 4 blocos de scripting de boss (~230 linhas) de `GameScene._spawnEnemies()` para um novo módulo `src/scenes/BossSetup.ts`, sem alterar comportamento.

**Architecture:** Refactoring puro em 3 passos: (1) relaxar modificadores `private` nos membros de GameScene que BossSetup precisa acessar, (2) criar `BossSetup.ts` com os 4 métodos de setup, (3) substituir o bloco `if/else` de boss em GameScene por uma única chamada `BossSetup.setup(this, id)` e remover imports não mais usados.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## Estrutura de arquivos

| Arquivo | Mudança |
|---|---|
| `src/scenes/GameScene.ts` | Relaxar `private` em 13 membros; substituir bloco boss; remover 5 imports; adicionar 1 import |
| `src/scenes/BossSetup.ts` | **Criar** — classe estática com dispatch + 4 métodos de setup |

---

## Task 1: Relaxar modificadores `private` em GameScene.ts

**Files:**
- Modify: `src/scenes/GameScene.ts` (linhas 38–82, 296, 1046)

> **Contexto:** BossSetup.ts precisará acessar membros de GameScene que atualmente são `private`. Em TypeScript não existe `friend class`, então a solução é remover o modificador `private` e documentar com comentário `/*internal*/`. A convenção de underline (`_`) já sinaliza "não tocar de fora".

- [ ] **Step 1: Remover `private` dos campos na classe GameScene**

Localizar o bloco de propriedades (linhas 38–81) e substituir `private` por `/*internal*/` nos seguintes campos. **Alterar apenas esses — não tocar nos demais:**

```typescript
  /*internal*/ player!: Player
  /*internal*/ enemyGroup!: Phaser.Physics.Arcade.Group
  /*internal*/ currentLevel!: LevelData
  /*internal*/ _bossExit: Phaser.Physics.Arcade.Image | null = null
  /*internal*/ _bossProjectileGroup: Phaser.Physics.Arcade.Group | null = null
  /*internal*/ _fx!: EffectsManager
  /*internal*/ _am?: AchievementManager
  /*internal*/ _bossStartTime = 0
  /*internal*/ _livesAtBossStart = 0
  /*internal*/ _killCountInLevel = 0
  /*internal*/ _mainBoss: Enemy | null = null
```

Os demais campos (`groundLayer`, `platformLayer`, `_parallax`, etc.) continuam `private`.

- [ ] **Step 2: Remover `private` dos dois métodos**

Localizar `private _spawnScorePopup` e `private _levelComplete` no arquivo e trocar por `/*internal*/`:

```typescript
  /*internal*/ _spawnScorePopup(x: number, y: number, text: string, color: string = '#ffffff'): void {
```

```typescript
  /*internal*/ _levelComplete(): void {
```

- [ ] **Step 3: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Esperado: nenhuma linha de saída (sem erros de tipo).

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "refactor: relax private modifiers on GameScene members needed by BossSetup"
```

---

## Task 2: Criar `src/scenes/BossSetup.ts`

**Files:**
- Create: `src/scenes/BossSetup.ts`

> **Contexto:** Este arquivo contém exatamente o código que será removido de `GameScene._spawnEnemies()`. Cada método privado corresponde a um boss. O `import type { GameScene }` evita dependência circular em runtime.

- [ ] **Step 1: Criar o arquivo com o conteúdo completo**

Criar `/Users/apple/Desktop/github/game-cruella-e-raya/src/scenes/BossSetup.ts`:

```typescript
import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT, SCORING } from '../constants'
import { gameState } from '../GameState'
import { Enemy } from '../entities/Enemy'
import { ZeladorBoss } from '../entities/enemies/ZeladorBoss'
import { Zelador } from '../entities/enemies/Zelador'
import { SeuBigodes } from '../entities/enemies/SeuBigodes'
import { Drone } from '../entities/enemies/Drone'
import { SegurancaMoto } from '../entities/enemies/SegurancaMoto'
import type { GameScene } from './GameScene'

export class BossSetup {
  /** Configura o boss principal da fase. Chamado por GameScene._spawnEnemies(). */
  static setup(scene: GameScene, levelId: string): void {
    switch (levelId) {
      case '0-boss': BossSetup._setup0Boss(scene); break
      case '1-boss': BossSetup._setup1Boss(scene); break
      case '2-boss': BossSetup._setup2Boss(scene); break
      case '3-boss': BossSetup._setup3Boss(scene); break
    }
  }

  // ── ZeladorBoss ──────────────────────────────────────────────────────────────
  private static _setup0Boss(scene: GameScene): void {
    const mapWidth = scene.currentLevel.tileWidthCols * 32
    scene._bossStartTime = scene.time.now
    scene._livesAtBossStart = gameState.hearts
    const boss = new ZeladorBoss(scene, mapWidth / 2, 376)
    scene.enemyGroup.add(boss)
    boss.setVisible(false)
    ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
    scene._mainBoss = boss

    scene._bossProjectileGroup = scene.physics.add.group()

    boss.on('spawnChave', (data: { x: number; y: number; vx: number; vy: number }) => {
      if (!scene._bossProjectileGroup || !scene.scene.isActive(KEYS.GAME)) return
      const chave = scene.physics.add.image(data.x, data.y, KEYS.CHAVE)
      chave.setDepth(5)
      const body = chave.body as Phaser.Physics.Arcade.Body
      body.setVelocity(data.vx, data.vy)
      scene._bossProjectileGroup.add(chave)
      scene.time.delayedCall(4000, () => { if (chave.active) chave.destroy() })
    })

    boss.on('spawnMinion', (data: { x: number; y: number }) => {
      const minion = new Zelador(scene, data.x, data.y)
      scene.enemyGroup.add(minion)
      minion.on('died', (e: Enemy) => {
        gameState.addScore(SCORING.ENEMY_KILL)
        gameState.sessionEnemiesKilled++
        scene._am?.notify('enemy_killed')
        scene._killCountInLevel++
        scene._fx.enemyDeathBurst(e.x, e.y)
        scene._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
      })
    })

    boss.on('died', (b: Enemy) => {
      gameState.addScore(1000)
      gameState.sessionEnemiesKilled++
      scene._am?.notify('boss_defeated', {
        levelId: scene.currentLevel.id,
        fightDurationMs: scene.time.now - scene._bossStartTime,
        damageTaken: scene._livesAtBossStart - gameState.hearts,
        playerHpFull: gameState.hearts >= 3,
      })
      scene._fx.enemyDeathBurst(b.x, b.y)
      scene._spawnScorePopup(b.x, b.y - 30, '+1000', '#22ccff')
      if (scene._bossExit) {
        scene._bossExit.setVisible(true)
        ;(scene._bossExit.body as Phaser.Physics.Arcade.StaticBody).enable = true
        scene._bossExit.refreshBody()
        scene.cameras.main.shake(200, 0.006)
      }
      const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
        '✓ Caminho livre! Vá para a saída!', {
        fontSize: '18px', color: '#22ffcc', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3,
        backgroundColor: '#000000aa', padding: { x: 14, y: 8 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)
      scene.tweens.add({ targets: msg, alpha: 1, duration: 300 })
      scene.time.delayedCall(3000, () => {
        if (msg.active) scene.tweens.add({ targets: msg, alpha: 0, duration: 500,
          onComplete: () => { if (msg.active) msg.destroy() } })
      })
    })

    scene.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (boss.active && scene.player) boss.setPlayerPos(scene.player.x, scene.player.y)
      },
    })
  }

  // ── SeuBigodes ───────────────────────────────────────────────────────────────
  private static _setup1Boss(scene: GameScene): void {
    scene._bossStartTime = scene.time.now
    scene._livesAtBossStart = gameState.hearts
    const boss = new SeuBigodes(scene, 480, 376)
    scene.enemyGroup.add(boss)
    boss.setVisible(false)
    ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
    scene._mainBoss = boss

    boss.on('died', (b: Enemy) => {
      gameState.addScore(1000)
      gameState.sessionEnemiesKilled++
      scene._am?.notify('boss_defeated', {
        levelId: scene.currentLevel.id,
        fightDurationMs: scene.time.now - scene._bossStartTime,
        damageTaken: scene._livesAtBossStart - gameState.hearts,
        playerHpFull: gameState.hearts >= 3,
      })
      gameState.collarOfGold = true
      scene._fx.enemyDeathBurst(b.x, b.y)
      scene._spawnScorePopup(b.x, b.y - 30, '+1000', '#22c55e')
      scene._levelComplete()
    })

    boss.on('spawnMinion', (minion: Enemy) => {
      scene.enemyGroup.add(minion)
      minion.on('died', (e: Enemy) => {
        gameState.addScore(SCORING.ENEMY_KILL)
        gameState.sessionEnemiesKilled++
        scene._am?.notify('enemy_killed')
        scene._killCountInLevel++
        scene._fx.enemyDeathBurst(e.x, e.y)
        scene._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
      })
    })
  }

  // ── Drone ────────────────────────────────────────────────────────────────────
  private static _setup2Boss(scene: GameScene): void {
    const mapWidth = scene.currentLevel.tileWidthCols * 32
    scene._bossStartTime = scene.time.now
    scene._livesAtBossStart = gameState.hearts
    const boss = new Drone(scene, mapWidth / 2, 180)
    scene.enemyGroup.add(boss)
    boss.setVisible(false)
    ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
    scene._mainBoss = boss

    scene._bossProjectileGroup = scene.physics.add.group()

    boss.on('spawnBomb', (data: { x: number; y: number; vx: number; vy: number }) => {
      if (!scene._bossProjectileGroup || !scene.scene.isActive(KEYS.GAME)) return
      const bomb = scene.physics.add.image(data.x, data.y, KEYS.BOMB)
      bomb.setDepth(5)
      const body = bomb.body as Phaser.Physics.Arcade.Body
      body.setVelocity(data.vx, data.vy)
      // gravidade normal → projétil cai em parábola
      scene._bossProjectileGroup.add(bomb)
      scene.time.delayedCall(4000, () => { if (bomb.active) bomb.destroy() })
    })

    boss.on('spawnLaser', (data: { x: number; y: number; vx: number; vy: number }) => {
      if (!scene._bossProjectileGroup || !scene.scene.isActive(KEYS.GAME)) return
      const laser = scene.physics.add.image(data.x, data.y, KEYS.LASER)
      laser.setDepth(5)
      const body = laser.body as Phaser.Physics.Arcade.Body
      body.setVelocity(data.vx, data.vy)
      body.setGravityY(-800)   // tiro reto horizontal
      scene._bossProjectileGroup.add(laser)
      scene.time.delayedCall(3000, () => { if (laser.active) laser.destroy() })
    })

    boss.on('died', (b: Enemy) => {
      gameState.addScore(500)
      gameState.sessionEnemiesKilled++
      scene._am?.notify('boss_defeated', {
        levelId: scene.currentLevel.id,
        fightDurationMs: scene.time.now - scene._bossStartTime,
        damageTaken: scene._livesAtBossStart - gameState.hearts,
        playerHpFull: gameState.hearts >= 3,
      })
      scene._fx.enemyDeathBurst(b.x, b.y)
      scene._spawnScorePopup(b.x, b.y - 30, '+500', '#ff4444')
      scene._levelComplete()
    })

    scene.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (boss.active && scene.player) boss.setPlayerPos(scene.player.x, scene.player.y)
      },
    })
  }

  // ── SegurancaMoto ────────────────────────────────────────────────────────────
  private static _setup3Boss(scene: GameScene): void {
    const mapWidth = scene.currentLevel.tileWidthCols * 32
    scene._bossStartTime = scene.time.now
    scene._livesAtBossStart = gameState.hearts
    const boss = new SegurancaMoto(scene, mapWidth - 100, 352)
    scene.enemyGroup.add(boss)
    boss.setVisible(false)
    ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
    scene._mainBoss = boss

    if (!scene._bossProjectileGroup) scene._bossProjectileGroup = scene.physics.add.group()

    boss.on('died', (b: Enemy) => {
      gameState.addScore(1000)
      gameState.sessionEnemiesKilled++
      scene._am?.notify('boss_defeated', {
        levelId: scene.currentLevel.id,
        fightDurationMs: scene.time.now - scene._bossStartTime,
        damageTaken: scene._livesAtBossStart - gameState.hearts,
        playerHpFull: gameState.hearts >= 3,
      })
      scene._fx.enemyDeathBurst(b.x, b.y)
      scene._spawnScorePopup(b.x, b.y - 30, '+1000', '#22ccff')
      if (scene._bossExit) {
        scene._bossExit.setVisible(true)
        ;(scene._bossExit.body as Phaser.Physics.Arcade.StaticBody).enable = true
        scene._bossExit.refreshBody()
        scene.cameras.main.shake(200, 0.006)
      }
    })

    scene.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (boss.active && scene.player) boss.setPlayerPos(scene.player.x, scene.player.y)
      },
    })
  }
}
```

- [ ] **Step 2: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Esperado: nenhuma linha de saída.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BossSetup.ts
git commit -m "feat: add BossSetup module with 4 boss setup methods"
```

---

## Task 3: Substituir bloco boss em GameScene.ts + limpar imports

**Files:**
- Modify: `src/scenes/GameScene.ts`

> **Contexto:** Este task finaliza o refactoring: adiciona o import de BossSetup, substitui as ~230 linhas do bloco `if/else if` por uma linha, e remove os 5 imports de bosses que agora vivem em BossSetup.ts.

- [ ] **Step 1: Adicionar import de BossSetup no topo de GameScene.ts**

No bloco de imports (após linha 35, junto dos outros imports de `../fx/` e `../systems/`):

```typescript
import { BossSetup } from './BossSetup'
```

- [ ] **Step 2: Remover os 5 imports de boss que migram para BossSetup.ts**

Localizar e remover estas linhas de import em `GameScene.ts`:

```typescript
import { SeuBigodes } from '../entities/enemies/SeuBigodes'
import { SegurancaMoto } from '../entities/enemies/SegurancaMoto'
import { Drone } from '../entities/enemies/Drone'
import { ZeladorBoss } from '../entities/enemies/ZeladorBoss'
import { Zelador } from '../entities/enemies/Zelador'
```

> **Atenção:** `Porteiro` **não** deve ser removido — o handler de `spawnChave` do Porteiro permanece em GameScene (linhas 449–459, dentro do loop regular de inimigos). Apenas os 5 listados acima migram.

- [ ] **Step 3: Substituir o bloco boss em `_spawnEnemies()`**

Localizar o bloco (começa em `if (this.currentLevel.isBossLevel) {`, linha ~471, termina no `}` que fecha esse if por volta da linha 668). Substituir **todo esse bloco** por:

```typescript
    if (this.currentLevel.isBossLevel) {
      BossSetup.setup(this, this.currentLevel.id)
    }
```

- [ ] **Step 4: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Esperado: nenhuma linha de saída.

- [ ] **Step 5: Rodar todos os testes**

```bash
npx vitest run
```

Esperado: 783 testes passam (mesmo número de antes — refactoring puro).

- [ ] **Step 6: Confirmar tamanho de GameScene.ts**

```bash
wc -l src/scenes/GameScene.ts
```

Esperado: ~1060 linhas (antes: 1287 — redução de ~227 linhas).

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "refactor: move boss scripting out of GameScene into BossSetup"
```
