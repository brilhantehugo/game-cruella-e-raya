# Guia de Geração de Sprites — GPT Image 2.0 + Nano Banana 2

## Ferramenta

- **ChatGPT** com modelo GPT-4o (acesso a GPT Image 2.0)
- **Estilo:** Nano Banana 2
  - Clique no ícone de imagem → selecione estilo → procure "Nano Banana 2"
  - Ou inclua `"Nano Banana 2 pixel art style"` no prompt

## Prompt Base

```
true pixel art, [DESCRIÇÃO], [W]x[H] pixel canvas, transparent background,
Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, no blur,
game sprite, side view
```

## Prompts por Personagem

### Aspirador (Wall-E) — 36×20 px → `public/sprites/aspirador.png`

```
true pixel art, robotic vacuum cleaner robot, oval flat disc body viewed from the side,
white-grey body, orange circular LiDAR dome on top-left, small cyan camera eye on right side,
dark grey wheels protruding below, ventilation slits on left edge, grey stripe along middle,
36x20 pixel canvas, transparent background, Nano Banana 2 style, pixel-grid aligned,
no anti-aliasing, game sprite, side view
```

### Drone de Vigilância — 32×18 px → `public/sprites/drone.png`

```
true pixel art, surveillance drone robot, rectangular dark blue-grey body,
large cyan camera lens centered on front face, symmetric propeller rotors on left and right sides,
dark navy color scheme with blue accent outlines, 32x18 pixel canvas,
transparent background, Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, game sprite, side view
```

### Segurança na Moto — 60×50 px → `public/sprites/seguranca-moto.png`

```
true pixel art, security guard riding a dark motorcycle, side view facing left,
dark navy blue motorcycle body with two black wheels, yellow headlight on the left (front),
rider wearing dark navy uniform, black helmet with golden visor, 60x50 pixel canvas,
transparent background, Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, game sprite, side view
```

### Zelador — 48×48 px → `public/sprites/zelador.png`

```
true pixel art, building janitor man, side view patrol pose, grey work uniform with apron,
metal key hanging from belt, holding a mop, angry scowling expression, 48x48 pixel canvas,
transparent background, Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, game sprite, side view
```

## Checklist de Qualidade

Antes de salvar cada PNG:
- [ ] Pixels alinhados em grid (sem pixels "meio-pixel" ou anti-aliasing)
- [ ] Fundo transparente (não branco)
- [ ] Tamanho exato conforme spec acima
- [ ] Personagem reconhecível e lê-se bem em escala 2–2.5×
- [ ] Paleta de cores coerente com o estilo visual urbano do jogo

## Como Acessar Nano Banana 2

No ChatGPT (GPT-4o com geração de imagens):
- Clique no ícone de imagem → selecione estilo → procure "Nano Banana 2"
- Ou mencione explicitamente no prompt: `"Nano Banana 2 pixel art style"`
- O estilo força grid de pixels verdadeiro sem anti-aliasing artificial

## Fluxo de Uso

1. Copiar o prompt do personagem desejado
2. Colar no ChatGPT com estilo Nano Banana 2 selecionado
3. Revisar resultado → se aprovado, baixar PNG
4. Salvar em `public/sprites/` com o nome exato indicado
5. `npm run build` → testar no jogo (o sprite aparece automaticamente)

> Deletar o PNG a qualquer momento reverte para o sprite procedural (fallback automático).
