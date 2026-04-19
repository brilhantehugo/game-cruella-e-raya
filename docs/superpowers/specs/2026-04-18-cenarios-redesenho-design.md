# Spec H — Redesenho dos Cenários (Backgrounds)

**Data:** 2026-04-18
**Área:** Visual / Arte
**Estado:** Aprovado

---

## 1. Visão Geral

Redesenho completo dos 10 temas de fundo do jogo com objetivo de eliminar poluição visual e estabelecer hierarquia clara entre as camadas de parallax.

**Problema:** os backgrounds atuais têm elementos demais por camada, cores saturadas no fundo competindo com os personagens e foreground, e composição sem intenção clara.

**Solução:** abordagem híbrida — camadas distantes permanecem procedurais mas simplificadas, camadas próximas ganham composição mais cuidadosa. Todo o código permanece em `src/scenes/BootScene.ts`. Nenhum asset externo.

---

## 2. Princípio Visual Universal

Uma regra única governa os 10 temas:

| Camada | Papel | Elementos máx. | Saturação | Contraste |
|---|---|---|---|---|
| **L1** (céu / fundo) | Atmosfera e profundidade | 2 | 20–30% | suave |
| **L2** (meio) | Silhuetas identificáveis | 3 | 40–50% | médio |
| **L3** (próximo) | Detalhe arquitetônico | 4 | 70–85% | forte |

**Hierarquia de cor:**
- L1: gradiente de 2 stops (topo → horizonte), cor-base do tema muito dessaturada
- L2: formas geométricas grandes, versão escurecida e dessaturada da cor-base
- L3: tom pleno do tema com borda escura de contraste, máximo 4 tipos de elemento

**O que é removido em todos os temas:**
- Degradês com mais de 2 faixas de cor
- Elementos decorativos puramente ornamentais sem papel narrativo
- Cores vibrantes nas camadas L1 e L2
- Elementos que se repetem em alta frequência (textura excessiva)

---

## 3. Redesenho por Tema

### 3.1 `apartamento` — Sala de Estar (World 0)

| Camada | Conteúdo |
|---|---|
| L1 | Parede bege lisa — gradiente 2 stops (`#f5e6c8` topo → `#e8d4aa` baixo). Nenhum elemento adicional. |
| L2 | Silhueta de sofá grande (retângulo arredondado) + quadro na parede (retângulo estreito). Tons cinza-bege dessaturados (`#c8b89a`, `#b0a080`). |
| L3 | Rodapé horizontal + faixas de piso de madeira (4 faixas alternando `#8B6914` e `#7a5c10`). Sombra leve na base. |

### 3.2 `apto_boss` — Cozinha (World 0-boss)

| Camada | Conteúdo |
|---|---|
| L1 | Grade de azulejos brancos simples (`#f0f0f0` com bordas `#ddd`) + retângulo de luz de janela (branco com alpha 0.3). |
| L2 | Silhueta de armários de cozinha suspensos — cinza frio (`#888a8c`), forma de bloco retangular. |
| L3 | Balcão horizontal + pia (retângulo arredondado) + torneira (L invertido). Tons branco e cinza médio. |

### 3.3 `rua` — Rua Externa Diurna

| Camada | Conteúdo |
|---|---|
| L1 | Gradiente céu: `#87ceeb` (topo) → `#d4eeff` (horizonte). Uma nuvem larga e baixa (elipse branca, alpha 0.7). |
| L2 | 3 prédios em alturas diferentes — blocos cinza-azulados dessaturados (`#7a8a99`, `#6a7a88`). Janelas apenas como faixas escuras regulares. |
| L3 | Calçada (faixa `#aaaaaa`) + 1 poste simples (linha vertical + braço) + 1 janela com grade (retângulo com 2 linhas cruzadas). |

### 3.4 `praca` — Praça / Parque

| Camada | Conteúdo |
|---|---|
| L1 | Gradiente céu: `#a8d8ea` → `#d9eeff`. Uma nuvem suave (elipse branca, alpha 0.6). |
| L2 | Linha de colinas (curva suave, `#7a9a6a` dessaturado) + 2 árvores como triângulos (`#4a6a3a`). |
| L3 | Gramado (faixa `#5a8a4a`) + cerca de madeira (posts verticais + 2 réguas horizontais, `#8B6914`). |

### 3.5 `mercado` — Mercado / Armazém

| Camada | Conteúdo |
|---|---|
| L1 | Gradiente pôr do sol: `#f4a460` (topo) → `#ffd700` (horizonte), dessaturado. |
| L2 | 2 galpões em silhueta — marrom-acinzentado escuro (`#5a4a3a`), telhados em dois ângulos diferentes. |
| L3 | Chão (`#888`) + 1 caixa de madeira (retângulo com linhas de grade simples) + 1 toldo liso (triângulo `#c84b32`). |

### 3.6 `boss` — Boss Noturno

| Camada | Conteúdo |
|---|---|
| L1 | Gradiente noturno: `#1a0a2e` (topo) → `#2d1b4e` (meio). Lua crescente (arco branco) + 3 estrelas (pontos `#ffffff`). |
| L2 | 2 prédios quase-pretos (`#1a1a2a`), borda superior levemente visível (`#2a2a3a`). Sem janelas. |
| L3 | Grade metálica (barras verticais regulares, `#444`) + chão escuro com reflexo horizontal tênue (`#2a2a3a`). |

### 3.7 `exterior` — Fachada do Prédio (World 2)

| Camada | Conteúdo |
|---|---|
| L1 | Gradiente noturno: `#0a1628` → `#1a2a44`. Lua cheia (círculo `#fffff0`, alpha 0.9). |
| L2 | Fachada de prédio — bloco cinza (`#404850`) com 6 janelas iluminadas em grade 2×3 (`#ffe8a0`, alpha 0.8). |
| L3 | Grades verticais de ferro (`#333`) + 2 arbustos em silhueta (elipses `#2a3a1a`) + calçada (`#606060`). |

### 3.8 `patio` — Pátio Interno

| Camada | Conteúdo |
|---|---|
| L1 | Gradiente cinza-azul: `#5a6a7a` → `#8a9aaa`. 1 nuvem pequena (`#ccc`, alpha 0.5). |
| L2 | Muro de tijolo — faixas horizontais com juntas verticais alternadas, tons `#7a5a4a` e `#6a4a3a`. |
| L3 | Chão de paralelepípedo (grid irregular `#888` com bordas `#666`) + varal (linha + 2 peças de roupa como retângulos coloridos simples). |

### 3.9 `telhado` — Telhado Noturno (World 3)

| Camada | Conteúdo |
|---|---|
| L1 | Noturno profundo: `#080818` → `#141428`. Estrelas como pontos brancos (8 pts, posições fixas) + lua (círculo `#f0f0e0`). |
| L2 | Antenas de TV (linhas verticais + diagonais, `#2a2a2a`) + 1 caixa d'água (cilindro simplificado, `#3a3a4a`). |
| L3 | Superfície do telhado — faixas paralelas de telha (`#4a3a2a`) + calha horizontal (`#606060`). |

### 3.10 `rua_noite` — Rua Noturna (World 3)

**Nota:** atualmente reutiliza as layers do tema `exterior`. Passa a ter layers **próprias** com paleta roxa-azulada.

| Camada | Conteúdo |
|---|---|
| L1 | Gradiente noturno roxo: `#0e0a1e` → `#1a1232`. 2 estrelas + luar difuso (elipse `#8888cc`, alpha 0.15, no horizonte). |
| L2 | Silhuetas de 3 prédios (`#18141e`) com 2–3 janelas amarelo-tênue (`#ffe880`, alpha 0.5) cada. |
| L3 | Calçada (`#4a4a5a`) + 1 poste com halo de luz (círculo `#ffe080`, alpha 0.2) + grade baixa horizontal. |

---

## 4. Arquitetura Técnica

### 4.1 Arquivos modificados

| Arquivo | Ação | Detalhe |
|---|---|---|
| `src/scenes/BootScene.ts` | Modificar | Reescrever os 27 blocos existentes + adicionar 3 novos blocos para `rua_noite` |
| `src/constants.ts` | Modificar | Adicionar `BG_RUA_NOITE_1`, `BG_RUA_NOITE_2`, `BG_RUA_NOITE_3` às keys |
| `src/background/ParallaxBackground.ts` | Modificar | Atualizar mapeamento `rua_noite` para usar as 3 novas keys em vez das do `exterior` |

`LevelData.ts`, `GameScene.ts`, `World*.ts` e todos os outros arquivos permanecem intactos.

**Nota:** os outros 9 temas (27 blocos) apenas reescrevem o corpo de drawing — as keys já existem e nenhum outro arquivo precisa de alteração para eles.

### 4.2 Estrutura interna mantida

A função `gen(key, width, height)` e o padrão de chamar `gen()` ao final de cada bloco são preservados. Apenas o corpo de drawing entre o comentário do tema e o `gen()` é reescrito.

### 4.3 Paleta de cores por tema (referência)

| Tema | Cor dominante L3 | L2 (80% escurecida) | L1 (dessaturada) |
|---|---|---|---|
| apartamento | `#8B6914` | `#b0a080` | `#f5e6c8` |
| apto_boss | `#f0f0f0` | `#888a8c` | `#f0f0f0` |
| rua | `#aaaaaa` | `#7a8a99` | `#87ceeb` |
| praca | `#5a8a4a` | `#4a6a3a` | `#a8d8ea` |
| mercado | `#888888` | `#5a4a3a` | `#f4a460` |
| boss | `#444444` | `#1a1a2a` | `#1a0a2e` |
| exterior | `#606060` | `#404850` | `#0a1628` |
| patio | `#888888` | `#6a4a3a` | `#5a6a7a` |
| telhado | `#4a3a2a` | `#2a2a2a` | `#080818` |
| rua_noite | `#4a4a5a` | `#18141e` | `#0e0a1e` |

---

## 5. Testes

- `npm test`: 124/124 devem continuar passando — nenhuma lógica de gameplay é alterada
- `npm run build`: build limpo sem erros TypeScript
- Verificação visual manual: iniciar o jogo e percorrer pelo menos 1 nível de cada mundo para confirmar hierarquia visual (fundo suave → meio reconhecível → foreground contrastado)

---

## 6. Fora de Escopo

- Redesenho dos tiles (chão, plataformas) — sistema de tileset separado
- Redesenho de decorações por nível (`decorations[]` em World*.ts)
- Redesenho dos sprites de personagens e inimigos
- Adição de animações nos backgrounds (nuvens móveis, etc.)
- Assets externos (PNG, SVG) — tudo permanece procedural
