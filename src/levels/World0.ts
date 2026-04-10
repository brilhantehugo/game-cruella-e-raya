import { LevelData } from './LevelData'

const G = 416 // ground surface y

const COLS = 96  // expanded: 3072px
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function platformRow(x: number, len: number): number[] {
  const row = emptyRow(); for (let i = x; i < x + len; i++) row[i] = 2; return row
}
function multiPlatRow(...ranges: [number, number][]): number[] {
  const row = emptyRow()
  for (const [x, len] of ranges) for (let i = x; i < x + len; i++) row[i] = 2
  return row
}

// ── 0-1: Sala de Estar — fugir da sala ───────────────────────────────────────
export const LEVEL_0_1: LevelData = {
  id: '0-1', name: 'Sala de Estar', bgColor: 0xf5e6c8,
  backgroundTheme: 'apartamento' as const, timeLimit: 180, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    multiPlatRow([6,5],  [65,5]),  emptyRow(),  // sofá alto na 2ª metade
    multiPlatRow([16,4], [76,4]),  emptyRow(),  // prateleira de livros
    multiPlatRow([28,5], [86,5]),  emptyRow(),  // mesa de jantar
    multiPlatRow([40,4]),          emptyRow(),
    multiPlatRow([50,5]),          emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3008, exitY: 370,
  checkpointX: 1536, checkpointY: 380,
  checkpointSprite: 'vaso',
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
  nextLevel: '0-boss',
  intro: {
    complexity: 1,
    dialogue: [
      'Precisamos passar pela sala sem que Hugo e Hannah nos vejam!',
      'Deixa comigo, eu sei latir bem alto para distraí-los!',
    ],
  },
  decorations: [
    { type: 'cadeira',   x: 180,  y: G, blocking: true },
    { type: 'mesa',      x: 380,  y: G, blocking: true },
    { type: 'vaso',      x: 580,  y: G, blocking: true },
    { type: 'balcao',    x: 800,  y: G, blocking: true },
    { type: 'balcao',    x: 1080, y: G, blocking: true },
    { type: 'fogao',     x: 1280, y: G, blocking: true },
    { type: 'geladeira', x: 1480, y: G, blocking: true },
    { type: 'balcao',    x: 1680, y: G, blocking: true },
    { type: 'grade',     x: 1900, y: G, blocking: true },
    { type: 'cadeira',   x: 2000, y: G, blocking: true },
    { type: 'mesa',      x: 2200, y: G, blocking: true },
    { type: 'estante',   x: 2420, y: G, blocking: true },
    { type: 'vaso',      x: 2620, y: G, blocking: true },
    { type: 'balcao',    x: 2820, y: G, blocking: true },
    { type: 'grade',     x: 2950, y: G, blocking: true },
  ],
}

// ── 0-2: Estacionamento do Prédio ────────────────────────────────────────────
export const LEVEL_0_2: LevelData = {
  id: '0-2', name: 'Estacionamento do Prédio', bgColor: 0x2e2e40,
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
  nextLevel: '1-1',
  intro: {
    complexity: 2,
    dialogue: [
      'O estacionamento! Zelador e porteiro estão de olho. Não nos peguem!',
      'E eu que achei que o pior era o aspirador… Vamos logo, Raya!',
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

// ── 0-boss: Cozinha — batalha contra o Wall-E ────────────────────────────────
export const LEVEL_0_BOSS: LevelData = {
  id: '0-boss', name: 'Cozinha — Wall-E Ataca!', bgColor: 0xf0f0e8,
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
      bpm([4,4], [18,4], [33,4], [48,4]),  // row 3: 4 prateleiras altas
      be(),
      bpm([11,4], [25,4], [40,4], [54,4]), // row 5: 4 prateleiras médias (offset das altas)
      be(), be(), be(), be(),
      bpm([7,6], [32,6]),                   // row 10: 2 bancadas longas de cozinha
      be(), be(), bg(),
    ]
  })(),
  spawnX: 64, spawnY: 300, exitX: 1856, exitY: 370,
  checkpointX: 80, checkpointY: 300,
  enemies: [], items: [], goldenBones: [],
  nextLevel: '0-2', isBossLevel: true,
  intro: {
    complexity: 3,
    dialogue: [
      'Cuidado — esse robô de limpeza virou selvagem!',
      'Wall-E?! Eu preferia um Roomba com melhor gosto.',
    ],
  },
  decorations: [
    { type: 'balcao',    x: 150,  y: G, blocking: true },
    { type: 'mesa',      x: 400,  y: G, blocking: true },
    { type: 'fogao',     x: 650,  y: G, blocking: true },
    { type: 'geladeira', x: 900,  y: G, blocking: true },
    { type: 'balcao',    x: 1100, y: G, blocking: true },
    { type: 'mesa',      x: 1350, y: G, blocking: true },
    { type: 'fogao',     x: 1550, y: G, blocking: true },
    { type: 'geladeira', x: 1750, y: G, blocking: true },
    { type: 'balcao',    x: 1900, y: G, blocking: true },
  ],
}

export const WORLD0_LEVELS: Record<string, LevelData> = {
  '0-1':    LEVEL_0_1,
  '0-boss': LEVEL_0_BOSS,
  '0-2':    LEVEL_0_2,
}
