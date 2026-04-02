# Raya & Cruella — Game Design Spec

**Data:** 2026-04-02
**Status:** Aprovado

---

## Visão Geral

Jogo 2D estilo plataforma (Super Mario) com as protagonistas Raya e Cruella, duas Spitz Alemão Anão. O jogador alterna entre as duas cachorras durante as fases, explorando um bairro urbano cheio de inimigos do cotidiano, coletando itens e derrotando bosses.

---

## Stack Técnica

| Item | Escolha |
|------|---------|
| Engine | Phaser 3 |
| Linguagem | TypeScript |
| Bundler | Vite |
| Deploy | GitHub Pages via GitHub Actions |
| Mapas | Tiled (exportado como JSON) |

**URL pública:** `https://<usuario>.github.io/game-cruella-e-raya/`

---

## Estrutura de Pastas

```
game-cruella-e-raya/
├── src/
│   ├── main.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── MenuScene.ts
│   │   ├── GameScene.ts
│   │   └── UIScene.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Raya.ts
│   │   ├── Cruella.ts
│   │   └── Enemy.ts
│   ├── items/
│   │   └── PowerUp.ts
│   ├── levels/
│   │   └── World1.ts
│   └── constants.ts
├── public/
│   └── assets/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── index.html
├── vite.config.ts
└── package.json
```

**Decisões arquiteturais:**
- `GameScene` + `UIScene` rodam em paralelo — HUD nunca pisca em transições
- Cada mundo é um arquivo independente em `levels/` — adicionar mundos futuros não toca código existente
- `Player.ts` gerencia qual cachorra está ativa e delega física/animações para `Raya.ts` ou `Cruella.ts`

---

## Estilo Visual

**Cartoon Colorido** — personagens grandes e expressivos, cores vibrantes, estética moderna tipo Kirby. Os sprites dos personagens serão refinados iterativamente após o MVP.

---

## Mundo e Fases

### Mundo 1 — "O Bairro" (MVP)

| Fase | Cenário | Objetivo |
|------|---------|----------|
| 1-1 | Rua residencial | Chegar ao fim desviando de gatos e pombos |
| 1-2 | Praça com jardim | Atravessar o parquinho, resgatar ossos escondidos |
| 1-3 | Mercadinho / feirinha | Plataformas em bancas e caixotes, inimigos mais rápidos |
| 1-Boss | Depósito de lixo | Derrotar o Seu Bigodes |

**Detalhes de fase:**
- 3 ossos dourados escondidos por fase (colecionáveis opcionais, desbloqueiam galeria no menu)
- Checkpoint no meio de cada fase: hidrante
- Saída da fase: portão de casa com plaquinha "Chegamos!"
- Tilemaps em camadas: fundo, plataformas, decoração, colisão, spawn de inimigos/itens

**Mundos futuros planejados (fora do escopo do MVP):**
- Mundo 2 — Centro Comercial
- Mundo 3 — Parque Ecológico

---

## Personagens

### Controles Base (ambas)

| Tecla | Ação |
|-------|------|
| `←` `→` | Mover |
| `Espaço` | Pular (segurar = pulo mais alto) |
| `Shift` | Habilidade especial da cachorra ativa |
| `Tab` | Trocar entre Raya e Cruella (cooldown 1.5s) |

### Raya — A Ágil

- Velocidade base 20% maior que Cruella
- Pulo duplo
- **Habilidade especial:** Dash horizontal — atravessa passagens estreitas e paredes frágeis

### Cruella — A Intimidadora

- Resistência maior (+1 hit antes de perder coração)
- **Habilidade especial:** Latido de choque — onda sonora que atordoa inimigos num raio curto
- Inimigos comuns têm chance de fugir ao detectar Cruella (intimidação passiva)

### Mecânica de Troca

- A cachorra inativa aparece como "fantasminha" ao lado da ativa
- Troca é animada (flash + som de latido)
- Se a cachorra ativa recebeu hit recente (2s), troca fica bloqueada

### Vidas e Energia

- 3 corações compartilhados entre as duas
- Perder todos os corações → tela "Game Over — Volta pra casa!" com opção de recomeçar do checkpoint

---

## Inimigos

### Inimigos Comuns — Mundo 1

| Inimigo | Comportamento | Como derrotar |
|---------|--------------|---------------|
| Gato Mal-encarado | Patrulha plataforma, arranha ao contato | Latido da Cruella (foge) ou pular na cabeça |
| Pombo Agitado | Voa em linha reta, para às vezes no chão | Bola/frisbee ou pulo |
| Rato de Calçada | Corre rápido, muda de direção ao ser encurralado | Dash da Raya passa por cima |
| Dono Nervoso | Tenta capturar as cachorras com guia | Inderrotável — apenas esquivar |

### Boss — Seu Bigodes 🐱

Gato enorme e gordo que domina o depósito de lixo. Luta em 3 fases:

1. **Fase 1 (100%→50% HP):** Joga lixo (latinhas, sacos) em arco. Raya esquiva com dash, Cruella derruba com latido.
2. **Fase 2 (50%→25% HP):** Pula entre plataformas esmagando o chão. Janela de ataque no pouso.
3. **Fase 3 (25%→0% HP):** Convoca 2 Gatos Mal-encarados. Exige troca de personagem para gerenciar dois focos.

**Derrota:** Seu Bigodes foge e deixa cair o **Colar de Ouro** (+velocidade permanente pelo resto do mundo).

---

## Itens e Power-ups

### Coletáveis de Pontuação

| Item | Efeito |
|------|--------|
| Osso comum 🦴 | +10 pts |
| Osso dourado ✨🦴 | Colecionável secreto — 3 por fase, desbloqueiam galeria |

### Power-ups Temporários (~10s)

| Item | Efeito | Origem |
|------|--------|--------|
| Petisco de fígado 🍖 | Velocidade turbo (+50%) | Blocos surpresa |
| Pipoca de rua 🍿 | Pulo super alto (x2 altura) | Áreas secretas |
| Pizza no chão 🍕 | Restaura 1 coração | Escondida em becos |
| Churrasco do vizinho 🥩 | Invencibilidade por 8s | Após boss de fase |
| Bola de tênis 🎾 | Projétil arremessável (3 usos) | Caixotes quebráveis |
| Frisbee 🥏 | Projétil que quica nas paredes (2 ricochetes) | Plataformas secretas |

### Acessórios Equipáveis (persistem até levar hit)

| Acessório | Efeito Passivo |
|-----------|---------------|
| Laço vermelho 🎀 | Escudo — absorve 1 hit sem perder coração |
| Coleira com plaquinha 🏷️ | Atrai ossos próximos automaticamente |
| Chapéu de festa 🎉 | Pulo duplo para Cruella |
| Bandana | Reduz cooldown de troca para 0.5s |

---

## HUD e Telas

### HUD (UIScene)

```
┌─────────────────────────────────────────┐
│ ❤️❤️❤️        RAYA ↔ CRUELLA    Ossos: 47│
│ [Acessório ativo]    [Cooldown troca]    │
└─────────────────────────────────────────┘
```

- Coração pisca ao levar dano
- Ícone da cachorra inativa aparece acinzentado com cooldown visível
- Acessório equipado mostra ícone pequeno no canto

### Telas

| Tela | Descrição |
|------|-----------|
| Menu principal | Título animado, botão Jogar, botão Galeria |
| Pausa (`ESC`) | Mostra controles, opção de sair ao menu |
| Game Over | "Volta pra casa!" — recomeçar do checkpoint ou início da fase |
| Fase concluída | Placar de ossos + tempo, animação das duas cachorras |

---

## Deploy

- GitHub Actions: push na `main` → `npm run build` → publica `dist/` no GitHub Pages
- Arquivo `.github/workflows/deploy.yml` configurado desde o início do projeto
- `.superpowers/` adicionado ao `.gitignore`

---

## Fora do Escopo (MVP)

- Mundos 2 e 3
- Modo co-op local
- Sons e trilha sonora (placeholder no MVP)
- Mobile / controle touch
- Sistema de save persistente (localStorage pode vir depois)
