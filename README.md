# 🐾 Cruella & Raya — O Jogo

> Plataforma 2D em TypeScript + Phaser 3 — controla duas cãezinhas numa fuga épica pelo prédio, ruas e telhados da cidade!

🎮 **[Jogar agora](https://brilhantehugo.github.io/game-cruella-e-raya/)**

---

## 🎮 Sobre o Jogo

**Cruella & Raya** é um jogo de plataforma 2D onde controlas simultaneamente duas cadelas com personalidades opostas: **Raya**, ágil e veloz, e **Cruella**, lenta mas intimidante. Alterna entre as duas para superar inimigos, colecionar ossos e escapar de 3 mundos cheios de perigo — do apartamento caótico até ao telhado em confronto com um drone de vigilância.

---

## ✨ Funcionalidades

- **2 personagens jogáveis** com mecânicas únicas (troca a qualquer momento com `TAB`)
- **3 mundos** com 4 fases cada (3 normais + 1 boss)
- **Sistema de medalhas** — Bronze, Prata e Ouro por pontuação em cada fase
- **Sistema de counter** — janelas de vulnerabilidade nos inimigos para ataques especiais
- **Combo de troca** — Dash da Raya → trocar → boost da Cruella (janela de 600ms)
- **Checkpoints** por fase + progressão de perfil persistente
- **Mapa do mundo** interactivo com nós desbloqueáveis
- **7 tipos de inimigos** com IA e padrões distintos (incluindo 3 bosses)
- **Parallax backgrounds** com 3 camadas por tema visual
- **BGM procedural** por cena

---

## 🐕 Personagens

### Raya — A Veloz
| Atributo | Valor |
|----------|-------|
| Velocidade | 240 px/s |
| Saltos | Duplo salto |
| Habilidade (`X`) | Dash — 600 px/s por 200ms |
| Cooldown | 800ms |

### Cruella — A Intimidante
| Atributo | Valor |
|----------|-------|
| Velocidade | 200 px/s |
| Saltos | Salto simples |
| Habilidade (`X`) | Late — atordoa inimigos num raio de 120px por 1200ms |
| Cooldown | 1500ms |

**Troca (`TAB`):** cooldown de 1500ms. Ao trocar logo após o dash da Raya, a Cruella recebe um boost de velocidade.

---

## 🗺️ Mundos e Fases

### Mundo 0 — Apartamento
| Fase | Nome | Descrição |
|------|------|-----------|
| 0-1 | Sala de Estar | Fuga pela sala com Hugo e Hannah |
| 0-2 | Estacionamento | Zeladores e gatos no parque de estacionamento |
| 0-boss | Cozinha | Boss: **Wall-E** — aspirador selvagem |

### Mundo 1 — Cidade
| Fase | Nome | Descrição |
|------|------|-----------|
| 1-1 | Rua | Primeira saída para o exterior |
| 1-2 | Praça | Praça da cidade com ratos e pombos |
| 1-3 | Mercado | Caos no mercado com moradores e zeladores |
| 1-boss | Boss | Boss: **Seu Bigodes** — gato de 3 fases com minions |

### Mundo 2 — Exterior do Prédio
| Fase | Nome | Descrição |
|------|------|-----------|
| 2-1 | Passeio Público | Calçada nocturna cheia de ratos e zeladores |
| 2-2 | Pátio Interior | Pátio de tijolo com gatos em todo o lado |
| 2-3 | Escadas de Emergência | Subida andar a andar com pombos e donos |
| 2-boss | Telhado | Boss: **Drone** — vigilância aérea de 3 fases |

---

## 👾 Inimigos

| Inimigo | Tipo | Comportamento |
|---------|------|---------------|
| Gato Malencarado | Normal | Patrulha → agacha → salta → recupera |
| Pombo Agitado | Normal | Voa em patrulha → paira → mergulha |
| Rato de Calçada | Normal | Patrulha → carga → dash rápido |
| Dono Nervoso | Normal | Persegue o jogador pelo eixo X |
| Zelador | Normal | Patrulha simples agressiva |
| Morador | Normal | Patrulha com área de detecção |
| **Wall-E** | Boss | 3 fases — pulso de vácuo, cargas e projécteis de sujidade + pás giratórias |
| **Seu Bigodes** | Boss | 3 fases — invoca minions, saltos e ataques em área |
| **Drone** | Boss | 3 fases — flutua, lança bombas em parábola e lasers horizontais |

---

## 🎯 Sistema de Pontuação

| Acção | Pontos |
|-------|--------|
| Osso colectado | 10 |
| Inimigo derrotado | 50 |
| Osso Dourado | 500 |
| Boss derrotado | 1000 |

### Limiares de Medalha (exemplos)
| Fase | Bronze | Prata | Ouro |
|------|--------|-------|------|
| 2-1 | 600 | 1200 | 1900 |
| 2-2 | 900 | 1800 | 2850 |
| 2-3 | 1000 | 2000 | 3150 |

---

## 🕹️ Controlos

| Tecla | Acção |
|-------|-------|
| ← / → (Setas ou A/D) | Mover |
| ↑ / Espaço / W | Saltar |
| X | Habilidade especial (Dash / Late) |
| TAB | Trocar personagem |
| ESC | Pausa |

---

## 🛠️ Stack Técnica

| Tecnologia | Versão |
|-----------|--------|
| [Phaser 3](https://phaser.io/) | 3.87.0 |
| TypeScript | 5.4.5 |
| Vite | 5.4.0 |
| Vitest | 1.6.0 |
| Node.js | ≥ 20.14 |

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+
- npm

### Instalação

```bash
git clone https://github.com/brilhantehugo/game-cruella-e-raya.git
cd game-cruella-e-raya
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Abre `http://localhost:5173` no browser.

### Build de Produção

```bash
npm run build
npm run preview
```

### Testes

```bash
npm test
```

79 testes — cobre entidades, física, pontuação, mecânicas de jogo e gerenciamento de perfil.

---

## 📁 Estrutura do Projecto

```
src/
├── scenes/          # 15 cenas Phaser (Menu, Game, UI, WorldMap, etc.)
├── entities/        # Player, Enemy base, 7 tipos de inimigos
├── levels/          # LevelData + World0, World1, World2
├── background/      # ParallaxBackground (3 camadas por tema)
├── audio/           # SoundManager — BGM procedural
├── storage/         # ProfileManager — perfis persistentes
├── constants.ts     # KEYS, dimensões, limiares de medalha
└── GameState.ts     # Estado global da sessão de jogo
tests/               # Vitest — testes unitários e de integração
docs/                # Especificações de design e planos de implementação
```

---

## 🎨 Temas Visuais

| Tema | Descrição |
|------|-----------|
| `apartamento` | Interior acolhedor com tons quentes |
| `apto_boss` | Interior escuro para bosses de apartamento |
| `rua` | Rua nocturna da cidade |
| `praca` | Praça urbana |
| `mercado` | Zona de mercado movimentada |
| `boss` | Arena de boss da cidade |
| `exterior` | Fachada do prédio com céu nocturno |
| `patio` | Pátio interior de tijolo com varal |
| `telhado` | Telhado com estrelas e antenas |

---

## 📋 Perfis de Jogador

O jogo suporta múltiplos perfis com progressão independente:
- Desbloqueio de fases por conclusão
- Medalhas por fase (Ouro 🥇 / Prata 🥈 / Bronze 🥉)
- Pontuação total acumulada
- Escolha de personagem principal (Raya ou Cruella)

---

## 📄 Licença

Projecto pessoal — todos os direitos reservados.
