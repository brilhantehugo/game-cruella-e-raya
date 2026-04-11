# Spec A — Expansão dos Mundos 0, 1 e 2

**Data:** 2026-04-11
**Estado:** Aprovado

## Objectivo

Expandir os três mundos existentes para terem pelo menos 5 fases normais + 1 boss cada. Inclui:
- 7 novas fases de conteúdo
- 1 novo boss (Zelador do Prédio)
- 1 novo sistema (mini-boss mid-level com barreiras + barra de vida)
- Renumeração das fases afectadas
- Migração de perfis guardados

---

## Estrutura Final dos Mundos

### Mundo 0 — Apartamento

| ID | Nome | Tipo | Nota |
|----|------|------|------|
| 0-1 | Sala de Estar | Normal | Wall-E como mini-boss mid-level |
| 0-2 | Corredor | **🆕 Normal** | |
| 0-3 | Estacionamento do Prédio | Normal | era 0-2 |
| 0-4 | Estacionamento Nível 1 | **🆕 Normal** | |
| 0-5 | Estacionamento Nível 2 | **🆕 Normal** | |
| 0-boss | Lobby / Saída do Prédio | Boss | Zelador do Prédio |

Cadeia: `0-1 → 0-2 → 0-3 → 0-4 → 0-5 → 0-boss → 1-1`

### Mundo 1 — Cidade

| ID | Nome | Tipo | Nota |
|----|------|------|------|
| 1-1 | Rua | Normal | |
| 1-2 | Beco Escuro | **🆕 Normal** | |
| 1-3 | Praça | Normal | era 1-2 |
| 1-4 | Parque da Cidade | **🆕 Normal** | |
| 1-5 | Mercado | Normal | era 1-3 |
| 1-boss | Boss — Seu Bigodes | Boss | |

Cadeia: `1-1 → 1-2 → 1-3 → 1-4 → 1-5 → 1-boss → 2-1`

### Mundo 2 — Exterior do Prédio

| ID | Nome | Tipo | Nota |
|----|------|------|------|
| 2-1 | Passeio Público | Normal | |
| 2-2 | Pátio Interior | Normal | |
| 2-3 | Garagem de Serviço | **🆕 Normal** | |
| 2-4 | Escadas de Emergência | Normal | era 2-3 |
| 2-5 | Varandas / Fachada | **🆕 Normal** | |
| 2-boss | Telhado — Drone | Boss | |

Cadeia: `2-1 → 2-2 → 2-3 → 2-4 → 2-5 → 2-boss → null`

---

## Track A — Renumeração e Encadeamento

### Ficheiros a alterar

| Ficheiro | Mudança |
|----------|---------|
| `src/levels/World0.ts` | Renomear `LEVEL_0_2` → `LEVEL_0_3`; actualizar `nextLevel` de todas as fases |
| `src/levels/World1.ts` | Renomear `LEVEL_1_2` → `LEVEL_1_3`, `LEVEL_1_3` → `LEVEL_1_5`; actualizar `nextLevel` |
| `src/levels/World2.ts` | Renomear `LEVEL_2_3` → `LEVEL_2_4`; actualizar `nextLevel` |
| `src/constants.ts` | Adicionar MEDAL_THRESHOLDS para 7 novas fases; adicionar KEYS.ZELADOR_BOSS, KEYS.CHAVE |
| `src/scenes/WorldMapScene.ts` | Actualizar MAP_NODES com novos IDs e novas fases |
| `src/storage/ProfileManager.ts` | Adicionar `SAVE_VERSION = 2`; reset automático de perfis com versão < 2 |

### Compatibilidade de perfis

Adicionar constante `SAVE_VERSION = 2` ao `ProfileManager`. Na função de carregamento, verificar a versão do perfil guardado — se `version < 2` ou ausente, apagar o perfil e recomeçar limpo. Mostrar mensagem ao utilizador: `"Actualização do jogo detectada — o teu progresso foi reposto."`.

---

## Track B — Sistema Mini-Boss + Zelador do Prédio

### Sistema Mini-Boss

#### Extensão de LevelData

```typescript
miniBoss?: {
  triggerX:      number   // jogador cruza esta posição → dispara o encontro
  spawnX:        number   // onde o mini-boss aparece
  spawnY:        number
  leftBarrierX:  number   // posição X da barreira esquerda
  rightBarrierX: number   // posição X da barreira direita
}
```

#### Comportamento em GameScene

1. Se `currentLevel.miniBoss` existe, criar zona de trigger invisível (Phaser Zone) em `triggerX`
2. Quando o jogador entra na zona:
   - Spawn do `Aspirador` em `(spawnX, spawnY)`
   - Colocar 2 sprites de grade (`GATE`) em `leftBarrierX` e `rightBarrierX` com physics estática
   - Emitir evento para UIScene mostrar barra de mini-boss
   - Trocar BGM para tema de boss
3. `Aspirador` emite `died`:
   - Remover barreiras (destroy)
   - Emitir evento para UIScene esconder barra de mini-boss
   - Restaurar BGM da fase
   - Atribuir 500 pontos ao jogador

#### Adição à UIScene

Barra de mini-boss: posicionada no topo do ecrã, menor que a barra de boss principal (largura: 200px, altura: 12px). Mostra ícone do Wall-E à esquerda e barra vermelha. Oculta por padrão; visível apenas durante encontro mini-boss.

---

### Boss: Zelador do Prédio

**Ficheiro:** `src/entities/enemies/ZeladorBoss.ts`
**Sprite:** `KEYS.ZELADOR_BOSS` — 32×32px, gerado no BootScene (avental azul escuro, vassoura)

| Atributo | Valor |
|----------|-------|
| HP | 12 hits |
| Velocidade base | 90 px/s |
| Físicas | Normal (gravidade, colide com chão) |
| Escala | 2× |

#### Fases

| Fase | HP % | Tint | Comportamento |
|------|------|------|---------------|
| 1 | 100–67% | normal | Patrulha + lança 1 chave em arco a cada 3000ms |
| 2 | 67–34% | `0xff8800` | Velocidade 130 px/s + 2 chaves por ciclo (2500ms) + esfregão (slide) a cada 5000ms |
| 3 | ≤34% | `0xff4444` | Velocidade 160 px/s + chaves + esfregão + spawn de 1 zelador normal a cada 6000ms |

**Transições de fase:** dois blocos `if` independentes (não `if/else if`) para evitar salto de fase com dano em spike.

#### Projéctil — Chave (`CHAVE`)

- Sprite: 12×6px, linha dourada/prata (gerado no BootScene)
- Lançada em arco médio: `vy = -180`, `vx = ±200` (na direcção do jogador)
- Gravidade normal → parábola
- Emite `spawnChave` → `GameScene` cria body e adiciona ao `_bossProjectileGroup`

#### Esfregão (Slide Attack)

- Carga horizontal a 300 px/s durante 400ms na direcção do jogador
- Tint amarelo (`0xffff00`) durante a carga; reposto no fim
- `camera.shake(80, 0.004)` no início da carga
- Dano de contacto normal durante o slide

#### Morte

- `body.setEnable(false)`
- Tween: `scaleX → 0`, `scaleY → 0`, `alpha → 0`, `angle → 180`, duração 900ms
- `onComplete`: emite `died`, 1000 pontos, `_levelComplete()`

---

## Track C — 7 Novas Fases

Nenhum novo tema de background necessário — todas as fases reutilizam temas existentes.

### Novos sprites (BootScene)

| Key | Descrição | Tamanho |
|-----|-----------|---------|
| `ZELADOR_BOSS` | Zelador maior, avental azul escuro, vassoura | 32×32 |
| `CHAVE` | Chave metálica dourada/prata | 12×6 |

### Especificações das fases

#### 0-2 — Corredor

| Atributo | Valor |
|----------|-------|
| Colunas | 70 |
| backgroundTheme | `apartamento` |
| exitX | 2176 |
| nextLevel | `'0-3'` |
| isBossLevel | false |
| Inimigos | 5 (hugo×2, hannah×2, gato×1) |
| Itens | 8 |
| Golden Bones | 2 |
| Decorações | 8 |
| Medal threshold (Ouro) | 800 |

Plataformas dispostas como portas de apartamento ao longo de um corredor estreito. Poucas plataformas elevadas. Hugo e Hannah patrulham os corredores.

#### 0-4 — Estacionamento Nível 1

| Atributo | Valor |
|----------|-------|
| Colunas | 90 |
| backgroundTheme | `apto_boss` |
| exitX | 2816 |
| nextLevel | `'0-5'` |
| isBossLevel | false |
| Inimigos | 8 (zelador×4, rato×2, gato×2) |
| Itens | 10 |
| Golden Bones | 3 |
| Decorações | 10 |
| Medal threshold (Ouro) | 1400 |

Rampas inclinadas, carros como decoração de fundo, pilares como plataformas. Tema escuro (`apto_boss`). Zeladores patrulham entre carros.

#### 0-5 — Estacionamento Nível 2

| Atributo | Valor |
|----------|-------|
| Colunas | 100 |
| backgroundTheme | `apto_boss` |
| exitX | 3136 |
| nextLevel | `'0-boss'` |
| isBossLevel | false |
| Inimigos | 10 (zelador×5, rato×3, gato×2) |
| Itens | 11 |
| Golden Bones | 3 |
| Decorações | 11 |
| Medal threshold (Ouro) | 1700 |

Similar ao N1 mas mais longo, mais inimigos, plataformas mais altas. Última fase antes do boss.

#### 1-2 — Beco Escuro

| Atributo | Valor |
|----------|-------|
| Colunas | 80 |
| backgroundTheme | `rua` |
| exitX | 2496 |
| nextLevel | `'1-3'` |
| isBossLevel | false |
| Inimigos | 8 (rato×4, gato×3, pombo×1) |
| Itens | 9 |
| Golden Bones | 2 |
| Decorações | 10 |
| Medal threshold (Ouro) | 1200 |

Corredor urbano estreito, plataformas sobrepostas verticalmente (caixotes, escadas de incêndio), ratos predominantes. Pombo único difícil de evitar numa área estreita.

#### 1-4 — Parque da Cidade

| Atributo | Valor |
|----------|-------|
| Colunas | 95 |
| backgroundTheme | `praca` |
| exitX | 2976 |
| nextLevel | `'1-5'` |
| isBossLevel | false |
| Inimigos | 9 (pombo×4, donoNervoso×3, rato×2) |
| Itens | 11 |
| Golden Bones | 3 |
| Decorações | 12 |
| Medal threshold (Ouro) | 1500 |

Espaço aberto com bancos e árvores como plataformas. Pombos atacam em grupos. Donos nervosos com área de detecção ampla. Contraste de ritmo com o Beco anterior.

#### 2-3 — Garagem de Serviço

| Atributo | Valor |
|----------|-------|
| Colunas | 90 |
| backgroundTheme | `exterior` |
| exitX | 2816 |
| nextLevel | `'2-4'` |
| isBossLevel | false |
| Inimigos | 9 (zelador×4, rato×4, pombo×1) |
| Itens | 10 |
| Golden Bones | 3 |
| Decorações | 11 |
| Medal threshold (Ouro) | 1400 |

Subsolo do prédio, rampas descendentes e ascendentes, caixotes de entrega como plataformas. Zeladores e ratos em alta densidade. Tom industrial escuro.

#### 2-5 — Varandas / Fachada

| Atributo | Valor |
|----------|-------|
| Colunas | 100 |
| backgroundTheme | `exterior` |
| exitX | 3136 |
| nextLevel | `'2-boss'` |
| isBossLevel | false |
| Inimigos | 12 (pombo×5, morador×4, rato×3) |
| Itens | 12 |
| Golden Bones | 3 |
| Decorações | 13 |
| Medal threshold (Ouro) | 1900 |

Subida pela fachada exterior do prédio saltando de varanda em varanda. Plataformas curtas e elevadas. Pombos atacam do ar constantemente. Moradores surgem das janelas. Fase mais vertical do Mundo 2.

---

## Ficheiros Afectados — Resumo

| Ficheiro | Track | Tipo de mudança |
|----------|-------|----------------|
| `src/constants.ts` | A + C | Novos KEYS + MEDAL_THRESHOLDS |
| `src/levels/World0.ts` | A + C | Renumeração + 3 novas fases + miniBoss config |
| `src/levels/World1.ts` | A + C | Renumeração + 2 novas fases |
| `src/levels/World2.ts` | A + C | Renumeração + 2 novas fases |
| `src/scenes/BootScene.ts` | C | 2 novos sprites (ZELADOR_BOSS, CHAVE) |
| `src/scenes/GameScene.ts` | B | Sistema mini-boss + ZeladorBoss handlers |
| `src/scenes/UIScene.ts` | B | Barra de mini-boss |
| `src/scenes/WorldMapScene.ts` | A | MAP_NODES actualizados |
| `src/storage/ProfileManager.ts` | A | SAVE_VERSION + migração |
| `src/entities/enemies/ZeladorBoss.ts` | B | Novo ficheiro — boss entity |
| `src/levels/LevelData.ts` | B | Campo `miniBoss?` opcional |

---

## Fora de Âmbito (Spec B)

- World 3 (Rua de Noite)
- Novos tipos de inimigos (segurança, porteiro)
- Sistema de spotlight/visibilidade reduzida
- Patrulhas coordenadas / alertas propagados
