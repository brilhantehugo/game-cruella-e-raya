# Spec II — Redesenho dos Sprites de Raya e Cruella como Lulus da Pomerânia

**Data:** 2026-04-20
**Área:** Arte / Sprites
**Estado:** Aprovado

---

## 1. Visão Geral

Redesenho cirúrgico dos sprites de pixel art de Raya e Cruella em `src/sprites/SpriteData.ts` para que ambas pareçam Lulus da Pomerânia reais. A principal característica a capturar é a **juba densa** (pelo abundante no pescoço e tórax). Nenhuma lógica de jogo, física ou animação é alterada.

| Personagem | Dimensão | Cor atual | Nova cor |
|---|---|---|---|
| Raya | 32×32 | Cinza/preta + bandana amarela | Blue merle (sem acessório) |
| Cruella | 28×28 | Roxa escura + laço rosa | Parti-color preto/branco (sem acessório) |

**Total de arquivos alterados:** 1 (`src/sprites/SpriteData.ts`)  
**Testes automatizados:** nenhuma mudança esperada — 124/124 devem continuar passando.

---

## 2. Abordagem

**Opção B — Redesenho do corpo, arquitetura preservada:**

- Redesenhar `rBase` e `cBase` do zero com silhueta de Lulu
- Atualizar `rP` e `cP` com novas paletas de cor
- Manter `rLegs` / `cLegs` intactos (7 linhas × 6 frames cada)
- Manter `compile()`, exportações `RAYA_SPRITE` / `CRUELLA_SPRITE`, dimensões e estrutura geral

---

## 3. Paletas de Cor

### Raya — Blue Merle

| Char | Hex | Uso |
|------|-----|-----|
| `B` | `#000000` | Contorno, pupila |
| `D` | `#2b3050` | Mancha merle escura (patches) |
| `G` | `#5a6b8a` | Base cinza-azulado |
| `L` | `#8fa3be` | Tom médio / transição |
| `W` | `#ccd8e8` | Áreas claras / juba externa |
| `H` | `#e8eef6` | Highlight branco |
| `.` | transparente | Fundo |

### Cruella — Parti-Color

| Char | Hex | Uso |
|------|-----|-----|
| `B` | `#000000` | Contorno + lado esquerdo preto |
| `K` | `#2a2a2a` | Sombra no lado preto |
| `W` | `#ffffff` | Lado direito branco |
| `S` | `#d8d8d8` | Sombra no lado branco |
| `G` | `#888888` | Transição central / nariz |
| `.` | transparente | Fundo |

---

## 4. Layout dos Sprites

### Raya (32×32) — Zonamento vertical de `rBase` (25 linhas)

```
Rows  0– 3  ▸ Orelhas triangulares pontiagudas + topo da cabeça
Rows  4– 9  ▸ Cabeça redonda / face (focinho levemente pontudo, olhos, nariz)
Rows 10–16  ▸ JUBA — zona mais larga; pelos radiando para fora do pescoço/tórax
Rows 17–21  ▸ Corpo compacto (mais estreito que a juba)
Rows 22–24  ▸ Barriga / transição para as patas
Rows 25–31  ▸ rLegs (inalterado)
```

### Cruella (28×28) — Zonamento vertical de `cBase` (21 linhas)

```
Rows  0– 2  ▸ Orelhas triangulares + topo
Rows  3– 8  ▸ Cabeça / face
Rows  9–14  ▸ JUBA (mesma lógica de bordas dentadas)
Rows 15–18  ▸ Corpo compacto
Rows 19–20  ▸ Barriga / transição
Rows 21–27  ▸ cLegs (inalterado)
```

### Técnica da Juba

A juba é implementada com **bordas dentadas**: alternando chars de pelo claro (`W`/`H` para Raya, `W`/`S` para Cruella) e transparente (`.`) nas colunas externas das rows de juba. O centro dessas rows usa tons mais escuros para profundidade.

Exemplo (Raya, row de juba):
```
..WLGGGDDGGGGLW..  ← borda dentada externa com pelos claros
.WLGGDDDDDDDGGLW.  ← juba mais preenchida
WLGGDDDDDDDDDGGLW  ← row mais larga da juba
```

### Divisão Parti-Color da Cruella

A linha de divisão preto/branco corre **verticalmente pelo centro** (coluna 14 de 28). Lado esquerdo (cols 0–13) usa chars `B`/`K`. Lado direito (cols 14–27) usa `W`/`S`. O nariz (`G`) fica centrado na junção para transição natural.

---

## 5. O que NÃO muda

- `rLegs` / `cLegs` — todas as 6 variantes de animação (idle, walk1–4, jump)
- `compile()` function
- Exportações `RAYA_SPRITE` / `CRUELLA_SPRITE`
- Dimensões dos frames (32×32 e 28×28)
- Qualquer outro sprite (GATO, POMBO, RATO, DONO, BIGODES)
- Física, hitboxes, GameScene, WorldMapScene

---

## 6. Testes e Critérios de Aceitação

**Automatizados:** `npm test` — 124/124 passando (sem mudança de comportamento)  
**Build:** `npm run build` — sem erros TypeScript

**Verificação manual:**

| Critério | Como verificar |
|----------|---------------|
| Raya tem silhueta de juba visível | Sprite em movimento em qualquer level |
| Raya tem cor blue merle (cinza-azulado com manchas escuras) | Sprite idle com zoom no browser |
| Cruella tem divisão esquerda-preta / direita-branca nítida | Sprite idle com zoom |
| Orelhas triangulares visíveis em ambas | Sprite idle |
| Animação de caminhada e pulo sem glitches | Jogar normalmente |
| Acessórios removidos (sem bandana, sem laço) | Inspecionar sprite em qualquer state |

---

## 7. Fora de Escopo

- Mudança nas dimensões dos sprites (32×32 e 28×28 permanecem)
- Ajuste de hitbox ou física
- Novos frames de animação
- Rabo enrolado sobre o dorso (difícil de representar em pixel art lateral — pode ser adicionado numa iteração futura)
- Redesenho de outros personagens (Hugo, Hannah, Zelador, Morador, Gato, etc.)
