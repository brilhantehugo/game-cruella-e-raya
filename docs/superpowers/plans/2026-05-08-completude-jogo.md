# Completude do Jogo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o jogo completo como produto final — controles polidos (coyote time, jump buffer, variable jump), heart pickup, diferenciação estratégica de personagens e fechamento do meta-loop de colecionáveis.

**Architecture:** Blocos A e C2 tocam entidades e GameScene; Bloco B2 adiciona um case em GameScene e items nos level data; Bloco C1 é data-only nos level files; Bloco D toca LevelCompleteScene. Todos são independentes entre si. Bloco B1 (UIScene cooldown bar) **já estava implementado** — não há nada a fazer.

**Tech Stack:** TypeScript, Phaser 3 Arcade Physics, Vitest

---

## Arquivos

| Arquivo | Ação | O que muda |
|---|---|---|
| `src/entities/Raya.ts` | Modificar | Coyote time, jump buffer, variable jump |
| `src/entities/Cruella.ts` | Modificar | Coyote time, jump buffer, variable jump (single jump) |
| `src/scenes/GameScene.ts` | Modificar | case `'heart'` em `_handleItemCollect()`, listener bark circle |
| `src/levels/World0.ts` | Modificar | Adicionar heart item em `LEVEL_0_BOSS` |
| `src/levels/World1.ts` | Modificar | Heart em `LEVEL_1_BOSS`, bone #2 de 1-2 em y:48, inimigos agrupados em 1-2 |
| `src/levels/World2.ts` | Modificar | Heart em `LEVEL_2_BOSS`, 3 inimigos em x:1200/1270/1320 em 2-2 |
| `src/levels/World3.ts` | Modificar | Heart em `LEVEL_3_BOSS`, bone #3 de 3-1 em x:2350 |
| `src/scenes/LevelCompleteScene.ts` | Modificar | Badge de 100% ao completar todos golden bones de um mundo |
| `tests/CompletudoJogo.test.ts` | Criar | Testes TDD para level data (Blocos B2, C1) |

---

## Task 1: Testes TDD — escrever e confirmar falha

**Files:**
- Create: `tests/CompletudoJogo.test.ts`

**Contexto:** Os testes verificam estado dos dados antes de mudar o código. Todos devem FALHAR agora (os dados ainda não foram alterados). Apenas level data é testável com Vitest — física e Phaser não são.

- [ ] **Step 1: Criar o arquivo de testes**

```typescript
// tests/CompletudoJogo.test.ts
import { describe, it, expect } from 'vitest'
import { LEVEL_1_2, LEVEL_1_BOSS } from '../src/levels/World1'
import { LEVEL_2_2, LEVEL_2_BOSS } from '../src/levels/World2'
import { LEVEL_3_1, LEVEL_3_BOSS } from '../src/levels/World3'
import { LEVEL_0_BOSS } from '../src/levels/World0'

describe('Bloco B2 — Heart items no level data', () => {
  it('LEVEL_0_BOSS tem pelo menos 1 item heart', () => {
    const hearts = LEVEL_0_BOSS.items?.filter(i => i.type === 'heart') ?? []
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })

  it('LEVEL_1_BOSS tem pelo menos 1 item heart', () => {
    const hearts = LEVEL_1_BOSS.items?.filter(i => i.type === 'heart') ?? []
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })

  it('LEVEL_2_BOSS tem pelo menos 1 item heart', () => {
    const hearts = LEVEL_2_BOSS.items?.filter(i => i.type === 'heart') ?? []
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })

  it('LEVEL_3_BOSS tem pelo menos 1 item heart', () => {
    const hearts = LEVEL_3_BOSS.items?.filter(i => i.type === 'heart') ?? []
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Bloco C1 — Golden bones estratégicos e inimigos agrupados', () => {
  it('LEVEL_1_2 bone #2 (índice 1) está em y <= 48 — requer dash de Raya', () => {
    const bones = LEVEL_1_2.goldenBones ?? []
    expect(bones[1].y).toBeLessThanOrEqual(48)
  })

  it('LEVEL_2_2 tem inimigos em x:1200, x:1270 e x:1320 — favorece latido de Cruella', () => {
    const enemies = LEVEL_2_2.enemies ?? []
    const xs = enemies.map(e => e.x)
    expect(xs).toContain(1200)
    expect(xs).toContain(1270)
    expect(xs).toContain(1320)
  })

  it('LEVEL_3_1 bone #3 (índice 2) está em x:2350 — além do raio de visão padrão', () => {
    const bones = LEVEL_3_1.goldenBones ?? []
    expect(bones[2].x).toBe(2350)
  })
})
```

- [ ] **Step 2: Rodar — devem FALHAR**

```bash
npm test -- tests/CompletudoJogo.test.ts 2>&1 | tail -20
```

Esperado: 7 testes falhando. Se algum passar, o dado já está correto (não é problema — continue).

---

## Task 2: Bloco A — Raya.ts — Coyote time, jump buffer, variable jump

**Files:**
- Modify: `src/entities/Raya.ts`

**Contexto:** `Raya.ts` é um `Phaser.Physics.Arcade.Sprite`. O método `update(speedBonus)` já existe. As variáveis `jumpsLeft`, `cursors`, `wasGrounded` já existem. `jumpsLeft` é resetado para 2 ao pousar. O pulo atual usa `Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.jumpsLeft > 0`.

- [ ] **Step 1: Adicionar campos privados**

Localizar o bloco de campos privados (logo abaixo da declaração da classe). Após:
```typescript
  private wasGrounded: boolean = false
```

Adicionar:
```typescript
  private _coyoteUntil: number = 0
  private _jumpBufferUntil: number = 0
  private _jumpCut: boolean = false
```

- [ ] **Step 2: Atualizar lógica ao pousar — definir coyote window**

Localizar o bloco de edge detection (onde `wasGrounded` é atualizado). O código atual:
```typescript
    // Edge detection: just landed → reset double jump
    if (onGround && !this.wasGrounded) {
      this.jumpsLeft = 2
      this.emit('landed')
    }
    this.wasGrounded = onGround
```

Substituir por:
```typescript
    // Edge detection: just landed → reset double jump + jump buffer
    if (onGround && !this.wasGrounded) {
      this.jumpsLeft = 2
      this._coyoteUntil = 0
      this._jumpCut = false
      this.emit('landed')
      // Jump buffer: pulo pressionado antes de pousar
      if (this.scene.time.now < this._jumpBufferUntil && this.jumpsLeft > 0) {
        this._jumpBufferUntil = 0
        const jumpVel = gameState.hasPowerUp('pipoca', this.scene.time.now)
          ? PHYSICS.JUMP_VELOCITY * 1.45
          : PHYSICS.JUMP_VELOCITY
        this.setVelocityY(jumpVel)
        this.jumpsLeft--
        this.emit('jumped')
      }
    }
    // Coyote time: define janela ao sair do chão sem pular
    if (!onGround && this.wasGrounded) {
      this._coyoteUntil = this.scene.time.now + 80
    }
    this.wasGrounded = onGround
```

- [ ] **Step 3: Atualizar condição de pulo — incorporar coyote e buffer**

Localizar:
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

Substituir por:
```typescript
    const now = this.scene.time.now
    const coyoteOk = now < this._coyoteUntil && this.jumpsLeft === 2  // só no 1º pulo
    const canJump = this.jumpsLeft > 0 || coyoteOk

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this._jumpBufferUntil = now + 100  // registra intenção de pulo
    }

    if ((Phaser.Input.Keyboard.JustDown(this.cursors.space) || now < this._jumpBufferUntil) && canJump) {
      this._jumpBufferUntil = 0
      const jumpVel = gameState.hasPowerUp('pipoca', now)
        ? PHYSICS.JUMP_VELOCITY * 1.45
        : PHYSICS.JUMP_VELOCITY
      this.setVelocityY(jumpVel)
      this._jumpCut = false

      if (coyoteOk && !onGround) {
        this._coyoteUntil = 0   // consome coyote
        this.jumpsLeft = 1       // usou o 1º pulo via coyote → sobra 1 (double jump)
      } else {
        this.jumpsLeft--
      }
      SoundManager.play(this.jumpsLeft === 0 ? 'doubleJump' : 'jump')
      this.emit('jumped')
    }
```

- [ ] **Step 4: Adicionar variable jump — cortar pulo ao soltar espaço**

Localizar o bloco de animação (após o bloco de pulo, antes do bloco de dash). Antes de:
```typescript
    if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.dashCooldown) {
```

Adicionar:
```typescript
    // Variable jump: soltar espaço enquanto sobe corta o pulo (once per jump)
    const body = this.body as Phaser.Physics.Arcade.Body
    if (!onGround && body.velocity.y < 0 && !this.cursors.space.isDown && !this._jumpCut) {
      this._jumpCut = true
      body.setVelocityY(body.velocity.y * 0.4)
    }

```

- [ ] **Step 5: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/entities/Raya.ts
git commit -m "feat(raya): coyote time (80ms), jump buffer (100ms) e variable jump"
```

---

## Task 3: Bloco A — Cruella.ts — Coyote time, jump buffer, variable jump

**Files:**
- Modify: `src/entities/Cruella.ts`

**Contexto:** `Cruella.ts` tem `jumpsLeft: number = 1` (single jump). A lógica é igual à Raya, mas o coyote só se aplica quando `jumpsLeft === 1` (não tem double jump para gerenciar). Não tem dash, mas tem `shiftKey` para bark.

- [ ] **Step 1: Adicionar campos privados**

Localizar o bloco de campos privados de Cruella. Após:
```typescript
  private barkCooldown: boolean = false
```

Adicionar:
```typescript
  private _coyoteUntil: number = 0
  private _jumpBufferUntil: number = 0
  private _jumpCut: boolean = false
```

- [ ] **Step 2: Atualizar lógica ao pousar**

Localizar em `Cruella.update()` o edge detection de landing. O padrão é similar ao Raya — onde `jumpsLeft` é resetado ao pousar (provavelmente `jumpsLeft = 1`). Substituir:
```typescript
    if (onGround && !this.wasGrounded) {
      this.jumpsLeft = 1
      this.emit('landed')
    }
    this.wasGrounded = onGround
```

Por:
```typescript
    if (onGround && !this.wasGrounded) {
      this.jumpsLeft = 1
      this._coyoteUntil = 0
      this._jumpCut = false
      this.emit('landed')
      // Jump buffer
      if (this.scene.time.now < this._jumpBufferUntil && this.jumpsLeft > 0) {
        this._jumpBufferUntil = 0
        const jumpVel = gameState.hasPowerUp('pipoca', this.scene.time.now)
          ? PHYSICS.JUMP_VELOCITY * 1.45
          : PHYSICS.JUMP_VELOCITY
        this.setVelocityY(jumpVel)
        this.jumpsLeft--
        this.emit('jumped')
      }
    }
    if (!onGround && this.wasGrounded) {
      this._coyoteUntil = this.scene.time.now + 80
    }
    this.wasGrounded = onGround
```

- [ ] **Step 3: Atualizar condição de pulo**

Localizar o JustDown de espaço em Cruella (similar ao Raya mas `jumpsLeft: 1`). Substituir o bloco de pulo existente por:

```typescript
    const now = this.scene.time.now
    const coyoteOk = now < this._coyoteUntil && this.jumpsLeft === 1
    const canJump = this.jumpsLeft > 0 || coyoteOk

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this._jumpBufferUntil = now + 100
    }

    if ((Phaser.Input.Keyboard.JustDown(this.cursors.space) || now < this._jumpBufferUntil) && canJump) {
      this._jumpBufferUntil = 0
      const jumpVel = gameState.hasPowerUp('pipoca', now)
        ? PHYSICS.JUMP_VELOCITY * 1.45
        : PHYSICS.JUMP_VELOCITY
      this.setVelocityY(jumpVel)
      this._jumpCut = false
      if (coyoteOk && !onGround) {
        this._coyoteUntil = 0
        this.jumpsLeft = 0
      } else {
        this.jumpsLeft--
      }
      SoundManager.play('jump')
      this.emit('jumped')
    }
```

- [ ] **Step 4: Adicionar variable jump**

Antes do bloco de bark/shiftKey, adicionar:
```typescript
    // Variable jump
    const body = this.body as Phaser.Physics.Arcade.Body
    if (!onGround && body.velocity.y < 0 && !this.cursors.space.isDown && !this._jumpCut) {
      this._jumpCut = true
      body.setVelocityY(body.velocity.y * 0.4)
    }

```

- [ ] **Step 5: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/entities/Cruella.ts
git commit -m "feat(cruella): coyote time (80ms), jump buffer (100ms) e variable jump"
```

---

## Task 4: Bloco B2 — Heart pickup: GameScene + level data

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/levels/World0.ts`, `World1.ts`, `World2.ts`, `World3.ts`

**Contexto:** `_handleItemCollect()` usa um switch-case por tipo. O case `'pizza'` já faz `gameState.restoreHeart()`. O case `'heart'` é novo — mesma lógica, sprite diferente (usa `KEYS.HEART` que já é preloaded globalmente). Adicionar 1 heart em cada fase de boss.

### Passo GameScene

- [ ] **Step 1: Adicionar case 'heart' em _handleItemCollect()**

Localizar (após o case 'pizza'):
```typescript
      case 'pizza':
        gameState.restoreHeart()
        this._spawnScorePopup(item.x, item.y - 16, '❤️', '#ff6b6b')
        this._am?.notify('item_collected', { type: 'pizza' })
        break
```

Adicionar logo após:
```typescript
      case 'heart':
        gameState.restoreHeart()
        SoundManager.play('collectBone')
        this._spawnScorePopup(item.x, item.y - 16, '❤️ +vida!', '#ff4466')
        break
```

### Passo Level Data (boss levels)

- [ ] **Step 2: Adicionar heart em LEVEL_0_BOSS**

Em `src/levels/World0.ts`, localizar `LEVEL_0_BOSS.items`. Adicionar no array:
```typescript
    { type: 'heart', x: 960, y: 380 },
```
> x:960 é o centro da arena do boss — posição visível e estratégica.

- [ ] **Step 3: Adicionar heart em LEVEL_1_BOSS**

Em `src/levels/World1.ts`, localizar `LEVEL_1_BOSS.items`. Adicionar:
```typescript
    { type: 'heart', x: 960, y: 380 },
```

- [ ] **Step 4: Adicionar heart em LEVEL_2_BOSS**

Em `src/levels/World2.ts`, localizar `LEVEL_2_BOSS.items`. Adicionar:
```typescript
    { type: 'heart', x: 960, y: 380 },
```

- [ ] **Step 5: Adicionar heart em LEVEL_3_BOSS**

Em `src/levels/World3.ts`, localizar `LEVEL_3_BOSS.items`. Adicionar:
```typescript
    { type: 'heart', x: 960, y: 380 },
```

- [ ] **Step 6: Rodar testes — Bloco B2 deve passar**

```bash
npm test -- tests/CompletudoJogo.test.ts 2>&1 | tail -15
```

Esperado: os 4 testes de `Bloco B2` passando. Os 3 de `Bloco C1` ainda falham.

- [ ] **Step 7: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built`.

- [ ] **Step 8: Commit**

```bash
git add src/scenes/GameScene.ts src/levels/World0.ts src/levels/World1.ts src/levels/World2.ts src/levels/World3.ts
git commit -m "feat(game): heart pickup — case 'heart' em GameScene e spawn nos níveis boss"
```

---

## Task 5: Bloco C1 — Level data: golden bones estratégicos e inimigos agrupados

**Files:**
- Modify: `src/levels/World1.ts`, `World2.ts`, `World3.ts`

**Contexto:** Três mudanças de dados puras. Zero código novo. O objetivo é criar situações onde uma personagem é claramente superior para alcançar o golden bone.

- [ ] **Step 1: Mover bone #2 de LEVEL_1_2 para plataforma alta (requer dash)**

Em `src/levels/World1.ts`, localizar `LEVEL_1_2.goldenBones`:
```typescript
  goldenBones: [
    { x: 420,  y: 80 },
    { x: 2100, y: 80 },
  ],
```

Substituir por:
```typescript
  goldenBones: [
    { x: 420,  y: 80 },
    { x: 2100, y: 48 },
  ],
```

> y:48 fica acima do alcance de um pulo simples de Cruella (single jump ≈ 160px de altura). Raya dash + double jump alcança. Nota: o level data pode precisar ter uma plataforma em x:2100 para o bone pousar — verificar se a estrutura de tiles já tem plataforma nessa posição. Se não tiver, a posição x:2100 ainda funciona (bone flutua no ar, acessível apenas com dash).

- [ ] **Step 2: Adicionar inimigos agrupados em LEVEL_2_2 (favorece latido de Cruella)**

Em `src/levels/World2.ts`, localizar `LEVEL_2_2.enemies`. Adicionar ao array existente:
```typescript
    { type: 'rato', x: 1200, y: 390 },
    { type: 'rato', x: 1270, y: 390 },
    { type: 'gato', x: 1320, y: 390 },
```

> O latido de Cruella (`BARK_RADIUS * 1.5 = 180px`) atinge os 3 de uma vez. Raya teria que stompar ou desviar de cada um individualmente. O golden bone existente em `{ x: 1344, y: 96 }` fica protegido por esse grupo.

- [ ] **Step 3: Mover bone #3 de LEVEL_3_1 para além do raio de visão**

Em `src/levels/World3.ts`, localizar `LEVEL_3_1.goldenBones`:
```typescript
  goldenBones: [
    { x: 370,  y: 190 },
    { x: 1220, y: 190 },
    { x: 2040, y: 190 },
  ],
```

Substituir por:
```typescript
  goldenBones: [
    { x: 370,  y: 190 },
    { x: 1220, y: 190 },
    { x: 2350, y: 190 },
  ],
```

> `playerAuraRadius: 130` em LEVEL_3_1 significa que o bone em x:2350 (310px à direita do antigo x:2040) é quase invisível sem estratégia. Cruella bark revela inimigos em área (180px) e ajuda navegar no escuro.

- [ ] **Step 4: Rodar testes — todos devem passar**

```bash
npm test -- tests/CompletudoJogo.test.ts 2>&1 | tail -15
```

Esperado: todos os 7 testes passando.

- [ ] **Step 5: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built`.

- [ ] **Step 6: Commit**

```bash
git add src/levels/World1.ts src/levels/World2.ts src/levels/World3.ts
git commit -m "feat(levels): golden bones estratégicos e inimigos agrupados para diferenciação de personagens"
```

---

## Task 6: Bloco C2 — Círculo visual do latido de Cruella

**Files:**
- Modify: `src/scenes/GameScene.ts`

**Contexto:** Em `GameScene.create()`, existe um listener de `swap-fx`. Cruella emite o evento `'bark'` com `(x, y)` em `bark()`. `GameScene` precisa escutar esse evento via `this.player.cruella.on('bark', ...)`. O raio é `PHYSICS.BARK_RADIUS * 1.5` que corresponde a 180px.

- [ ] **Step 1: Adicionar listener de bark em create()**

Localizar em `GameScene.create()` o bloco do listener swap-fx:
```typescript
    this.events.on('swap-fx', ({ x, y, isRaya }: { x: number; y: number; isRaya: boolean }) => {
      this._fx.swapBurst(x, y, isRaya)
    })
    this._puAuraGfx = this.add.graphics()
    this._puAuraGfx.setDepth(5)
```

Adicionar logo após o swap-fx listener (antes de `this._puAuraGfx`):
```typescript
    this.player.cruella.on('bark', (x: number, y: number) => {
      const gfx = this.add.graphics()
      gfx.setDepth(6)
      gfx.lineStyle(2, 0xffffff, 0.6)
      gfx.strokeCircle(x, y, PHYSICS.BARK_RADIUS * 1.5)
      this.tweens.add({
        targets: gfx,
        alpha: 0,
        duration: 400,
        onComplete: () => gfx.destroy(),
      })
    })
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(game): círculo visual do raio de latido ao usar habilidade de Cruella"
```

---

## Task 7: Bloco D — Badge de 100% por mundo em LevelCompleteScene

**Files:**
- Modify: `src/scenes/LevelCompleteScene.ts`

**Contexto:** `LevelCompleteScene.create()` recebe dados passados via `scene.start(KEYS.LEVEL_COMPLETE, data)`. `gameState.goldenBones` é um `Record<string, boolean[]>` acumulado durante a sessão. `gameState.currentLevel` tem o formato `'1-3'`, `'1-boss'`, etc. O badge aparece apenas ao terminar um nível boss (quando o mundo está completo).

- [ ] **Step 1: Adicionar constante com golden bones por mundo**

Localizar os imports no topo de `LevelCompleteScene.ts`. Após os imports existentes, adicionar:
```typescript
const WORLD_LEVELS_WITH_BONES: Record<string, string[]> = {
  '0': ['0-1', '0-2', '0-4', '0-5'],
  '1': ['1-1', '1-2', '1-3', '1-4', '1-5'],
  '2': ['2-1', '2-2', '2-3', '2-5'],
  '3': ['3-1', '3-2', '3-3', '3-4', '3-5'],
}
```

> Esses são os níveis com `goldenBones` definidos nos level data (bosses têm array vazio e são excluídos).

- [ ] **Step 2: Adicionar lógica de detecção de 100% e badge**

Localizar o final de `create()` em `LevelCompleteScene.ts` — o bloco onde o botão "próxima fase" é criado (por volta da linha 195-210). Antes do `this.add.text` do botão próximo, adicionar:

```typescript
    // Badge de 100% do mundo ao completar boss
    const lvl = gameState.currentLevel  // ex: '1-boss'
    const worldId = lvl.split('-')[0]   // ex: '1'
    const worldLevels = WORLD_LEVELS_WITH_BONES[worldId] ?? []
    const isBoss = lvl.endsWith('boss')

    if (isBoss && worldLevels.length > 0) {
      const allGolden = worldLevels.every(id =>
        (gameState.goldenBones[id] ?? []).every(Boolean)
      )
      if (allGolden) {
        this.add.rectangle(cx, 60, 320, 36, 0xffd700, 0.15).setScrollFactor(0)
        this.add.text(cx, 60, `🏆 World ${worldId} — 100% completo!`, {
          fontSize: '15px', color: '#ffd700', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setScrollFactor(0)
      }
    }
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/LevelCompleteScene.ts
git commit -m "feat(level-complete): badge de 100% ao completar todos golden bones de um mundo"
```

---

## Task 8: Verificação final

- [ ] **Step 1: Suite completa de testes**

```bash
npm test 2>&1 | tail -10
```

Esperado: todos os testes passando (sem regressões nos testes existentes).

- [ ] **Step 2: Build limpo**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros.

- [ ] **Step 3: Checklist de comportamento**

Verificar mentalmente:
- ✅ Cair de uma plataforma e pular imediatamente ainda funciona (coyote 80ms)
- ✅ Pressionar espaço antes de pousar registra o pulo (jump buffer 100ms)
- ✅ Tap no espaço = pulo baixo; hold = pulo máximo (variable jump)
- ✅ Raya coyote não consome o double jump (ainda tem 1 pulo após coyote)
- ✅ Coletar heart nos níveis boss restaura 1 vida com popup "❤️ +vida!"
- ✅ Golden bone de 1-2 em y:48 inacessível com pulo simples de Cruella
- ✅ Grupo de inimigos em 2-2 x:1200–1320 favorece latido em área de Cruella
- ✅ Golden bone de 3-1 em x:2350 está no escuro (além do playerAuraRadius:130)
- ✅ Bark de Cruella exibe círculo branco translúcido por 400ms
- ✅ Badge dourado aparece em LevelCompleteScene ao terminar boss com 100% do mundo
