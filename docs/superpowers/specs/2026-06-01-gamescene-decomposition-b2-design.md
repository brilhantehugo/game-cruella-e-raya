# Spec B2 — GameScene Decomposition: BossIntro, CollisionSetup, ItemCollectHandler

**Data:** 2026-06-01
**Status:** Aprovado

**Goal:** Extrair mais 3 blocos de GameScene para módulos independentes, reduzindo o arquivo de 1094 para ~780 linhas, sem alterar comportamento.

---

## Contexto

Após a extração de BossSetup (Spec B1), GameScene ainda contém 3 métodos grandes que podem ser isolados com o mesmo padrão (`import type { GameScene }` + `/*internal*/`):

- `_runBossIntro()` — 105 linhas — cinematic de intro do boss
- `_setupCollisions()` — ~216 linhas — toda a física e reações de combate
- `_handleItemCollect()` — 67 linhas — lógica de coleta de itens

---

## Módulo 1: `src/scenes/BossIntro.ts`

### Interface

```typescript
export class BossIntro {
  static run(scene: GameScene): void
}
```

### O que move

- Zoom out da câmera, pan até o boss, shake
- Tabela `BOSS_SPEECHES` com falas dos 4 bosses
- Fade-in/out dos textos de header + speech
- Restauração da câmera, follow do player, ativação do boss

### Novos membros a relaxar em GameScene

| Campo/Método | Linha atual | Por quê |
|---|---|---|
| `_cinematicActive` | 49 | escrito ao iniciar/encerrar cinematic |
| `_followingSprite` | 48 | escrito ao restaurar follow da câmera |

### Chamada em GameScene

```typescript
// Linha ~176, em create():
// Antes: this._runBossIntro()
// Depois:
BossIntro.run(this)
```

---

## Módulo 2: `src/scenes/CollisionSetup.ts`

### Interface

```typescript
export class CollisionSetup {
  static setup(scene: GameScene): void
}
```

### O que move

- Colisões básicas: player + ground/platform/decoration, enemies + ground/platform
- Colisões de plataformas dinâmicas (carryCallback)
- Overlaps de hazards (spikes)
- Overlap player/enemy: stomp, npc_push, churrasco, dano genérico
- Overlap player/item → delega a `ItemCollectHandler.handle()`
- Bark de Cruella: shockwave VFX + reações dos inimigos (stun, ko, counter)
- Projéteis de boss: collider/ground + overlap/player
- Dash de Raya: dano + counter window

### Novos membros a relaxar em GameScene

| Campo/Método | Linha atual | Por quê |
|---|---|---|
| `groundLayer` | 36 | colisões básicas |
| `platformLayer` | 37 | colisões básicas |
| `decorationLayer` | 38 | colisões com sólidos |
| `itemGroup` | 40 | overlap player/item |
| `_movingPlatformGroup` | 70 | plataformas dinâmicas |
| `_hazardGroup` | 67 | spike overlap |
| `_enemyHPBar` | 59 | `show()` no dash hit |
| `_gameOver()` | 884 | chamado nos checks `isDead()` |

### Chamada em GameScene

```typescript
// Em create(), após _spawnItems():
// Antes: this._setupCollisions()
// Depois:
CollisionSetup.setup(this)
```

---

## Módulo 3: `src/scenes/ItemCollectHandler.ts`

### Interface

```typescript
export class ItemCollectHandler {
  static handle(scene: GameScene, type: string, item: Phaser.Physics.Arcade.Image): void
}
```

### O que move

- Switch por tipo de item: `checkpoint`, `exit`, `bone`, `golden_bone`, `pizza`, `heart`, `laco`, `coleira`, `chapeu`, `bandana`, `default` (power-ups)
- Lógica: score, sound, VFX, achievement notify, `item.destroy()`

### Membros necessários — todos já `/*internal*/` após módulos anteriores

`_fx`, `_am`, `_spawnScorePopup`, `_enemyHPBar`, `player`, `currentLevel`, `_levelComplete` — nenhum membro novo a relaxar.

> `_handleItemCollect()` é removido de GameScene (substituído por `ItemCollectHandler.handle()`).

### Chamada em CollisionSetup.ts

```typescript
// No overlap player/item (dentro de CollisionSetup.setup()):
ItemCollectHandler.handle(scene, t, go)
```

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/scenes/BossIntro.ts` | **Criar** — cinematic de intro do boss |
| `src/scenes/CollisionSetup.ts` | **Criar** — toda a lógica de colisão/combate |
| `src/scenes/ItemCollectHandler.ts` | **Criar** — lógica de coleta de itens |
| `src/scenes/GameScene.ts` | Relaxar 10 membros; substituir 3 chamadas; remover `_handleItemCollect`; adicionar 3 imports |

---

## Membros relaxados nesta spec (novos)

`_cinematicActive`, `_followingSprite`, `groundLayer`, `platformLayer`, `decorationLayer`, `itemGroup`, `_movingPlatformGroup`, `_hazardGroup`, `_enemyHPBar`, `_gameOver`

---

## Estratégia de Teste

Refactoring puro — sem nova lógica.

1. `npx vitest run` — mesmo resultado (783 testes)
2. `npm run build` — sem erros TypeScript
3. GameScene deve ficar em ~780 linhas após as 3 extrações

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Extrair `update()` | Loop principal — muito acoplado, risco alto |
| Extrair `_setupCamera()` | 20 linhas — ganho mínimo |
| Extrair `_gameOver()` | 30 linhas — ganho mínimo |
| Injeção de dependência formal | Over-engineering para este tamanho de projeto |
