# Progressão Justa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pontuação, medalhas, ossos dourados e conquistas passam a refletir a tentativa atual da fase, no perfil ativo — sem inflação, sem medalha impossível, sem osso perdido e sem farm.

**Architecture:** Funções puras novas/alteradas (`maxLevelScore`, `calcMedal`, `GameState`, `ProfileManager`, `AchievementManager`) com TDD em Vitest; as cenas Phaser só passam a consumir essas APIs. Uma fonte única de fases (`src/levels/index.ts`) alimenta tudo.

**Tech Stack:** TypeScript, Phaser 3, Vite, Vitest (Phaser mockado em `tests/__mocks__/phaser.ts`), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-10-16-progressao-justa-design.md`

## Global Constraints

- Não alterar valores de `SCORING`, layout de fases nem quantidade de inimigos.
- `localStorage` pode lançar (modo privado/quota): toda leitura/escrita fica em `try/catch` silencioso.
- Saves v2 nunca perdem medalha, `bestScore`, osso ou upgrade; medalhas nunca são rebaixadas.
- Perfis com `version < 2` continuam ignorados (comportamento atual).
- Fora de escopo: timer na pausa, vazamento de listeners, controles, tradução pt-BR.
- Ao fim de cada task: `npx vitest run` verde e `npx tsc --noEmit` sem erros.

## Review Focus

1. **Save v2 com fase de 4 ossos** — ao carregar, o array vira 4 posições e o 4º osso coletado depois é salvo (Task 3).
2. **Morrer depois do checkpoint** — ossos pegos antes do checkpoint não reaparecem e o score volta ao valor do checkpoint (Tasks 4 e 6).
3. **Tela de intro da fase chama `GameScene.create()` duas vezes** — `levelBones` não pode ser reinicializado na segunda chamada (Task 4).
4. **Trocar de perfil na mesma sessão** — conquistas e ossos do perfil anterior não aparecem no novo (Tasks 5 e 6).
5. **`localStorage` lançando exceção** — `AchievementManager._save` hoje não tem `try/catch`; jogo não pode quebrar (Task 5).

## Deviation from spec (refinement)

O spec previa `profileManager.hasGoldenBone()` para decidir se o osso é novo. Como o perfil só é gravado no fim da fase, morrer e recomeçar contaria o mesmo osso de novo. O plano guarda um conjunto `seenBones` (`"levelId:index"`) dentro do próprio estado de conquistas. `hasGoldenBone` não é criado (YAGNI).

---

### Task 1: Fonte única de fases + `maxLevelScore`

**Files:**
- Create: `src/levels/index.ts`
- Create: `src/systems/LevelScoring.ts`
- Modify: `src/scenes/GameScene.ts:92` (usar `ALL_LEVELS` importado)
- Modify: `src/scenes/LevelCompleteScene.ts:6-17` (remover cópia local, importar)
- Test: `tests/LevelScoring.test.ts`

**Interfaces:**
- Produces: `export const ALL_LEVELS: Record<string, LevelData>` (merge de `WORLD0_LEVELS..WORLD3_LEVELS`)
- Produces: `export function maxLevelScore(level: LevelData): number` = `enemies.length × SCORING.ENEMY_KILL + items.filter(type==='bone').length × SCORING.BONE + goldenBones.length × SCORING.GOLDEN_BONE + (isBossLevel ? SCORING.BOSS_KILL : 0)`
- Produces: `export function levelsWithGoldenBones(worldId: string): string[]` — ids de `ALL_LEVELS` cujo id começa com `${worldId}-` e `goldenBones.length > 0`, em ordem de declaração.

- [ ] **Step 1: Write failing tests** in `tests/LevelScoring.test.ts`:
  - `ALL_LEVELS` tem 24 chaves.
  - `maxLevelScore(ALL_LEVELS[id]) > 0` para todo id.
  - Fase sintética `{ enemies: [a,b], items: [{type:'bone'},{type:'pizza'}], goldenBones: [p,p,p], isBossLevel: false }` → `2*50 + 1*10 + 3*500 = 1610`; mesma com `isBossLevel: true` e sem ossos/itens → `1000 + enemies*50`.
  - `levelsWithGoldenBones('0')` contém `'0-3'` e não contém `'0-boss'`; `levelsWithGoldenBones('2')` contém `'2-4'`.
- [ ] **Step 2: Run** `npx vitest run tests/LevelScoring.test.ts` → FAIL (módulos inexistentes).
- [ ] **Step 3: Implement** `src/levels/index.ts` e `src/systems/LevelScoring.ts`; trocar as duas cópias locais de `ALL_LEVELS` pelo import.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `feat: single ALL_LEVELS source + maxLevelScore derived from level data`

---

### Task 2: Nova regra de medalha

**Files:**
- Modify: `src/storage/ProfileManager.ts` (`calcMedal`)
- Test: `tests/ProfileManager.test.ts:148-171` (reescrever bloco `calcMedal`)

**Interfaces:**
- Produces: `static calcMedal(score: number, bonesCollected: number, bonesTotal: number, deaths: number, maxScore: number): Medal`
  - `maxScore <= 0` → `'bronze'`
  - Ouro: `bonesCollected >= bonesTotal && score/maxScore >= 0.8 && deaths === 0`
  - Prata: `(bonesTotal > 0 && bonesCollected >= Math.ceil(bonesTotal / 2)) || (score/maxScore >= 0.6 && deaths <= 2)`
  - Senão bronze.

- [ ] **Step 1: Write failing tests** (substituem os atuais):
  - `calcMedal(1600, 2, 2, 0, 2000)` → `'gold'` (fase com 2 ossos)
  - `calcMedal(1600, 4, 4, 0, 2000)` → `'gold'` (fase com 4 ossos — hoje falha)
  - `calcMedal(900, 0, 0, 0, 1000)` → `'gold'` (boss)
  - `calcMedal(1600, 3, 4, 0, 2000)` → `'silver'` (faltou osso)
  - `calcMedal(1600, 3, 3, 1, 2000)` → `'silver'`
  - `calcMedal(100, 2, 4, 9, 2000)` → `'silver'` (metade dos ossos)
  - `calcMedal(100, 1, 3, 9, 2000)` → `'bronze'`
  - `calcMedal(500, 0, 0, 3, 1000)` → `'bronze'`
- [ ] **Step 2: Run** `npx vitest run tests/ProfileManager.test.ts` → FAIL.
- [ ] **Step 3: Implement** nova assinatura. Atualizar a única chamada (`LevelCompleteScene.ts:53`) para compilar provisoriamente com `goldenBones.filter(Boolean).length, goldenBones.length` (Task 7 troca a fonte de dados).
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `feat: medal rule uses real golden bone count per level`

---

### Task 3: Perfil salva todos os ossos + migração v2 → v3

**Files:**
- Modify: `src/storage/ProfileManager.ts`
- Test: `tests/ProfileManager.test.ts`

**Interfaces:**
- Consumes: `ALL_LEVELS` (Task 1).
- Produces: `SAVE_VERSION = 3`; `_emptyRecord(levelId: string): LevelRecord` com `goldenBones` de tamanho `ALL_LEVELS[levelId]?.goldenBones.length ?? 0`; `saveLevel` faz união em `max(len existente, len novo)`; `getAll()` migra v2 (estende cada `goldenBones` com `false` até o tamanho da fase; `version = 3`) e persiste uma única vez quando houve migração.

- [ ] **Step 1: Write failing tests:**
  - `create` → `levels['0-1'].goldenBones.length === 4`, `levels['1-1'].goldenBones.length === 3`.
  - `saveLevel('0-1', {...goldenBones: [false,false,false,true]})` → perfil tem `[false,false,false,true]`.
  - União: salvar `[true,false,false,false]` depois `[false,false,false,true]` → `[true,false,false,true]`.
  - Migração: gravar direto no storage um perfil `version: 2` com `levels['0-1'] = { medal:'silver', bestScore: 9999, goldenBones:[true,true,true], ... }` e `upgrades: { dash_fast: true }` → `getAll()[0]` tem `version 3`, `goldenBones` `[true,true,true,false]`, `medal 'silver'`, `bestScore 9999`, upgrade mantido; o JSON no storage já está em v3.
  - Perfil `version: 1` continua filtrado.
  - `getTotalGoldenBones()` conta o 4º osso.
- [ ] **Step 2: Run** `npx vitest run tests/ProfileManager.test.ts` → FAIL.
- [ ] **Step 3: Implement.** Atualizar os testes antigos que montam `LevelRecord` com 3 posições só onde a nova lógica muda o resultado esperado.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `feat: persist every golden bone per level + migrate saves v2→v3`

---

### Task 4: GameState — score por fase, total da corrida, ossos por tentativa

**Files:**
- Modify: `src/GameState.ts`
- Test: `tests/GameState.test.ts` (substituir casos das linhas 98, 149-156, 189-196)

**Interfaces:**
- Keeps (por enquanto): `goldenBones` e `collectGoldenBone()` — removidos na Task 7, depois que todos os consumidores migrarem.
- Produces (campos): `runScore = 0`, `checkpointScore = 0`, `levelBones: boolean[] = []`, `checkpointBones: boolean[] = []`.
- Produces (métodos):
  - `ensureLevelBones(count: number): void` — só reinicializa para `Array(count).fill(false)` se `levelBones.length !== count` (idempotente).
  - `collectLevelBone(index: number): void`
  - `commitLevelScore(): void` — `runScore += score`.
- Mudanças: `setCheckpoint` grava `checkpointScore = score` e `checkpointBones = [...levelBones]`; `resetAtCheckpoint` restaura `score = checkpointScore` e `levelBones = [...checkpointBones]`; `resetLevel` zera `score`, `levelBones = []`, `checkpointScore = 0`, `checkpointBones = []` (mantém `runScore`); `reset` zera tudo isso **e** `runScore`.

- [ ] **Step 1: Write failing tests:**
  - `resetLevel` zera `score` e `levelBones`, preserva `runScore`.
  - `reset` zera `runScore`.
  - `ensureLevelBones(4)` duas vezes após `collectLevelBone(1)` → `[false,true,false,false]` (idempotente — Review Focus 3).
  - Sequência: `score=300`, `ensureLevelBones(3)`, `collectLevelBone(0)`, `setCheckpoint(10,20)`, `score=900`, `collectLevelBone(2)`, `resetAtCheckpoint()` → `score 300`, `levelBones [true,false,false]` (Review Focus 2).
  - `score=500; commitLevelScore(); resetLevel(); score=200; commitLevelScore()` → `runScore 700`.
- [ ] **Step 2: Run** `npx vitest run tests/GameState.test.ts` → FAIL.
- [ ] **Step 3: Implement.** Os testes antigos de `goldenBones` em `GameState.test.ts` que afirmam "mantém score" passam a afirmar que `score` zera; os que só checam `goldenBones` ficam até a Task 7.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `feat: per-level score, run total and per-attempt golden bones in GameState`

---

### Task 5: Conquistas por perfil, ossos distintos, storage seguro

**Files:**
- Modify: `src/achievements/AchievementManager.ts`
- Test: `tests/AchievementManager.test.ts`

**Interfaces:**
- Produces: `constructor(onUnlock: (def: AchievementDef) => void, profileId: string | null = null)`; `readonly profileId: string | null`.
- Storage key: `profileId ? \`cruella-achievements:${profileId}\` : 'cruella-achievements'`.
- Primeira carga com `profileId` e sem chave própria → copia o estado da chave legada (se houver); a legada não é apagada.
- `AchievementState` ganha `seenBones: string[]` (default `[]`).
- `NotifyPayload` ganha `index?: number`. Evento `golden_bone` com `levelId`+`index`: incrementa `golden_bones` só se `"levelId:index"` não está em `seenBones` (e o adiciona). Sem `levelId`/`index` → comportamento antigo (incrementa).
- `_load` e `_save` com `try/catch` silencioso.

- [ ] **Step 1: Write failing tests:**
  - Dois managers com ids `'a'` e `'b'`: notify `enemy_killed` em `a` → `b.getCounter('enemies_killed') === 0`.
  - Estado legado com `unlocked: ['first_blood']` → `new AchievementManager(cb, 'a').isUnlocked('first_blood') === true` e a chave legada ainda existe.
  - `golden_bone` `{levelId:'1-1', index:0}` duas vezes → `getCounter('golden_bones') === 1`; depois `index:1` → `2`.
  - Estado persistido e recarregado mantém `seenBones` (recriar manager com mesmo id e repetir o osso → contador inalterado).
  - `localStorage.setItem` lançando → `notify` não lança (Review Focus 5).
- [ ] **Step 2: Run** `npx vitest run tests/AchievementManager.test.ts` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit` → PASS.
- [ ] **Step 5: Commit** `feat: per-profile achievements, distinct golden bone counting, safe storage`

---

### Task 6: Ligar a jogabilidade (GameScene, ItemCollectHandler, AchievementsScene)

**Files:**
- Modify: `src/scenes/GameScene.ts` (`create`, spawn de ossos ~452, `_levelComplete` ~468)
- Modify: `src/scenes/ItemCollectHandler.ts:32-38`
- Modify: `src/scenes/AchievementsScene.ts:27`

**Interfaces:**
- Consumes: `gameState.ensureLevelBones / collectLevelBone / commitLevelScore / levelBones` (Task 4); `AchievementManager(onUnlock, profileId)` (Task 5).

- [ ] **Step 1: GameScene.create** — recriar `this._am` quando `this._am?.profileId !== (profileManager.getActive()?.id ?? null)` (Review Focus 4); depois de resolver `currentLevel`, chamar `gameState.ensureLevelBones(this.currentLevel.goldenBones.length)`.
- [ ] **Step 2: Spawn** — pular `GoldenBone` de índice `i` quando `gameState.levelBones[i]` é `true`.
- [ ] **Step 3: `_levelComplete`** — chamar `gameState.commitLevelScore()` antes de iniciar `LEVEL_COMPLETE`; enviar `goldenBones: [...gameState.levelBones]` e `score: gameState.score`.
- [ ] **Step 4: ItemCollectHandler** — trocar `collectGoldenBone(...)` por `gameState.collectLevelBone(boneIndex)` e `notify('golden_bone', { levelId: gameState.currentLevel, index: boneIndex })`.
- [ ] **Step 5: AchievementsScene** — fallback `new AchievementManager(() => {}, profileManager.getActive()?.id ?? null)`, e só reutilizar `gs._am` se o `profileId` bater.
- [ ] **Step 6: Run** `npx vitest run && npx tsc --noEmit` → PASS.
- [ ] **Step 7: Verify in browser** (preview do dev server): começar 0-1, pegar 1 osso dourado, ativar checkpoint, morrer até game over, ENTER (checkpoint) → osso não reaparece e o HUD mostra o score do checkpoint. Depois R → osso reaparece e HUD mostra 0.
- [ ] **Step 8: Commit** `feat: wire per-attempt bones, run score and per-profile achievements into gameplay`

---

### Task 7: Telas leem do perfil (LevelComplete, Galeria, Ending) + remover tabela manual

**Files:**
- Modify: `src/scenes/LevelCompleteScene.ts` (medalha ~52, ossos ~136, badge ~195, remover `WORLD_LEVELS_WITH_BONES`, `goNext` → Ending)
- Modify: `src/scenes/GalleryScene.ts`
- Modify: `src/scenes/EndingScene.ts:30,75`
- Modify: `src/constants.ts` (remover `MEDAL_THRESHOLDS`)
- Modify: `src/GameState.ts` + `tests/GameState.test.ts` (remover `goldenBones`/`collectGoldenBone` e seus testes)
- Modify: `tests/World3.test.ts` (trocar teste de `MEDAL_THRESHOLDS` por `maxLevelScore > 0` nas fases 3-x)

**Interfaces:**
- Consumes: `ALL_LEVELS`, `maxLevelScore`, `levelsWithGoldenBones` (Task 1); `calcMedal` (Task 2); `profileManager.getActive()/getTotalGoldenBones()` (Task 3); `gameState.runScore` (Task 4).

- [ ] **Step 1: LevelCompleteScene** — `medal = ProfileManager.calcMedal(score, bones.filter(Boolean).length, bones.length, deaths, maxLevelScore(levelData))`; desenhar `bones.length` ícones centralizados (0 ícones em boss); badge 100% usa `levelsWithGoldenBones(worldId)` contra `profileManager.getActive().levels[id].goldenBones.every(Boolean)`, lido **depois** de `saveLevel`; ao ir para o Ending passar `score: gameState.runScore`.
- [ ] **Step 2: GalleryScene** — listar as fases de `levelsWithGoldenBones('0'..'3')` lendo `goldenBones` do perfil ativo (sem perfil → tudo vazio), uma linha por mundo com células `id ●●○`; total `x/64`. Tudo deve caber acima do códex de itens em 800×450 sem sobreposição (ajustar posições do códex se preciso).
- [ ] **Step 3: EndingScene** — `totalGolden = profileManager.getTotalGoldenBones()`; score do `data` (já é `runScore`).
- [ ] **Step 4: Remover `MEDAL_THRESHOLDS`** (atualizar `tests/World3.test.ts`) e remover `gameState.goldenBones`/`collectGoldenBone` — `grep -rn "goldenBones\[\|collectGoldenBone" src` deve voltar vazio fora de `levels/` e `ProfileManager`.
- [ ] **Step 5: Run** `npx vitest run && npm run build && npm run test:e2e` → tudo verde.
- [ ] **Step 6: Verify in browser** — concluir uma fase de 4 ossos pegando os 4 sem morrer: tela mostra 4 ícones e medalha de ouro; Galeria mostra `4/4` para a fase após recarregar a página; trocar de perfil → Galeria e Conquistas do outro perfil não mostram esses dados. Screenshot da tela de fase concluída como prova.
- [ ] **Step 7: Commit** `feat: level complete, gallery and ending read golden bones from profile; drop manual medal table`
