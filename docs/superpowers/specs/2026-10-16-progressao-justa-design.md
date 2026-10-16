# Spec PJ — Progressão Justa (pontuação, medalhas, ossos dourados, conquistas)

**Data:** 2026-10-16
**Status:** Em revisão

**Goal:** Fazer pontuação, medalhas, ossos dourados e conquistas refletirem o que a jogadora fez **naquela fase, naquele perfil** — sem inflação entre fases, sem medalhas impossíveis, sem ossos perdidos e sem farm.

---

## Por quê

A auditoria de 2026-10-16 encontrou que os sistemas de progressão mentem para a jogadora:

1. **Pontuação acumula entre fases.** `resetLevel()` preserva `score`; `LevelCompleteScene` usa `gameState.score` como score da fase. Quem joga em sequência (ENTER) chega nas fases finais com o placar de todas as anteriores → medalha/recorde inflados. Quem entra pelo mapa começa do zero. Reiniciar após game over também mantém os pontos (farm).
2. **Ouro impossível.** `calcMedal` exige `bonesCount === 3`, mas fases têm 0, 2, 3 ou 4 ossos dourados. Impossível em 0-2, 1-2 (2 ossos), nos 4 bosses (0 ossos) e — se pegar todos — nas 6 fases com 4 ossos.
3. **4º osso dourado se perde.** `ProfileManager.saveLevel` faz `.map` sobre um array de 3 posições → o índice 3 nunca é salvo. São 6 ossos (moeda de upgrades) perdidos.
4. **Dados faltando.** `MEDAL_THRESHOLDS` não tem 0-3, 1-5, 2-4 (caem no default 2000). `WORLD_LEVELS_WITH_BONES` (badge 100%) ignora 0-3 e 2-4.
5. **Ossos dourados vivem só na memória da sessão.** `gameState.goldenBones` nunca é carregado do perfil nem limpo no `reset()`: some ao recarregar a página, vaza entre perfis na mesma sessão, e a medalha usa a união da sessão (não a tentativa atual). Galeria, badge 100% e Ending leem esse mapa. A Galeria ainda só lista 1-1..1-3 com "x/3".
6. **Conquistas globais e farmáveis.** Uma única chave `cruella-achievements` para os 3 perfis. O contador `golden_bones` incrementa a cada recoleta → "Mestre dos Ossos (64)" sai repetindo uma fase.

---

## Goals

- Score exibido, medalha e recorde de uma fase dependem só da tentativa dessa fase.
- Ouro é alcançável em **todas** as 24 fases, com critério coerente com o nº real de ossos de cada uma.
- Todos os 64 ossos dourados são salvos no perfil e contam para upgrades.
- Galeria, badge 100%, Ending e mapa leem ossos/medalhas **do perfil ativo**.
- Conquistas são por perfil; conquistas de coleção contam ossos **distintos**.
- Saves existentes (versão 2) continuam funcionando, sem perder nada que a jogadora já tem.

## Non-goals

- Bug do timer correndo durante a pausa e vazamento de listeners (spec separada).
- Rebalancear layout de fases, quantidade de inimigos ou valores de `SCORING`.
- Novas conquistas, novos upgrades, redesenho visual das telas (só ajustar textos/contagens que hoje estão errados).
- Tradução pt-PT → pt-BR.

## Anti-goals (seria fracasso mesmo "funcionando")

- Jogadora abrir o jogo e ver medalhas, ossos, upgrades ou conquistas **a menos** do que tinha.
- Medalha de ouro ficar trivial (ex.: ouro só por terminar).
- Score total do mapa/perfil continuar subindo por replay de uma mesma fase.

---

## Design

### 0. Fonte única das fases

Hoje `ALL_LEVELS` é montado localmente em `GameScene.ts:92` e de novo em `LevelCompleteScene.ts:12`. Criar `src/levels/index.ts` exportando `ALL_LEVELS: Record<string, LevelData>` e trocar as duas cópias por esse import. ProfileManager, Galeria e badge 100% usam o mesmo módulo.

### 1. Pontuação por fase + total da corrida (GameState)

- `gameState.score` passa a significar **score da tentativa atual da fase**. Zera em `reset()` e `resetLevel()` (hoje preserva).
- Novo `gameState.runScore: number` — soma dos scores das fases **concluídas** na corrida atual. Zera em `reset()`; incrementado em `_levelComplete()` antes de ir para `LevelCompleteScene`. Usado só pelo `EndingScene` ("pontuação total").
- Checkpoint: novo `gameState.checkpointScore`, gravado em `setCheckpoint()`. `resetAtCheckpoint()` restaura `score = checkpointScore` (hoje mantém tudo o que foi ganho, inclusive depois do checkpoint).
- HUD (`UIScene`) continua lendo `gameState.score` — agora mostra o score da fase. GameOver idem.

### 2. Ossos dourados por tentativa (GameState + GameScene)

- Remover `gameState.goldenBones: Record<string, boolean[]>` e `collectGoldenBone(level, index)`.
- Novo `gameState.levelBones: boolean[]` — ossos pegos **nesta tentativa**, dimensionado com `currentLevel.goldenBones.length` no `create()` da `GameScene` quando a fase começa do zero (`reset`/`resetLevel`).
- Checkpoint: `checkpointBones` gravado em `setCheckpoint()`; `resetAtCheckpoint()` restaura `levelBones = [...checkpointBones]`. Ossos já pegos (em `levelBones`) **não são re-spawnados** — evita +500 duplicado.
- `_levelComplete()` envia `levelBones` (não a união da sessão) para `LevelCompleteScene`.

### 3. Medalha (ProfileManager.calcMedal + pontuação máxima derivada)

- Substituir a tabela manual `MEDAL_THRESHOLDS` por uma função pura `maxLevelScore(level: LevelData): number` em `src/systems/` — soma `enemies.length × SCORING.ENEMY_KILL + bones (items 'bone') × SCORING.BONE + goldenBones.length × SCORING.GOLDEN_BONE + (isBossLevel ? SCORING.BOSS_KILL : 0)`. Cobre automaticamente fases novas/faltantes.
- Nova assinatura: `calcMedal(score, bonesCollected, bonesTotal, deaths, maxScore)`.
  - `ratio = score / maxScore`
  - **Ouro:** `bonesCollected === bonesTotal` **e** `ratio >= 0.8` **e** `deaths === 0`. Em fase sem ossos (bosses), a condição de ossos é automaticamente satisfeita.
  - **Prata:** (`bonesTotal > 0` e `bonesCollected >= ceil(bonesTotal / 2)`) **ou** (`ratio >= 0.6` e `deaths <= 2`).
  - **Bronze:** caso contrário.
- `LevelCompleteScene` mostra `bonesTotal` ícones (hoje fixo em 3).

### 4. Perfil (ProfileManager) — salvar tudo + migração

- `LevelRecord.goldenBones` passa a ter o tamanho real da fase. `saveLevel` faz união elemento a elemento usando `max(len existente, len novo)` (nada se perde).
- `_emptyRecord(levelId)` dimensiona `goldenBones` pela fase (via `ALL_LEVELS`).
- `SAVE_VERSION` 2 → 3, com **migração** em `getAll()` (não filtro): perfis v2 têm cada `goldenBones` estendido com `false` até o tamanho da fase; medalhas e `bestScore` antigos são **mantidos** (nunca rebaixados). Perfis < 2 continuam ignorados como hoje. A migração persiste o resultado na primeira leitura.
- Novo `profileManager.hasGoldenBone(levelId, index): boolean` (usado pelas conquistas, item 6).

### 5. Leitores de ossos passam a usar o perfil

- **Badge 100% do mundo** (`LevelCompleteScene`): lista derivada de `ALL_LEVELS` (fases do mundo com `goldenBones.length > 0`) e checagem contra o perfil — corrige 0-3 e 2-4.
- **Galeria** (`GalleryScene`): lista todas as fases com ossos, agrupadas por mundo, mostrando `x/N` do perfil.
- **Ending** (`EndingScene`): total de ossos via `profileManager.getTotalGoldenBones()`; score via `gameState.runScore`.

### 6. Conquistas por perfil, sem farm (AchievementManager)

- Chave de storage passa a ser `cruella-achievements:<profileId>` (sem perfil ativo → chave legada, comportamento atual).
- **Migração:** na primeira carga de um perfil sem chave própria, copia o estado legado global (ninguém perde conquistas já desbloqueadas). A chave legada não é apagada.
- Evento `golden_bone` só incrementa o contador se o osso for **novo para o perfil** (`!profileManager.hasGoldenBone(levelId, index)` checado no momento da coleta). Payload ganha `levelId` + `index`.
- `bone_master` passa a ser alcançável com exatamente os 64 ossos distintos (agora todos salvos — item 4).
- Contadores de abate e itens continuam cumulativos (são cumulativos por natureza).

---

## Restrições

- TypeScript + Phaser 3, padrões existentes (funções puras testadas com Vitest em `tests/`, cenas finas).
- Não quebrar os 416 testes atuais; atualizar os que assumem `goldenBones` de 3 posições ou `MEDAL_THRESHOLDS`.
- `localStorage` pode falhar (modo privado) — manter os `try/catch` silenciosos existentes.

## Testes esperados

- `calcMedal`: ouro alcançável com 0, 2, 3 e 4 ossos totais; prata pela metade dos ossos; bronze.
- `maxLevelScore`: valor > 0 para todas as 24 fases de `ALL_LEVELS`.
- `saveLevel`: fase com 4 ossos persiste o 4º; união não reduz o tamanho.
- Migração v2 → v3: arrays estendidos, medalhas/`bestScore` preservados, versão gravada.
- GameState: `resetLevel` zera `score`/`levelBones`; `resetAtCheckpoint` restaura `checkpointScore`/`checkpointBones`; `runScore` só cresce em fase concluída.
- AchievementManager: estado isolado por perfil; cópia do legado na primeira carga; osso repetido não incrementa contador.
- E2E (Playwright) existente continua verde.

## Decisões tomadas por mim (revisar)

1. **HUD mostra o score da fase**, não o total da corrida. O total aparece só no Ending.
2. **Ouro em boss** = sem morrer + ≥ 80% do máximo (na prática: derrotar o boss sem morrer).
3. **Pontuação máxima calculada** a partir dos dados da fase, substituindo os valores escolhidos à mão — os limiares de ouro mudam um pouco em todas as fases.
4. **Recordes antigos inflados são mantidos** (não há como saber o valor real). O score total do perfil pode seguir alto para saves antigos; novos recordes já são justos.
5. **Conquistas legadas são copiadas para cada perfil** na primeira carga, em vez de atribuídas a um só.
