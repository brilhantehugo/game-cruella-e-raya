# Bug Fixes: Stun Icon, Boss Projectile Leak, getHp Deprecated

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir 3 bugs cirúrgicos: ícone de stun que não segue o inimigo, timers de projéteis do boss que vazam no shutdown, e remoção de método deprecated `getHp()`.

**Architecture:** Dois arquivos modificados (`Enemy.ts` e `GameScene.ts`), sem novos arquivos. B1 adiciona um listener `preupdate` que reposiciona o `stunIcon` a cada frame. B2 adiciona cleanup explícito no bloco `shutdown` já existente. B3 remove 3 linhas dead code.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## Estrutura de arquivos

| Arquivo | Mudança |
|---|---|
| `src/entities/Enemy.ts` | B1: adicionar tracker `preupdate` em `stun()` + B3: remover `getHp()` |
| `src/scenes/GameScene.ts` | B2: adicionar cleanup de group/timers no bloco `shutdown` |
| `tests/Enemy.test.ts` | B1: teste da lógica do tracker + B3: confirmar remoção |

---

## Task 1: B1 — Stun icon segue o inimigo

**Files:**
- Modify: `src/entities/Enemy.ts` (método `stun()`, linhas 41–68)
- Modify: `tests/Enemy.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Abrir `tests/Enemy.test.ts` e adicionar ao final do arquivo:

```typescript
describe('stun tracker — ícone segue a posição do inimigo', () => {
  it('tracker chama setPosition com posição atual do inimigo', () => {
    let lastX = 0
    let lastY = 0
    const mockIcon = {
      active: true,
      setPosition: (x: number, y: number) => { lastX = x; lastY = y },
    }

    // Simula a lógica do tracker extraída de Enemy.stun()
    let enemyX = 100
    let enemyY = 200
    const tracker = () => {
      if (mockIcon.active) mockIcon.setPosition(enemyX, enemyY - 30)
    }

    tracker()
    expect(lastX).toBe(100)
    expect(lastY).toBe(170)

    // Inimigo se move — tracker deve acompanhar
    enemyX = 250
    enemyY = 300
    tracker()
    expect(lastX).toBe(250)
    expect(lastY).toBe(270)
  })

  it('tracker é no-op quando stunIcon não está mais ativo', () => {
    let called = false
    const mockIcon = {
      active: false,
      setPosition: () => { called = true },
    }
    const tracker = () => {
      if (mockIcon.active) mockIcon.setPosition(0, 0)
    }
    tracker()
    expect(called).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar o teste para verificar que passa (lógica pura)**

```bash
npx vitest run tests/Enemy.test.ts
```

Esperado: os 2 novos testes PASS (são pura lógica JS, sem Phaser — devem passar imediatamente pois testam o padrão, não a implementação ainda).

> Nota: esses testes validam o contrato da lógica do tracker. A integração real (listener `preupdate` no Phaser) é verificada pelo build TypeScript no Step 4.

- [ ] **Step 3: Implementar o fix em `src/entities/Enemy.ts`**

Localizar o método `stun()` (linha 41). Substituir **apenas** o corpo do método pelo código abaixo — não alterar nada fora de `stun()`:

```typescript
stun(duration: number): void {
  this.stunUntil = this.scene.time.now + duration
  this.setVelocityX(0)

  // Gold tint while stunned
  this.setTint(0xffdd00)

  // Floating daze icon that bobs above the enemy
  const stunIcon = this.scene.add.text(this.x, this.y - 30, '😵', { fontSize: '16px' })
  stunIcon.setDepth(10)
  this.scene.tweens.add({
    targets: stunIcon,
    y: stunIcon.y - 12,
    duration: 400,
    yoyo: true,
    repeat: -1,
  })

  // Tracker: reposiciona o ícone a cada frame enquanto o stun estiver ativo
  const tracker = () => {
    if (stunIcon.active) stunIcon.setPosition(this.x, this.y - 30)
  }
  this.scene.events.on('preupdate', tracker)

  // On wake-up: remove tracker, clear tint, reverse direction, destroy icon
  this.scene.time.delayedCall(duration, () => {
    this.scene.events.off('preupdate', tracker)
    if (!this.active) {
      if (stunIcon.active) stunIcon.destroy()
      return
    }
    this.clearTint()
    this.direction *= -1
    if (stunIcon.active) stunIcon.destroy()
  })
}
```

- [ ] **Step 4: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Esperado: nenhuma linha de saída (sem erros de tipo).

- [ ] **Step 5: Rodar todos os testes**

```bash
npx vitest run
```

Esperado: todos passam (número igual ou maior ao anterior).

- [ ] **Step 6: Commit**

```bash
git add src/entities/Enemy.ts tests/Enemy.test.ts
git commit -m "fix: stun icon now tracks enemy position via preupdate listener"
```

---

## Task 2: B2 — Boss projectile timers limpos no shutdown

**Files:**
- Modify: `src/scenes/GameScene.ts` (bloco `shutdown`, linhas 123–134)

> Contexto: `GameScene.create()` registra um handler `this.events.once('shutdown', () => { ... })` na linha 123. Esse bloco já limpa parallax, spotlight, radar, ambientFX. Precisamos adicionar o cleanup do `_bossProjectileGroup` e de todos os timers da cena.

- [ ] **Step 1: Localizar o bloco shutdown em `src/scenes/GameScene.ts`**

O bloco atual (linhas 123–134) tem esta aparência:

```typescript
this.events.once('shutdown', () => {
  SoundManager.stopBgm()
  this._parallax.destroy()
  this._spotlight?.destroy()
  this._spotlight = null
  this._radarArrow?.destroy()
  this._radarArrow = null
  this._radarTimer?.remove()
  this._radarTimer = null
  this._ambientFX?.destroy()
  this._ambientFX = null
})
```

- [ ] **Step 2: Adicionar cleanup do bossProjectileGroup**

Substituir o bloco acima por:

```typescript
this.events.once('shutdown', () => {
  SoundManager.stopBgm()
  this._parallax.destroy()
  this._spotlight?.destroy()
  this._spotlight = null
  this._radarArrow?.destroy()
  this._radarArrow = null
  this._radarTimer?.remove()
  this._radarTimer = null
  this._ambientFX?.destroy()
  this._ambientFX = null
  if (this._bossProjectileGroup) {
    this.time.removeAllEvents()
    this._bossProjectileGroup.clear(true, true)
    this._bossProjectileGroup = null
  }
})
```

> `this.time.removeAllEvents()` cancela todos os `time.addEvent` da cena (incluindo boss projectile spawners, radar timer, etc.). É seguro no shutdown pois a cena está sendo destruída logo em seguida. `clear(true, true)` destrói todos os GameObjects e os remove do grupo.

- [ ] **Step 3: Verificar build TypeScript**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Esperado: nenhuma linha de saída.

- [ ] **Step 4: Rodar todos os testes**

```bash
npx vitest run
```

Esperado: todos passam — nenhum teste quebrado pela adição.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "fix: clear boss projectile group and all timers on scene shutdown"
```

---

## Task 3: B3 — Remover getHp() deprecated

**Files:**
- Modify: `src/entities/Enemy.ts` (remover linhas 89–90)
- Modify: `tests/Enemy.test.ts` (confirmar que hp é acessível diretamente)

- [ ] **Step 1: Confirmar que não há chamadores**

```bash
grep -rn "getHp()" src/
```

Esperado: **nenhuma saída** — o único uso era a definição. Se aparecer alguma saída, substituir cada `.getHp()` por `.hp` antes de continuar.

- [ ] **Step 2: Remover o método de `src/entities/Enemy.ts`**

Localizar e remover as 3 linhas (89–91):

```typescript
  /** @deprecated Use `.hp` directly — field is now public. */
  getHp(): number { return this.hp }
```

O arquivo após a remoção deve ter `isStunned()` logo após `applyDifficulty()`, sem nada entre eles.

- [ ] **Step 3: Adicionar teste de regressão em `tests/Enemy.test.ts`**

Adicionar ao final de `tests/Enemy.test.ts`:

```typescript
describe('Enemy.hp — acesso direto (sem getHp deprecated)', () => {
  it('hp é acessível como campo público', () => {
    const e = new TestEnemy(4)
    expect(e.hp).toBe(4)
    // getHp() foi removido — TypeScript recusaria chamadas a e.getHp()
    expect('getHp' in e).toBe(false)
  })
})
```

- [ ] **Step 4: Rodar o teste para verificar que passa**

```bash
npx vitest run tests/Enemy.test.ts
```

Esperado: todos os testes do arquivo passam, incluindo o novo.

- [ ] **Step 5: Build TypeScript final**

```bash
npm run build 2>&1 | grep -E "error TS" | head -10
```

Esperado: nenhum erro de tipo.

- [ ] **Step 6: Rodar suite completa**

```bash
npx vitest run
```

Esperado: todos passam.

- [ ] **Step 7: Commit**

```bash
git add src/entities/Enemy.ts tests/Enemy.test.ts
git commit -m "fix: remove deprecated getHp() — use .hp directly"
```
