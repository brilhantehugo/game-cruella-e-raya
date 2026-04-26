# Character Sprite Redesign — Design Spec

**Data:** 2026-04-24  
**Âmbito:** Todos os personagens jogáveis, NPCs e inimigos  
**Pipeline:** Pixel Lab MCP → PNG spritesheets  
**Estilo:** 16-bit SNES (24–32 px por frame)

---

## Contexto

Os sprites actuais são gerados proceduralmente em runtime via `Phaser.GameObjects.Graphics` (`BootScene.create()`) ou arrays de pixels hardcoded em `SpriteData.ts`. Esta abordagem tem um tecto de qualidade baixo — as formas são limitadas a rectângulos, círculos e triângulos, sem detalhe de pixel art real. O objectivo é substituir todos os sprites de personagens por ficheiros PNG de alta qualidade gerados com o Pixel Lab MCP.

---

## Arquitectura

### Estado actual
- `src/sprites/SpriteData.ts` — frames de Raya, Cruella, Gato, Pombo, Rato, Dono, Bigodes codificados como arrays de pixels
- `BootScene.create()` — sprites estáticos de Hugo, Hannah, Zelador, Segurança, etc. desenhados com `g.fillRect()`
- `BootScene._makePixelSprite()` — método auxiliar que converte arrays de pixels em spritesheets

### Estado alvo
- `public/sprites/` — directório com PNGs de todos os personagens
- `BootScene.preload()` — carrega spritesheets com `this.load.spritesheet()`
- `SpriteData.ts` — retirado após validação do piloto
- Decorações, tiles e backgrounds **não são alterados** (fora do âmbito)

### Dimensões por categoria

| Categoria | Largura × Altura | Exemplos |
|-----------|-----------------|---------|
| Jogadoras | 32 × 32 px | Raya, Cruella |
| NPCs humanos | 20 × 40 px | Hugo, Hannah |
| Inimigos simples | 24 × 32 px | Gato, Dono, Zelador, Segurança, Porteiro |
| Bosses | 48 × 48 px | Zelador Boss, Drone, Seu Bigodes, Seg. Moto |

---

## Personagens em âmbito

| Personagem | Tipo | Chave (`KEYS.*`) | Prioridade |
|-----------|------|-----------------|-----------|
| Raya | Jogadora | `RAYA` | 🔴 Piloto |
| Cruella | Jogadora | `CRUELLA` | 🔴 Piloto |
| Hugo | NPC | `HUGO` | 🟡 Fase 2 |
| Hannah | NPC | `HANNAH` | 🟡 Fase 2 |
| Gato | Inimigo | `GATO` | 🟡 Fase 2 |
| Dono Nervoso | Inimigo | `DONO` | 🟡 Fase 2 |
| Zelador | Inimigo | `ZELADOR` | 🟡 Fase 2 |
| Segurança | Inimigo | `SEGURANCA` | 🟡 Fase 2 |
| Porteiro | Inimigo | `PORTEIRO` | 🟡 Fase 2 |
| Seg. Moto | Boss/inimigo | `SEGURANCA_MOTO` | 🟠 Fase 3 |
| Zelador Boss | Boss | `ZELADOR_BOSS` | 🟠 Fase 3 |
| Seu Bigodes | Boss | `BIGODES` | 🟠 Fase 3 |
| Drone | Boss | `DRONE` | 🟠 Fase 3 |

---

## Spec do Piloto: Raya & Cruella

### Raya
- **Descrição:** Cão golden retriever pequeno, pelagem dourada/âmbar (`#e8b450`), coleira vermelha com tag dourada, expressão animada e confiante
- **Dimensões:** 32 × 32 px por frame, spritesheet horizontal
- **Animações e frames:**

| Animação | Frames | Índices |
|----------|--------|---------|
| `idle` | 2 | 0–1 |
| `walk` | 4 | 2–5 |
| `run` | 4 | 6–9 |
| `jump` | 2 | 10–11 |
| `bark` | 2 | 12–13 |
| `stun` | 1 | 14 |
| `death` | 2 | 15–16 |

- **Spritesheet final:** `public/sprites/raya.png` — 544 × 32 px (17 frames)

### Cruella
- **Descrição:** Cão dálmata pequeno, pelagem branca com manchas pretas assimétricas, laço rosa na cabeça, expressão elegante e inteligente
- **Dimensões:** 32 × 32 px por frame, spritesheet horizontal
- **Animações:** idênticas às de Raya (mesmos índices de frame)
- **Spritesheet final:** `public/sprites/cruella.png` — 544 × 32 px

---

## Pipeline de Geração

### Pré-requisitos
1. Instalar `pixellab-mcp` no Claude Code
2. Obter API key em https://pixellab.ai
3. Ter `sharp` ou ImageMagick disponível para montar spritesheets

### Fluxo por personagem
1. **Gerar cada frame individualmente** com prompt consistente no Pixel Lab MCP
2. **Prompt base (Raya):**
   ```
   golden retriever dog, small cute, pixel art 16-bit SNES style,
   32x32 pixels, side view facing right, warm amber fur #e8b450,
   red collar with small gold tag, solid white background,
   no anti-aliasing, clean pixel edges, no outline
   ```
3. **Montar spritesheet** — juntar frames num único PNG horizontal
4. **Guardar em `public/sprites/`**
5. **Actualizar `BootScene.preload()`:**
   ```typescript
   this.load.spritesheet(KEYS.RAYA, 'sprites/raya.png', {
     frameWidth: 32, frameHeight: 32
   })
   ```
6. **Actualizar `Player.ts`** — ajustar índices de frame nas animações existentes

---

## Integração no Jogo

### BootScene
- Remover chamada `this._makePixelSprite(KEYS.RAYA, RAYA_SPRITE)` após validação
- Remover bloco `gen(KEYS.HUGO, ...)` etc. após validação de cada personagem
- Manter `_makePixelSprite()` apenas enquanto houver personagens por migrar

### SpriteData.ts
- Manter intacto durante o piloto (fallback de segurança)
- Deprecar e remover após todos os personagens migrarem

### Player.ts / entidades
- Os `anims.create()` existentes continuam a funcionar — apenas os `frame` indices mudam para corresponder ao novo spritesheet

---

## Fallback

- Os sprites actuais continuam a funcionar em paralelo enquanto o piloto estiver em curso
- Se o output do Pixel Lab não ficar no estilo esperado, itera-se o prompt sem custo de código
- Se as dimensões 32×32 criarem problemas no hitbox, ajusta-se `frameWidth/frameHeight` no `load.spritesheet()` sem tocar na física

---

## Critérios de Sucesso (Piloto)

- [ ] Raya e Cruella visualmente reconhecíveis com personalidade clara
- [ ] Animação `walk` fluida a 60 fps sem artefactos
- [ ] Hitbox e física sem regressões (`npm test` verde — 462 testes)
- [ ] Jogo corre no browser sem erros de console
- [ ] Tamanho visual dos sprites compatível com o level design existente

---

## Fora do Âmbito

- Tiles (ground, platform)
- Decorações de cenário (balcão, estante, árvore, etc.)
- Backgrounds parallax
- Itens (ossos, power-ups, acessórios)
- Efeitos visuais (dust puff, death burst)
- UI (corações, HUD)
