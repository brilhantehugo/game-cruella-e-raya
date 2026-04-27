import { LevelData } from './LevelData'

const G = 416 // ground surface y

const COLS = 96  // default: 3072px
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function multiPlatRow(...ranges: [number, number][]): number[] {
  const row = emptyRow()
  for (const [x, len] of ranges) for (let i = x; i < x + len; i++) row[i] = 2
  return row
}

function mkHelpers(cols: number) {
  const e = (): number[] => Array(cols).fill(0)
  const g = (): number[] => Array(cols).fill(1)
  const mp = (...ranges: [number, number][]): number[] => {
    const r = e()
    for (const [x, len] of ranges) for (let i = x; i < x + len; i++) r[i] = 2
    return r
  }
  return { e, g, mp }
}

const c70  = mkHelpers(70)   // Corredor     (0-2): 70 cols = 2240px
const c90  = mkHelpers(90)   // Est. Nível 1 (0-4): 90 cols = 2880px
const c100 = mkHelpers(100)  // Est. Nível 2 (0-5): 100 cols = 3200px

// ── 0-1: Sala de Estar ───────────────────────────────────────────────────────
export const LEVEL_0_1: LevelData = {
  id: '0-1', name: 'Sala de Estar', bgColor: 0xf5e6c8,
  backgroundTheme: 'apartamento' as const, timeLimit: 180, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    multiPlatRow([6,5],  [65,5]),  emptyRow(),
    multiPlatRow([16,4], [76,4]),  emptyRow(),
    multiPlatRow([28,5], [86,5]),  emptyRow(),
    multiPlatRow([40,4]),          emptyRow(),
    multiPlatRow([50,5]),          emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3008, exitY: 370,
  checkpointX: 1536, checkpointY: 380,
  miniBoss: {
    triggerX:      2400,   // ~78% do mapa — boss como guardião da casa
    spawnX:        2640,
    spawnY:        352,
    leftBarrierX:  2176,
    rightBarrierX: 3008,
  },
  enemies: [
    { type: 'hugo',    x: 500,  y: 390 },
    { type: 'hannah',  x: 1200, y: 390 },
    { type: 'hugo',    x: 1650, y: 390 },
    { type: 'hannah',  x: 2100, y: 390 },
    { type: 'hugo',    x: 2500, y: 390 },
    { type: 'hannah',  x: 2800, y: 390 },
    { type: 'zelador', x: 2950, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 160,  y: 380 },
    { type: 'bone',           x: 400,  y: 380 },
    { type: 'petisco',        x: 650,  y: 380 },
    { type: 'bone',           x: 850,  y: 380 },
    { type: 'surprise_block', x: 1000, y: 310 },
    { type: 'laco',           x: 1200, y: 380 },
    { type: 'bone',           x: 1400, y: 380 },
    { type: 'pizza',          x: 1700, y: 380 },
    { type: 'bone',           x: 1900, y: 380 },
    { type: 'bone',           x: 2050, y: 380 },
    { type: 'petisco',        x: 2250, y: 380 },
    { type: 'surprise_block', x: 2400, y: 310 },
    { type: 'bone',           x: 2600, y: 380 },
    { type: 'laco',           x: 2750, y: 380 },
    { type: 'bone',           x: 2900, y: 380 },
  ],
  goldenBones: [
    { x: 220,  y: 80 },
    { x: 1100, y: 96 },
    { x: 1760, y: 80 },
    { x: 2700, y: 80 },
  ],
  nextLevel: '0-2',
  intro: {
    complexity: 1,
    dialogue: [
      'Raya: "Vejo Hugo e Hannah. Precisamos de um plano!"',
      'Cruella: "O plano É correr. Seu plano sempre foi correr."',
    ],
  },
  decorations: [
    { type: 'cadeira',   x: 180,  y: G, blocking: true },
    { type: 'mesa',      x: 380,  y: G, blocking: true },
    { type: 'balcao',    x: 650,  y: G, blocking: true },
    { type: 'balcao',    x: 930,  y: G, blocking: true },
    { type: 'fogao',     x: 1130, y: G, blocking: true },
    { type: 'geladeira', x: 1330, y: G, blocking: true },
    { type: 'balcao',    x: 1530, y: G, blocking: true },
    { type: 'grade',     x: 1750, y: G, blocking: true },
    { type: 'cadeira',   x: 1850, y: G, blocking: true },
    { type: 'mesa',      x: 2050, y: G, blocking: true },
    { type: 'estante',   x: 2270, y: G, blocking: true },
    { type: 'balcao',    x: 2500, y: G, blocking: true },
    { type: 'balcao',    x: 2720, y: G, blocking: true },
    { type: 'grade',     x: 2950, y: G, blocking: true },
  ],
}

// ── 0-2: Corredor 🆕 ─────────────────────────────────────────────────────────
export const LEVEL_0_2: LevelData = {
  id: '0-2', name: 'Corredor', bgColor: 0xe0ceaa,
  backgroundTheme: 'apartamento' as const, timeLimit: 160, tileWidthCols: 70,
  tiles: [
    c70.e(), c70.e(), c70.e(),
    c70.mp([5,3], [35,3], [60,3]), c70.e(),
    c70.mp([15,4], [45,4]), c70.e(),
    c70.mp([25,3], [55,3]), c70.e(),
    c70.e(), c70.e(), c70.e(), c70.e(),
    c70.g(),
  ],
  spawnX: 64, spawnY: 350, exitX: 2176, exitY: 370,
  checkpointX: 1120, checkpointY: 380,
  enemies: [
    { type: 'hugo',   x: 420,  y: 390 },
    { type: 'hannah', x: 840,  y: 390 },
    { type: 'hugo',   x: 1260, y: 390 },
    { type: 'hannah', x: 1680, y: 390 },
    { type: 'gato',   x: 2050, y: 390 },
  ],
  items: [
    { type: 'bone',    x: 200,  y: 380 },
    { type: 'bone',    x: 480,  y: 380 },
    { type: 'petisco', x: 750,  y: 380 },
    { type: 'bone',    x: 1000, y: 380 },
    { type: 'bone',    x: 1300, y: 380 },
    { type: 'bone',    x: 1550, y: 380 },
    { type: 'bone',    x: 1820, y: 380 },
    { type: 'bone',    x: 2080, y: 380 },
  ],
  goldenBones: [
    { x: 350,  y: 80 },
    { x: 1700, y: 80 },
  ],
  nextLevel: '0-3',
  intro: {
    complexity: 1,
    dialogue: [
      'Raya: "Corredor estreito. Vou na frente para te proteger!"',
      'Cruella: "Eu mesma consigo me proteger, obrigada. Vai."',
    ],
  },
  decorations: [
    { type: 'cadeira',  x: 150,  y: G, blocking: true },
    { type: 'balcao',   x: 370,  y: G, blocking: true },
    { type: 'estante',  x: 620,  y: G, blocking: true },
    { type: 'cadeira',  x: 900,  y: G, blocking: true },
    { type: 'balcao',   x: 1130, y: G, blocking: true },
    { type: 'estante',  x: 1400, y: G, blocking: true },
    { type: 'cadeira',  x: 1680, y: G, blocking: true },
    { type: 'balcao',   x: 1950, y: G, blocking: true },
  ],
}

// ── 0-3: Estacionamento do Prédio (era 0-2) ──────────────────────────────────
export const LEVEL_0_3: LevelData = {
  id: '0-3', name: 'Estacionamento do Prédio', bgColor: 0x2e2e40,
  backgroundTheme: 'apto_boss' as const, timeLimit: 200, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    emptyRow(), emptyRow(), emptyRow(),
    emptyRow(), emptyRow(), emptyRow(),
    emptyRow(), multiPlatRow([20,5], [50,5], [75,6]),
    emptyRow(), emptyRow(), groundRow(),
  ],
  spawnX: 64, spawnY: 350, exitX: 3008, exitY: 370,
  checkpointX: 1536, checkpointY: 380,
  enemies: [
    { type: 'gato',    x: 400,  y: 390 },
    { type: 'zelador', x: 700,  y: 390 },
    { type: 'gato',    x: 1000, y: 390 },
    { type: 'morador', x: 1200, y: 390 },
    { type: 'zelador', x: 1500, y: 390 },
    { type: 'gato',    x: 1750, y: 390 },
    { type: 'zelador', x: 2000, y: 390 },
    { type: 'gato',    x: 2300, y: 390 },
    { type: 'morador', x: 2550, y: 390 },
    { type: 'gato',    x: 2800, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 160,  y: 380 },
    { type: 'bone',           x: 360,  y: 380 },
    { type: 'petisco',        x: 700,  y: 380 },
    { type: 'bone',           x: 960,  y: 380 },
    { type: 'bone',           x: 1150, y: 380 },
    { type: 'pizza',          x: 1400, y: 380 },
    { type: 'bone',           x: 1640, y: 380 },
    { type: 'bone',           x: 1820, y: 380 },
    { type: 'bone',           x: 2000, y: 380 },
    { type: 'petisco',        x: 2200, y: 380 },
    { type: 'surprise_block', x: 2400, y: 310 },
    { type: 'bone',           x: 2600, y: 380 },
    { type: 'bone',           x: 2850, y: 380 },
  ],
  goldenBones: [
    { x: 272,  y: 64 },
    { x: 1024, y: 64 },
    { x: 1760, y: 64 },
    { x: 2650, y: 64 },
  ],
  nextLevel: '0-4',
  intro: {
    complexity: 2,
    dialogue: [
      'Raya: "Estacionamento! Há carros! Posso farejar os pneus?"',
      'Cruella: "Focada. Precisamos ficar focadas. Tem zelador por todo lado."',
    ],
  },
  decorations: [
    { type: 'carro',  x: 224,  y: G, blocking: true },
    { type: 'carro',  x: 544,  y: G, blocking: true },
    { type: 'poste',  x: 720,  y: G },
    { type: 'carro',  x: 864,  y: G, blocking: true },
    { type: 'carro',  x: 1120, y: G, blocking: true },
    { type: 'poste',  x: 1280, y: G },
    { type: 'carro',  x: 1440, y: G, blocking: true },
    { type: 'carro',  x: 1664, y: G, blocking: true },
    { type: 'carro',  x: 1900, y: G, blocking: true },
    { type: 'poste',  x: 2080, y: G },
    { type: 'carro',  x: 2240, y: G, blocking: true },
    { type: 'carro',  x: 2464, y: G, blocking: true },
    { type: 'poste',  x: 2640, y: G },
    { type: 'carro',  x: 2800, y: G, blocking: true },
    { type: 'grade',  x: 2900, y: G, blocking: true },
    { type: 'grade',  x: 2940, y: G, blocking: true },
    { type: 'grade',  x: 2980, y: G, blocking: true },
  ],
}

// ── 0-4: Estacionamento Nível 1 🆕 ───────────────────────────────────────────
export const LEVEL_0_4: LevelData = {
  id: '0-4', name: 'Estacionamento Nível 1', bgColor: 0x1a1a2e,
  backgroundTheme: 'apto_boss' as const, timeLimit: 200, tileWidthCols: 90,
  tiles: [
    c90.e(), c90.e(), c90.e(),
    c90.mp([10,4], [40,4], [70,4]), c90.e(),
    c90.mp([22,5], [55,4]), c90.e(),
    c90.mp([32,4], [65,5]), c90.e(),
    c90.e(), c90.e(), c90.e(), c90.e(),
    c90.g(),
  ],
  spawnX: 64, spawnY: 350, exitX: 2816, exitY: 370,
  checkpointX: 1440, checkpointY: 380,
  enemies: [
    { type: 'zelador', x: 400,  y: 390 },
    { type: 'rato',    x: 700,  y: 390 },
    { type: 'gato',    x: 1000, y: 390 },
    { type: 'zelador', x: 1300, y: 390 },
    { type: 'rato',    x: 1600, y: 390 },
    { type: 'zelador', x: 1900, y: 390 },
    { type: 'gato',    x: 2200, y: 390 },
    { type: 'zelador', x: 2600, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 200,  y: 380 },
    { type: 'bone',           x: 500,  y: 380 },
    { type: 'petisco',        x: 800,  y: 380 },
    { type: 'bone',           x: 1100, y: 380 },
    { type: 'bone',           x: 1400, y: 380 },
    { type: 'surprise_block', x: 1550, y: 310 },
    { type: 'bone',           x: 1700, y: 380 },
    { type: 'bone',           x: 2000, y: 380 },
    { type: 'petisco',        x: 2300, y: 380 },
    { type: 'bone',           x: 2600, y: 380 },
  ],
  goldenBones: [
    { x: 350,  y: 80 },
    { x: 1440, y: 80 },
    { x: 2500, y: 80 },
  ],
  nextLevel: '0-5',
  intro: {
    complexity: 2,
    dialogue: [
      'Raya: "Tem mais zelador aqui do que gato na rua!"',
      'Cruella: "Precisamos sair antes que percam a paciência de vez."',
    ],
  },
  decorations: [
    { type: 'carro',  x: 200,  y: G, blocking: true },
    { type: 'carro',  x: 500,  y: G, blocking: true },
    { type: 'poste',  x: 700,  y: G },
    { type: 'carro',  x: 900,  y: G, blocking: true },
    { type: 'carro',  x: 1200, y: G, blocking: true },
    { type: 'poste',  x: 1450, y: G },
    { type: 'carro',  x: 1650, y: G, blocking: true },
    { type: 'carro',  x: 1950, y: G, blocking: true },
    { type: 'poste',  x: 2200, y: G },
    { type: 'carro',  x: 2450, y: G, blocking: true },
  ],
}

// ── 0-5: Estacionamento Nível 2 🆕 ───────────────────────────────────────────
export const LEVEL_0_5: LevelData = {
  id: '0-5', name: 'Estacionamento Nível 2', bgColor: 0x12121e,
  backgroundTheme: 'apto_boss' as const, timeLimit: 200, tileWidthCols: 100,
  tiles: [
    c100.e(), c100.e(), c100.e(),
    c100.mp([8,4], [35,4], [62,4], [88,4]), c100.e(),
    c100.mp([18,5], [48,5], [75,4]), c100.e(),
    c100.mp([28,4], [58,4], [82,5]), c100.e(),
    c100.e(), c100.e(), c100.e(), c100.e(),
    c100.g(),
  ],
  spawnX: 64, spawnY: 350, exitX: 3136, exitY: 370,
  checkpointX: 1600, checkpointY: 380,
  enemies: [
    { type: 'zelador', x: 350,  y: 390 },
    { type: 'rato',    x: 650,  y: 390 },
    { type: 'gato',    x: 950,  y: 390 },
    { type: 'zelador', x: 1200, y: 390 },
    { type: 'rato',    x: 1450, y: 390 },
    { type: 'zelador', x: 1700, y: 390 },
    { type: 'rato',    x: 2000, y: 390 },
    { type: 'gato',    x: 2300, y: 390 },
    { type: 'zelador', x: 2600, y: 390 },
    { type: 'zelador', x: 2950, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 200,  y: 380 },
    { type: 'bone',           x: 500,  y: 380 },
    { type: 'petisco',        x: 800,  y: 380 },
    { type: 'bone',           x: 1100, y: 380 },
    { type: 'bone',           x: 1400, y: 380 },
    { type: 'surprise_block', x: 1600, y: 310 },
    { type: 'bone',           x: 1800, y: 380 },
    { type: 'bone',           x: 2100, y: 380 },
    { type: 'petisco',        x: 2400, y: 380 },
    { type: 'bone',           x: 2700, y: 380 },
    { type: 'bone',           x: 3000, y: 380 },
  ],
  goldenBones: [
    { x: 400,  y: 80 },
    { x: 1600, y: 80 },
    { x: 2800, y: 80 },
  ],
  nextLevel: '0-boss',
  intro: {
    complexity: 2,
    dialogue: [
      'Raya: "Mais um andar! Estamos quase fora!"',
      'Cruella: "Não era pra ter tantos andares. Quem construiu esse prédio?"',
    ],
  },
  decorations: [
    { type: 'carro',  x: 200,  y: G, blocking: true },
    { type: 'carro',  x: 500,  y: G, blocking: true },
    { type: 'poste',  x: 750,  y: G },
    { type: 'carro',  x: 1000, y: G, blocking: true },
    { type: 'carro',  x: 1300, y: G, blocking: true },
    { type: 'poste',  x: 1550, y: G },
    { type: 'carro',  x: 1750, y: G, blocking: true },
    { type: 'carro',  x: 2050, y: G, blocking: true },
    { type: 'poste',  x: 2300, y: G },
    { type: 'carro',  x: 2550, y: G, blocking: true },
    { type: 'carro',  x: 2850, y: G, blocking: true },
  ],
}

// ── 0-boss: Lobby / Saída do Prédio ──────────────────────────────────────────
export const LEVEL_0_BOSS: LevelData = {
  id: '0-boss', name: 'Lobby / Saída do Prédio', bgColor: 0xf0f0e8,
  backgroundTheme: 'apto_boss' as const, timeLimit: 0, tileWidthCols: 60,
  tiles: (() => {
    const BC = 60
    const be = (): number[] => Array(BC).fill(0)
    const bg = (): number[] => Array(BC).fill(1)
    const bpm = (...ranges: [number, number][]): number[] => {
      const r = be()
      for (const [x, len] of ranges) for (let i = x; i < x + len; i++) r[i] = 2
      return r
    }
    return [
      be(), be(), be(),
      bpm([5,4], [20,4], [36,4], [51,4]),
      be(),
      bpm([12,4], [28,4], [44,4]),
      be(), be(), be(), be(),
      bpm([8,6], [34,6]),
      be(), be(), bg(),
    ]
  })(),
  spawnX: 64, spawnY: 300, exitX: 1856, exitY: 370,
  checkpointX: 80, checkpointY: 300,
  enemies: [], items: [], goldenBones: [],
  nextLevel: '1-1', isBossLevel: true,
  intro: {
    complexity: 3,
    dialogue: [
      'Cruella: "O zelador. Guardião do único corredor de saída."',
      'Raya: "Eu trato dele! Tenho dentes!"',
      'Cruella: "Você também tem o entusiasmo de um aspirador. Mas é apreciável."',
    ],
  },
  worldTransition: [
    'Raya: "CONSEGUIMOS! A gente saiu do prédio!"',
    'Cruella: "Saímos para a rua. Que é igualmente perigosa."',
    'Raya: "Me deixa ter esse momento, Cruella."',
  ],
  decorations: [
    { type: 'balcao',    x: 150,  y: G, blocking: true },
    { type: 'mesa',      x: 420,  y: G, blocking: true },
    { type: 'cadeira',   x: 680,  y: G, blocking: true },
    { type: 'balcao',    x: 940,  y: G, blocking: true },
    { type: 'mesa',      x: 1160, y: G, blocking: true },
    { type: 'cadeira',   x: 1400, y: G, blocking: true },
    { type: 'balcao',    x: 1620, y: G, blocking: true },
    { type: 'grade',     x: 1820, y: G, blocking: true },
  ],
}

export const WORLD0_LEVELS: Record<string, LevelData> = {
  '0-1':    LEVEL_0_1,
  '0-2':    LEVEL_0_2,
  '0-3':    LEVEL_0_3,
  '0-4':    LEVEL_0_4,
  '0-5':    LEVEL_0_5,
  '0-boss': LEVEL_0_BOSS,
}
