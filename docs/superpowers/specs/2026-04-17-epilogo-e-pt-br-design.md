# Spec F — Epílogo na EndingScene + Conversão PT-PT → PT-BR

**Data:** 2026-04-17
**Área:** Narrativa & Personagens
**Estado:** Aprovado

---

## 1. Visão Geral

Duas melhorias no eixo narrativo:

1. **Epílogo na EndingScene** — 6 linhas de diálogo entre Raya e Cruella surgem *antes* das estatísticas, como momento emocional de encerramento do arco. Texto auto-avançado sobre o starfield existente.
2. **Conversão PT-PT → PT-BR** — todos os diálogos dos arquivos `World*.ts` e `worldTransition` estão em português de Portugal. Serão convertidos para português do Brasil.

---

## 2. Epílogo — EndingScene

### 2.1 Conteúdo

```
Raya: "Conseguimos! A gente tá FORA! Eu sabia! Eu SABIA!"
Cruella: "Claro que sabia. Não para de falar nisso desde o primeiro andar."
Raya: "Porque era verdade! Somos uma dupla incrível!"
Cruella: "Não somos uma dupla. Você é minha cachorra."
Raya: "...A melhor cachorra do mundo?"
Cruella: "…A melhor cachorra do mundo."
```

A última fala de Cruella é o único momento no jogo em que ela cede sem sarcasmo — payoff do arco inteiro.

### 2.2 Fluxo da EndingScene

**Antes:** starfield → stats → botão menu
**Depois:** starfield → **epílogo** → fade → stats → botão menu

### 2.3 Animação por linha

- Fade in: 400ms
- Visível: 1800ms
- Fade out: 400ms
- Total por linha: **2600ms**
- Total do epílogo: ~15,6s (6 × 2600ms)
- Pausa após última linha antes de mostrar stats: 600ms

### 2.4 Estilo visual

- Texto centralizado horizontalmente, a ~50% da altura da tela
- Cada linha exibida na cor da personagem que fala: Raya `#88ffaa`, Cruella `#ffa040`
- Texto completo na mesma cor — um único objeto `Text` por linha
- Fundo: starfield já existente, sem overlay adicional
- `scrollFactor: 0`, `depth: 10`

### 2.5 Implementação técnica

Em `src/scenes/EndingScene.ts`:
- Adicionar constante `EPILOGUE_LINES` com as 6 strings
- Adicionar método privado `_runEpilogue(): void` que encadeia as linhas via `this.time.delayedCall`
- Chamar `_runEpilogue()` no início de `create()`, antes de qualquer chamada às stats
- As stats são mostradas via `delayedCall` com delay total do epílogo + 600ms de pausa

---

## 3. Conversão PT-PT → PT-BR

### 3.1 Padrões gerais de conversão

| PT-PT | PT-BR |
|---|---|
| "o teu / a tua" | "o seu / a sua" / sem artigo |
| "és" | "você é" |
| "tens" | "você tem" |
| "controla-te" | "se controla" / "controle-se" |
| "proteger-te" | "te proteger" |
| "matar-nos" | "nos matar" |
| "estou a ver" | "estou vendo" |
| "a correr / a subir" | "correndo / subindo" |
| "há + plural" | "tem + singular" (informal BR) |
| "toda a gente" | "todo mundo" |
| "todo o lado / toda a parte" | "todo lado" |
| "este/esta" (dem.) | "esse/essa" |
| "deixa-me" | "me deixa" |
| "exactamente" | "exatamente" |
| "direcção" | "direção" |
| "magnífico" | "magnífico" (mesmo, só confirmar acento) |
| "edifício" (para prédio) | "prédio" |
| "a sério" | "de verdade" |

### 3.2 Diálogos corrigidos por arquivo

#### World0.ts

| Nível | Original | PT-BR |
|---|---|---|
| 0-1 | `"O teu plano foi sempre correr."` | `"Seu plano sempre foi correr."` |
| 0-2 | `"Vou à frente para proteger-te!"` | `"Vou na frente para te proteger!"` |
| 0-2 | `"Eu própria consigo proteger-me, obrigada."` | `"Eu mesma consigo me proteger, obrigada."` |
| 0-3 | `"Precisamos de estar focadas. Há zeladores em todo o lado."` | `"Precisamos ficar focadas. Tem zelador por todo lado."` |
| 0-4 | `"Há mais zeladores aqui do que gatos na rua!"` | `"Tem mais zelador aqui do que gato na rua!"` |
| 0-4 | `"Precisamos de sair antes que percam completamente a paciência."` | `"Precisamos sair antes que percam a paciência de vez."` |
| 0-5 | `"Isto não era suposto ter tantos andares. Quem construiu este prédio?"` | `"Não era pra ter tantos andares. Quem construiu esse prédio?"` |
| 0-boss | `"Tens também o entusiasmo de um aspirador. Mas aprecia-se."` | `"Você também tem o entusiasmo de um aspirador. Mas é apreciável."` |
| worldTransition | `"CONSEGUIMOS! Saímos do edifício!"` | `"CONSEGUIMOS! A gente saiu do prédio!"` |
| worldTransition | `"Deixa-me ter este momento, Cruella."` | `"Me deixa ter esse momento, Cruella."` |

#### World1.ts

| Nível | Original | PT-BR |
|---|---|---|
| 1-1 | `"Controla-te. Há moradores por toda a parte."` | `"Controle-se. Tem morador por todo lado."` |
| 1-2 | `"Isso é… exactamente o que eu ia dizer."` | `"Isso é… exatamente o que eu ia dizer."` |
| 1-3 | `"Não somos aqui para fazer amigos."` | `"Não estamos aqui pra fazer amigos."` |
| 1-4 | `"Concentra-te. Há donos nervosos em todo o parque."` | `"Concentra. Tem dono nervoso por todo o parque."` |
| 1-boss | `"...Ele é mesmo muito enorme, Cruella."` | `"...Ele é muito grande mesmo, Cruella."` |
| worldTransition | `"Precisamos de subir o exterior do prédio."` | `"Precisamos subir pelo exterior do prédio."` |

#### World2.ts

| Nível | Original | PT-BR |
|---|---|---|
| 2-1 | `"Há ratos, zeladores, e o chão está molhado."` | `"Tem rato, zelador, e o chão está molhado."` |
| 2-2 | `"Gatos em todo o lado. Alguém os alimentou em excesso."` | `"Gatos por todo lado. Alguém alimentou demais."` |
| 2-3 | `"Quantos tem este prédio?!"` | `"Quantos tem esse prédio?!"` |
| 2-4 | `"Sempre soube que morreria a subir escadas."` | `"Sempre soube que morreria subindo escadas."` |
| 2-4 | `"Isso é suposto motivar-me?"` | `"Isso é pra me motivar?"` |
| 2-5 | `"Não olhes para baixo."` (×2) | `"Não olha pra baixo."` (×2) |
| 2-5 | `"Varandas! Conseguimos ver toda a cidade daqui!"` | `"Varandas! A gente consegue ver toda a cidade daqui!"` |
| 2-boss | `"E agora ele quer matar-nos."` | `"E agora ele quer nos matar."` |

#### World3.ts

| Nível | Original | PT-BR |
|---|---|---|
| 3-1 | `"Há alguém com uma lanterna ao fundo."` | `"Tem alguém com uma lanterna lá no fundo."` |
| 3-2 | `"Há gatos a correr em direcção à nossa luz."` | `"Tem gatos correndo em direção à nossa luz."` |
| 3-2 | `"Os gatos correm em direcção à luz agora?"` | `"Os gatos correm em direção à luz agora?"` |
| 3-3 | `"Tu. Devagar. Sem barulho."` | `"Você. Devagar. Sem barulho."` |
| 3-4 | `"LUZ! Luz a sério! Estou a ver tudo!"` | `"LUZ! Luz de verdade! Estou vendo tudo!"` |
| 3-4 | `"Também significa que toda a gente nos vê a nós."` | `"Também significa que todo mundo nos vê."` |
| 3-5 | `"O nosso prédio! Estamos quase!"` | `"Nosso prédio! Estamos quase!"` |
| 3-5 | `"Há um segurança de moto lá ao fundo."` | `"Tem um segurança de moto lá no fundo."` |
| 3-5 | `"Vamos a isso."` | `"Vamos nessa."` |
| 3-boss | `"Uma moto. Com farol. A vir na nossa direcção."` | `"Uma moto. Com farol. Vindo em nossa direção."` |
| 3-boss | `"Vou saltar. É o meu plano."` | `"Vou pular. É meu plano."` |
| worldTransition | `"Conseguimos. Estamos em casa."` | OK — sem alteração |

---

## 4. Arquivos Modificados

| Arquivo | Alteração |
|---|---|
| `src/scenes/EndingScene.ts` | Adicionar `EPILOGUE_LINES` + `_runEpilogue()` + reorganizar `create()` |
| `src/levels/World0.ts` | 8 strings corrigidas (6 diálogos + 2 worldTransition) |
| `src/levels/World1.ts` | 6 strings corrigidas (5 diálogos + 1 worldTransition) |
| `src/levels/World2.ts` | 8 strings corrigidas |
| `src/levels/World3.ts` | 9 strings corrigidas (8 diálogos + 1 boss) |

---

## 5. Testes

- `npm test`: 124/124 devem continuar passando (sem lógica nova, só strings e UI Phaser)
- `npm run build`: build limpo sem erros TypeScript
- Verificação manual: EndingScene deve mostrar epílogo antes das stats

---

## 6. Fora de Escopo

- Revisão de textos em cenas de UI (`HowToPlayScene`, `EnemyInfoScene`, etc.)
- Revisão do texto da `IntroCrawlScene` (já está em PT-BR adequado)
- Animações de personagens durante o epílogo
- Vozes / áudio
