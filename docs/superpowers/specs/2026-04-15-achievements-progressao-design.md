# Spec D — Sistema de Achievements & Progressão

**Data:** 2026-04-15  
**Área:** Progressão & Conquistas  
**Estado:** Aprovado

---

## 1. Visão Geral

Adicionar um sistema de achievements independente ao jogo *Cruella e Raya*, com:

- Ecrã próprio (`AchievementsScene`) acessível pelo menu principal
- Toast não-intrusivo no canto superior direito durante o jogo
- 20 achievements em 4 categorias
- Persistência via `localStorage`
- Integração com `GameScene` via chamadas directas ao `AchievementManager`

---

## 2. Arquitectura

### 2.1 Abordagem

**AchievementManager centralizado** (Opção A — escolhida).  
Singleton que:
1. Carrega definições de achievements de `achievements.ts`
2. Mantém contadores e flags em memória
3. Persiste estado em `localStorage["cruella-achievements"]`
4. Expõe `notify(event, payload?)` para o resto do jogo
5. Avalia regras e emite toast via `UIScene` quando uma conquista é desbloqueada

### 2.2 Ficheiros Novos

| Ficheiro | Responsabilidade |
|---|---|
| `src/achievements/AchievementManager.ts` | Singleton — lógica central |
| `src/achievements/achievements.ts` | Array de `AchievementDef` (20 entradas) |
| `src/achievements/AchievementDef.ts` | Interface TypeScript |
| `src/scenes/AchievementsScene.ts` | Ecrã de conquistas |

### 2.3 Ficheiros Modificados

| Ficheiro | Alteração |
|---|---|
| `src/scenes/GameScene.ts` | Adicionar chamadas `AM.notify(...)` nos eventos-chave |
| `src/scenes/UIScene.ts` | Adicionar método `showAchievementToast(def)` |
| `src/scenes/MenuScene.ts` | Adicionar botão "Conquistas" que abre `AchievementsScene` |
| `src/scenes/EndingScene.ts` | Chamar `AM.notify('ending_seen')` |

---

## 3. Estrutura de Dados

### 3.1 AchievementDef

```ts
interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string
  category: 'combat' | 'collection' | 'style' | 'narrative'
  secret?: boolean
  condition:
    | { type: 'counter'; key: string; threshold: number }
    | { type: 'flag';    key: string }
    | { type: 'unlock';  id: string }
}
```

### 3.2 localStorage

**Key:** `cruella-achievements`

```json
{
  "unlocked": ["first_blood", "first_bone"],
  "counters": {
    "enemies_killed": 47,
    "golden_bones": 3,
    "items_collected": 82,
    "pizzas_collected": 2,
    "bosses_defeated": 1
  },
  "flags": {
    "no_damage_boss": false,
    "ending_seen": false,
    "no_death_world_streak": 0,
    "no_death_current_world": null
  }
}
```

---

## 4. Lista de Achievements (20)

### 🗡️ Combate (6)

| ID | Título | Condição |
|---|---|---|
| `first_blood` | Primeira Baixa | Derrotar 1 inimigo |
| `pest_control` | Controlo de Pragas | Derrotar 50 inimigos |
| `exterminator` | Exterminadora | Derrotar 200 inimigos |
| `boss_slayer` | Caçadora de Chefes | Derrotar todos os 4 bosses |
| `speed_kill` | Relâmpago | Derrotar boss em menos de 90s |
| `no_damage_boss` | Intocável | Derrotar qualquer boss sem levar dano |

### 🦴 Colecção (5)

| ID | Título | Condição |
|---|---|---|
| `first_bone` | Boa Menina | Apanhar o 1º golden bone |
| `bone_collector` | Coleccionadora | Apanhar 10 golden bones |
| `bone_master` | Mestre dos Ossos | Apanhar todos os 64 golden bones |
| `item_hoarder` | Acumuladora | Apanhar 100 itens no total |
| `pizza_lover` | Amante de Pizza | Apanhar 5 pizzas |

### 🎯 Estilo de Jogo (5)

| ID | Título | Condição |
|---|---|---|
| `pacifist` | Pacifista | Completar nível sem derrotar nenhum inimigo |
| `speedrunner` | Speedrunner | Completar nível com 60s+ no relógio |
| `no_death_world` | Sem Arranhões | Completar um mundo inteiro sem morrer |
| `checkpoint_free` | Voo Livre | Completar nível sem usar checkpoint |
| `full_health_boss` | Sã e Salva | Derrotar boss com vida cheia |

### 📖 Narrativa (4)

| ID | Título | Condição |
|---|---|---|
| `world_1_done` | Rua Conquistada | Completar o Mundo 1 |
| `world_2_done` | Prédio Conquistado | Completar o Mundo 2 |
| `world_3_done` | Noite Conquistada | Completar o Mundo 3 |
| `true_ending` | Finalmente em Casa | Ver o final completo do jogo |

---

## 5. UI

### 5.1 Toast (durante o jogo)

- Posição: canto superior direito, `scrollFactor: 0`, `depth: 60`
- Conteúdo: ícone + "Conquista Desbloqueada!" + título + descrição
- Animação: fade in 300ms → visível 3s → fade out 400ms
- Empilhável: se múltiplos desbloquearem em simultâneo, aparecem em fila
- Não pausa o jogo

### 5.2 AchievementsScene

- Fundo escuro com tema do jogo
- Header: título "🏆 CONQUISTAS" + contador "X / 20" + barra de progresso
- Tabs de categoria: Todos / Combate / Colecção / Estilo / Narrativa
- Por achievement:
  - **Desbloqueado:** fundo dourado escuro, borda laranja, ✓, título + descrição visíveis
  - **Bloqueado com progresso:** fundo escuro, borda cinza, contador de progresso visível (ex: 47/200)
  - **Secreto bloqueado:** ícone ❓, título "???", descrição "Achievement secreto"
- Botão "Voltar" para MenuScene

---

## 6. Pontos de Integração (GameScene)

| Evento no jogo | Chamada |
|---|---|
| Inimigo morto | `AM.notify('enemy_killed')` |
| Golden bone apanhado | `AM.notify('golden_bone')` |
| Item apanhado | `AM.notify('item_collected', { type })` |
| Boss derrotado | `AM.notify('boss_defeated', { levelId, fightDurationMs, damageTaken, playerHpFull })` |
| Nível completo | `AM.notify('level_complete', { usedCheckpoint, timeLeft, damageTaken, killCount })` |
| Mundo completo | `AM.notify('world_complete', { world })` |
| Ending visto | `AM.notify('ending_seen')` (em `EndingScene`) |

---

## 7. Fora de Âmbito

- Sincronização online / leaderboards
- Achievements por personagem seleccionada
- Notificações push / sistema de notificações externo
- Importar/exportar save

---

## 8. Critérios de Sucesso

1. 20 achievements avaliados correctamente nas condições definidas
2. Estado persiste após fechar e reabrir o browser
3. Toast aparece sem interromper o gameplay
4. `AchievementsScene` mostra estado actualizado em tempo real
5. Zero chamadas de achievement em ficheiros que não sejam GameScene/EndingScene/UIScene
