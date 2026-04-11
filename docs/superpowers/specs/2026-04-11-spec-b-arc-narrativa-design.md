# Spec B — Arc Narrativa Completa
**Data:** 2026-04-11
**Âmbito:** Polimento narrativo — abertura expandida, diálogos por fase, transições de mundo, EndingScene

---

## Contexto

O jogo tem 18 fases (3 mundos × 6) com sistema de diálogo já funcional via `LevelIntroScene`. Contudo:
- Muitos níveis novos (0-2, 0-4, 0-5, 1-2, 1-4, 2-3, 2-5) não têm `intro`
- Os existentes têm tom neutro, não o tom de comédia definido
- Não há transições narrativas entre mundos
- `nextLevel === null` (pós 2-boss) navega para o `WorldMap` sem qualquer celebração ou final

**Tom:** Comédia leve estilo "buddy cop" — Raya entusiasta e impulsiva, Cruella dramática e sarcástica, discutem constantemente mas há afeto genuíno por baixo.

---

## Abordagem Escolhida

**Dados + EndingScene + transições de mundo:**
- Preencher `intro` em todos os 18 níveis com diálogo de comédia
- Adicionar `worldTransition?: string[]` a `LevelData` para diálogo pós-boss
- Expandir `IntroCrawlScene` com 6 slides narrativos
- Nova `EndingScene` — vitória, estatísticas, créditos, botão "Jogar de Novo"

Alternativas descartadas: "só dados" (sem final) e "cutscenes animadas" (complexidade excessiva com sprites placeholder).

---

## 1. Abertura Expandida — `IntroCrawlScene`

Substituir `CRAWL_TEXT` actual por 6 slides narrativos (separados por `''`):

```
'Numa cidade qualquer, numa noite de quinta-feira…',
'',
'Cruella De Vil estava em apuros.',
'Como de costume.',
'',
'A sua única aliada: Raya,',
'uma labrador de 4 anos com excesso de confiança',
'e falta de bom gosto.',
'',
'O plano: sair do prédio sem serem vistas.',
'Simples. Infalível.',
'',
'Completamente impossível.',
'',
'Mas Cruella nunca perde.',
'',
'E Raya nunca para de latir.',
```

Cabeçalho muda de `'Em uma galáxia muito, muito próxima…'` para `'Em algures num prédio de Lisboa…'`.

---

## 2. Diálogos por Fase

Todos os 18 níveis recebem campo `intro` com `dialogue: string[]` (2-4 linhas, formato `"Personagem: texto"`). Os existentes são substituídos por versões com o tom de comédia correcto.

### World 0 — Apartamento

**0-1 Sala de Estar** *(update)*
```
'Raya: "Vejo Hugo e Hannah. Precisamos de um plano!"',
'Cruella: "O plano É correr. O teu plano foi sempre correr."',
```

**0-2 Corredor** *(novo)*
```
'Raya: "Corredor estreito. Vou à frente para proteger-te!"',
'Cruella: "Eu própria consigo proteger-me, obrigada. Vai."',
```

**0-3 Estacionamento do Prédio** *(update)*
```
'Raya: "Estacionamento! Há carros! Posso farejar os pneus?"',
'Cruella: "Focada. Precisamos de estar focadas. Há zeladores em todo o lado."',
```

**0-4 Estacionamento Nível 1** *(novo)*
```
'Raya: "Há mais zeladores aqui do que gatos na rua!"',
'Cruella: "Precisamos de sair antes que percam completamente a paciência."',
```

**0-5 Estacionamento Nível 2** *(novo)*
```
'Raya: "Mais um andar! Estamos quase fora!"',
'Cruella: "Isto não era suposto ter tantos andares. Quem construiu este prédio?"',
```

**0-boss Lobby** *(update)*
```
'Cruella: "O zelador. Guardião do único corredor de saída."',
'Raya: "Eu trato dele! Tenho dentes!"',
'Cruella: "Tens também o entusiasmo de um aspirador. Mas aprecia-se."',
```

### World 1 — Cidade

**1-1 Rua Residencial** *(update)*
```
'Raya: "Ar fresco! Liberdade! Cheiro a comida! POMBOS!"',
'Cruella: "Controla-te. Há moradores por toda a parte."',
```

**1-2 Beco Escuro** *(novo)*
```
'Raya: "Beco escuro! Perfeito para uma emboscada!"',
'Cruella: "Isso é… exactamente o que eu ia dizer. Mas com mais elegância."',
```

**1-3 Praça com Jardim** *(update)*
```
'Raya: "Uma praça cheia de ratos! Posso caçar um?"',
'Cruella: "Não somos aqui para fazer amigos. Ou inimigos com patas."',
```

**1-4 Parque da Cidade** *(novo)*
```
'Raya: "ÁRVORES! Posso fazer xixi numa árvore??"',
'Cruella: "Concentra-te. Há donos nervosos em todo o parque."',
'Raya: "...Posso fazer xixi DEPOIS de me concentrar?"',
```

**1-5 Mercadinho/Feirinha** *(update)*
```
'Cruella: "O mercado. Cheiro insuportável mas excelente cobertura."',
'Raya: "Cheiro a churrasco! Focada. Estou focada. Que churrasco magnifico."',
```

**1-boss Depósito** *(novo)*
```
'Raya: "Seu Bigodes. Ouvi falar dele. É enorme."',
'Cruella: "Todos os gatos são enormes quando bloqueiam a saída."',
'Raya: "...Ele é mesmo muito enorme, Cruella."',
```

### World 2 — Exterior do Prédio

**2-1 Passeio Público** *(update)*
```
'Cruella: "Passeio à noite. Quase civilizado."',
'Raya: "Há ratos, zeladores, e o chão está molhado. Adoro!"',
```

**2-2 Pátio Interior** *(update)*
```
'Raya: "Pátio! Espaço aberto. Boa visibilidade."',
'Cruella: "Gatos em todo o lado. Alguém os alimentou em excesso."',
```

**2-3 Garagem de Serviço** *(novo)*
```
'Raya: "Garagem. Cheiro a óleo e a zeladores."',
'Cruella: "Mais zeladores? Quantos tem este prédio?!"',
'Raya: "Muitos. É um prédio muito bem guardado."',
```

**2-4 Escadas de Emergência** *(update)*
```
'Cruella: "Escadas de emergência. Sempre soube que morreria a subir escadas."',
'Raya: "Estamos quase no telhado! Vai ser incrível!"',
'Cruella: "Isso é suposto motivar-me?"',
```

**2-5 Varandas/Fachada** *(novo)*
```
'Raya: "Varandas! Conseguimos ver toda a cidade daqui!"',
'Cruella: "Não olhes para baixo. Não olhes para baixo. Não—"',
'Raya: "Eu olhei para baixo."',
```

**2-boss Telhado/Drone** *(update)*
```
'Raya: "Um drone. Com câmeras. E bombas."',
'Cruella: "Reconheço aquele modelo. Eu tinha um igual."',
'Raya: "E agora ele quer matar-nos."',
'Cruella: "O meu era mais elegante."',
```

---

## 3. Transições de Mundo — `worldTransition`

Nova field em `LevelData`:
```typescript
worldTransition?: string[]   // diálogo mostrado em LevelCompleteScene após boss
```

Adicionada aos 3 níveis boss (isBossLevel: true) que têm `nextLevel` para outro mundo:

**0-boss** → World 1:
```
'Raya: "CONSEGUIMOS! Saímos do edifício!"',
'Cruella: "Saímos para a rua. Que é igualmente perigosa."',
'Raya: "Deixa-me ter este momento, Cruella."',
```

**1-boss** → World 2:
```
'Raya: "Seu Bigodes foi derrotado! Incrível!"',
'Cruella: "É o mínimo esperado. Precisamos de subir o exterior do prédio."',
'Raya: "...O lado de fora? Lá em cima?"',
```

**Comportamento em `LevelCompleteScene`:**
Se o nível completado tiver `worldTransition`, o botão ENTER muda de label para `"[ ENTER — Próximo Mundo ]"` e, ao ser premido, mostra o diálogo inline: fundo escuro sobre o ecrã actual, linhas de texto animadas com fade-in sequencial (uma por uma, 600ms entre cada linha), depois botão `"[ ENTER — Continuar ]"` que navega para a próxima fase normalmente. Não é lançada uma nova Scene — o diálogo ocorre dentro de `LevelCompleteScene`.

---

## 4. `EndingScene` — Vitória Final

Nova cena disparada quando `nextLevel === null` (após 2-boss Drone).

**Fluxo:** 4 momentos em sequência, cada um com botão/tecla para avançar.

### Momento 1 — Alívio
Fundo negro com estrelas (reutiliza efeito de `IntroCrawlScene`):
```
Raya: "CONSEGUIMOS! Estamos livres!"
Cruella: "Sabia que iríamos conseguir. Nunca duvidei nem um segundo."
```

### Momento 2 — Reconhecimento (emotivo)
```
Raya: "Foste incrível lá dentro, Cruella."
Cruella: "...Tu também não foste má, para um cão."
Raya: "[abana o rabo vigorosamente]"
Cruella: "Para. Estás a fazer-me sorrir e odeio isso."
```

### Momento 3 — Estatísticas
Painel com fundo escuro, animado:
- Pontuação total da sessão
- Medalhas obtidas (Gold/Silver/Bronze/nenhuma)
- Ossos dourados recolhidos
- Inimigos derrotados
- Mortes

### Momento 4 — Créditos + Botão
```
"Fim."
"Obrigado por jogar Cruella & Raya!"

[ ENTER — Jogar de Novo ]   [ M — Mapa do Mundo ]
```

"Jogar de Novo" → `KEYS.CHARACTER_SELECT` com `gameState.reset()`
"Mapa do Mundo" → `KEYS.WORLD_MAP`

---

## 5. Integração — `LevelCompleteScene.goNext()`

**Abordagem:** Zero mudanças em `GameScene`. A detecção ocorre dentro de `LevelCompleteScene`.

`goNext()` actualmente navega para `KEYS.WORLD_MAP` quando `nextLevel === null`. Alterar para navegar para `KEYS.ENDING` nesse caso. O label do botão já tem lógica condicional (`'[ ENTER — Próxima Fase ]'` vs `'[ ENTER — Ver Créditos ]'`) — apenas substituir o destino de `KEYS.WORLD_MAP` para `KEYS.ENDING`.

---

## 6. Registo em `BootScene`

Adicionar `EndingScene` ao array de cenas registadas no `Game` config.

---

## Ficheiros Afectados

| Ficheiro | Tipo de Mudança |
|----------|----------------|
| `src/scenes/IntroCrawlScene.ts` | Substituir `CRAWL_TEXT` e cabeçalho |
| `src/levels/LevelData.ts` | Adicionar `worldTransition?: string[]` |
| `src/levels/World0.ts` | `intro` em 0-2, 0-4, 0-5; update 0-1, 0-3, 0-boss; `worldTransition` em 0-boss |
| `src/levels/World1.ts` | `intro` em 1-2, 1-4, 1-boss; update 1-1, 1-3, 1-5; `worldTransition` em 1-boss |
| `src/levels/World2.ts` | `intro` em 2-3, 2-5; update 2-1, 2-2, 2-4, 2-boss |
| `src/scenes/LevelCompleteScene.ts` | `goNext()` → `KEYS.ENDING` quando `nextLevel === null`; mostrar `worldTransition` se presente |
| `src/scenes/EndingScene.ts` | **Novo** — 4 momentos: alívio + reconhecimento + stats + créditos |
| `src/main.ts` ou `BootScene.ts` | Registar `EndingScene` |
| `src/constants.ts` | Adicionar `KEYS.ENDING = 'ending'` |

---

## Testes

Não são necessários testes unitários novos — os diálogos são dados puros e a `EndingScene` é visual. O tipo `worldTransition?: string[]` em `LevelData` é verificado pelo compilador TypeScript.

Os 82 testes existentes devem continuar a passar sem alteração.

---

## Fora de Âmbito

- Retratos animados dos personagens
- Voz/áudio para os diálogos
- World 3 ou novos níveis
- Sistema de cutscene com sprites em movimento
