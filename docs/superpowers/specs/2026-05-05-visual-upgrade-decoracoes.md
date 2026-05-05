# Visual Upgrade — Decorações e Densidade das Fases

**Goal:** Substituir as decorações canvas-drawn mais visíveis por pixel art PNG (Pixel Lab), adicionar 12 novos tipos temáticos por mundo e aumentar a densidade de decorações em todos os 4 mundos.

**Architecture:** Híbrido — PNG via Pixel Lab para os 10 elementos mais visíveis/frequentes; canvas-drawn para os 12 novos tipos menores. Cada mundo recebe novos tipos temáticos e mais instâncias das existentes, com meta de decoração a cada ~150–200px de mapa.

**Tech Stack:** Phaser 3, TypeScript, Pixel Lab MCP (`create_object`), canvas 2D API, Vite

---

## Parte 1 — Sprites PNG via Pixel Lab (`create_object`)

Os 10 elementos selecionados por critério de visibilidade e frequência de uso. Substituem o `gen()` canvas-drawn no BootScene por `this.load.image()`.

### 1.1 Sprites Externos / Rua (World 1, 2, 3)

| Elemento | Key | Dimensão alvo | Descrição para geração |
|---|---|---|---|
| casa | `KEYS.CASA` | 96×80px | residential building facade, side view, 2 floors, door and windows, pixel art |
| loja | `KEYS.LOJA` | 80×64px | small shop front with awning, side view, pixel art |
| arvore | `KEYS.ARVORE` | 40×80px | urban tree, trunk and round leafy top, pixel art side view |
| poste | `KEYS.POSTE` | 16×80px | street lamp post, light at top, pixel art |
| banco | `KEYS.BANCO` | 52×32px | wooden park bench, side view, pixel art |
| carro | `KEYS.CARRO` | 80×46px | parked car, side view, pixel art |

### 1.2 Sprites Internos / Apartamento (World 0)

| Elemento | Key | Dimensão alvo | Descrição para geração |
|---|---|---|---|
| cadeira | `KEYS.CADEIRA` | 34×48px | wooden kitchen chair, side view, pixel art |
| mesa | `KEYS.MESA` | 80×48px | dining table, side view, pixel art |
| grade | `KEYS.GRADE` | 40×64px | metal fence/bars, front view, pixel art |
| fogao | `KEYS.FOGAO` | 48×60px | kitchen stove with burners, front view, pixel art |

### 1.3 Estratégia de fallback

Se `create_object` retornar erro ou qualidade ruim, manter canvas-drawn atual para aquele elemento e marcar como "pendente revisão". Não bloquear os outros sprites.

---

## Parte 2 — Novos Tipos de Decoração (canvas-drawn)

Novos elementos temáticos por mundo. Adicionados ao `BootScene.ts` como canvas-drawn e às constantes em `constants.ts`.

### 2.1 World 0 — Apartamento (interior)

| Tipo | Key | Dimensão | Visual | Blocking |
|---|---|---|---|---|
| quadro | `KEYS.QUADRO` | 48×36px | moldura + retângulo de pintura (paisagem simples) no topo da parede (y baixo) | false |
| planta | `KEYS.PLANTA` | 32×48px | vaso marrom + folhas verdes ovais saindo para cima | false |
| tapete | `KEYS.TAPETE` | 60×12px | retângulo baixo, padrão listrado colorido | false |

### 2.2 World 0 — Estacionamento (levels 0-3, 0-4, 0-5)

| Tipo | Key | Dimensão | Visual | Blocking |
|---|---|---|---|---|
| pilar | `KEYS.PILAR` | 24×80px | pilar de concreto cinza, listras diagonais no topo | true |
| barreira | `KEYS.BARREIRA` | 48×32px | barreira plástica laranja/amarela, baixa e larga | false |

### 2.3 World 1 — Rua (exterior dia)

| Tipo | Key | Dimensão | Visual | Blocking |
|---|---|---|---|---|
| orelhao | `KEYS.ORELHAO` | 24×56px | orelhão azul, cabine pequena + cúpula | false |
| semaforo | `KEYS.SEMAFORO` | 16×64px | poste fino, caixa com 3 círculos (vermelho/amarelo/verde) | false |
| banca | `KEYS.BANCA` | 60×56px | banca de jornal, toldo listrado, revistas expostas | false |

### 2.4 World 2 — Praça / Mercado (exterior)

| Tipo | Key | Dimensão | Visual | Blocking |
|---|---|---|---|---|
| fonte | `KEYS.FONTE` | 64×48px | fonte circular, borda de pedra, água azul central | false |
| floreira | `KEYS.FLOREIRA` | 56×28px | canteiro baixo com flores coloridas (círculos) | false |

### 2.5 World 3 — Rua de Noite (exterior noite)

| Tipo | Key | Dimensão | Visual | Blocking |
|---|---|---|---|---|
| outdoor | `KEYS.OUTDOOR` | 80×56px | estrutura metálica + painel iluminado (retângulo claro) | false |
| bueiro | `KEYS.BUEIRO` | 32×12px | tampão circular cinza no chão, grelha desenhada | false |

---

## Parte 3 — Aumento de Densidade por Mundo

Meta: pelo menos uma decoração a cada 150–200px de mapa. Adicionar instâncias das decorações existentes e dos novos tipos.

### World 0 — Níveis de Apartamento (0-1, 0-2, 0-boss)

Adicionar por fase:
- +2 cadeira, +1 mesa (espaçados entre obstáculos existentes)
- +1 planta (perto de balcão ou estante)
- +1 quadro (y alto, sem blocking)
- +1 tapete (y=416, decorativo no chão)

### World 0 — Níveis de Estacionamento (0-3, 0-4, 0-5)

Adicionar por fase:
- +3–4 pilar (a cada ~200px, blocking=true)
- +2 barreira (entre carros)

### World 1 — Rua (1-1, 1-2, 1-3, 1-boss)

Adicionar por fase:
- +1 orelhao
- +1 semaforo
- +1 banca
- +1 poste (espaçamento atual tem gaps de 400+px)
- +1 lixeira (onde gap > 300px)

### World 2 — Praça/Mercado (2-1, 2-2, 2-3, 2-boss)

Adicionar por fase:
- +1 fonte (centro da fase)
- +2 floreira
- +1 vaso ou canteiro
- +1 lixeira onde gap > 300px

### World 3 — Rua de Noite (3-1, 3-2, 3-3, 3-boss)

Adicionar por fase:
- +1 outdoor
- +2 bueiro (no chão, y=416)
- +1 banco extra
- +1 arvore onde gap > 250px

---

## Parte 4 — Arquitetura de Implementação

### 4.1 Ordem de arquivos a modificar

1. **`src/constants.ts`** — Adicionar keys para os 12 novos tipos: `QUADRO`, `PLANTA`, `TAPETE`, `PILAR`, `BARREIRA`, `ORELHAO`, `SEMAFORO`, `BANCA`, `FONTE`, `FLOREIRA`, `OUTDOOR`, `BUEIRO`

2. **`src/scenes/BootScene.ts`** — Para os 10 elementos PNG: substituir bloco `gen()` + canvas por `this.load.image(KEYS.X, 'sprites/decorations/x.png')`. Para os 12 novos tipos: adicionar blocos canvas-drawn novos.

3. **`public/sprites/decorations/`** — Diretório novo. Recebe os 10 PNGs gerados pelo Pixel Lab.

4. **`src/levels/World0.ts`** — Adicionar instâncias extras + pilar/barreira nos níveis de estacionamento + quadro/planta/tapete nos de apartamento.

5. **`src/levels/World1.ts`** — Adicionar orelhão, semáforo, banca + mais postes/lixeiras.

6. **`src/levels/World2.ts`** — Adicionar fonte, floreiras + mais decorações existentes.

7. **`src/levels/World3.ts`** — Adicionar outdoor, bueiro + mais árvores/bancos.

### 4.2 Geração Pixel Lab

Usar `create_object` com parâmetros:
- `tile_size`: 16 (pixel art estilo retro)
- `description`: descrição específica da tabela acima
- `detail`: "medium"
- `shading`: "basic"

Salvar resultado em `public/sprites/decorations/<nome>.png`.

### 4.3 Integração no BootScene

```typescript
// Antes (canvas-drawn):
gen(KEYS.CASA, cw, ch)
g.fillStyle(0xd4785a)
g.fillRect(...)

// Depois (PNG):
this.load.image(KEYS.CASA, 'sprites/decorations/casa.png')
```

O `this.load.image()` deve ficar na função `preload()`, não em `create()`. Verificar se BootScene tem `preload()` separado de `create()`.

### 4.4 LevelBuilder — suporte a novos tipos

Verificar em `src/entities/LevelBuilder.ts` que os novos tipos estão mapeados no `createDecoration()`. Se `LevelBuilder` usa o `KEYS` dict para resolver sprites, os novos tipos funcionam automaticamente ao adicionar as keys.

---

## Testes

```typescript
// tests/VisualUpgradeDecoracoes.test.ts
describe('Novos tipos de decoração existem nas fases corretas', () => {
  it('World0 apartamento tem quadro, planta, tapete')
  it('World0 estacionamento tem pilar e barreira')
  it('World1 tem orelhao, semaforo e banca')
  it('World2 tem fonte e floreira')
  it('World3 tem outdoor e bueiro')
})

describe('Sprites PNG de decorações foram carregados', () => {
  // Verificar que os arquivos PNG existem em public/sprites/decorations/
  it('casa.png existe')
  it('loja.png existe')
  // ... etc
})
```

---

## Ordem de implementação

```
Task 1: constants.ts — adicionar 12 keys novas
Task 2: Pixel Lab — gerar 10 PNGs (casa, loja, arvore, poste, banco, carro, cadeira, mesa, grade, fogao)
Task 3: BootScene — substituir canvas pelos 10 PNGs + adicionar canvas dos 12 novos tipos
Task 4: World0 — densidade + novos tipos (quadro, planta, tapete, pilar, barreira)
Task 5: World1 — densidade + novos tipos (orelhao, semaforo, banca)
Task 6: World2 — densidade + novos tipos (fonte, floreira)
Task 7: World3 — densidade + novos tipos (outdoor, bueiro)
Task 8: Testes + build final
```

Cada task termina com `npm run build && npm test`.
