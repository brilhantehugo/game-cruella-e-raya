# Spec A — Bug Fixes: Stun Icon, Boss Projectile Leak, getHp Deprecated

**Data:** 2026-06-01
**Status:** Aprovado

**Goal:** Corrigir 3 bugs identificados na revisão dos sistemas: ícone de stun estático, vazamento de timers de projéteis do boss no shutdown, e remoção de método deprecated.

---

## Contexto

Revisão geral dos sistemas do jogo identificou 3 bugs independentes de baixo risco, todos com fix cirúrgico sem necessidade de novos arquivos ou refatorações estruturais.

---

## Bug B1 — Ícone de stun não segue o inimigo

### Problema

`Enemy.stun()` cria o `stunIcon` (emoji `😵`) com posição `(this.x, this.y - 30)` uma única vez via `scene.add.text()`. O ícone permanece fixo no ponto onde o inimigo estava ao ser stunado, mesmo que o inimigo se mova posteriormente.

### Fix

Adicionar um listener `preupdate` que reposiciona o ícone a cada frame enquanto o stun estiver ativo. O listener é removido no cleanup do `delayedCall` já existente (que roda quando o stun expira).

**Arquivo:** `src/entities/Enemy.ts` — método `stun()`

```typescript
// Após criar stunIcon, registrar tracker:
const tracker = () => {
  if (stunIcon.active) stunIcon.setPosition(this.x, this.y - 30)
}
this.scene.events.on('preupdate', tracker)

// No delayedCall de cleanup existente, adicionar antes de stunIcon.destroy():
this.scene.events.off('preupdate', tracker)
```

O `stunIcon.active` check dentro do tracker e dentro do `onDeath` já protege contra referência a objeto destruído.

---

## Bug B2 — Timers de projéteis do boss vazam no shutdown

### Problema

`GameScene` usa `this.time.addEvent({ loop: true })` para spawnar projéteis dos bosses. Se o player morre durante o boss fight, o evento `shutdown` destrói a cena — mas os timers podem disparar mais um tick e tentar referenciar o `_bossProjectileGroup` após a cena ter sido destruída, causando erros silenciosos.

### Fix

No bloco `this.events.once('shutdown', ...)` já existente em `GameScene.create()`, adicionar limpeza explícita antes do encerramento:

**Arquivo:** `src/scenes/GameScene.ts` — bloco `shutdown`

```typescript
// Adicionar no shutdown block, antes do }):
if (this._bossProjectileGroup) {
  this.time.removeAllEvents()
  this._bossProjectileGroup.clear(true, true)
  this._bossProjectileGroup = null
}
```

`this.time.removeAllEvents()` é seguro no shutdown pois a cena está sendo destruída. Remove todos os timers da cena sem precisar rastrear referências individuais.

---

## Bug B3 — Método `getHp()` deprecated em Enemy.ts

### Problema

`Enemy.ts` expõe `getHp(): number` marcado com `@deprecated` que retorna `this.hp`. O campo `hp` já é `public` desde refatoração anterior. Manter o método polui a API da classe e pode enganar código futuro.

### Fix

1. Buscar todos os chamadores com `grep -rn "getHp()" src/`
2. Substituir cada ocorrência por `.hp` direto
3. Remover o método de `Enemy.ts`

**Arquivo:** `src/entities/Enemy.ts` — remover 3 linhas

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/entities/Enemy.ts` | Adicionar tracker `preupdate` em `stun()` + remover `getHp()` |
| `src/scenes/GameScene.ts` | Adicionar cleanup de timers/projectiles no bloco `shutdown` |
| Outros (se houver chamadores de `getHp()`) | Substituir `.getHp()` por `.hp` |

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Refatorar stun em `StunIndicator` class | Abordagem B descartada — complexidade desnecessária para efeito cosmético |
| Rastrear timers individualmente no boss | `removeAllEvents()` no shutdown é suficiente e mais simples |
| Outros bugs de gameplay | Fora da lista aprovada — sessão separada se necessário |
