# Polimento Visual & Game Feel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o `EffectsManager` com 9 métodos de efeitos visuais e aplicar 7 correções visuais catalogadas, entregando polimento arcade expressivo ao jogo sem lógica de negócio nova.

**Architecture:** A classe `EffectsManager` em `src/fx/EffectsManager.ts` encapsula todos os efeitos visuais via `Graphics` + tweens do Phaser, sem texturas externas. `GameScene` instancia e mantém um `private _fx: EffectsManager` e chama os métodos nos 10 pontos de integração. `Raya.ts` emite dois novos eventos (`'jumped'`, `'landed'`) que `GameScene` escuta. As 7 correções visuais são mudanças pontuais nos arquivos de nível/entidade.

**Tech Stack:** TypeScript, Phaser 3, Vitest (testes unitários existentes via `npm test`)

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/fx/EffectsManager.ts` | **Criar** | 9 métodos de efeito visual via Graphics + tweens |
| `src/entities/Raya.ts` | **Modificar** | Emitir eventos `'jumped'` e `'landed'` |
| `src/scenes/GameScene.ts` | **Modificar** | Instanciar EffectsManager, 10 pontos de integração, delegar `_spawnScorePopup` |
| `src/levels/World0.ts` | **Modificar** | Fix 3: `estante` → `balcao` na fase `0-boss` |
| `src/entities/npc/Hugo.ts` | **Modificar** | Fix 4: `setScale(2)` → `setScale(1.6)` |
| `src/entities/npc/Hannah.ts` | **Modificar** | Fix 4: `setScale(2)` → `setScale(1.6)` |
| `src/levels/World1.ts` | **Modificar** | Fix 6–7: redistribuir decorações de `LEVEL_1_1` |
| `src/background/ParallaxBackground.ts` | **Modificar** | Fix 2: adicionar suporte a `alpha` por camada; ajustar `bg_rua_2` |

---

## Task 1: Criar `src/fx/EffectsManager.ts`

**Files:**
- Create: `src/fx/EffectsManager.ts`

> **Nota:** `EffectsManager` é puramente visual — depende do Phaser em runtime e não tem lógica testável em unit tests. A verificação é feita rodando `npm test` para garantir que nada quebrou, seguida de testes manuais no jogo.

- [ ] **Step 1: Criar a pasta e o arquivo**

```bash
mkdir -p /Users/apple/Desktop/github/game-cruella-e-raya/src/fx
```

Criar `src/fx/EffectsManager.ts` com o conteúdo abaixo:

```typescript
export class EffectsManager {
  constructor(private scene: Phaser.Scene) {}

  /** Poeira nos pés (pulo = 'small', aterrissagem = 'large') */
  dustPuff(x: number, y: number, size: 'small' | 'large' = 'small'): void {
    const count = 5
    const radius = size === 'large' ? 50 : 30
    const duration = 300
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / (count - 1)) * i - Math.PI / 2
      const dist = Phaser.Math.Between(Math.floor(radius * 0.4), radius)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const r = size === 'large' ? Phaser.Math.Between(4, 8) : Phaser.Math.Between(2, 5)
      const color = Phaser.Math.RND.pick([0xaaaaaa, 0xccbbaa, 0x998877])
      const g = this.scene.add.graphics()
      g.fillStyle(color, 0.8)
      g.fillCircle(0, 0, r)
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** Ghost trail: cópia fantasma do sprite durante o dash */
  ghostTrail(sprite: Phaser.Physics.Arcade.Sprite): void {
    const copy = this.scene.add.sprite(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
    copy.setFlipX(sprite.flipX)
    copy.setScale(sprite.scaleX, sprite.scaleY)
    copy.setAlpha(0.4)
    copy.setDepth(sprite.depth - 1)
    this.scene.tweens.add({
      targets: copy,
      alpha: 0,
      duration: 150,
      ease: 'Linear',
      onComplete: () => copy.destroy(),
    })
  }

  /** Burst de partículas laranja/amarelas ao matar inimigo */
  enemyDeathBurst(x: number, y: number): void {
    const colors = [0xff6600, 0xffaa00, 0xffdd00]
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i
      const dist = Phaser.Math.Between(20, 50)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(Phaser.Math.RND.pick(colors), 1)
      g.fillCircle(0, 0, Phaser.Math.Between(3, 7))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 250,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** 4 partículas amarelas ao coletar bone regular */
  boneSpark(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 / 4) * i
      const dist = Phaser.Math.Between(10, 25)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(0xffff00, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(2, 4))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** 8 partículas douradas + flash de câmera ao coletar golden bone */
  goldenBoneBurst(x: number, y: number): void {
    this.scene.cameras.main.flash(80, 255, 215, 0)
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i
      const dist = Phaser.Math.Between(30, 70)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(0xffd700, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(3, 8))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** Score popup animado com bounce (scale 0.5→1.2→1.0 em 120ms, depois sobe e some) */
  scorePopupBounce(text: string, x: number, y: number, color: string = '#ffffff'): void {
    const t = this.scene.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'Arial Black, Arial',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    })
    t.setOrigin(0.5)
    t.setDepth(200)
    t.setScale(0.5)
    // Fase 1: bounce in (0.5 → 1.2 em 80ms)
    this.scene.tweens.add({
      targets: t,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Fase 2: settle (1.2 → 1.0 em 40ms)
        this.scene.tweens.add({
          targets: t,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 40,
          ease: 'Quad.easeIn',
          onComplete: () => {
            // Fase 3: subir e desaparecer (680ms)
            this.scene.tweens.add({
              targets: t,
              y: y - 50,
              alpha: 0,
              duration: 680,
              ease: 'Quad.easeIn',
              onComplete: () => t.destroy(),
            })
          },
        })
      },
    })
  }

  /** 8 partículas brancas em arco ao ativar checkpoint */
  checkpointSparkle(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i - Math.PI / 2
      const dist = Phaser.Math.Between(20, 40)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(0xffffff, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(2, 5))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** 10 partículas coloridas ao coletar power-up (cor por tipo) */
  powerUpBurst(x: number, y: number, type: string): void {
    const colorMap: Record<string, number> = {
      churrasco: 0xff4400,
      pipoca:    0xffff00,
      petisco:   0xff8800,
    }
    const color = colorMap[type] ?? 0x00ccff
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i
      const dist = Phaser.Math.Between(20, 60)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(color, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(3, 7))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 350,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** 4 partículas ciano ao stunar inimigo com bark */
  barkImpact(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 / 4) * i
      const dist = Phaser.Math.Between(10, 20)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(0x00ccff, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(2, 4))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }
}
```

- [ ] **Step 2: Confirmar que o TypeScript compila**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npx tsc --noEmit 2>&1 | head -30
```

Expected: sem erros de compilação.

- [ ] **Step 3: Rodar os testes existentes**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test 2>&1 | tail -20
```

Expected: todos os testes passando (≥49 passing).

- [ ] **Step 4: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/fx/EffectsManager.ts && git commit -m "feat: create EffectsManager with 9 visual effect methods"
```

---

## Task 2: Modificar `src/entities/Raya.ts` — emitir eventos `'jumped'` e `'landed'`

**Files:**
- Modify: `src/entities/Raya.ts`

`Raya` extende `Phaser.Physics.Arcade.Sprite`, que por sua vez extende `Phaser.GameObjects.GameObject`, o qual já tem `EventEmitter`. Basta chamar `this.emit(...)`.

- [ ] **Step 1: Adicionar emit de 'jumped' no bloco de pulo**

Em `src/entities/Raya.ts`, o bloco de pulo está em torno das linhas 62–68:

```typescript
if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.jumpsLeft > 0) {
  const jumpVel = gameState.hasPowerUp('pipoca', this.scene.time.now)
    ? PHYSICS.JUMP_VELOCITY * 1.45
    : PHYSICS.JUMP_VELOCITY
  this.setVelocityY(jumpVel)
  this.jumpsLeft--
  SoundManager.play(this.jumpsLeft === 0 ? 'doubleJump' : 'jump')
}
```

Adicionar `this.emit('jumped')` logo após `SoundManager.play(...)`:

```typescript
if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.jumpsLeft > 0) {
  const jumpVel = gameState.hasPowerUp('pipoca', this.scene.time.now)
    ? PHYSICS.JUMP_VELOCITY * 1.45
    : PHYSICS.JUMP_VELOCITY
  this.setVelocityY(jumpVel)
  this.jumpsLeft--
  SoundManager.play(this.jumpsLeft === 0 ? 'doubleJump' : 'jump')
  this.emit('jumped')
}
```

- [ ] **Step 2: Adicionar emit de 'landed' no bloco de aterrissagem**

Em `src/entities/Raya.ts`, o bloco de detecção de aterrissagem está em torno das linhas 39–48:

```typescript
const body = this.body as Phaser.Physics.Arcade.Body
const onGround = body.blocked.down

// Edge detection: just landed → reset double jump
if (onGround && !this.wasGrounded) {
  this.jumpsLeft = 2
}
this.wasGrounded = onGround
```

Adicionar `this.emit('landed')` dentro do `if (onGround && !this.wasGrounded)`:

```typescript
const body = this.body as Phaser.Physics.Arcade.Body
const onGround = body.blocked.down

// Edge detection: just landed → reset double jump
if (onGround && !this.wasGrounded) {
  this.jumpsLeft = 2
  this.emit('landed')
}
this.wasGrounded = onGround
```

- [ ] **Step 3: Confirmar que o TypeScript compila**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros.

- [ ] **Step 4: Rodar os testes**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test 2>&1 | tail -10
```

Expected: todos passando.

- [ ] **Step 5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/entities/Raya.ts && git commit -m "feat: Raya emits 'jumped' and 'landed' events"
```

---

## Task 3: Instanciar EffectsManager em `GameScene.ts` + ghost trail + dust events

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Adicionar o import do EffectsManager**

No topo de `src/scenes/GameScene.ts`, após os outros imports, adicionar:

```typescript
import { EffectsManager } from '../fx/EffectsManager'
```

- [ ] **Step 2: Adicionar campo privado `_fx` e `_lastTrailAt`**

Na seção de campos privados da classe (ao redor das linhas 27–43), adicionar:

```typescript
private _fx!: EffectsManager
private _lastTrailAt: number = 0
```

- [ ] **Step 3: Instanciar EffectsManager em `create()`**

Em `create()`, logo após a linha que instancia `_parallax` (em torno da linha 64):

```typescript
this._parallax = new ParallaxBackground(this, this.currentLevel.backgroundTheme)
```

Adicionar logo abaixo:

```typescript
this._fx = new EffectsManager(this)
```

- [ ] **Step 4: Adicionar ghost trail em `update()`**

No final do método `update()` (após o `enemies.forEach`), adicionar:

```typescript
// Ghost trail no dash
if (this.player.raya.getIsDashing()) {
  const now = this.time.now
  if (now - this._lastTrailAt >= 80) {
    this._fx.ghostTrail(this.player.raya)
    this._lastTrailAt = now
  }
}
```

- [ ] **Step 5: Ouvir eventos 'jumped' e 'landed' da Raya em `create()`**

Em `create()`, após a linha que instancia `this._fx`, adicionar os listeners (a posição exata não importa, apenas que esteja após o player ser criado):

```typescript
// Efeitos de dust no pulo e aterrissagem
this.player.raya.on('jumped', () => {
  const body = this.player.raya.body as Phaser.Physics.Arcade.Body
  this._fx.dustPuff(this.player.raya.x, body.bottom, 'small')
})
this.player.raya.on('landed', () => {
  const body = this.player.raya.body as Phaser.Physics.Arcade.Body
  this._fx.dustPuff(this.player.raya.x, body.bottom, 'large')
})
```

> **Onde o player é criado?** Buscar em `GameScene.ts` por `new Player(` ou `_buildPlayer` — os listeners devem ser registrados após essa criação. Se houver um método separado de setup do player, adicionar no final desse método.

- [ ] **Step 6: Compilar e testar**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npx tsc --noEmit 2>&1 | head -20 && npm test 2>&1 | tail -10
```

Expected: sem erros de compilação, todos os testes passando.

- [ ] **Step 7: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/GameScene.ts && git commit -m "feat: wire EffectsManager — ghost trail and dust puff effects"
```

---

## Task 4: Score popups animados + particle effects para inimigos e bones

**Files:**
- Modify: `src/scenes/GameScene.ts`

A estratégia: fazer `_spawnScorePopup` delegar para `_fx.scorePopupBounce` (todos os popups ficam com bounce automaticamente) e adicionar partículas nas coletas específicas.

- [ ] **Step 1: Atualizar `_spawnScorePopup` para delegar ao EffectsManager**

Localizar o método `_spawnScorePopup` em `GameScene.ts` (em torno da linha 227). Substituir o corpo inteiro pelo delegate:

```typescript
private _spawnScorePopup(x: number, y: number, text: string, color: string = '#ffffff'): void {
  this._fx.scorePopupBounce(text, x, y, color)
}
```

> Todos os `this._spawnScorePopup(...)` existentes passam a usar o novo popup com bounce automaticamente — não é necessário mudar nenhuma chamada existente.

- [ ] **Step 2: Adicionar `enemyDeathBurst` em cada handler de 'died'**

Há 4 locais onde inimigos morrem (verificar linha exata com grep). Em cada handler `enemy.on('died', ...)`, adicionar `this._fx.enemyDeathBurst(e.x, e.y)`:

**Location 1 — inimigos regulares** (em torno da linha 281):
```typescript
enemy.on('died', (e: Enemy) => {
  gameState.addScore(50)
  gameState.sessionEnemiesKilled++
  this._fx.enemyDeathBurst(e.x, e.y)          // ← adicionar
  this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
})
```

**Location 2 — boss Aspirador** (em torno da linha 308):
```typescript
boss.on('died', (b: Enemy) => {
  gameState.addScore(500)
  gameState.sessionEnemiesKilled++
  this._fx.enemyDeathBurst(b.x, b.y)          // ← adicionar
  this._spawnScorePopup(b.x, b.y - 30, '+500', '#22ccff')
  // ... resto do código existente
})
```

**Location 3 — boss Seu Bigodes** (em torno da linha 330):
```typescript
boss.on('died', (b: Enemy) => {
  gameState.addScore(1000)
  gameState.sessionEnemiesKilled++
  gameState.collarOfGold = true
  this._fx.enemyDeathBurst(b.x, b.y)          // ← adicionar
  this._spawnScorePopup(b.x, b.y - 30, '+1000', '#22c55e')
  this._levelComplete()
})
```

**Location 4 — minions do Seu Bigodes** (em torno da linha 341):
```typescript
minion.on('died', (e: Enemy) => {
  gameState.addScore(SCORING.ENEMY_KILL)
  gameState.sessionEnemiesKilled++
  this._fx.enemyDeathBurst(e.x, e.y)          // ← adicionar
  this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
})
```

- [ ] **Step 3: Adicionar `boneSpark` e `goldenBoneBurst` no handler de itens**

Localizar o `switch` de coleta de itens em `GameScene.ts` (método `_handleItemCollect` ou similar, em torno das linhas 564–574).

**Case 'bone'** — adicionar `boneSpark`:
```typescript
case 'bone':
  gameState.addScore(10)
  SoundManager.play('collectBone')
  this._fx.boneSpark(item.x, item.y)           // ← adicionar
  this._spawnScorePopup(item.x, item.y - 16, '+10', '#ffff00')
  break
```

> Nota: a chamada original era `this._spawnScorePopup(item.x, item.y - 16, '+10')` sem cor — adicionar `'#ffff00'` para ossos regulares ficarem amarelos.

**Case 'golden_bone'** — adicionar `goldenBoneBurst`:
```typescript
case 'golden_bone':
  gameState.collectGoldenBone(gameState.currentLevel, (item as GoldenBone).boneIndex)
  gameState.addScore(500)
  SoundManager.play('collectGolden')
  this._fx.goldenBoneBurst(item.x, item.y)     // ← adicionar
  this._spawnScorePopup(item.x, item.y - 16, '+500', '#ffd700')
  break
```

- [ ] **Step 4: Adicionar `barkImpact` no handler do bark**

Localizar o handler `this.player.cruella.on('bark', ...)` (em torno da linha 505). No loop que aplica stun aos inimigos, adicionar `this._fx.barkImpact(e.x, e.y)`:

```typescript
;(this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
  const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
  if (dist <= PHYSICS.BARK_RADIUS) {
    e.stun(2000)
    this._fx.barkImpact(e.x, e.y)             // ← adicionar
    this._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
  }
})
```

- [ ] **Step 5: Compilar e testar**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npx tsc --noEmit 2>&1 | head -20 && npm test 2>&1 | tail -10
```

Expected: sem erros de compilação, todos os testes passando.

- [ ] **Step 6: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/GameScene.ts && git commit -m "feat: wire score popup bounce, enemy death burst, bone spark, bark impact"
```

---

## Task 5: Checkpoint sparkle + power-up burst em `GameScene.ts`

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Adicionar `checkpointSparkle` no handler de checkpoint**

Localizar o `case 'checkpoint':` no switch de itens (em torno da linha 551):

```typescript
case 'checkpoint':
  if (!gameState.checkpointReached) {
    gameState.setCheckpoint(item.x, item.y)
    SoundManager.play('checkpoint')
    this._fx.checkpointSparkle(item.x, item.y)  // ← adicionar
  }
  return // don't destroy
```

- [ ] **Step 2: Adicionar `powerUpBurst` no handler de power-up**

Localizar o `default:` do switch (em torno da linha 575), que trata todos os power-ups:

```typescript
default:
  gameState.applyPowerUp(type, now)
  SoundManager.play('powerUp')
  this._fx.powerUpBurst(this.player.x, this.player.y, type)  // ← adicionar
  this._spawnScorePopup(item.x, item.y - 16, '✨', '#00ffff')
```

> `this.player.x / this.player.y` acessa a posição do player ativo. Se `player` tiver uma propriedade `x` direta, use-a; caso contrário, use `this.player.raya.x` ou o sprite ativo dependendo do personagem atual.

- [ ] **Step 3: Compilar e testar**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npx tsc --noEmit 2>&1 | head -20 && npm test 2>&1 | tail -10
```

Expected: sem erros, testes passando.

- [ ] **Step 4: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/GameScene.ts && git commit -m "feat: add checkpoint sparkle and power-up burst effects"
```

---

## Task 6: Fix 3 — `World0.ts`: substituir `estante` por `balcao`

**Files:**
- Modify: `src/levels/World0.ts`

- [ ] **Step 1: Localizar e substituir**

Em `src/levels/World0.ts`, linha ~63:

```typescript
// ANTES:
{ type: 'estante', x: 800,  y: G, blocking: true },

// DEPOIS:
{ type: 'balcao',  x: 800,  y: G, blocking: true },
```

Usar o Edit tool para fazer a troca exata.

- [ ] **Step 2: Compilar e testar**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npx tsc --noEmit 2>&1 | head -10 && npm test 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/levels/World0.ts && git commit -m "fix: replace estante with balcao in 0-boss kitchen (Fix 3)"
```

---

## Task 7: Fix 4 — Hugo.ts e Hannah.ts: scale 2.0 → 1.6

**Files:**
- Modify: `src/entities/npc/Hugo.ts`
- Modify: `src/entities/npc/Hannah.ts`

- [ ] **Step 1: Atualizar Hugo.ts**

Em `src/entities/npc/Hugo.ts`, linha ~17:

```typescript
// ANTES:
this.setScale(2)

// DEPOIS:
this.setScale(1.6)
```

- [ ] **Step 2: Atualizar Hannah.ts**

Em `src/entities/npc/Hannah.ts`, linha ~17:

```typescript
// ANTES:
this.setScale(2)

// DEPOIS:
this.setScale(1.6)
```

- [ ] **Step 3: Compilar e testar**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npx tsc --noEmit 2>&1 | head -10 && npm test 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/entities/npc/Hugo.ts src/entities/npc/Hannah.ts && git commit -m "fix: reduce Hugo and Hannah NPC scale from 2.0 to 1.6 (Fix 4)"
```

---

## Task 8: Fix 6-7 — `World1.ts`: redistribuir decorações de LEVEL_1_1

**Files:**
- Modify: `src/levels/World1.ts`

> **Pré-condição:** Verificar se os sprites `banco` e `banca` existem no atlas do jogo antes de usar. Buscar por essas chaves nos arquivos de asset/constantes (`src/constants.ts`, arquivos de atlas JSON). Se não existirem, substituir por `petshop` e `placa` (tipos conhecidos).

- [ ] **Step 1: Verificar se `banco` e `banca` existem**

```bash
grep -r "'banco'\|'banca'\|\"banco\"\|\"banca\"" /Users/apple/Desktop/github/game-cruella-e-raya/src/constants.ts /Users/apple/Desktop/github/game-cruella-e-raya/public 2>/dev/null | head -20
```

- Se encontrados: usar `banco` e `banca` como no spec.
- Se não encontrados: usar `petshop` e `placa` como substitutos seguros.

- [ ] **Step 2: Atualizar a array de decorações de LEVEL_1_1**

Em `src/levels/World1.ts`, a array atual (linhas ~45–55):

```typescript
// ANTES:
decorations: [
  { type: 'loja',    x: 180,  y: G },
  { type: 'poste',   x: 480,  y: G },
  { type: 'arvore',  x: 700,  y: G },
  { type: 'casa',    x: 950,  y: G },
  { type: 'lixeira', x: 1200, y: G },
  { type: 'loja',    x: 1500, y: G },
  { type: 'arvore',  x: 1750, y: G },
  { type: 'poste',   x: 2050, y: G },
  { type: 'lixeira', x: 2300, y: G },
],
```

Substituir por (usando `banco`/`banca` se disponíveis, ou `petshop`/`placa` caso contrário):

```typescript
// DEPOIS (com banco/banca — trocar por petshop/placa se não existirem):
decorations: [
  { type: 'loja',    x: 180,  y: G },
  { type: 'poste',   x: 420,  y: G },
  { type: 'banco',   x: 620,  y: G },   // novo (ou 'petshop')
  { type: 'arvore',  x: 850,  y: G },
  { type: 'casa',    x: 1100, y: G },
  { type: 'lixeira', x: 1300, y: G },
  { type: 'banca',   x: 1500, y: G },   // novo (ou 'placa')
  { type: 'loja',    x: 1720, y: G },
  { type: 'arvore',  x: 1950, y: G },
  { type: 'poste',   x: 2150, y: G },
  { type: 'lixeira', x: 2350, y: G },
],
```

- [ ] **Step 3: Compilar e testar**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npx tsc --noEmit 2>&1 | head -10 && npm test 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/levels/World1.ts && git commit -m "fix: redistribute LEVEL_1_1 decorations for visual variety (Fix 6-7)"
```

---

## Task 9: Fix 1 — Verificar intro do boss Aspirador (já implementado)

**Files:**
- Verify: `src/scenes/GameScene.ts`

> **Nota:** A inspeção do código mostrou que o Fix 1 já está implementado corretamente (header `'💨 ASPIRADOR 3000 💨'`, fade-in 300ms, duração 3000ms, fade-out 400ms). Esta task é apenas de verificação.

- [ ] **Step 1: Confirmar que o código existe**

```bash
grep -n "ASPIRADOR 3000" /Users/apple/Desktop/github/game-cruella-e-raya/src/scenes/GameScene.ts
```

Expected: encontrar a linha com `'💨 ASPIRADOR 3000 💨'`.

- [ ] **Step 2: Verificar os timings**

```bash
grep -A 30 "ASPIRADOR 3000" /Users/apple/Desktop/github/game-cruella-e-raya/src/scenes/GameScene.ts | head -35
```

Confirmar:
- `duration: 300` no fade-in
- `delayedCall(3000, ...)` para o fade-out
- `duration: 400` no fade-out

Se qualquer timing estiver diferente, corrigir para os valores acima.

- [ ] **Step 3: Commit (só se houver correção)**

```bash
# Apenas se houve mudança:
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/GameScene.ts && git commit -m "fix: correct Aspirador boss intro timing and fade (Fix 1)"
```

---

## Task 10: Fix 2 — Parallax bg_rua_3: adicionar suporte a `alpha` por camada

**Files:**
- Modify: `src/background/ParallaxBackground.ts`

O layer `bg_rua_2` (casas/árvores mid-ground) deve ter alpha 0.7 para criar separação visual. O layer `bg_rua_3` (near, com o carro) pode ter seu `y` ajustado se o carro estiver flutuando.

- [ ] **Step 1: Inspecionar a estrutura de `LayerConfig` e `TileSprite` setup**

```bash
cat -n /Users/apple/Desktop/github/game-cruella-e-raya/src/background/ParallaxBackground.ts | head -80
```

Confirmar:
- Como os TileSprites são criados (método `create` ou no construtor)
- Se `LayerConfig` já tem campo `alpha`

- [ ] **Step 2: Adicionar campo `alpha` opcional em `LayerConfig`**

Localizar a interface/type `LayerConfig` no arquivo. Adicionar `alpha?: number`:

```typescript
// ANTES (exemplo):
interface LayerConfig {
  key: string
  speed: number
  y: number
  height: number
}

// DEPOIS:
interface LayerConfig {
  key: string
  speed: number
  y: number
  height: number
  alpha?: number
}
```

- [ ] **Step 3: Aplicar alpha ao criar o TileSprite**

No código que instancia os TileSprites (dentro do construtor ou método `create`), após criar cada sprite, aplicar o alpha se definido. Exemplo:

```typescript
// Onde o TileSprite é criado, algo como:
const tile = scene.add.tileSprite(0, config.y, width, config.height, config.key)
// Adicionar após a criação:
if (config.alpha !== undefined) {
  tile.setAlpha(config.alpha)
}
```

- [ ] **Step 4: Atualizar `THEME_LAYERS` para o tema `rua`**

Localizar `THEME_LAYERS` no arquivo. Atualizar o tema `rua`:

```typescript
rua: [
  { key: KEYS.BG_RUA_1, speed: 0.05, y: 0, height: 450 },
  { key: KEYS.BG_RUA_2, speed: 0.2,  y: 0, height: 450, alpha: 0.7 },  // ← alpha 0.7
  { key: KEYS.BG_RUA_3, speed: 0.5,  y: 0, height: 450 },
],
```

> **Nota sobre o carro flutuando:** Se após o alpha fix o carro ainda parecer flutuando, ajustar o `y` do `BG_RUA_3` para um valor positivo (ex: `y: 40`) para shiftar a camada para baixo. Isso é um ajuste visual — testar em jogo para calibrar o valor correto.

- [ ] **Step 5: Compilar e testar**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npx tsc --noEmit 2>&1 | head -20 && npm test 2>&1 | tail -10
```

Expected: sem erros de compilação, testes passando.

- [ ] **Step 6: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/background/ParallaxBackground.ts && git commit -m "fix: add per-layer alpha support; reduce bg_rua_2 opacity for depth (Fix 2)"
```

---

## Task 11: Fix 5 — Verificar nome da fase no HUD (já implementado)

**Files:**
- Verify: `src/scenes/UIScene.ts`, `src/scenes/GameScene.ts`

> **Nota:** Fix 5 está marcado na spec como "Já implementado". Esta task é apenas verificação.

- [ ] **Step 1: Confirmar que UIScene escuta o evento 'level-name'**

```bash
grep -n "level-name" /Users/apple/Desktop/github/game-cruella-e-raya/src/scenes/UIScene.ts /Users/apple/Desktop/github/game-cruella-e-raya/src/scenes/GameScene.ts
```

Expected: UIScene tem `on('level-name', ...)` e GameScene tem `emit('level-name', ...)`.

- [ ] **Step 2: Teste manual no jogo**

Iniciar qualquer fase e confirmar que o nome da fase aparece no HUD no início do nível (ex: "Fase 1-1", "Parque do Bairro", etc.). Verificar fases `0-1`, `1-1` e `0-boss`.

Se o nome não aparecer, inspecionar se `GameScene.ts` emite o evento após `create()`:
```bash
grep -n "emit.*level-name\|level-name.*emit" /Users/apple/Desktop/github/game-cruella-e-raya/src/scenes/GameScene.ts
```

---

## Checklist de Testes Manuais

Após completar todas as tasks, verificar cada item no jogo:

- [ ] 1. Dash da Raya → ghost trail visível por ~150ms (cópias desvanecendo atrás)
- [ ] 2. Pulo → poeira pequena nos pés ao sair do chão
- [ ] 3. Aterrissagem → poeira maior ao tocar o chão
- [ ] 4. Matar inimigo → burst laranja/amarelo + popup com bounce
- [ ] 5. Coletar bone → sparkle amarelo + popup com bounce
- [ ] 6. Coletar golden bone → burst dourado + flash de câmera amarelo
- [ ] 7. Bark da Cruella → mini-burst ciano em cada inimigo stunado
- [ ] 8. Checkpoint → sparkle branco em arco
- [ ] 9. Coletar power-up → burst colorido saindo do player
- [ ] 10. Boss Aspirador (fase 0-boss) → header "💨 ASPIRADOR 3000 💨" aparece com fade, fica 3s, faz fade-out
- [ ] 11. Fase 1-1 → decorações com nova distribuição (banco/banca ou petshop/placa)
- [ ] 12. Fase 1-x → camada mid-ground (casas/árvores) aparece ligeiramente transparente vs. foreground
