# Design: Sistema de Progressão & Recompensa

**Data:** 2026-04-07
**Status:** Aprovado
**Abordagem escolhida:** B — Sistema Completo

## Resumo

Adicionar ao jogo um sistema completo de progressão persistente com perfis de jogador, mapa de mundo navegável (estilo Mario World), medalhas por fase e histórico de estatísticas. Tudo salvo no `localStorage` via uma camada de acesso centralizada (`ProfileManager`).

---

## 1. Arquitetura

### Novos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/storage/ProfileManager.ts` | CRUD de perfis no localStorage. Único ponto de acesso ao storage. |
| `src/scenes/ProfileSelectScene.ts` | Tela de seleção/criação de perfil. Roda antes do MenuScene. |
| `src/scenes/WorldMapScene.ts` | Mapa de mundo com nós por fase. Desbloqueio, medalhas, navegação. |

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/scenes/LevelCompleteScene.ts` | Adiciona medalha animada, stats de sessão, save no ProfileManager. |
| `src/GameState.ts` | 3 novos contadores de sessão: `sessionDeaths`, `sessionEnemiesKilled`, `sessionStartTime`. |
| `src/scenes/BootScene.ts` | Redireciona para `ProfileSelectScene` se não houver perfil ativo. |
| `src/scenes/MenuScene.ts` | Botão "Jogar" vai para `WorldMapScene`; adiciona opção "Trocar Perfil". |
| `src/scenes/GameOverScene.ts` | Botão "Menu" aponta para `WorldMapScene`. |
| `src/constants.ts` | Adiciona chaves `PROFILE_SELECT`, `WORLD_MAP` em KEYS. Adiciona `MEDAL_THRESHOLDS`. |

### Fluxo de cenas

```
Boot → ProfileSelectScene → Menu → WorldMapScene → Game → LevelCompleteScene → WorldMapScene
                                                                ↑ (game over → WorldMapScene)
```

---

## 2. Modelo de Dados

### Tipos

```typescript
type Medal = 'gold' | 'silver' | 'bronze'

interface LevelRecord {
  completed: boolean
  medal: Medal | null
  bestScore: number
  bestTime: number          // segundos
  goldenBones: boolean[]    // [bone0, bone1, bone2]
  totalDeaths: number
  totalEnemiesKilled: number
  playCount: number
}

interface PlayerProfile {
  id: string                // timestamp único (Date.now().toString())
  name: string              // ex: "Hugo"
  dog: 'raya' | 'cruella'  // cachorra escolhida na criação
  createdAt: number
  lastPlayedAt: number
  currentLevel: string      // última fase acessada, ex: '1-2'
  totalScore: number        // acumulado de todas as fases
  levels: Record<string, LevelRecord>
}
```

### localStorage

- `rcgame_profiles` — `PlayerProfile[]` serializado como JSON
- `rcgame_active_profile` — `string` com o `id` do perfil ativo

O `ProfileManager` é o único módulo que lê/escreve essas chaves. Nenhuma cena acessa `localStorage` diretamente.

---

## 3. Sistema de Medalhas

Calculado via `ProfileManager.calcMedal()` ao final de cada fase.

| Medalha | Critério |
|---|---|
| 🥇 Ouro | 3 golden bones + score ≥ 80% do máximo da fase + 0 mortes |
| 🥈 Prata | 2+ golden bones OU score ≥ 60% do máximo (com ≤ 2 mortes) |
| 🥉 Bronze | Fase concluída (qualquer condição) |

O score máximo por fase (`MEDAL_THRESHOLDS`) é definido em `constants.ts` com base na quantidade de inimigos e itens de cada fase. A medalha salva é sempre a melhor já conquistada na fase — uma prata não substitui um ouro de uma run anterior.

---

## 4. ProfileManager API

```typescript
class ProfileManager {
  // Leitura
  getAll(): PlayerProfile[]
  getActive(): PlayerProfile | null

  // Gestão de perfis
  create(name: string, dog: DogType): PlayerProfile
  setActive(id: string): void
  delete(id: string): void

  // Progresso
  saveLevel(levelId: string, record: LevelRecord): void
  unlockLevel(levelId: string): void
  isUnlocked(levelId: string): boolean
  getMedal(levelId: string): Medal | null

  // Cálculo de medalha (estático, sem efeito colateral)
  static calcMedal(
    score: number,
    bones: boolean[],
    deaths: number,
    maxScore: number
  ): Medal | null
}

export const profileManager = new ProfileManager()
```

Limite: máximo de 3 perfis simultâneos. `create()` lança erro se o limite for atingido.

---

## 5. GameState — Contadores de Sessão

Três campos adicionados ao `GameState` existente:

```typescript
sessionDeaths: number = 0
sessionEnemiesKilled: number = 0
sessionStartTime: number = 0
```

`resetLevel()` já existente recebe mais 3 linhas:

```typescript
this.sessionDeaths = 0
this.sessionEnemiesKilled = 0
this.sessionStartTime = Date.now()
```

`GameScene` incrementa:
- `gameState.sessionDeaths++` cada vez que `gameState.isDead()` é verdadeiro e o jogo dispara um respawn (checkpoint ou reinício de fase). Uma sessão com 2 mortes antes de completar a fase registra `sessionDeaths = 2`.
- `gameState.sessionEnemiesKilled++` quando um inimigo é destruído

---

## 6. Cenas

### ProfileSelectScene

- Exibe até 3 slots de perfil. Slots vazios mostram botão "＋ Novo perfil".
- Criar perfil: campo de texto para nome + escolha de cachorra (Raya ou Cruella).
- Selecionar perfil: clique → `profileManager.setActive(id)` → vai para MenuScene.
- Excluir perfil: botão de lixeira com confirmação (não excluir o perfil ativo).
- Acessível no boot (se não houver perfil ativo) e via "Trocar Perfil" no MenuScene.

### WorldMapScene

- Um mundo por linha. Nós conectados por trilha visual.
- Estado dos nós: concluído (medalha visível) | atual (pulsando) | bloqueado (cadeado).
- Clique em nó desbloqueado → `gameState.currentLevel = levelId` → inicia GameScene.
- Nós bloqueados não são clicáveis.
- Exibe nome do perfil ativo e score total no canto superior.

### LevelCompleteScene (modificada)

Recebe via `scene.start(KEYS.LEVEL_COMPLETE, { stats })` onde `stats` contém:

```typescript
{
  score: number
  time: number          // Date.now() - sessionStartTime (ms)
  goldenBones: boolean[]
  deaths: number
  enemiesKilled: number
  levelId: string
}
```

Sequência de exibição:
1. Medalha aparece com animação de entrada
2. Contadores animados (score, tempo, inimigos, mortes) contam até o valor final
3. Se `score > levelRecord.bestScore`: exibe "Novo recorde! ↑"
4. Exibe golden bones coletadas (preenchidas vs. vazias)
5. Botões: "Próxima Fase" (se `currentLevel.nextLevel` existir) ou "Ver Créditos" (última fase) + "Voltar ao Mapa"
6. Ao sair, chama `profileManager.saveLevel()`. Chama `profileManager.unlockLevel(nextLevel)` apenas se `nextLevel` não for `null`.

---

## 7. Fluxo de Save (passo a passo)

1. Jogador sai pela exit gate em `GameScene`
2. `GameScene` coleta stats de sessão do `gameState`
3. Chama `this.scene.start(KEYS.LEVEL_COMPLETE, { stats })`
4. `LevelCompleteScene` calcula medalha via `ProfileManager.calcMedal()`
5. Exibe resumo animado
6. Ao confirmar: `profileManager.saveLevel(levelId, record)` + `profileManager.unlockLevel(nextLevel)`
7. Navega para `WorldMapScene`

---

## 8. Pontos de Atenção

- **`gameState` vs. `profileManager`:** `gameState` é estado de sessão (volátil, resetável). `profileManager` é persistência (dura entre sessões). Os dois nunca se sincronizam diretamente — apenas `LevelCompleteScene` faz a ponte.
- **Primeira execução:** se `rcgame_profiles` não existe no localStorage, `ProfileManager.getAll()` retorna `[]`. `BootScene` detecta `getActive() === null` e abre `ProfileSelectScene`.
- **Fase 1-1 desbloqueada por padrão:** ao criar um perfil, `unlockLevel('0-1')` e `unlockLevel('1-1')` são chamados automaticamente.
- **Boss levels:** desbloqueados quando a fase anterior ao boss é concluída (mesma lógica de `nextLevel` já existente em `LevelData`).
- **`goldenBones` em `GameState` vs. `LevelRecord`:** `gameState.goldenBones` rastreia os coletados na sessão atual. `LevelRecord.goldenBones` persiste o melhor resultado histórico (OR entre sessões: se já coletou bone[0] antes, continua marcado).
