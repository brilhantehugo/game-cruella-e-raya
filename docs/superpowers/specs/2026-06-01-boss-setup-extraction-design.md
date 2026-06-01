# Spec B1 — BossSetup: Extração da Lógica de Boss de GameScene

**Data:** 2026-06-01
**Status:** Aprovado

**Goal:** Mover os 4 blocos de scripting de boss (~230 linhas) para fora de `GameScene._spawnEnemies()` para um novo módulo `BossSetup`, sem alterar comportamento.

---

## Contexto

`GameScene.ts` tem 1287 linhas. Cerca de 230 são blocos `if/else if` dentro de `_spawnEnemies()` que instanciam e configuram os 4 bosses principais. Cada bloco tem a mesma estrutura (instanciar, desabilitar, registrar eventos, iniciar poller) com variações nos valores. Isso torna difícil encontrar lógica não relacionada ao boss na mesma função.

Este spec extrai essa lógica para `src/scenes/BossSetup.ts` como refactoring puro — sem nova funcionalidade, sem mudança de comportamento.

---

## Arquitetura

### Novo arquivo: `src/scenes/BossSetup.ts`

Classe estática com dispatch por `levelId`:

```typescript
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
  private static _setup0Boss(scene: GameScene): void { ... }
  private static _setup1Boss(scene: GameScene): void { ... }
  private static _setup2Boss(scene: GameScene): void { ... }
  private static _setup3Boss(scene: GameScene): void { ... }
}
```

### Modificação em `GameScene.ts`

**1. Campos que saem de `private` para sem modificador** (ficam acessíveis a `BossSetup` no mesmo package):

```typescript
// Antes:            private _mainBoss: Enemy | null = null
// Depois:          /*internal*/ _mainBoss: Enemy | null = null
```

Campos afetados: `player`, `currentLevel`, `enemyGroup`, `_mainBoss`, `_bossProjectileGroup`, `_bossExit`, `_bossStartTime`, `_livesAtBossStart`, `_fx`, `_am`, `_killCountInLevel`

Métodos afetados: `_spawnScorePopup`, `_levelComplete`

**2. Em `_spawnEnemies()`, o bloco `if (this.currentLevel.isBossLevel)` vira:**

```typescript
if (this.currentLevel.isBossLevel) {
  BossSetup.setup(this, this.currentLevel.id)
}
```

---

## Conteúdo de cada método em BossSetup

### `_setup0Boss` — ZeladorBoss

- Instancia `ZeladorBoss` em `(mapWidth / 2, 376)`
- `_bossProjectileGroup = scene.physics.add.group()`
- Eventos: `spawnChave` (adiciona chave ao grupo), `spawnMinion` (adiciona Zelador ao `enemyGroup`), `died` (+1000, notify, deathBurst, popup, reveal `_bossExit`, mensagem "Caminho livre")
- Poller: `time.addEvent({ delay: 100, loop: true })` atualiza `boss.setPlayerPos`

### `_setup1Boss` — SeuBigodes

- Instancia `SeuBigodes` em `(480, 376)`
- Sem `_bossProjectileGroup`
- Eventos: `spawnMinion` (adiciona minion ao `enemyGroup` com handler `died`), `died` (+1000, notify, deathBurst, popup, `collarOfGold = true`, `_levelComplete()`)
- Poller: nenhum (SeuBigodes não usa posição do player)

### `_setup2Boss` — Drone

- Instancia `Drone` em `(mapWidth / 2, 180)`
- `_bossProjectileGroup = scene.physics.add.group()`
- Eventos: `spawnBomb`, `spawnLaser` (ambos adicionam ao grupo com `delayedCall` de auto-destruição), `died` (+500, notify, deathBurst, popup, `_levelComplete()`)
- Poller: `time.addEvent({ delay: 100, loop: true })`

### `_setup3Boss` — SegurancaMoto

- Instancia `SegurancaMoto` em `(mapWidth - 100, 352)`
- `_bossProjectileGroup = scene.physics.add.group()` (criado mas não usado diretamente — SegurancaMoto usa internamente)
- Eventos: `died` (+1000, notify, deathBurst, popup, reveal `_bossExit`)
- Poller: `time.addEvent({ delay: 100, loop: true })`

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/scenes/BossSetup.ts` | **Criar** — 4 métodos de setup + dispatch |
| `src/scenes/GameScene.ts` | **Modificar** — remover ~230 linhas de boss, adicionar `BossSetup.setup(this, id)`, relaxar modificadores em 13 membros |

---

## Estratégia de Teste

Refactoring puro — sem nova lógica. Rede de segurança:

1. `npx vitest run` passa igual antes (783 testes)
2. `npm run build` sem erros TypeScript
3. Smoke test manual: iniciar uma fase de boss, confirmar que o boss aparece e funciona

Não há testes unitários novos a escrever — BossSetup não tem lógica nova para testar.

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Refatorar `_setupMiniBoss` | Mini-boss usa padrão diferente (trigger de zona); spec separado |
| Extrair outros métodos de GameScene | B2 (decomposição ampla) — spec posterior |
| Adicionar novos bosses | Não é objetivo desta spec |
| Criar `BossHandler` interface | Opção B descartada — over-engineering para 4 bosses estáticos |
