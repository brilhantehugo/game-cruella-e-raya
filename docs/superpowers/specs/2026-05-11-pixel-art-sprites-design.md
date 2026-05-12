# Spec J — Pixel Art Sprites (GPT Image 2.0 + Nano Banana 2)

**Data:** 2026-05-11
**Status:** Aprovado

**Goal:** Gerar sprites pixel art reais para os 4 personagens que atualmente usam geração procedural (canvas) ou sprite emprestado com tint, integrando-os no jogo com fallback automático para o código procedural existente.

**Inspiração:** Vídeo "Stop Generating Fake Pixel Art Game Sprites" — GPT Image 2.0 com Nano Banana 2 gera pixel art verdadeiro (grid alinhado, sem anti-aliasing falso) ao contrário de filtros de pixelização genéricos.

---

## Personagens Alvo

| Personagem | Situação Atual | Arquivo Alvo | Tamanho |
|---|---|---|---|
| Aspirador (Wall-E) | Gerado em canvas (`gen()`) | `public/sprites/aspirador.png` | 36×20 px |
| Drone de Vigilância | Gerado em canvas (`gen()`) | `public/sprites/drone.png` | 32×18 px |
| Segurança na Moto | Gerado em canvas (`gen()`) | `public/sprites/seguranca-moto.png` | 60×50 px |
| Zelador | `KEYS.HUGO` + `setTint(0xdddddd)` | `public/sprites/zelador.png` | 48×48 px |

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Regenerar sprites existentes (Cruella, Raya, etc.) | Já têm arte própria satisfatória |
| Animações/spritesheets | Esses 4 são imagens estáticas — escopo futuro |
| Automação via API OpenAI | Geração criativa requer revisão humana antes de integrar |

---

## Entregável 1 — Guia de Geração (`docs/sprite-prompts.md`)

Documento com:
- Instrução de ferramenta (GPT Image 2.0, modelo `gpt-image-1`, style Nano Banana 2)
- Prompt base reutilizável
- Prompt específico por personagem
- Checklist de qualidade visual
- Instruções de exportação

### Prompt Base

```
true pixel art, [DESCRIÇÃO], [W]x[H] pixel canvas, transparent background,
Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, no blur,
game sprite, side view
```

### Prompts por Personagem

**Aspirador (36×20):**
```
true pixel art, robotic vacuum cleaner robot, oval flat disc body viewed from the side,
white-grey body, orange circular LiDAR dome on top-left, small cyan camera eye on right side,
dark grey wheels protruding below, ventilation slits on left edge, grey stripe along middle,
36x20 pixel canvas, transparent background, Nano Banana 2 style, pixel-grid aligned,
no anti-aliasing, game sprite, side view
```

**Drone (32×18):**
```
true pixel art, surveillance drone robot, rectangular dark blue-grey body,
large cyan camera lens centered on front face, symmetric propeller rotors on left and right sides,
dark navy color scheme with blue accent outlines, 32x18 pixel canvas,
transparent background, Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, game sprite, side view
```

**Segurança na Moto (60×50):**
```
true pixel art, security guard riding a dark motorcycle, side view facing left,
dark navy blue motorcycle body with two black wheels, yellow headlight on the left (front),
rider wearing dark navy uniform, black helmet with golden visor, 60x50 pixel canvas,
transparent background, Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, game sprite, side view
```

**Zelador (48×48):**
```
true pixel art, building janitor man, side view patrol pose, grey work uniform with apron,
metal key hanging from belt, holding a mop, angry scowling expression, 48x48 pixel canvas,
transparent background, Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, game sprite, side view
```

### Checklist de Qualidade Visual

Antes de salvar o PNG, verificar:
- [ ] Pixels alinhados em grid (sem pixels "meio-pixel" ou anti-aliasing)
- [ ] Fundo transparente (não branco)
- [ ] Tamanho exato conforme spec (36×20, 32×18, 60×50 ou 48×48)
- [ ] Personagem reconhecível e lê-se bem em escala 2-2.5×
- [ ] Paleta de cores coerente com o estilo visual do jogo (tons escuros/urbanos)

### Como Acessar Nano Banana 2

No ChatGPT (GPT-4o com geração de imagens):
- Clique no ícone de imagem → selecione estilo → procure "Nano Banana 2"
- Ou mencione explicitamente no prompt: `"Nano Banana 2 pixel art style"`
- O estilo força grid de pixels verdadeiro sem anti-aliasing artificial

### Instruções de Exportação

1. Abrir ChatGPT com GPT-4o (acesso ao GPT Image 2.0)
2. Selecionar estilo "Nano Banana 2" ou incluir no prompt
3. Gerar → revisar → se aprovado, baixar PNG
4. Salvar em `public/sprites/` com o nome exato da tabela acima
5. Rodar `npm run build` para verificar no jogo

---

## Entregável 2 — Integração no `BootScene.ts`

### 2a. Adicionar `load.image()` em `preload()`

```typescript
// Sprites gerados com GPT Image 2.0 — fallback procedural em create()
this.load.image(KEYS.ASPIRADOR,      'sprites/aspirador.png')
this.load.image(KEYS.DRONE,          'sprites/drone.png')
this.load.image(KEYS.SEGURANCA_MOTO, 'sprites/seguranca-moto.png')
this.load.image(KEYS.ZELADOR,        'sprites/zelador.png')
```

### 2b. Adicionar guard nos `gen()` em `create()`

Envolver cada geração procedural com `if (!this.textures.exists(...))`:

```typescript
// Aspirador — só gera se PNG real não foi carregado
if (!this.textures.exists(KEYS.ASPIRADOR)) {
  clr()
  // ... código existente de geração do aspirador ...
  gen(KEYS.ASPIRADOR, AW, AH)
}

// Drone
if (!this.textures.exists(KEYS.DRONE)) {
  clr()
  // ... código existente ...
  gen(KEYS.DRONE, 32, 18)
}

// Segurança Moto
if (!this.textures.exists(KEYS.SEGURANCA_MOTO)) {
  clr()
  // ... código existente ...
  gen(KEYS.SEGURANCA_MOTO, 60, 50)
}
```

### 2c. Remover tint placeholder do `Zelador.ts`

```typescript
// ANTES:
super(scene, x, y, KEYS.HUGO, config);
this.setTint(0xdddddd);

// DEPOIS:
super(scene, x, y, KEYS.ZELADOR, config);
// sem tint — sprite próprio
```

---

## Fluxo de Uso

```
1. Ler docs/sprite-prompts.md
2. Colar prompt no ChatGPT (GPT Image 2.0, Nano Banana 2)
3. Revisar resultado visualmente (checklist de qualidade)
4. Salvar PNG em public/sprites/
5. npm run build → testar no jogo
6. Repetir para cada personagem
```

A qualquer momento, deletar o PNG reverte automaticamente para o sprite procedural (fallback).

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `docs/sprite-prompts.md` | **Criar** — guia completo de geração |
| `src/scenes/BootScene.ts` | **Modificar** — `preload()` + guards em `create()` |
| `src/entities/enemies/Zelador.ts` | **Modificar** — `KEYS.ZELADOR` em vez de `KEYS.HUGO` + remover tint |
| `public/sprites/aspirador.png` | **Criar** (manualmente via GPT Image 2.0) |
| `public/sprites/drone.png` | **Criar** (manualmente via GPT Image 2.0) |
| `public/sprites/seguranca-moto.png` | **Criar** (manualmente via GPT Image 2.0) |
| `public/sprites/zelador.png` | **Criar** (manualmente via GPT Image 2.0) |
