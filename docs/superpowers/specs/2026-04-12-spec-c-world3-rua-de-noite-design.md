# Spec C — World 3: A Volta a Casa (Rua de Noite)

**Data:** 2026-04-12
**Status:** Aprovado

---

## Visão Geral

World 3 completa o arco narrativo do jogo: após escapar do telhado (World 2), Raya e Cruella percorrem a rua de noite para chegar a casa. É o mundo final — `3-boss.nextLevel = null` → `EndingScene`.

**Identidade mecânica:** escuridão com spotlight. Um overlay semi-transparente cobre toda a cena; fontes de luz (aura do jogador, lanterna do Segurança, luz de porta) perfuram o overlay com `blendMode: ERASE`. A mecânica aperta progressivamente entre 3-1 e 3-3, alivia em 3-4 (fase de contraste totalmente iluminada) e regressa ao intermédio em 3-5.

---

## Estrutura de Níveis

| ID | Nome | Spotlight | Inimigos principais | Novidade |
|----|------|-----------|---------------------|----------|
| 3-1 | Passeio Nocturno | Fraco — aura 130px | Rato, Gato, Segurança | Introdução ao overlay |
| 3-2 | Parque de Noite | Médio — aura 110px | Gato Selvagem, Pombo, Segurança | 1.ª aparição Gato Selvagem |
| 3-3 | Travessa Escura | Forte — aura 90px | Porteiro, Zelador, Rato | Escuridão máxima; Porteiros bloqueiam atalhos |
| 3-4 | Supermercado 24h | Sem overlay | Dono, Morador, Gato | Contraste intencional — ritmo mais rápido |
| 3-5 | Regresso ao Prédio | Médio — aura 100px | Todos os novos + Zelador | Escalada final |
| 3-boss | Perseguição da Viatura | Só faróis da moto | Segurança em moto | Boss com mecânica de salto sobre farol |

**Encadeamento:** `2-boss.nextLevel` muda de `null` para `'3-1'`. `3-boss.nextLevel = null` → `EndingScene`.

---

## Mecânico de Spotlight

### Implementação técnica

Um novo componente `SpotlightOverlay` (ficheiro: `src/fx/SpotlightOverlay.ts`) encapsula toda a lógica — o `GameScene` apenas instancia e destrói, sem lógica inline.

```typescript
// Interface pública
class SpotlightOverlay {
  constructor(scene: Phaser.Scene, playerAuraRadius: number)
  update(playerX: number, playerY: number, lightSources: LightSource[]): void
  destroy(): void
}

interface LightSource {
  x: number
  y: number
  type: 'circle' | 'cone'
  radius: number
  angle?: number   // graus — só para 'cone'
  spread?: number  // abertura do cone em graus — só para 'cone'
}
```

**Funcionamento por frame:**
1. `RenderTexture` (800×450, depth 50) criado uma vez em `create()`
2. Em cada `update()`: limpar o `RenderTexture`; preencher a preto com alpha 0.82; iterar `lightSources[]` e desenhar círculos/cones com `blendMode: ERASE`
3. O jogador contribui sempre com um círculo (raio variável por nível via `playerAuraRadius`)
4. `GameScene` activa o overlay apenas quando `currentLevel.hasSpotlight === true`

**Raios por nível:**

| Nível | `playerAuraRadius` |
|-------|-------------------|
| 3-1 | 130px |
| 3-2 | 110px |
| 3-3 | 90px |
| 3-4 | — (sem overlay) |
| 3-5 | 100px |
| 3-boss | 80px (só faróis da moto como fontes externas) |

---

## Novos Inimigos

### Segurança (`src/entities/enemies/Seguranca.ts`)

- **Herda de:** `HumanEnemy` (mesma base que Zelador/Morador)
- **Movimento:** patrulha horizontal lenta (60px/s); vira ao bater numa parede ou ao fim de 3s sem movimento
- **Lanterna:** cone direccional 180° × 200px na direcção do flip; contribui para `SpotlightOverlay.lightSources[]` como `type: 'cone'`
- **Estado ALERT:** se o cone tocar o jogador → 0.5s de animação surpresa → perseguição directa por 3s → volta a PATROL se perder contacto visual
- **Derrotado:** salto na cabeça ou dash da Raya; bark da Cruella atordoa 2s (humano — não elimina)
- **Sprite:** gerado no `BootScene` — humano de uniforme escuro, rectângulo amarelo como lanterna

### Porteiro (`src/entities/enemies/Porteiro.ts`)

- **Herda de:** `HumanEnemy`
- **Movimento:** estático — posicionado junto a portas/grades
- **Detecção:** zona de 120px à sua frente; ao detectar jogador → ALERT
- **Ataque:** lança chaves (projectil horizontal) — reutiliza mechânico do `ZeladorBoss`
- **Derrotado:** salto na cabeça ou bark da Cruella
- **Fonte de luz:** rectângulo estático 80×60px na sua posição contribui para `lightSources[]`
- **Sprite:** humano de colete, braços cruzados (inactivo) / braço estendido com chave (ALERT)

### Gato Selvagem (`src/entities/enemies/GatoSelvagem.ts`)

- **Herda de:** `GatoMalencarado` (extensão do comportamento base)
- **Estado base:** WANDER — movimento lento aleatório (velocidade 80px/s)
- **Activação:** se o aura do jogador ou cone de Segurança entrar num raio de 200px → CHASE directo (velocidade 200px/s)
- **Desactivação:** fonte de luz sai do raio de 200px → volta a WANDER após 2s
- **Derrotado:** salto na cabeça; bark da Cruella repele (recua 150px, não elimina)
- **Sprite:** versão mais escura do Gato, olhos brilhantes (pupils amarelas dilatadas)

---

## Boss — Perseguição da Viatura

### Arena e câmera

Fase horizontal longa (tileWidthCols: 60, igual aos outros boss levels). A moto entra pelo lado direito — câmera segue normalmente (jogador foge para a esquerda). Plataformas laterais baixas para esquivar; sem barreira direita (a moto é o limite).

### 3 Fases do Boss

| Fase | HP | Comportamento | Ataque |
|------|-----|--------------|--------|
| 1 | 100%→66% | Perseguição lenta | Farol (spotlight grande); spawn de Gato Selvagem ao ser atingido |
| 2 | 66%→33% | Acelera; muda de faixa verticalmente | Cone de luz que paralisa 1s; spawn de Segurança a pé |
| 3 | 33%→0% | Velocidade máxima; dashes laterais | Combo cone + Gatos Selvagens simultâneos |

### Como derrotar

O jogador não salta *em cima* da moto — salta *por cima do farol* 3× por fase para atingir o Segurança. Dash da Raya permite passar pelo farol sem dano. Cada salto/dash bem-sucedido = 1 hit.

### Diálogo de intro (3-boss)

```
Raya: "Uma moto. Com farol. A vir na nossa direcção."
Cruella: "Dito de outra forma: uma morte bem iluminada."
Raya: "Vou saltar. É o meu plano."
Cruella: "Claro que é."
```

---

## Diálogos dos Níveis Normais

### 3-1: Passeio Nocturno
```
Raya: "Finalmente ar fresco! E... escuridão total."
Cruella: "Há alguém com uma lanterna ao fundo."
Raya: "Amigo ou inimigo?"
Cruella: "Neste bairro? Inimigo."
```

### 3-2: Parque de Noite
```
Raya: "Um parque! De noite! Completamente assustador!"
Cruella: "Há gatos a correr em direcção à nossa luz."
Raya: "...Os gatos correm em direcção à luz agora?"
Cruella: "Aparentemente só os desta rua."
```

### 3-3: Travessa Escura
```
Cruella: "Travessa. Porteiros em cada entrada. Sem alternativa."
Raya: "Podemos ir devagar e não fazer barulho."
Cruella: "Tu. Devagar. Sem barulho."
Raya: "Estou a tentar."
```

### 3-4: Supermercado 24h
```
Raya: "LUZ! Luz a sério! Estou a ver tudo!"
Cruella: "Também significa que toda a gente nos vê a nós."
Raya: "...Devia ter pensado nisso."
Cruella: "Sim."
```

### 3-5: Regresso ao Prédio
```
Raya: "O nosso prédio! Estamos quase!"
Cruella: "Há um segurança de moto lá ao fundo."
Raya: "Vamos a isso."
Cruella: "Pela última vez, espero."
```

---

## worldTransition do 2-boss → World 3

O campo `worldTransition` do `LEVEL_2_BOSS` em `World2.ts` (actualmente vazio) passa a:
```
'Cruella: "Descemos do telhado. Só falta a rua."'
'Raya: "De noite. Sem trela."'
'Cruella: "Encantador."'
```

---

## EndingScene — Ajuste do Momento 0

O texto actual (*"Raya: CONSEGUIMOS! Estamos livres!"*) encaixa perfeitamente para o fim do World 3 — sem alteração necessária.

---

## Mudanças em Ficheiros Existentes

| Ficheiro | Mudança |
|----------|---------|
| `src/levels/World2.ts` | `2-boss.nextLevel = '3-1'`; adicionar `worldTransition` (3 linhas acima) |
| `src/levels/LevelData.ts` | Adicionar `hasSpotlight?: boolean` à interface `LevelData` |
| `src/constants.ts` | Novos KEYS: `GATO_SELVAGEM`, `SEGURANCA`, `PORTEIRO`, `BG_RUA_NOITE_1/2/3`; MEDAL_THRESHOLDS para 3-1 a 3-boss |
| `src/scenes/BootScene.ts` | Gerar sprites dos 3 novos inimigos; registar parallax `rua_noite` |
| `src/scenes/GameScene.ts` | Import WORLD3_LEVELS + 4 novos inimigos (Seguranca, Porteiro, GatoSelvagem, SegurancaMoto); instanciar `SpotlightOverlay` quando `hasSpotlight`; BGM sem alteração (switch existente reutiliza `BGM_WORLD1`/`BGM_BOSS` automaticamente) |
| `src/scenes/WorldMapScene.ts` | Adicionar 6 nós ao `MAP_NODES` (3-1 a 3-boss) |
| `src/scenes/EndingScene.ts` | Nenhuma — narrativa actual serve |

---

## Ficheiros Novos

| Ficheiro | Descrição |
|----------|-----------|
| `src/levels/World3.ts` | 6 definições de nível com `hasSpotlight`, inimigos, decorações |
| `src/entities/enemies/Seguranca.ts` | Inimigo com lanterna, herda HumanEnemy |
| `src/entities/enemies/Porteiro.ts` | Inimigo estático com chaves, herda HumanEnemy |
| `src/entities/enemies/GatoSelvagem.ts` | Gato atraído pela luz, herda GatoMalencarado |
| `src/fx/SpotlightOverlay.ts` | Componente isolado de overlay (RenderTexture + Graphics ERASE) |
| `src/entities/enemies/SegurancaMoto.ts` | Boss do World 3 — moto com farol, 3 fases, herda de Enemy |

---

## Testes Esperados

- [ ] `npm run build` sem erros TypeScript
- [ ] 82 testes existentes continuam a passar (`npm test`)
- [ ] Completar 2-boss navega para 3-1 (não EndingScene)
- [ ] Em 3-1/3-2/3-3/3-5: overlay escuro visível, aura do jogador visível
- [ ] Em 3-4 (supermercado): sem overlay
- [ ] Segurança: cone de lanterna visível; ALERT ao tocar jogador; volta a PATROL após 3s
- [ ] Gato Selvagem: WANDER quando longe da luz; CHASE quando luz entra no raio 200px
- [ ] Porteiro: estático; lança chaves ao detectar jogador em 120px
- [ ] 3-boss: moto persegue da direita; salto sobre farol causa dano; 3 fases com aumento de velocidade
- [ ] Completar 3-boss navega para EndingScene

---

## Fora do Escopo

- Modo co-op local
- Novos BGM tracks (audio procedural reutilizado)
- Vozes/áudio para diálogos
- World 4 ou níveis adicionais
- Sistema de dificuldade adaptativa
