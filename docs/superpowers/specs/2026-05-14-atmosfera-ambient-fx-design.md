# Spec K — AmbientFX: Partículas Ambientais por Tema

**Data:** 2026-05-14
**Status:** Aprovado

**Goal:** Adicionar partículas ambientais temáticas a cada fase do jogo, dando às fases mais "lugar" e atmosfera sem novos assets ou mudanças em sistemas existentes.

---

## Contexto

O sistema de parallax (`ParallaxBackground`) usa `TileSprite` estáticos — rolam com a câmera mas não têm movimento próprio. O jogo tem 10 temas de fundo (`BackgroundTheme`) e nenhum efeito ambiente dinâmico além do `SpotlightOverlay` (fases escuras). Resultado: as fases parecem "pinturas" sem vida.

---

## Arquitetura

### Novo arquivo: `src/fx/AmbientFX.ts`

Classe `AmbientFX` auto-suficiente:
- Recebe `scene` e `backgroundTheme` no construtor
- Registra timers internos com `scene.time.addEvent` — sem necessidade de `update()` externo
- Spawna partículas como `Phaser.GameObjects.Graphics` + tween de movimento/fade
- Cada partícula se destrói sozinha ao sair da viewport (`onComplete`)
- `destroy()` cancela timers e destrói partículas vivas

### Integração em `GameScene.ts` (2 linhas)

```typescript
// Em create(), após _setupParallax():
this._ambientFX = new AmbientFX(this, this.currentLevel.backgroundTheme)

// Em shutdown (via evento já existente):
this.events.once('shutdown', () => this._ambientFX?.destroy())
```

Nova propriedade privada: `private _ambientFX: AmbientFX | null = null`

### ScrollFactor

Todas as partículas usam `setScrollFactor(0)` — ficam presas à viewport como o HUD. Spawnam fora da tela (topo ou lateral) e morrem ao cruzar o lado oposto.

---

## Partículas por Tema

| Tema | Efeito | Descrição Visual | Max simultâneas | Spawn interval |
|---|---|---|---|---|
| `rua_noite` | **Chuva fina** | Traços `1×10px`, diagonal 15°, azul-brancos (`0xaaddff`), alpha 0.35–0.55 | 35 | 180ms |
| `apartamento` | **Motes de poeira** | Círculos `1–3px`, deriva lenta (↑ ou ↗), cores quentes claras (`0xfff8e7`, `0xffe4c4`), alpha 0.20–0.35 | 18 | 350ms |
| `apto_boss` | **Motes de poeira** | Igual `apartamento` | 14 | 400ms |
| `rua` | **Folhas** | Retângulos `3–5px`, caem com drift lateral aleatório, cores `0x44aa33 / 0xaacc22 / 0xffbb44`, rotacionam durante a queda | 12 | 500ms |
| `praca` | **Folhas** | Igual `rua` | 10 | 600ms |
| `patio` | **Folhas** | Igual `rua`, alpha ligeiramente menor | 8 | 700ms |
| `telhado` | **Detritos de vento** | Retângulos `1×4px`, sopram horizontalmente (direção aleatória por spawn), tons cinza (`0x888888`, `0xaaaaaa`), alpha 0.30–0.50 | 15 | 300ms |
| `exterior` | **Detritos de vento** | Igual `telhado` | 12 | 350ms |
| `mercado` | **Ar-condicionado** | Igual motes de poeira, porém tom azulado frio (`0xcceeFF`), deriva levemente ↑ | 12 | 400ms |
| `boss` | *(nenhuma)* | Sem partículas — foco no boss fight | 0 | — |

---

## Regras Gerais de Spawning

- Partículas nascem **fora da viewport** (y=−16 para partículas que caem; x=GAME_WIDTH+8 para partículas que sopram para a esquerda).
- Velocidade base com variação aleatória de ±20% por partícula para evitar uniformidade.
- Alpha nunca acima de 0.6 — partículas ficam no fundo, não competem com gameplay.
- Máximo de partículas simultâneas por tema: enforced via contagem interna; se limite atingido, o spawn é ignorado até alguma morrer.

---

## Performance

- Usa o mesmo padrão de `Graphics` + tween já estabelecido em `EffectsManager.dustPuff()`.
- Máximo de 35 partículas simultâneas (chuva, caso mais pesado) — negligenciável para Phaser.
- `AmbientFX.destroy()` usa array interno de partículas ativas para destruir tudo limpo, sem leaks entre fases.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/fx/AmbientFX.ts` | **Criar** — classe completa de partículas ambientais |
| `src/scenes/GameScene.ts` | **Modificar** — instanciar e destruir `AmbientFX` (+3 linhas) |

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Partículas interativas (afetadas por vento/pulo do player) | Complexidade desnecessária |
| Novos assets/sprites para partículas | Tudo procedural — sem assets |
| Animação nas camadas de parallax | Abordagem B descartada |
| Vinheta/overlay de cor por tema | Fora do escopo aprovado |
| Fases de boss com partículas | Distraem do combate |
