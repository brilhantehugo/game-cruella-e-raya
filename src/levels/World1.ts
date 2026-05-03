import { LevelData, DecorationSpawn, HUMAN_SPAWN_Y } from './LevelData'

const G = 416 // ground surface y (origin bottom = setOrigin(0.5,1) → y=416)

const COLS = 80
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function platformRow(x: number, len: number): number[] {
  const row = emptyRow(); for (let i = x; i < x + len; i++) row[i] = 2; return row
}

function mkHelpers(cols: number) {
  const e = (): number[] => Array(cols).fill(0)
  const g = (): number[] => Array(cols).fill(1)
  const p = (x: number, len: number): number[] => {
    const r = e(); for (let i = x; i < x + len; i++) r[i] = 2; return r
  }
  const mp = (...ranges: [number, number][]): number[] => {
    const r = e()
    for (const [x, len] of ranges) for (let i = x; i < x + len; i++) r[i] = 2
    return r
  }
  return { e, g, p, mp }
}

const r80 = mkHelpers(80)    // Beco Escuro  (1-2): 80 cols  = 2560px
const r12  = mkHelpers(100)  // Praça        (1-3, era 1-2): 100 cols = 3200px
const r95  = mkHelpers(95)   // Parque       (1-4): 95 cols  = 3040px
const r13  = mkHelpers(110)  // Mercado      (1-5, era 1-3): 110 cols = 3520px

export const LEVEL_1_1: LevelData = {
  id: '1-1', name: 'Rua Residencial', bgColor: 0x87CEEB, backgroundTheme: 'rua' as const, timeLimit: 200, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    platformRow(10, 5), emptyRow(), platformRow(20, 6), emptyRow(),
    platformRow(35, 4), platformRow(48, 5), emptyRow(),
    platformRow(60, 6), emptyRow(), emptyRow(), groundRow(),
  ],
  spawnX: 64, spawnY: 300, exitX: 2496, exitY: 370,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'rato',    x: 320,  y: 390 },
    { type: 'morador', x: 600,  y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 900,  y: 390 },
    { type: 'morador', x: 1200, y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 1500, y: 390 },
    { type: 'dono',    x: 1900, y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 2200, y: 390 },
    { type: 'morador', x: 1700, y: HUMAN_SPAWN_Y },
    { type: 'morador', x: 2000, y: HUMAN_SPAWN_Y },
    { type: 'dono',    x: 2400, y: HUMAN_SPAWN_Y },
  ],
  items: [
    { type: 'bone', x: 160, y: 380 }, { type: 'bone', x: 352, y: 380 },
    { type: 'bone', x: 480, y: 180 }, { type: 'petisco', x: 700, y: 380 },
    { type: 'bone', x: 900, y: 380 }, { type: 'surprise_block', x: 1100, y: 320 },
    { type: 'bone', x: 1400, y: 380 }, { type: 'laco', x: 1600, y: 380 },
    { type: 'bone', x: 1800, y: 380 }, { type: 'bone', x: 2100, y: 380 },
    { type: 'pizza',   x: 2300, y: 380 },
    { type: 'bone',    x: 1650, y: 380 },
    { type: 'petisco', x: 2050, y: 380 },
    { type: 'bone',    x: 2350, y: 380 },
  ],
  goldenBones: [{ x: 352, y: 96 }, { x: 1536, y: 96 }, { x: 1952, y: 224 }],
  nextLevel: '1-2',
  intro: {
    complexity: 2,
    dialogue: [
      'Raya: "Ar fresco! Liberdade! Cheiro a comida! POMBOS!"',
      'Cruella: "Controle-se. Tem morador por todo lado."',
    ],
  },
  decorations: [
    { type: 'loja',    x: 180,  y: G },
    { type: 'poste',   x: 420,  y: G },
    { type: 'banco',   x: 620,  y: G },
    { type: 'casa',    x: 1100, y: G },
    { type: 'lixeira', x: 1300, y: G },
    { type: 'placa',   x: 1500, y: G },
    { type: 'loja',    x: 1720, y: G },
    { type: 'poste',   x: 2100, y: G },
    { type: 'poste',   x: 2400, y: G },
    { type: 'lixeira', x: 2350, y: G },
  ],
}

// ── 1-2: Beco Escuro 🆕 ──────────────────────────────────────────────────────
export const LEVEL_1_2: LevelData = {
  id: '1-2', name: 'Beco Escuro', bgColor: 0x1a1030,
  backgroundTheme: 'rua' as const, timeLimit: 200, tileWidthCols: 80,
  tiles: [
    r80.e(), r80.e(),
    r80.mp([5,4], [28,4], [55,4]),
    r80.e(),
    r80.mp([12,5], [38,4], [62,4]),
    r80.e(),
    r80.mp([20,4], [48,5], [70,4]),
    r80.e(), r80.e(), r80.e(), r80.e(), r80.e(), r80.e(),
    r80.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 2496, exitY: 370,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'rato',  x: 350,  y: 390 },
    { type: 'gato',  x: 650,  y: 390 },
    { type: 'rato',  x: 900,  y: 390 },
    { type: 'rato',  x: 1150, y: 390 },
    { type: 'gato',  x: 1400, y: 390 },
    { type: 'rato',  x: 1700, y: 390 },
    { type: 'pombo', x: 2000, y: 140 },
    { type: 'gato',  x: 2200, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 200,  y: 380 },
    { type: 'bone',           x: 500,  y: 380 },
    { type: 'petisco',        x: 750,  y: 380 },
    { type: 'bone',           x: 1000, y: 380 },
    { type: 'surprise_block', x: 1200, y: 310 },
    { type: 'bone',           x: 1450, y: 380 },
    { type: 'bone',           x: 1700, y: 380 },
    { type: 'bone',           x: 1950, y: 380 },
    { type: 'bone',           x: 2250, y: 380 },
  ],
  goldenBones: [
    { x: 420,  y: 80 },
    { x: 2100, y: 80 },
  ],
  nextLevel: '1-3',
  intro: {
    complexity: 1,
    dialogue: [
      'Raya: "Beco escuro! Perfeito para uma emboscada!"',
      'Cruella: "Isso é… exatamente o que eu ia dizer. Mas com mais elegância."',
    ],
  },
  decorations: [
    { type: 'lixeira',   x: 150,  y: G },
    { type: 'saco_lixo', x: 350,  y: G },
    { type: 'grade',     x: 550,  y: G, blocking: true },
    { type: 'lixeira',   x: 750,  y: G },
    { type: 'saco_lixo', x: 950,  y: G },
    { type: 'grade',     x: 1150, y: G, blocking: true },
    { type: 'lixeira',   x: 1350, y: G },
    { type: 'saco_lixo', x: 1550, y: G },
    { type: 'grade',     x: 1750, y: G, blocking: true },
    { type: 'lixeira',   x: 2000, y: G },
  ],
}

// ── 1-3: Praça com Jardim (era 1-2) ──────────────────────────────────────────
export const LEVEL_1_3: LevelData = {
  id: '1-3', name: 'Praça com Jardim', bgColor: 0x90EE90,
  backgroundTheme: 'praca' as const, timeLimit: 200, tileWidthCols: 100,
  tiles: [
    r12.e(), r12.e(),
    r12.mp([5,4], [72,4], [87,4]),
    r12.e(),
    r12.p(15, 5), r12.mp([28,3], [78,3]), r12.e(),
    r12.mp([38,6], [90,5]), r12.p(52, 4), r12.e(),
    r12.mp([65,5], [80,4]), r12.e(), r12.e(),
    r12.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3136, exitY: 370,
  checkpointX: 1600, checkpointY: 380,
  enemies: [
    { type: 'pombo',   x: 400,  y: 160 },
    { type: 'morador', x: 700,  y: HUMAN_SPAWN_Y },
    { type: 'pombo',   x: 1000, y: 140 },
    { type: 'rato',    x: 1300, y: 390 },
    { type: 'pombo',   x: 1600, y: 150 },
    { type: 'dono',    x: 1900, y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 2200, y: 390 },
    { type: 'pombo',   x: 2400, y: 140 },
    { type: 'morador', x: 2600, y: HUMAN_SPAWN_Y },
    { type: 'pombo',   x: 2800, y: 150 },
    { type: 'dono',    x: 3000, y: HUMAN_SPAWN_Y },
  ],
  items: [
    { type: 'bone',           x: 200,  y: 380 },
    { type: 'bone',           x: 500,  y: 380 },
    { type: 'pipoca',         x: 750,  y: 380 },
    { type: 'surprise_block', x: 1000, y: 310 },
    { type: 'coleira',        x: 1300, y: 380 },
    { type: 'bone',           x: 1500, y: 380 },
    { type: 'bone',           x: 1800, y: 380 },
    { type: 'chapeu',         x: 2100, y: 380 },
    { type: 'bone',           x: 2300, y: 380 },
    { type: 'bone',           x: 2500, y: 380 },
    { type: 'petisco',        x: 2700, y: 380 },
    { type: 'surprise_block', x: 2850, y: 310 },
    { type: 'bone',           x: 3000, y: 380 },
  ],
  goldenBones: [
    { x: 192,  y: 64 },
    { x: 1248, y: 96 },
    { x: 2112, y: 160 },
    { x: 2880, y: 64 },
  ],
  nextLevel: '1-4',
  intro: {
    complexity: 2,
    dialogue: [
      'Raya: "Uma praça cheia de ratos! Posso caçar um?"',
      'Cruella: "Não estamos aqui pra fazer amigos. Ou inimigos com patas."',
    ],
  },
  decorations: [
    { type: 'banco',    x: 150,  y: G },
    { type: 'canteiro', x: 350,  y: G },
    { type: 'arvore',   x: 580,  y: G },
    { type: 'banco',    x: 780,  y: G },
    { type: 'canteiro', x: 980,  y: G },
    { type: 'poste',    x: 1180, y: G },
    { type: 'arvore',   x: 1400, y: G },
    { type: 'banco',    x: 1620, y: G },
    { type: 'canteiro', x: 1850, y: G },
    { type: 'arvore',   x: 2100, y: G },
    { type: 'banco',    x: 2320, y: G },
    { type: 'canteiro', x: 2520, y: G },
    { type: 'arvore',   x: 2720, y: G },
    { type: 'banco',    x: 2940, y: G },
    { type: 'poste',    x: 3100, y: G },
  ],
}

// ── 1-4: Parque da Cidade 🆕 ──────────────────────────────────────────────────
export const LEVEL_1_4: LevelData = {
  id: '1-4', name: 'Parque da Cidade', bgColor: 0x1a3a1a,
  backgroundTheme: 'praca' as const, timeLimit: 200, tileWidthCols: 95,
  tiles: [
    r95.e(), r95.e(), r95.e(),
    r95.mp([10,5], [45,5], [78,5]),
    r95.e(),
    r95.mp([22,4], [58,4], [85,4]),
    r95.e(),
    r95.mp([32,6], [68,5]),
    r95.e(), r95.e(), r95.e(), r95.e(), r95.e(),
    r95.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 2976, exitY: 370,
  checkpointX: 1504, checkpointY: 380,
  enemies: [
    { type: 'pombo', x: 350,  y: 140 },
    { type: 'dono',  x: 600,  y: HUMAN_SPAWN_Y },
    { type: 'pombo', x: 850,  y: 150 },
    { type: 'rato',  x: 1100, y: 390 },
    { type: 'dono',  x: 1350, y: HUMAN_SPAWN_Y },
    { type: 'pombo', x: 1600, y: 140 },
    { type: 'rato',  x: 1850, y: 390 },
    { type: 'pombo', x: 2100, y: 150 },
    { type: 'dono',  x: 2400, y: HUMAN_SPAWN_Y },
  ],
  items: [
    { type: 'bone',           x: 200,  y: 380 },
    { type: 'bone',           x: 450,  y: 380 },
    { type: 'petisco',        x: 700,  y: 380 },
    { type: 'bone',           x: 950,  y: 380 },
    { type: 'surprise_block', x: 1150, y: 310 },
    { type: 'coleira',        x: 1350, y: 380 },
    { type: 'bone',           x: 1550, y: 380 },
    { type: 'bone',           x: 1800, y: 380 },
    { type: 'bone',           x: 2050, y: 380 },
    { type: 'petisco',        x: 2300, y: 380 },
    { type: 'bone',           x: 2700, y: 380 },
  ],
  goldenBones: [
    { x: 380,  y: 80 },
    { x: 1504, y: 80 },
    { x: 2600, y: 80 },
  ],
  nextLevel: '1-5',
  intro: {
    complexity: 2,
    dialogue: [
      'Raya: "ÁRVORES! Posso fazer xixi numa árvore??"',
      'Cruella: "Concentra. Tem dono nervoso por todo o parque."',
      'Raya: "...Posso fazer xixi DEPOIS de me concentrar?"',
    ],
  },
  decorations: [
    { type: 'arvore',   x: 150,  y: G },
    { type: 'banco',    x: 380,  y: G },
    { type: 'canteiro', x: 600,  y: G },
    { type: 'arvore',   x: 820,  y: G },
    { type: 'banco',    x: 1040, y: G },
    { type: 'canteiro', x: 1280, y: G },
    { type: 'arvore',   x: 1500, y: G },
    { type: 'banco',    x: 1720, y: G },
    { type: 'canteiro', x: 1940, y: G },
    { type: 'arvore',   x: 2180, y: G },
    { type: 'banco',    x: 2400, y: G },
    { type: 'poste',    x: 2650, y: G },
  ],
}

// ── 1-5: Mercadinho / Feirinha (era 1-3) ──────────────────────────────────────
export const LEVEL_1_5: LevelData = {
  id: '1-5', name: 'Mercadinho / Feirinha', bgColor: 0xFFD700,
  backgroundTheme: 'mercado' as const, timeLimit: 200, tileWidthCols: 110,
  tiles: [
    r13.e(), r13.e(), r13.mp([8,5], [20,4]),
    r13.mp([32,5], [45,3]), r13.e(),
    r13.mp([55,6], [65,4]), r13.e(),
    r13.mp([70,5], [83,4], [96,4]),
    r13.mp([75,3], [89,3], [103,4]),
    r13.e(), r13.e(), r13.e(), r13.e(),
    r13.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3456, exitY: 370,
  checkpointX: 1760, checkpointY: 380,
  enemies: [
    { type: 'rato',    x: 300,  y: 390 }, { type: 'gato',    x: 600,  y: 390 },
    { type: 'morador', x: 800,  y: HUMAN_SPAWN_Y }, { type: 'pombo',   x: 1000, y: 120 },
    { type: 'dono',    x: 1200, y: HUMAN_SPAWN_Y }, { type: 'rato',    x: 1500, y: 390 },
    { type: 'gato',    x: 1700, y: 390 }, { type: 'pombo',   x: 1900, y: 150 },
    { type: 'morador', x: 2100, y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 2400, y: 390 },
    { type: 'rato',    x: 2650, y: 390 },
    { type: 'gato',    x: 2900, y: 390 },
    { type: 'morador', x: 3100, y: HUMAN_SPAWN_Y },
    { type: 'dono',    x: 3300, y: HUMAN_SPAWN_Y },
  ],
  items: [
    { type: 'bone',           x: 160,  y: 380 }, { type: 'petisco',  x: 400,  y: 380 },
    { type: 'surprise_block', x: 700,  y: 310 }, { type: 'bola',     x: 950,  y: 380 },
    { type: 'bone',           x: 1100, y: 380 }, { type: 'frisbee',  x: 1350, y: 380 },
    { type: 'bandana',        x: 1600, y: 380 }, { type: 'bone',     x: 1850, y: 380 },
    { type: 'surprise_block', x: 2100, y: 300 }, { type: 'bone',     x: 2300, y: 380 },
    { type: 'bone',           x: 2500, y: 380 },
    { type: 'petisco',        x: 2700, y: 380 },
    { type: 'bone',           x: 2900, y: 380 },
    { type: 'surprise_block', x: 3100, y: 300 },
    { type: 'bone',           x: 3300, y: 380 },
  ],
  goldenBones: [
    { x: 288,  y: 64 },
    { x: 1472, y: 96 },
    { x: 2048, y: 192 },
    { x: 3100, y: 64 },
  ],
  nextLevel: '1-boss',
  intro: {
    complexity: 2,
    dialogue: [
      'Cruella: "O mercado. Cheiro insuportável mas excelente cobertura."',
      'Raya: "Cheiro a churrasco! Focada. Estou focada. Que churrasco magnifico."',
    ],
  },
  decorations: [
    { type: 'barraca',   x: 150,  y: G },
    { type: 'lixeira',   x: 400,  y: G },
    { type: 'poste',     x: 600,  y: G },
    { type: 'barraca',   x: 800,  y: G },
    { type: 'saco_lixo', x: 1050, y: G },
    { type: 'barraca',   x: 1250, y: G },
    { type: 'lixeira',   x: 1500, y: G },
    { type: 'barraca',   x: 1700, y: G },
    { type: 'poste',     x: 1950, y: G },
    { type: 'barraca',   x: 2150, y: G },
    { type: 'lixeira',   x: 2380, y: G },
    { type: 'barraca',   x: 2550, y: G },
    { type: 'saco_lixo', x: 2750, y: G },
    { type: 'barraca',   x: 2950, y: G },
    { type: 'lixeira',   x: 3150, y: G },
    { type: 'barraca',   x: 3350, y: G },
  ],
}

export const LEVEL_1_BOSS: LevelData = {
  id: '1-boss', name: 'Depósito de Lixo — Seu Bigodes', bgColor: 0x2F4F2F,
  backgroundTheme: 'boss' as const, timeLimit: 0, tileWidthCols: 30,
  tiles: [
    Array(30).fill(0), Array(30).fill(0), Array(30).fill(0),
    [...Array(5).fill(0), ...Array(4).fill(1), ...Array(3).fill(0),
     ...Array(4).fill(1), ...Array(3).fill(0), ...Array(4).fill(1), ...Array(7).fill(0)],
    Array(30).fill(0), Array(30).fill(0), Array(30).fill(0),
    Array(30).fill(0), Array(30).fill(0), Array(30).fill(0),
    Array(30).fill(0), Array(30).fill(0), Array(30).fill(0),
    Array(30).fill(1),
  ],
  spawnX: 64, spawnY: 300, exitX: 896, exitY: 370,
  checkpointX: 80, checkpointY: 300,
  enemies: [], items: [], goldenBones: [],
  nextLevel: '2-1', isBossLevel: true,
  intro: {
    complexity: 3,
    dialogue: [
      'Raya: "Seu Bigodes. Ouvi falar dele. É enorme."',
      'Cruella: "Todos os gatos são enormes quando bloqueiam a saída."',
      'Raya: "...Ele é muito grande mesmo, Cruella."',
    ],
  },
  worldTransition: [
    'Raya: "Seu Bigodes foi derrotado! Incrível!"',
    'Cruella: "É o mínimo esperado. Precisamos subir pelo exterior do prédio."',
    'Raya: "...O lado de fora? Lá em cima?"',
  ],
  decorations: [
    { type: 'saco_lixo', x: 120, y: G },
    { type: 'lixeira',   x: 280, y: G },
    { type: 'saco_lixo', x: 450, y: G },
    { type: 'lixeira',   x: 640, y: G },
    { type: 'saco_lixo', x: 800, y: G },
  ],
}

export const WORLD1_LEVELS: Record<string, LevelData> = {
  '1-1': LEVEL_1_1, '1-2': LEVEL_1_2, '1-3': LEVEL_1_3,
  '1-4': LEVEL_1_4, '1-5': LEVEL_1_5, '1-boss': LEVEL_1_BOSS,
}
