# Spec A — Expansão dos Mundos 0, 1 e 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir Mundos 0, 1 e 2 para 5+ fases normais + 1 boss cada; adicionar mini-boss mid-level (Wall-E em 0-1), novo boss Zelador do Prédio (0-boss) e 7 novas fases de conteúdo.

**Architecture:** Três tracks independentes: (A) renumeração de IDs e cadeias nextLevel + migração de perfis, (B) sistema mini-boss data-driven + entidade ZeladorBoss, (C) conteúdo das 7 novas fases. Track A é prerequisito para C. Track B é independente.

**Tech Stack:** TypeScript 5.4, Phaser 3.87, Vitest 1.6, Vite 5.4

---

## File Map

| Ficheiro | Operação | Track |
|----------|----------|-------|
| `src/constants.ts` | Modificar — KEYS.ZELADOR_BOSS, KEYS.CHAVE, 7 MEDAL_THRESHOLDS | A |
| `src/storage/ProfileManager.ts` | Modificar — SAVE_VERSION + migração | A |
| `src/levels/LevelData.ts` | Modificar — campo `miniBoss?` opcional | B |
| `src/scenes/BootScene.ts` | Modificar — sprites ZELADOR_BOSS + CHAVE | B |
| `src/entities/enemies/ZeladorBoss.ts` | Criar — boss 3 fases | B |
| `src/scenes/UIScene.ts` | Modificar — barra de mini-boss | B |
| `src/scenes/GameScene.ts` | Modificar — trigger mini-boss + handlers ZeladorBoss | B |
| `src/levels/World0.ts` | Modificar — rename 0-2→0-3, update chains, 3 novas fases, novo 0-boss | A+C |
| `src/levels/World1.ts` | Modificar — rename 1-2→1-3 / 1-3→1-5, 2 novas fases | A+C |
| `src/levels/World2.ts` | Modificar — rename 2-3→2-4, 2 novas fases | A+C |
| `src/scenes/WorldMapScene.ts` | Modificar — MAP_NODES com 7 novas fases | A |
| `tests/ProfileManager.test.ts` | Modificar — testes de migração de versão | A |
| `tests/levels.test.ts` | Criar — 14 rows, cadeias nextLevel, MEDAL_THRESHOLDS | A+C |

---

## Task 1: constants.ts — Novos KEYS e MEDAL_THRESHOLDS

**Files:**
- Modify: `src/constants.ts`

- [ ] **Step 1: Adicionar KEYS.ZELADOR_BOSS e KEYS.CHAVE**

Em `src/constants.ts`, no bloco `export const KEYS`, após a linha `DRONE: 'drone'`:

```typescript
ZELADOR_BOSS: 'zelador_boss',
CHAVE:        'chave',
```

- [ ] **Step 2: Adicionar MEDAL_THRESHOLDS para as 7 novas fases**

No bloco `MEDAL_THRESHOLDS`, adicionar:

```typescript
'0-2': 800,
'0-4': 1400,
'0-5': 1700,
'1-2': 1200,
'1-4': 1500,
'2-3': 1400,
'2-5': 1900,
```

- [ ] **Step 3: Verificar compilação TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/constants.ts
git commit -m "feat: add KEYS.ZELADOR_BOSS, KEYS.CHAVE and 7 new MEDAL_THRESHOLDS for Spec A"
```

---

## Task 2: ProfileManager — SAVE_VERSION e Migração

**Files:**
- Modify: `src/storage/ProfileManager.ts`
- Modify: `tests/ProfileManager.test.ts`

- [ ] **Step 1: Escrever o teste de migração primeiro**

Abrir `tests/ProfileManager.test.ts` e adicionar no final (antes do último `}`):

```typescript
describe('SAVE_VERSION migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('perfil legado sem version é descartado no load', () => {
    const legacyProfile = { name: 'Teste', dogType: 'raya', levels: {}, totalScore: 500 }
    localStorage.setItem('rcgame_profiles', JSON.stringify([legacyProfile]))
    localStorage.setItem('rcgame_active_profile', '0')
    const pm = new ProfileManager()
    // perfil legado não tem version → deve ser apagado
    expect(pm.profiles).toHaveLength(0)
  })

  it('perfil com version correta é preservado', () => {
    const validProfile = {
      name: 'Valido', dogType: 'cruella', levels: {}, totalScore: 200, version: 2,
    }
    localStorage.setItem('rcgame_profiles', JSON.stringify([validProfile]))
    localStorage.setItem('rcgame_active_profile', '0')
    const pm = new ProfileManager()
    expect(pm.profiles).toHaveLength(1)
    expect(pm.profiles[0].name).toBe('Valido')
  })

  it('novo perfil gravado inclui version: 2', () => {
    const pm = new ProfileManager()
    pm.createProfile('NovoPerfil', 'raya')
    const raw = JSON.parse(localStorage.getItem('rcgame_profiles') ?? '[]')
    expect(raw[0].version).toBe(2)
  })
})
```

- [ ] **Step 2: Correr testes — verificar que falham**

```bash
npx vitest run tests/ProfileManager.test.ts
```

Esperado: FAIL nos 3 novos testes.

- [ ] **Step 3: Adicionar SAVE_VERSION ao ProfileManager**

Em `src/storage/ProfileManager.ts`, no topo do ficheiro após os imports:

```typescript
const SAVE_VERSION = 2
```

- [ ] **Step 4: Adicionar campo version ao tipo PlayerProfile**

Encontrar a interface/tipo `PlayerProfile` e adicionar:

```typescript
version?: number
```

- [ ] **Step 5: Filtrar perfis legado no constructor/load**

No método que carrega perfis do localStorage (provavelmente no constructor ou num método `_loadProfiles`), adicionar filtro após carregar o JSON:

```typescript
// Filtrar perfis com versão antiga (migração SAVE_VERSION)
this.profiles = raw.filter((p: PlayerProfile) => (p.version ?? 0) >= SAVE_VERSION)
```

- [ ] **Step 6: Incluir version ao gravar perfil novo**

No método `createProfile` (ou equivalente que grava no localStorage), garantir que o objeto incluído tem:

```typescript
version: SAVE_VERSION,
```

- [ ] **Step 7: Correr testes — verificar que passam**

```bash
npx vitest run tests/ProfileManager.test.ts
```

Esperado: todos os testes passam (incluindo os 3 novos).

- [ ] **Step 8: Commit**

```bash
git add src/storage/ProfileManager.ts tests/ProfileManager.test.ts
git commit -m "feat: add SAVE_VERSION=2 migration — legacy profiles without version are discarded"
```

---

## Task 3: LevelData.ts — Campo miniBoss Opcional

**Files:**
- Modify: `src/levels/LevelData.ts`

- [ ] **Step 1: Adicionar interface MiniBossConfig e campo miniBoss**

Em `src/levels/LevelData.ts`, antes da interface/type `LevelData`, adicionar:

```typescript
export interface MiniBossConfig {
  /** Posição X que o jogador deve cruzar para disparar o encontro */
  triggerX: number
  /** Onde o mini-boss aparece */
  spawnX: number
  spawnY: number
  /** Limites da arena — grade esquerda e direita */
  leftBarrierX: number
  rightBarrierX: number
}
```

No tipo/interface `LevelData`, adicionar campo opcional:

```typescript
miniBoss?: MiniBossConfig
```

- [ ] **Step 2: Verificar compilação TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/levels/LevelData.ts
git commit -m "feat: add optional miniBoss field to LevelData interface"
```

---

## Task 4: BootScene.ts — Sprites ZELADOR_BOSS e CHAVE

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: Adicionar sprite ZELADOR_BOSS (32×32) após o sprite DRONE**

Encontrar a secção que gera o sprite `KEYS.DRONE` em `src/scenes/BootScene.ts`. Imediatamente a seguir, adicionar:

```typescript
// ZELADOR_BOSS — zelador maior, avental azul escuro, vassoura
clr()
// corpo principal
g.fillStyle(0x1a3a6b); g.fillRect(6, 8, 20, 20)        // avental azul escuro
g.fillStyle(0x8B6914); g.fillRect(10, 2, 12, 8)          // cabeça (castanho)
g.fillStyle(0xf0c060); g.fillRect(12, 3, 8, 6)            // rosto
// vassoura
g.fillStyle(0x8B6914); g.fillRect(24, 4, 3, 24)           // cabo
g.fillStyle(0xd4a020); g.fillRect(21, 26, 9, 4)           // cabeça da vassoura
// pernas
g.fillStyle(0x1a3a6b); g.fillRect(10, 26, 5, 6)           // perna esq
g.fillStyle(0x1a3a6b); g.fillRect(17, 26, 5, 6)           // perna dir
gen(KEYS.ZELADOR_BOSS, 32, 32)

// CHAVE — chave metálica dourada/prata (projéctil do Zelador Boss)
clr()
g.fillStyle(0xd4af37); g.fillRect(0, 1, 8, 4)             // cabo da chave
g.fillStyle(0xd4af37); g.fillRect(8, 0, 4, 6)             // cabeça da chave
g.fillStyle(0xd4af37); g.fillRect(10, 2, 2, 2)             // dente 1
g.fillStyle(0xc0c0c0); g.fillRect(1, 2, 6, 2)             // brilho prata no cabo
gen(KEYS.CHAVE, 12, 6)
```

- [ ] **Step 2: Verificar compilação TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: generate ZELADOR_BOSS (32x32) and CHAVE (12x6) sprites in BootScene"
```

---

## Task 5: ZeladorBoss.ts — Entidade Boss

**Files:**
- Create: `src/entities/enemies/ZeladorBoss.ts`

- [ ] **Step 1: Criar o ficheiro ZeladorBoss.ts**

```typescript
import Phaser from 'phaser'
import { Enemy } from './Enemy'
import { KEYS } from '../../constants'

type Phase = 1 | 2 | 3

export class ZeladorBoss extends Enemy {
  private readonly MAX_HP = 12
  private _phase: Phase = 1
  private _isDying = false
  private _playerX = 400
  private _playerY = 352
  private _attackTimer = 3000
  private _slideTimer = 5000
  private _minionTimer = 6000
  private _isSliding = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.ZELADOR_BOSS, 12, 90)
    this.setScale(2)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(28, 28).setOffset(2, 2)
    this.setCollideWorldBounds(true)
    this.setVelocityX(90)
  }

  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  update(delta: number): void {
    if (this._isDying || this.isStunned()) return

    this._checkPhaseTransition()
    this._handlePatrol()

    this._attackTimer -= delta
    if (this._attackTimer <= 0) {
      this._doAttack()
      this._attackTimer = this._phase === 1 ? 3000 : this._phase === 2 ? 2500 : 2000
    }

    if (this._phase >= 2) {
      this._slideTimer -= delta
      if (this._slideTimer <= 0 && !this._isSliding) {
        this._doSlide()
        this._slideTimer = 5000
      }
    }

    if (this._phase === 3) {
      this._minionTimer -= delta
      if (this._minionTimer <= 0) {
        this.emit('spawnMinion', { x: this.x + (this.direction === 1 ? 80 : -80), y: this.y })
        this._minionTimer = 6000
      }
    }
  }

  private _checkPhaseTransition(): void {
    const hpPct = this.hp / this.MAX_HP
    if (hpPct <= 0.67 && this._phase < 2) {
      this._phase = 2
      this.speed = 130
      this.setTint(0xff8800)
    }
    if (hpPct <= 0.34 && this._phase < 3) {
      this._phase = 3
      this.speed = 160
      this.setTint(0xff4444)
    }
  }

  private _handlePatrol(): void {
    if (this._isSliding) return
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body.blocked.right) this.direction = -1
    if (body.blocked.left)  this.direction = 1
    body.setVelocityX(this.speed * this.direction)
    this.setFlipX(this.direction === -1)
  }

  private _doAttack(): void {
    const count = this._phase === 1 ? 1 : 2
    for (let i = 0; i < count; i++) {
      const dx = this._playerX - this.x
      const vx = Math.sign(dx) * 200
      this.scene.time.delayedCall(i * 150, () => {
        if (!this.active) return
        this.emit('spawnChave', { x: this.x, y: this.y - 8, vx, vy: -180 })
      })
    }
  }

  private _doSlide(): void {
    this._isSliding = true
    const body = this.body as Phaser.Physics.Arcade.Body
    const dir = Math.sign(this._playerX - this.x) || 1
    this.setTint(0xffff00)
    body.setVelocityX(300 * dir)
    this.scene.cameras.main.shake(80, 0.004)
    this.scene.time.delayedCall(400, () => {
      if (!this.active) return
      this._isSliding = false
      // restaurar tint da fase
      if      (this._phase === 3) this.setTint(0xff4444)
      else if (this._phase === 2) this.setTint(0xff8800)
      else                        this.clearTint()
    })
  }

  protected onDeath(): void {
    this._isDying = true
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setEnable(false)
    this.scene.tweens.add({
      targets: this,
      scaleX: 0, scaleY: 0, alpha: 0, angle: 180,
      duration: 900,
      ease: 'Power2',
      onComplete: () => {
        this.emit('died', this)
        this.destroy()
      },
    })
  }
}
```

- [ ] **Step 2: Verificar compilação TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/entities/enemies/ZeladorBoss.ts
git commit -m "feat: create ZeladorBoss entity (3 phases, spawnChave + slide + minion spawn)"
```

---

## Task 6: UIScene.ts — Barra de Mini-Boss

**Files:**
- Modify: `src/scenes/UIScene.ts`

- [ ] **Step 1: Adicionar variáveis de estado para barra de mini-boss**

Em `UIScene`, na secção de declaração de propriedades (junto às outras como `_heartsImages`, etc.), adicionar:

```typescript
private _miniBossBar?: Phaser.GameObjects.Graphics
private _miniBossIcon?: Phaser.GameObjects.Image
private _miniBossMaxHp = 0
```

- [ ] **Step 2: Criar barra de mini-boss no create()**

No método `create()` de UIScene, no final (após o timer/mute indicator), adicionar:

```typescript
// ── Mini-boss bar (oculta por padrão) ──────────────────────────────────────
this._miniBossBar = this.add.graphics().setScrollFactor(0).setVisible(false)
this._miniBossIcon = this.add.image(12, 14, KEYS.ASPIRADOR)
  .setScrollFactor(0).setScale(1.2).setVisible(false)

this.events.on('showMiniBossBar', (maxHp: number) => {
  this._miniBossMaxHp = maxHp
  this._miniBossBar!.setVisible(true)
  this._miniBossIcon!.setVisible(true)
  this._drawMiniBossBar(maxHp, maxHp)
})

this.events.on('updateMiniBossBar', (hp: number) => {
  this._drawMiniBossBar(hp, this._miniBossMaxHp)
})

this.events.on('hideMiniBossBar', () => {
  this._miniBossBar!.setVisible(false)
  this._miniBossIcon!.setVisible(false)
})
```

- [ ] **Step 3: Criar método _drawMiniBossBar**

Adicionar método privado na classe UIScene:

```typescript
private _drawMiniBossBar(hp: number, maxHp: number): void {
  if (!this._miniBossBar) return
  const g = this._miniBossBar
  g.clear()
  const x = 28, y = 8, w = 200, h = 12
  // fundo escuro
  g.fillStyle(0x333333, 0.85)
  g.fillRect(x - 2, y - 2, w + 4, h + 4)
  // barra vermelha (hp actual)
  const ratio = Math.max(0, hp / maxHp)
  g.fillStyle(0xcc2222, 1)
  g.fillRect(x, y, Math.floor(w * ratio), h)
  // borda branca
  g.lineStyle(1, 0xffffff, 0.6)
  g.strokeRect(x - 2, y - 2, w + 4, h + 4)
}
```

- [ ] **Step 4: Verificar compilação TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/UIScene.ts
git commit -m "feat: add mini-boss health bar to UIScene (hidden by default, event-driven)"
```

---

## Task 7: GameScene.ts — Sistema Mini-Boss + ZeladorBoss

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Importar ZeladorBoss**

No bloco de imports de GameScene, adicionar:

```typescript
import { ZeladorBoss } from '../entities/enemies/ZeladorBoss'
```

- [ ] **Step 2: Substituir bloco do 0-boss (Aspirador) pelo ZeladorBoss**

Encontrar o bloco `if (this.currentLevel.id === '0-boss')` que actualmente cria um Aspirador. Substituir **todo o conteúdo interno** por:

```typescript
if (this.currentLevel.id === '0-boss') {
  const boss = new ZeladorBoss(this, mapWidth / 2, 352)
  this.enemyGroup.add(boss)

  boss.on('spawnChave', ({ x, y, vx, vy }: { x:number; y:number; vx:number; vy:number }) => {
    const proj = this.physics.add.image(x, y, KEYS.CHAVE)
    const body = proj.body as Phaser.Physics.Arcade.Body
    body.setVelocity(vx, vy)
    this._bossProjectileGroup.add(proj)
    this.time.delayedCall(3000, () => { if (proj.active) proj.destroy() })
  })

  boss.on('spawnMinion', ({ x, y }: { x: number; y: number }) => {
    const minion = this._spawnEnemy({ type: 'zelador', x, y })
    if (minion) this.enemyGroup.add(minion)
  })

  boss.on('died', () => {
    this._addScore(1000)
    this._levelComplete()
  })

  this.time.addEvent({
    delay: 100,
    callback: () => { if (boss.active) boss.setPlayerPos(this.player.x, this.player.y) },
    loop: true,
  })
}
```

- [ ] **Step 3: Adicionar sistema mini-boss trigger**

Após o bloco de criação do tilemap (procurar onde `spawnX` / `spawnY` são usados para posicionar o jogador), adicionar o seguinte bloco:

```typescript
// ── Sistema Mini-Boss (data-driven via LevelData.miniBoss) ──────────────
if (this.currentLevel.miniBoss) {
  const mb = this.currentLevel.miniBoss
  let triggered = false

  const triggerZone = this.add.zone(mb.triggerX, this.scale.height / 2, 32, this.scale.height)
  this.physics.world.enable(triggerZone)

  const uiScene = this.scene.get('UIScene') as Phaser.Scene & { events: Phaser.Events.EventEmitter }

  this.physics.add.overlap(this.player.activeSprite ?? this.player, triggerZone, () => {
    if (triggered) return
    triggered = true
    triggerZone.destroy()

    // Spawn Wall-E mini-boss
    const miniBoss = new Aspirador(this, mb.spawnX, mb.spawnY)
    this.enemyGroup.add(miniBoss)

    // Barreiras
    const leftBar  = this.physics.add.staticImage(mb.leftBarrierX,  this.scale.height / 2, KEYS.EXIT_GATE)
    const rightBar = this.physics.add.staticImage(mb.rightBarrierX, this.scale.height / 2, KEYS.EXIT_GATE)
    this.physics.add.collider(this.player.activeSprite ?? this.player, leftBar)
    this.physics.add.collider(this.player.activeSprite ?? this.player, rightBar)

    // UI
    uiScene.events.emit('showMiniBossBar', miniBoss.hp)

    // Actualizar barra HP por polling (Enemy base não emite evento por dano)
    const hpPoll = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (miniBoss.active) uiScene.events.emit('updateMiniBossBar', miniBoss.hp)
      },
      loop: true,
    })

    miniBoss.on('died', () => {
      hpPoll.remove()
      leftBar.destroy()
      rightBar.destroy()
      uiScene.events.emit('hideMiniBossBar')
      this._addScore(500)
    })
  })
}
```

> **Nota:** `this.player.activeSprite` ou `this.player` — usar o mesmo padrão já em uso no ficheiro para referenciar o sprite activo do jogador (verificar como os overlaps existentes com `itemGroup` e `enemyGroup` referenciam o jogador).

- [ ] **Step 4: Verificar compilação TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Correr testes**

```bash
npx vitest run
```

Esperado: todos os testes passam.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: replace 0-boss Aspirador with ZeladorBoss; add data-driven mini-boss trigger system"
```

---

## Task 8: World0.ts — Renumeração + 3 Novas Fases + Novo Boss

**Files:**
- Modify: `src/levels/World0.ts`
- Modify: `tests/levels.test.ts` (criar se não existir)

- [ ] **Step 1: Escrever testes de nível para World0**

Criar/abrir `tests/levels.test.ts` e adicionar:

```typescript
import { describe, it, expect } from 'vitest'
import { WORLD0_LEVELS } from '../src/levels/World0'
import { WORLD1_LEVELS } from '../src/levels/World1'
import { WORLD2_LEVELS } from '../src/levels/World2'
import { MEDAL_THRESHOLDS } from '../src/constants'

describe('World0 levels', () => {
  const ids = ['0-1', '0-2', '0-3', '0-4', '0-5', '0-boss']
  it('contém exactamente as 6 fases esperadas', () => {
    expect(Object.keys(WORLD0_LEVELS).sort()).toEqual(ids.sort())
  })
  ids.filter(id => id !== '0-boss').forEach(id => {
    it(`${id} tem exactamente 14 rows no tilemap`, () => {
      expect(WORLD0_LEVELS[id].tiles).toHaveLength(14)
    })
  })
  it('cadeia nextLevel correcta para Mundo 0', () => {
    expect(WORLD0_LEVELS['0-1'].nextLevel).toBe('0-2')
    expect(WORLD0_LEVELS['0-2'].nextLevel).toBe('0-3')
    expect(WORLD0_LEVELS['0-3'].nextLevel).toBe('0-4')
    expect(WORLD0_LEVELS['0-4'].nextLevel).toBe('0-5')
    expect(WORLD0_LEVELS['0-5'].nextLevel).toBe('0-boss')
    expect(WORLD0_LEVELS['0-boss'].nextLevel).toBe('1-1')
  })
  it('0-boss é isBossLevel', () => {
    expect(WORLD0_LEVELS['0-boss'].isBossLevel).toBe(true)
  })
  it('0-1 tem miniBoss config', () => {
    expect(WORLD0_LEVELS['0-1'].miniBoss).toBeDefined()
    expect(WORLD0_LEVELS['0-1'].miniBoss?.triggerX).toBe(1280)
  })
  it('MEDAL_THRESHOLDS tem entrada para 0-2, 0-4, 0-5', () => {
    expect(MEDAL_THRESHOLDS['0-2']).toBe(800)
    expect(MEDAL_THRESHOLDS['0-4']).toBe(1400)
    expect(MEDAL_THRESHOLDS['0-5']).toBe(1700)
  })
})
```

- [ ] **Step 2: Correr testes — verificar que falham**

```bash
npx vitest run tests/levels.test.ts
```

Esperado: FAIL (estrutura antiga).

- [ ] **Step 3: Renomear LEVEL_0_2 para LEVEL_0_3 e actualizar a sua cadeia**

Em `src/levels/World0.ts`:
1. Renomear a constante `LEVEL_0_2` → `LEVEL_0_3`
2. Mudar `id: '0-2'` → `id: '0-3'`
3. Mudar `name: 'Estacionamento do Prédio'` (mantém)
4. Mudar `nextLevel: '0-boss'` → `nextLevel: '0-4'`

- [ ] **Step 4: Actualizar LEVEL_0_1 — adicionar miniBoss config**

Na constante `LEVEL_0_1`, manter `nextLevel: '0-2'` e adicionar no final do objecto (antes do `}`):

```typescript
miniBoss: {
  triggerX:      1280,
  spawnX:        1600,
  spawnY:        352,
  leftBarrierX:  1056,
  rightBarrierX: 1984,
},
```

- [ ] **Step 5: Substituir LEVEL_0_BOSS pelo novo Lobby/Zelador**

Substituir a constante `LEVEL_0_BOSS` pelo seguinte (mantendo o mesmo nome da constante):

```typescript
// ── 0-boss: Lobby / Saída do Prédio — batalha contra o Zelador ───────────
export const LEVEL_0_BOSS: LevelData = {
  id: '0-boss', name: 'Lobby — Zelador do Prédio!', bgColor: 0xe8e0d0,
  backgroundTheme: 'apartamento' as const, timeLimit: 0, tileWidthCols: 65,
  tiles: (() => {
    const BC = 65
    const be = (): number[] => Array(BC).fill(0)
    const bg = (): number[] => Array(BC).fill(1)
    const bpm = (...ranges: [number, number][]): number[] => {
      const r = be()
      for (const [x, len] of ranges) for (let i = x; i < x + len; i++) r[i] = 2
      return r
    }
    return [
      be(), be(), be(),
      bpm([5,4], [20,4], [40,4], [55,4]),  // row 3: prateleiras altas
      be(),
      bpm([12,5], [30,5], [48,5]),          // row 5: mezanino
      be(), be(), be(), be(),
      bpm([8,8], [35,8]),                   // row 10: balcões de recepção
      be(), be(), bg(),                     // rows 11,12,13
    ]
  })(),
  spawnX: 64, spawnY: 350, exitX: 1984, exitY: 370,
  checkpointX: 80, checkpointY: 350,
  enemies: [], items: [], goldenBones: [],
  nextLevel: '1-1', isBossLevel: true,
  intro: {
    complexity: 3,
    dialogue: [
      'O zelador do prédio está à nossa espera no lobby!',
      'Não vai ser fácil passar por ele... Mas temos de tentar!',
    ],
  },
  decorations: [
    { type: 'balcao',    x: 150,  y: G, blocking: true },
    { type: 'vaso',      x: 400,  y: G, blocking: false },
    { type: 'cadeira',   x: 600,  y: G, blocking: true },
    { type: 'mesa',      x: 850,  y: G, blocking: true },
    { type: 'balcao',    x: 1100, y: G, blocking: true },
    { type: 'vaso',      x: 1300, y: G, blocking: false },
    { type: 'cadeira',   x: 1500, y: G, blocking: true },
    { type: 'grade',     x: 1750, y: G, blocking: true },
    { type: 'grade',     x: 1790, y: G, blocking: true },
  ],
}
```

- [ ] **Step 6: Adicionar LEVEL_0_2 — Corredor (70 cols)**

Adicionar após LEVEL_0_1:

```typescript
// ── 0-2: Corredor do Apartamento ─────────────────────────────────────────
export const LEVEL_0_2: LevelData = {
  id: '0-2', name: 'Corredor', bgColor: 0xf2e4cc,
  backgroundTheme: 'apartamento' as const, timeLimit: 160, tileWidthCols: 70,
  tiles: (() => {
    const BC = 70
    const be = (): number[] => Array(BC).fill(0)
    const bg = (): number[] => Array(BC).fill(1)
    const bpm = (...ranges: [number, number][]): number[] => {
      const r = be()
      for (const [x, len] of ranges) for (let i = x; i < x + len; i++) r[i] = 2
      return r
    }
    return [
      be(), be(), be(),
      bpm([8,4], [30,4], [55,4]),            // row 3: prateleiras altas
      be(),
      bpm([4,4], [24,4], [44,4], [62,4]),    // row 5: nível médio-alto
      be(),
      bpm([2,4], [18,4], [36,4], [52,4]),    // row 7: nível médio
      be(),
      bpm([0,3],[14,4],[28,4],[44,4],[60,4]),// row 9: patamar baixo
      bpm([0,5],[12,4],[24,5],[38,5],[52,5],[64,5]), // row 10: patamar base
      bg(), bg(), bg(),                      // rows 11,12,13: chão
    ]
  })(),
  spawnX: 64, spawnY: 350, exitX: 2176, exitY: 370,
  checkpointX: 1120, checkpointY: 380,
  checkpointSprite: 'vaso',
  enemies: [
    { type: 'hugo',    x: 350,  y: 390 },
    { type: 'hannah',  x: 800,  y: 390 },
    { type: 'hugo',    x: 1300, y: 390 },
    { type: 'gato',    x: 1000, y: 224 },
    { type: 'hannah',  x: 1700, y: 390 },
  ],
  items: [
    { type: 'bone',    x: 150,  y: 380 },
    { type: 'bone',    x: 500,  y: 380 },
    { type: 'petisco', x: 750,  y: 380 },
    { type: 'bone',    x: 1050, y: 380 },
    { type: 'bone',    x: 1350, y: 380 },
    { type: 'pizza',   x: 1550, y: 380 },
    { type: 'bone',    x: 1800, y: 380 },
    { type: 'bone',    x: 2050, y: 380 },
  ],
  goldenBones: [
    { x: 200,  y: 64 },
    { x: 1200, y: 64 },
  ],
  nextLevel: '0-3',
  intro: {
    complexity: 1,
    dialogue: [
      'O corredor está cheio de moradores curiosos!',
      'Vamos em silêncio... ou quase.',
    ],
  },
  decorations: [
    { type: 'vaso',    x: 200,  y: G, blocking: false },
    { type: 'cadeira', x: 450,  y: G, blocking: true  },
    { type: 'grade',   x: 650,  y: G, blocking: true  },
    { type: 'balcao',  x: 900,  y: G, blocking: true  },
    { type: 'vaso',    x: 1100, y: G, blocking: false },
    { type: 'cadeira', x: 1300, y: G, blocking: true  },
    { type: 'grade',   x: 1500, y: G, blocking: true  },
    { type: 'balcao',  x: 1750, y: G, blocking: true  },
  ],
}
```

- [ ] **Step 7: Adicionar LEVEL_0_4 — Estacionamento Nível 1 (90 cols)**

Adicionar após LEVEL_0_3 (o antigo LEVEL_0_2):

```typescript
// ── 0-4: Estacionamento Nível 1 ──────────────────────────────────────────
export const LEVEL_0_4: LevelData = {
  id: '0-4', name: 'Estacionamento — Nível 1', bgColor: 0x1e1e2e,
  backgroundTheme: 'apto_boss' as const, timeLimit: 200, tileWidthCols: 90,
  tiles: (() => {
    const BC = 90
    const be = (): number[] => Array(BC).fill(0)
    const bg = (): number[] => Array(BC).fill(1)
    const bpm = (...ranges: [number, number][]): number[] => {
      const r = be()
      for (const [x, len] of ranges) for (let i = x; i < x + len; i++) r[i] = 2
      return r
    }
    return [
      be(), be(), be(), be(),
      bpm([5,4], [24,4], [46,4], [68,4], [83,4]), // row 4: prateleiras altas
      be(),
      bpm([10,5], [32,5], [56,5], [76,6]),         // row 6: capots de carros/mezanino
      be(),
      bpm([0,4],[18,4],[38,5],[58,5],[78,5]),       // row 8: pilares e plataformas
      be(),
      bpm([0,4],[12,4],[26,5],[42,5],[58,4],[72,5],[84,5]), // row 10: patamar
      bg(), bg(), bg(),                             // rows 11,12,13: chão
    ]
  })(),
  spawnX: 64, spawnY: 350, exitX: 2816, exitY: 370,
  checkpointX: 1440, checkpointY: 380,
  enemies: [
    { type: 'zelador', x: 400,  y: 390 },
    { type: 'rato',    x: 700,  y: 390 },
    { type: 'zelador', x: 1000, y: 390 },
    { type: 'gato',    x: 1300, y: 390 },
    { type: 'zelador', x: 1600, y: 390 },
    { type: 'rato',    x: 1900, y: 390 },
    { type: 'zelador', x: 2200, y: 390 },
    { type: 'gato',    x: 2550, y: 390 },
  ],
  items: [
    { type: 'bone',    x: 160,  y: 380 },
    { type: 'bone',    x: 450,  y: 380 },
    { type: 'petisco', x: 800,  y: 380 },
    { type: 'bone',    x: 1050, y: 380 },
    { type: 'bone',    x: 1300, y: 380 },
    { type: 'pizza',   x: 1600, y: 380 },
    { type: 'bone',    x: 1850, y: 380 },
    { type: 'bone',    x: 2100, y: 380 },
    { type: 'petisco', x: 2350, y: 380 },
    { type: 'bone',    x: 2600, y: 380 },
  ],
  goldenBones: [
    { x: 300,  y: 64 },
    { x: 1200, y: 64 },
    { x: 2400, y: 64 },
  ],
  nextLevel: '0-5',
  intro: {
    complexity: 2,
    dialogue: [
      'O estacionamento subterrâneo... escuro e cheio de zeladores.',
      'Mantém o faro aguçado — os ratos adoram estas sombras.',
    ],
  },
  decorations: [
    { type: 'carro',  x: 220,  y: G, blocking: true  },
    { type: 'carro',  x: 550,  y: G, blocking: true  },
    { type: 'poste',  x: 750,  y: G },
    { type: 'carro',  x: 950,  y: G, blocking: true  },
    { type: 'carro',  x: 1220, y: G, blocking: true  },
    { type: 'poste',  x: 1450, y: G },
    { type: 'carro',  x: 1650, y: G, blocking: true  },
    { type: 'carro',  x: 1950, y: G, blocking: true  },
    { type: 'poste',  x: 2150, y: G },
    { type: 'carro',  x: 2380, y: G, blocking: true  },
  ],
}
```

- [ ] **Step 8: Adicionar LEVEL_0_5 — Estacionamento Nível 2 (100 cols)**

Adicionar após LEVEL_0_4:

```typescript
// ── 0-5: Estacionamento Nível 2 ──────────────────────────────────────────
export const LEVEL_0_5: LevelData = {
  id: '0-5', name: 'Estacionamento — Nível 2', bgColor: 0x141420,
  backgroundTheme: 'apto_boss' as const, timeLimit: 200, tileWidthCols: 100,
  tiles: (() => {
    const BC = 100
    const be = (): number[] => Array(BC).fill(0)
    const bg = (): number[] => Array(BC).fill(1)
    const bpm = (...ranges: [number, number][]): number[] => {
      const r = be()
      for (const [x, len] of ranges) for (let i = x; i < x + len; i++) r[i] = 2
      return r
    }
    return [
      be(), be(), be(),
      bpm([6,4],[26,4],[50,4],[72,4],[90,4]),        // row 3: prateleiras altas
      be(),
      bpm([12,5],[34,5],[58,5],[80,6]),               // row 5: mezanino
      be(),
      bpm([2,4],[20,4],[40,5],[60,5],[80,5],[94,4]),  // row 7: plataformas médias
      be(),
      bpm([0,4],[16,4],[32,5],[50,5],[66,4],[82,5]),  // row 9: patamar baixo
      bpm([0,5],[14,4],[28,5],[44,5],[60,4],[76,5],[90,5]), // row 10: base
      bg(), bg(), bg(),                               // rows 11,12,13: chão
    ]
  })(),
  spawnX: 64, spawnY: 350, exitX: 3136, exitY: 370,
  checkpointX: 1600, checkpointY: 380,
  enemies: [
    { type: 'zelador', x: 350,  y: 390 },
    { type: 'rato',    x: 600,  y: 390 },
    { type: 'zelador', x: 850,  y: 390 },
    { type: 'gato',    x: 1100, y: 390 },
    { type: 'zelador', x: 1350, y: 390 },
    { type: 'rato',    x: 1600, y: 390 },
    { type: 'zelador', x: 1850, y: 390 },
    { type: 'gato',    x: 2100, y: 390 },
    { type: 'zelador', x: 2400, y: 390 },
    { type: 'rato',    x: 2700, y: 390 },
  ],
  items: [
    { type: 'bone',    x: 150,  y: 380 },
    { type: 'bone',    x: 400,  y: 380 },
    { type: 'petisco', x: 700,  y: 380 },
    { type: 'bone',    x: 950,  y: 380 },
    { type: 'bone',    x: 1200, y: 380 },
    { type: 'pizza',   x: 1500, y: 380 },
    { type: 'bone',    x: 1750, y: 380 },
    { type: 'bone',    x: 2000, y: 380 },
    { type: 'petisco', x: 2250, y: 380 },
    { type: 'bone',    x: 2550, y: 380 },
    { type: 'bone',    x: 2900, y: 380 },
  ],
  goldenBones: [
    { x: 400,  y: 64 },
    { x: 1400, y: 64 },
    { x: 2600, y: 64 },
  ],
  nextLevel: '0-boss',
  intro: {
    complexity: 2,
    dialogue: [
      'O segundo nível do estacionamento — ainda mais fundo e mais perigoso.',
      'Resistam mais um pouco! A saída está próxima.',
    ],
  },
  decorations: [
    { type: 'carro',  x: 240,  y: G, blocking: true  },
    { type: 'carro',  x: 560,  y: G, blocking: true  },
    { type: 'poste',  x: 780,  y: G },
    { type: 'carro',  x: 1000, y: G, blocking: true  },
    { type: 'carro',  x: 1280, y: G, blocking: true  },
    { type: 'poste',  x: 1500, y: G },
    { type: 'carro',  x: 1700, y: G, blocking: true  },
    { type: 'carro',  x: 1980, y: G, blocking: true  },
    { type: 'poste',  x: 2200, y: G },
    { type: 'carro',  x: 2400, y: G, blocking: true  },
    { type: 'carro',  x: 2700, y: G, blocking: true  },
  ],
}
```

- [ ] **Step 9: Actualizar WORLD0_LEVELS**

Substituir o export `WORLD0_LEVELS` por:

```typescript
export const WORLD0_LEVELS: Record<string, LevelData> = {
  '0-1':    LEVEL_0_1,
  '0-2':    LEVEL_0_2,
  '0-3':    LEVEL_0_3,
  '0-4':    LEVEL_0_4,
  '0-5':    LEVEL_0_5,
  '0-boss': LEVEL_0_BOSS,
}
```

- [ ] **Step 10: Correr testes**

```bash
npx vitest run tests/levels.test.ts
```

Esperado: todos os testes de World0 passam.

- [ ] **Step 11: Correr testes completos**

```bash
npx vitest run
```

Esperado: todos os testes passam.

- [ ] **Step 12: Commit**

```bash
git add src/levels/World0.ts tests/levels.test.ts
git commit -m "feat: expand World0 to 5 phases — Corredor 0-2, Est N1 0-4, Est N2 0-5, ZeladorBoss 0-boss, mini-boss in 0-1"
```

---

## Task 9: World1.ts — Renumeração + 2 Novas Fases

**Files:**
- Modify: `src/levels/World1.ts`
- Modify: `tests/levels.test.ts`

- [ ] **Step 1: Adicionar testes para World1**

Em `tests/levels.test.ts`, adicionar:

```typescript
describe('World1 levels', () => {
  const ids = ['1-1', '1-2', '1-3', '1-4', '1-5', '1-boss']
  it('contém exactamente as 6 fases esperadas', () => {
    expect(Object.keys(WORLD1_LEVELS).sort()).toEqual(ids.sort())
  })
  ids.filter(id => id !== '1-boss').forEach(id => {
    it(`${id} tem exactamente 14 rows no tilemap`, () => {
      expect(WORLD1_LEVELS[id].tiles).toHaveLength(14)
    })
  })
  it('cadeia nextLevel correcta para Mundo 1', () => {
    expect(WORLD1_LEVELS['1-1'].nextLevel).toBe('1-2')
    expect(WORLD1_LEVELS['1-2'].nextLevel).toBe('1-3')
    expect(WORLD1_LEVELS['1-3'].nextLevel).toBe('1-4')
    expect(WORLD1_LEVELS['1-4'].nextLevel).toBe('1-5')
    expect(WORLD1_LEVELS['1-5'].nextLevel).toBe('1-boss')
    expect(WORLD1_LEVELS['1-boss'].nextLevel).toBe('2-1')
  })
  it('MEDAL_THRESHOLDS tem entrada para 1-2 e 1-4', () => {
    expect(MEDAL_THRESHOLDS['1-2']).toBe(1200)
    expect(MEDAL_THRESHOLDS['1-4']).toBe(1500)
  })
})
```

- [ ] **Step 2: Correr testes — verificar que falham**

```bash
npx vitest run tests/levels.test.ts
```

Esperado: FAIL nos testes de World1.

- [ ] **Step 3: Renomear LEVEL_1_2 → LEVEL_1_3 e LEVEL_1_3 → LEVEL_1_5**

Em `src/levels/World1.ts`:
1. Renomear constante `LEVEL_1_3` → `LEVEL_1_5`, mudar `id: '1-3'` → `'1-5'`, mudar `nextLevel: '1-boss'` (mantém)
2. Renomear constante `LEVEL_1_2` → `LEVEL_1_3`, mudar `id: '1-2'` → `'1-3'`, mudar `nextLevel: '1-3'` → `'1-4'`
3. Actualizar `LEVEL_1_1.nextLevel` de `'1-2'` → `'1-2'` (mantém — vai apontar para o novo Beco)

- [ ] **Step 4: Adicionar LEVEL_1_2 — Beco Escuro (80 cols)**

No ficheiro World1.ts, verificar se já existe uma função `mkHelpers`. Se não existir, adicionar no topo (antes dos levels):

```typescript
function mkHelpers(cols: number) {
  const e = () => Array(cols).fill(0) as number[]
  const g = () => Array(cols).fill(1) as number[]
  const p = (...ranges: [number, number][]) => {
    const row = e()
    for (const [x, len] of ranges) for (let i = x; i < x + len; i++) row[i] = 2
    return row
  }
  return { e, g, p }
}
```

Depois adicionar, após LEVEL_1_1:

```typescript
// ── 1-2: Beco Escuro ──────────────────────────────────────────────────────
const { e: e12, g: g12, p: p12 } = mkHelpers(80)
export const LEVEL_1_2: LevelData = {
  id: '1-2', name: 'Beco Escuro', bgColor: 0x1a1a2e,
  backgroundTheme: 'rua' as const, timeLimit: 180, tileWidthCols: 80,
  tiles: [
    e12(), e12(), e12(),
    p12([6,4],[28,4],[52,4],[68,4]),          // row 3: escadas incêndio altas
    e12(),
    p12([2,4],[20,4],[40,4],[58,4],[72,4]),   // row 5: plataformas médias
    e12(),
    p12([0,3],[14,4],[30,4],[48,4],[62,4]),   // row 7: caixotes
    e12(),
    p12([0,4],[12,3],[24,4],[40,4],[56,4],[68,4]), // row 9: patamar
    p12([0,5],[10,4],[22,5],[36,5],[52,5],[64,5]), // row 10: base
    g12(), g12(), g12(),                     // rows 11-13: chão
  ],
  spawnX: 64, spawnY: 350, exitX: 2496, exitY: 370,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'rato',  x: 350,  y: 390 },
    { type: 'gato',  x: 650,  y: 390 },
    { type: 'rato',  x: 950,  y: 390 },
    { type: 'rato',  x: 1200, y: 390 },
    { type: 'gato',  x: 1500, y: 390 },
    { type: 'pombo', x: 1000, y: 200 },
    { type: 'gato',  x: 1800, y: 390 },
    { type: 'rato',  x: 2150, y: 390 },
  ],
  items: [
    { type: 'bone',    x: 150,  y: 380 },
    { type: 'bone',    x: 500,  y: 380 },
    { type: 'petisco', x: 800,  y: 380 },
    { type: 'bone',    x: 1050, y: 380 },
    { type: 'pizza',   x: 1350, y: 380 },
    { type: 'bone',    x: 1650, y: 380 },
    { type: 'bone',    x: 1900, y: 380 },
    { type: 'bone',    x: 2200, y: 380 },
    { type: 'petisco', x: 2400, y: 380 },
  ],
  goldenBones: [
    { x: 300,  y: 64 },
    { x: 1600, y: 64 },
  ],
  nextLevel: '1-3',
  intro: {
    complexity: 2,
    dialogue: [
      'Um beco escuro e apertado… os ratos dominam aqui.',
      'Cuidado — cada sombra pode esconder um gato esfomeado.',
    ],
  },
  decorations: [
    { type: 'lixeira',  x: 200,  y: G, blocking: true  },
    { type: 'caixote',  x: 450,  y: G, blocking: true  },
    { type: 'lixeira',  x: 700,  y: G, blocking: true  },
    { type: 'banco',    x: 950,  y: G, blocking: true  },
    { type: 'caixote',  x: 1200, y: G, blocking: true  },
    { type: 'lixeira',  x: 1450, y: G, blocking: true  },
    { type: 'caixote',  x: 1700, y: G, blocking: true  },
    { type: 'lixeira',  x: 2000, y: G, blocking: true  },
    { type: 'caixote',  x: 2250, y: G, blocking: true  },
    { type: 'banco',    x: 2350, y: G, blocking: true  },
  ],
}
```

- [ ] **Step 5: Adicionar LEVEL_1_4 — Parque da Cidade (95 cols)**

Adicionar após o renomeado LEVEL_1_3 (antiga Praça):

```typescript
// ── 1-4: Parque da Cidade ─────────────────────────────────────────────────
const { e: e14, g: g14, p: p14 } = mkHelpers(95)
export const LEVEL_1_4: LevelData = {
  id: '1-4', name: 'Parque da Cidade', bgColor: 0x2d5a27,
  backgroundTheme: 'praca' as const, timeLimit: 200, tileWidthCols: 95,
  tiles: [
    e14(), e14(), e14(), e14(),
    p14([8,5],[35,5],[62,5],[82,5]),           // row 4: copas de árvores altas
    e14(),
    p14([3,5],[22,5],[46,5],[68,5],[86,5]),    // row 6: ramos médios
    e14(),
    p14([0,4],[16,4],[34,4],[54,4],[72,5],[88,4]), // row 8: bancos/pedras
    e14(),
    p14([0,5],[14,4],[28,4],[44,5],[60,4],[76,5],[88,5]), // row 10: patamar
    g14(), g14(), g14(),                      // rows 11-13: chão
  ],
  spawnX: 64, spawnY: 350, exitX: 2976, exitY: 370,
  checkpointX: 1520, checkpointY: 380,
  enemies: [
    { type: 'pombo',       x: 400,  y: 200 },
    { type: 'dono_nervoso',x: 700,  y: 390 },
    { type: 'pombo',       x: 1000, y: 200 },
    { type: 'rato',        x: 1200, y: 390 },
    { type: 'dono_nervoso',x: 1500, y: 390 },
    { type: 'pombo',       x: 1700, y: 200 },
    { type: 'rato',        x: 2000, y: 390 },
    { type: 'dono_nervoso',x: 2300, y: 390 },
    { type: 'pombo',       x: 2600, y: 200 },
  ],
  items: [
    { type: 'bone',    x: 150,  y: 380 },
    { type: 'bone',    x: 450,  y: 380 },
    { type: 'petisco', x: 800,  y: 380 },
    { type: 'bone',    x: 1050, y: 380 },
    { type: 'bone',    x: 1350, y: 380 },
    { type: 'pizza',   x: 1600, y: 380 },
    { type: 'bone',    x: 1900, y: 380 },
    { type: 'bone',    x: 2200, y: 380 },
    { type: 'petisco', x: 2500, y: 380 },
    { type: 'bone',    x: 2750, y: 380 },
    { type: 'bone',    x: 2900, y: 380 },
  ],
  goldenBones: [
    { x: 350,  y: 64 },
    { x: 1400, y: 64 },
    { x: 2700, y: 64 },
  ],
  nextLevel: '1-5',
  intro: {
    complexity: 2,
    dialogue: [
      'Um parque! Devia ser relaxante… mas os pombos acham que é deles.',
      'E os donos com trela vêm a correr. Não paro para cheirar as flores!',
    ],
  },
  decorations: [
    { type: 'arvore', x: 200,  y: G },
    { type: 'banco',  x: 450,  y: G, blocking: true },
    { type: 'arvore', x: 700,  y: G },
    { type: 'banco',  x: 950,  y: G, blocking: true },
    { type: 'arvore', x: 1200, y: G },
    { type: 'banco',  x: 1500, y: G, blocking: true },
    { type: 'arvore', x: 1800, y: G },
    { type: 'banco',  x: 2050, y: G, blocking: true },
    { type: 'arvore', x: 2300, y: G },
    { type: 'banco',  x: 2600, y: G, blocking: true },
    { type: 'arvore', x: 2850, y: G },
    { type: 'banco',  x: 2900, y: G, blocking: true },
  ],
}
```

- [ ] **Step 6: Actualizar WORLD1_LEVELS**

Substituir o export `WORLD1_LEVELS` por:

```typescript
export const WORLD1_LEVELS: Record<string, LevelData> = {
  '1-1':    LEVEL_1_1,
  '1-2':    LEVEL_1_2,
  '1-3':    LEVEL_1_3,
  '1-4':    LEVEL_1_4,
  '1-5':    LEVEL_1_5,
  '1-boss': LEVEL_1_BOSS,
}
```

- [ ] **Step 7: Correr testes**

```bash
npx vitest run
```

Esperado: todos os testes passam.

- [ ] **Step 8: Commit**

```bash
git add src/levels/World1.ts tests/levels.test.ts
git commit -m "feat: expand World1 to 5 phases — Beco 1-2, Parque 1-4; renumber Praça→1-3, Mercado→1-5"
```

---

## Task 10: World2.ts — Renumeração + 2 Novas Fases

**Files:**
- Modify: `src/levels/World2.ts`
- Modify: `tests/levels.test.ts`

- [ ] **Step 1: Adicionar testes para World2**

Em `tests/levels.test.ts`, adicionar:

```typescript
describe('World2 levels', () => {
  const ids = ['2-1', '2-2', '2-3', '2-4', '2-5', '2-boss']
  it('contém exactamente as 6 fases esperadas', () => {
    expect(Object.keys(WORLD2_LEVELS).sort()).toEqual(ids.sort())
  })
  ids.filter(id => id !== '2-boss').forEach(id => {
    it(`${id} tem exactamente 14 rows no tilemap`, () => {
      expect(WORLD2_LEVELS[id].tiles).toHaveLength(14)
    })
  })
  it('cadeia nextLevel correcta para Mundo 2', () => {
    expect(WORLD2_LEVELS['2-1'].nextLevel).toBe('2-2')
    expect(WORLD2_LEVELS['2-2'].nextLevel).toBe('2-3')
    expect(WORLD2_LEVELS['2-3'].nextLevel).toBe('2-4')
    expect(WORLD2_LEVELS['2-4'].nextLevel).toBe('2-5')
    expect(WORLD2_LEVELS['2-5'].nextLevel).toBe('2-boss')
    expect(WORLD2_LEVELS['2-boss'].nextLevel).toBeNull()
  })
  it('MEDAL_THRESHOLDS tem entrada para 2-3 e 2-5', () => {
    expect(MEDAL_THRESHOLDS['2-3']).toBe(1400)
    expect(MEDAL_THRESHOLDS['2-5']).toBe(1900)
  })
})
```

- [ ] **Step 2: Correr testes — verificar que falham**

```bash
npx vitest run tests/levels.test.ts
```

Esperado: FAIL nos testes de World2.

- [ ] **Step 3: Renomear LEVEL_2_3 → LEVEL_2_4**

Em `src/levels/World2.ts`:
1. Renomear constante `LEVEL_2_3` → `LEVEL_2_4`
2. Mudar `id: '2-3'` → `'2-4'`
3. Mudar `nextLevel: '2-boss'` → `'2-5'`
4. Actualizar `LEVEL_2_2.nextLevel` de `'2-3'` → `'2-3'` (vai apontar para Garagem)

- [ ] **Step 4: Adicionar LEVEL_2_3 — Garagem de Serviço (90 cols)**

No ficheiro World2.ts, confirmar que a função `mkHelpers` existe (foi adicionada nas versões anteriores do ficheiro). Se não, adicionar o mesmo `mkHelpers` da Task 9. Depois adicionar após LEVEL_2_2:

```typescript
// ── 2-3: Garagem de Serviço ───────────────────────────────────────────────
const r23g = mkHelpers(90)
export const LEVEL_2_3: LevelData = {
  id: '2-3', name: 'Garagem de Serviço', bgColor: 0x1a1a28,
  backgroundTheme: 'exterior' as const, timeLimit: 200, tileWidthCols: 90,
  tiles: [
    r23g.e(), r23g.e(), r23g.e(), r23g.e(),
    r23g.p([5,4],[22,4],[44,4],[66,4],[82,4]),        // row 4: prateleiras
    r23g.e(),
    r23g.p([10,5],[30,5],[54,5],[74,6]),               // row 6: rampas/mezanino
    r23g.e(),
    r23g.p([0,4],[18,4],[36,5],[56,5],[76,5]),         // row 8: caixotes/pilares
    r23g.e(),
    r23g.p([0,4],[12,4],[26,5],[42,5],[58,4],[74,5],[86,4]), // row 10: patamar
    r23g.g(), r23g.g(), r23g.g(),                     // rows 11-13: chão
  ],
  spawnX: 64, spawnY: 350, exitX: 2816, exitY: 370,
  checkpointX: 1440, checkpointY: 380,
  enemies: [
    { type: 'zelador', x: 350,  y: 390 },
    { type: 'rato',    x: 650,  y: 390 },
    { type: 'zelador', x: 950,  y: 390 },
    { type: 'rato',    x: 1200, y: 390 },
    { type: 'zelador', x: 1500, y: 390 },
    { type: 'rato',    x: 1750, y: 390 },
    { type: 'pombo',   x: 1100, y: 200 },
    { type: 'zelador', x: 2100, y: 390 },
    { type: 'rato',    x: 2400, y: 390 },
  ],
  items: [
    { type: 'bone',    x: 150,  y: 380 },
    { type: 'bone',    x: 400,  y: 380 },
    { type: 'petisco', x: 750,  y: 380 },
    { type: 'bone',    x: 1000, y: 380 },
    { type: 'bone',    x: 1300, y: 380 },
    { type: 'pizza',   x: 1550, y: 380 },
    { type: 'bone',    x: 1800, y: 380 },
    { type: 'bone',    x: 2050, y: 380 },
    { type: 'petisco', x: 2300, y: 380 },
    { type: 'bone',    x: 2600, y: 380 },
  ],
  goldenBones: [
    { x: 300,  y: 64 },
    { x: 1300, y: 64 },
    { x: 2500, y: 64 },
  ],
  nextLevel: '2-4',
  intro: {
    complexity: 2,
    dialogue: [
      'A garagem de serviço do prédio — entregadores e zeladores por todo o lado.',
      'E claro, os ratos adoram estes corredores escuros.',
    ],
  },
  decorations: [
    { type: 'carro',  x: 220,  y: G, blocking: true  },
    { type: 'caixote',x: 480,  y: G, blocking: true  },
    { type: 'carro',  x: 720,  y: G, blocking: true  },
    { type: 'poste',  x: 950,  y: G },
    { type: 'caixote',x: 1150, y: G, blocking: true  },
    { type: 'carro',  x: 1400, y: G, blocking: true  },
    { type: 'caixote',x: 1650, y: G, blocking: true  },
    { type: 'poste',  x: 1900, y: G },
    { type: 'carro',  x: 2150, y: G, blocking: true  },
    { type: 'caixote',x: 2450, y: G, blocking: true  },
    { type: 'carro',  x: 2650, y: G, blocking: true  },
  ],
}
```

- [ ] **Step 5: Adicionar LEVEL_2_5 — Varandas / Fachada (100 cols)**

Adicionar após o renomeado LEVEL_2_4 (antigas Escadas):

```typescript
// ── 2-5: Varandas / Fachada ───────────────────────────────────────────────
const r25 = mkHelpers(100)
export const LEVEL_2_5: LevelData = {
  id: '2-5', name: 'Varandas — Fachada do Prédio', bgColor: 0x0d1b2a,
  backgroundTheme: 'exterior' as const, timeLimit: 200, tileWidthCols: 100,
  tiles: [
    r25.e(), r25.e(),
    r25.p([4,5],[22,5],[44,5],[66,5],[86,5]),          // row 2: varandas altas
    r25.e(),
    r25.p([0,4],[18,4],[38,5],[60,5],[80,5],[94,4]),   // row 4: varandas médias-altas
    r25.e(),
    r25.p([6,4],[24,4],[46,4],[68,4],[88,4]),           // row 6: varandas médias
    r25.e(),
    r25.p([2,4],[20,4],[40,5],[62,5],[82,4]),           // row 8: varandas baixas
    r25.e(),
    r25.p([0,5],[14,4],[28,5],[44,5],[60,4],[76,5],[90,5]), // row 10: patamar
    r25.g(), r25.g(), r25.g(),                         // rows 11-13: chão
  ],
  spawnX: 64, spawnY: 350, exitX: 3136, exitY: 370,
  checkpointX: 1600, checkpointY: 380,
  enemies: [
    { type: 'pombo',   x: 300,  y: 200 },
    { type: 'morador', x: 600,  y: 390 },
    { type: 'pombo',   x: 900,  y: 150 },
    { type: 'rato',    x: 1100, y: 390 },
    { type: 'morador', x: 1350, y: 390 },
    { type: 'pombo',   x: 1600, y: 200 },
    { type: 'rato',    x: 1850, y: 390 },
    { type: 'morador', x: 2100, y: 390 },
    { type: 'pombo',   x: 2350, y: 150 },
    { type: 'morador', x: 2600, y: 390 },
    { type: 'pombo',   x: 2850, y: 200 },
    { type: 'rato',    x: 3000, y: 390 },
  ],
  items: [
    { type: 'bone',    x: 150,  y: 380 },
    { type: 'bone',    x: 450,  y: 380 },
    { type: 'petisco', x: 750,  y: 380 },
    { type: 'bone',    x: 1000, y: 380 },
    { type: 'bone',    x: 1300, y: 380 },
    { type: 'pizza',   x: 1600, y: 380 },
    { type: 'bone',    x: 1900, y: 380 },
    { type: 'bone',    x: 2150, y: 380 },
    { type: 'petisco', x: 2400, y: 380 },
    { type: 'bone',    x: 2700, y: 380 },
    { type: 'bone',    x: 2950, y: 380 },
    { type: 'bone',    x: 3050, y: 380 },
  ],
  goldenBones: [
    { x: 400,  y: 64 },
    { x: 1500, y: 64 },
    { x: 2800, y: 64 },
  ],
  nextLevel: '2-boss',
  intro: {
    complexity: 3,
    dialogue: [
      'A fachada do prédio… precisamos subir varanda a varanda.',
      'Os pombos não vão deixar ser fácil. Telhado à vista!',
    ],
  },
  decorations: [
    { type: 'arvore',  x: 200,  y: G },
    { type: 'grade',   x: 500,  y: G, blocking: true },
    { type: 'arvore',  x: 800,  y: G },
    { type: 'grade',   x: 1100, y: G, blocking: true },
    { type: 'arvore',  x: 1400, y: G },
    { type: 'grade',   x: 1700, y: G, blocking: true },
    { type: 'arvore',  x: 2000, y: G },
    { type: 'grade',   x: 2300, y: G, blocking: true },
    { type: 'arvore',  x: 2600, y: G },
    { type: 'grade',   x: 2900, y: G, blocking: true },
    { type: 'arvore',  x: 3050, y: G },
    { type: 'grade',   x: 3100, y: G, blocking: true },
    { type: 'grade',   x: 3110, y: G, blocking: true },
  ],
}
```

- [ ] **Step 6: Actualizar WORLD2_LEVELS**

Substituir o export `WORLD2_LEVELS` por:

```typescript
export const WORLD2_LEVELS: Record<string, LevelData> = {
  '2-1':    LEVEL_2_1,
  '2-2':    LEVEL_2_2,
  '2-3':    LEVEL_2_3,
  '2-4':    LEVEL_2_4,
  '2-5':    LEVEL_2_5,
  '2-boss': LEVEL_2_BOSS,
}
```

- [ ] **Step 7: Correr todos os testes**

```bash
npx vitest run
```

Esperado: todos os testes passam.

- [ ] **Step 8: Commit**

```bash
git add src/levels/World2.ts tests/levels.test.ts
git commit -m "feat: expand World2 to 5 phases — Garagem 2-3, Varandas 2-5; renumber Escadas→2-4"
```

---

## Task 11: WorldMapScene.ts — MAP_NODES Actualizado

**Files:**
- Modify: `src/scenes/WorldMapScene.ts`

- [ ] **Step 1: Actualizar MAP_NODES com as novas fases e IDs corrigidos**

Em `src/scenes/WorldMapScene.ts`, substituir o array `MAP_NODES` pelo seguinte (manter os nodes existentes com IDs actualizados e adicionar os 7 novos):

```typescript
const MAP_NODES = [
  // Mundo 0 — Apartamento
  { id: '0-1',    label: '0-1',    world: 'Mundo 0 — Apartamento', x: 100, y: 70  },
  { id: '0-2',    label: '0-2',    world: 'Mundo 0 — Apartamento', x: 175, y: 70  },
  { id: '0-3',    label: '0-3',    world: 'Mundo 0 — Apartamento', x: 250, y: 70  },
  { id: '0-4',    label: '0-4',    world: 'Mundo 0 — Apartamento', x: 325, y: 70  },
  { id: '0-5',    label: '0-5',    world: 'Mundo 0 — Apartamento', x: 400, y: 70  },
  { id: '0-boss', label: '0★',     world: 'Mundo 0 — Apartamento', x: 475, y: 70  },
  // Mundo 1 — Cidade
  { id: '1-1',    label: '1-1',    world: 'Mundo 1 — Cidade',       x: 100, y: 200 },
  { id: '1-2',    label: '1-2',    world: 'Mundo 1 — Cidade',       x: 175, y: 200 },
  { id: '1-3',    label: '1-3',    world: 'Mundo 1 — Cidade',       x: 250, y: 200 },
  { id: '1-4',    label: '1-4',    world: 'Mundo 1 — Cidade',       x: 325, y: 200 },
  { id: '1-5',    label: '1-5',    world: 'Mundo 1 — Cidade',       x: 400, y: 200 },
  { id: '1-boss', label: '1★',     world: 'Mundo 1 — Cidade',       x: 475, y: 200 },
  // Mundo 2 — Exterior do Prédio
  { id: '2-1',    label: '2-1',    world: 'Mundo 2 — Exterior',     x: 100, y: 330 },
  { id: '2-2',    label: '2-2',    world: 'Mundo 2 — Exterior',     x: 175, y: 330 },
  { id: '2-3',    label: '2-3',    world: 'Mundo 2 — Exterior',     x: 250, y: 330 },
  { id: '2-4',    label: '2-4',    world: 'Mundo 2 — Exterior',     x: 325, y: 330 },
  { id: '2-5',    label: '2-5',    world: 'Mundo 2 — Exterior',     x: 400, y: 330 },
  { id: '2-boss', label: '2★',     world: 'Mundo 2 — Exterior',     x: 475, y: 330 },
]
```

> **Nota:** Ajustar as coordenadas `x` e `y` de acordo com o layout visual actual do WorldMapScene. O importante é que os IDs estejam correctos e todos os 18 nós estejam presentes. Os valores acima são uma proposta — verificar o ficheiro original para seguir o mesmo espaçamento.

- [ ] **Step 2: Actualizar o array `worlds` e `worldStartY` se necessário**

Confirmar que o array de `worlds` contém os 3 mundos:

```typescript
const worlds = [
  'Mundo 0 — Apartamento',
  'Mundo 1 — Cidade',
  'Mundo 2 — Exterior',
]
```

- [ ] **Step 3: Verificar compilação TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Correr todos os testes**

```bash
npx vitest run
```

Esperado: todos os testes passam.

- [ ] **Step 5: Commit e push final**

```bash
git add src/scenes/WorldMapScene.ts
git commit -m "feat: update WorldMapScene MAP_NODES with all 18 nodes (6 per world) for Spec A"
git push origin main
```

---

## Verificação Final

Após todas as tasks:

```bash
npx tsc --noEmit && npx vitest run
```

Esperado:
- `tsc --noEmit` → sem erros
- Vitest → todos os testes passam (incluindo os novos em `tests/levels.test.ts` e `tests/ProfileManager.test.ts`)

Iniciar o jogo em desenvolvimento:

```bash
npm run dev
```

Verificar manualmente:
- [ ] Mapa do mundo mostra 18 nós (6 por mundo)
- [ ] 0-1 tem encontro mini-boss (Wall-E com barreiras e barra de HP)
- [ ] 0-boss tem Zelador (3 fases, chaves em arco, slide attack)
- [ ] Cadeia completa 0-1 → 0-2 → 0-3 → 0-4 → 0-5 → 0-boss → 1-1 → ... → 2-boss
- [ ] Perfis antigos são resetados com mensagem de actualização
