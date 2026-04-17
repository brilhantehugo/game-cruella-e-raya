# Spec G — SettingsOverlay: Configurações + Guia de Controles

**Data:** 2026-04-17
**Área:** UX / Interface
**Estado:** Aprovado

---

## 1. Visão Geral

Uma tela de configurações acessível de dois pontos de entrada — menu principal e menu de pausa — implementada como overlay Phaser (container sobre a cena atual, sem troca de cena).

**Escopo:**
- Toggle visual de mute global (sem sliders, sem separação música/SFX)
- Guia de controles estático
- Sem persistência — estado reseta a cada sessão

---

## 2. Arquitetura

### 2.1 Arquivos

| Arquivo | Ação | Detalhe |
|---|---|---|
| `src/ui/SettingsOverlay.ts` | Criar | Classe reutilizável que gerencia o overlay |
| `src/scenes/MenuScene.ts` | Modificar | Botão `[ S — CONFIGURAÇÕES ]` + tecla `S` |
| `src/scenes/PauseScene.ts` | Modificar | Botão `[ S — CONFIGURAÇÕES ]` + tecla `S` |

### 2.2 API da Classe

```typescript
export class SettingsOverlay {
  constructor(scene: Phaser.Scene)
  show(): void
  hide(): void
  isVisible(): boolean
}
```

### 2.3 Implementação Interna

`SettingsOverlay` cria um `Phaser.GameObjects.Container` com:
- `scrollFactor: 0`
- `depth: 50` (acima de tudo)
- Visível via `.setVisible(true/false)` — o container persiste em memória, é alternado

Filhos do container:
1. **Fundo** — `Rectangle` centralizado, `500 × 320px`, fill `0x000000 alpha 0.82`, borda `#888888`. Recebe `.setInteractive()` para capturar todos os cliques sobre o painel e impedir que atravessem para a cena abaixo.
2. **Título** — `"⚙ CONFIGURAÇÕES"`, `fontSize: '18px'`, `color: '#ffffff'`, `fontStyle: 'bold'`.
3. **Toggle de mute** — botão de texto interativo que reflete `gameState.muted`. Textos: `"🔊  Música: ATIVADA"` / `"🔇  Música: SILENCIADA"`. Cor ativa: `#88ffaa`; cor silenciada: `#ff6666`.
4. **Separador** — linha horizontal `Graphics`.
5. **Título controles** — `"CONTROLES"`, `fontSize: '13px'`, `color: '#aaaaaa'`.
6. **Tabela de controles** — 6 linhas de texto estático (ver Seção 3).
7. **Botão fechar** — `"[ ESC — FECHAR ]"`, `fontSize: '13px'`, `color: '#aaaaff'`. Clique chama `hide()`.

O toggle chama `SoundManager.setMuted(!gameState.muted)` e atualiza o próprio texto/cor imediatamente.

---

## 3. Conteúdo do Overlay

Layout visual (centralizado em GAME_WIDTH/2, GAME_HEIGHT/2):

```
┌─────────────────────────────────────┐
│        ⚙ CONFIGURAÇÕES              │
│                                     │
│  🔊  Música: ATIVADA                │  ← botão interativo
│                                     │
│  ──────────────────────────────     │
│  CONTROLES                          │
│  ← →      Mover                     │
│  ESPAÇO   Pular                     │
│  SHIFT    Habilidade da Raya        │
│  TAB      Trocar personagem         │
│  ESC      Pausar / Fechar           │
│  M        Silenciar música          │
│                                     │
│       [ ESC — FECHAR ]              │
└─────────────────────────────────────┘
```

---

## 4. Integração nas Cenas

### 4.1 MenuScene

- Adicionar botão `[ S — CONFIGURAÇÕES ]` após o botão de conquistas (y ≈ 449), `fontSize: '13px'`, `color: '#cccccc'`.
- Adicionar `kb.on('keydown-S', () => settingsOverlay.show())`.
- Cleanup no `shutdown`: remover handler de `S`.
- ESC no overlay: chamar `settingsOverlay.hide()` e não propagar.

### 4.2 PauseScene

- Adicionar botão `[ S — CONFIGURAÇÕES ]` na lista de opções da pausa.
- Adicionar `kb.on('keydown-S', () => settingsOverlay.show())`.
- **Gestão de ESC:** quando o overlay está aberto, ESC fecha o overlay (não resume o jogo). Implementação: no handler de ESC da pausa, verificar `if (settingsOverlay.isVisible()) { settingsOverlay.hide(); return }` antes de resumir.
- Cleanup no `shutdown`: remover handler de `S`.

### 4.3 Tabela de comportamento de ESC

| Contexto | ESC |
|---|---|
| Menu principal, overlay fechado | sem ação (comportamento atual) |
| Menu principal, overlay aberto | fecha overlay |
| Pausa, overlay fechado | resume jogo (comportamento atual) |
| Pausa, overlay aberto | fecha overlay, não resume |

---

## 5. Testes

- `npm test`: 124/124 devem continuar passando (sem nova lógica de gameplay)
- `npm run build`: build limpo sem erros TypeScript
- Verificação manual:
  - Menu → S → overlay aparece → M muda o toggle → ESC fecha
  - Menu → S → overlay aparece → clique no toggle → muda estado do som
  - Jogo → ESC (pausa) → S → overlay sobre a pausa → ESC fecha overlay → pausa ainda visível → ESC resume jogo

---

## 6. Fora de Escopo

- Sliders de volume separados (música vs SFX)
- Persistência de configurações no perfil
- Remapeamento de teclas
- Configurações de acessibilidade (modo daltônico, etc.)
- Tecla S durante o jogo (só no menu e na pausa)
