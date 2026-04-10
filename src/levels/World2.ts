import { LevelData } from './LevelData'

const G = 416 // ground surface y

const COLS = 80
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function platformRow(x: number, len: number): number[] {
  const row = emptyRow(); for (let i = x; i < x + len; i++) row[i] = 2; return row
}

// Helpers para fases expandidas
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
const r22 = mkHelpers(100)   // LEVEL_2_2: 100 cols = 3200px
const r23 = mkHelpers(110)   // LEVEL_2_3: 110 cols = 3520px

export const LEVEL_2_1: LevelData = {
  id: '2-1', name: 'Passeio Público', bgColor: 0x1a1a3a,
  backgroundTheme: 'exterior' as const, timeLimit: 180, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    platformRow(8, 5),  emptyRow(),
    platformRow(20, 4), platformRow(35, 5), emptyRow(),
    platformRow(45, 4), platformRow(58, 5), emptyRow(),
    platformRow(68, 5), emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 300, exitX: 2496, exitY: 370,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'rato',    x: 300,  y: 390 },
    { type: 'gato',    x: 600,  y: 390 },
    { type: 'rato',    x: 800,  y: 390 },
    { type: 'zelador', x: 1100, y: 390 },
    { type: 'gato',    x: 1400, y: 390 },
    { type: 'rato',    x: 1800, y: 390 },
    { type: 'dono',    x: 2100, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 160,  y: 380 },
    { type: 'bone',           x: 400,  y: 380 },
    { type: 'petisco',        x: 550,  y: 380 },
    { type: 'bone',           x: 700,  y: 380 },
    { type: 'surprise_block', x: 900,  y: 310 },
    { type: 'bone',           x: 1200, y: 380 },
    { type: 'petisco',        x: 1600, y: 380 },
    { type: 'surprise_block', x: 1700, y: 310 },
    { type: 'pizza',          x: 1400, y: 380 },
    { type: 'laco',           x: 2100, y: 380 },
    { type: 'bone',           x: 1900, y: 380 },
  ],
  goldenBones: [
    { x: 320,  y: 96 },
    { x: 1152, y: 80 },
    { x: 1984, y: 64 },
  ],
  nextLevel: '2-2',
  intro: {
    complexity: 2,
    dialogue: [
      'O passeio está cheio de ratos à noite. Cuidado com o zelador!',
      'Que horror. Eu mereço um táxi, não isto.',
    ],
  },
  decorations: [
    { type: 'poste',   x: 200,  y: G },
    { type: 'lixeira', x: 450,  y: G },
    { type: 'arvore',  x: 700,  y: G },
    { type: 'banco',   x: 950,  y: G },
    { type: 'poste',   x: 1200, y: G },
    { type: 'lixeira', x: 1700, y: G },
    { type: 'arvore',  x: 1950, y: G },
    { type: 'grade',   x: 2200, y: G },
    { type: 'placa',   x: 1450, y: G },
    { type: 'grade',   x: 2400, y: G },
  ],
}

export const LEVEL_2_2: LevelData = {
  id: '2-2', name: 'Pátio Interior', bgColor: 0x2a1a0a,
  backgroundTheme: 'patio' as const, timeLimit: 200, tileWidthCols: 100,
  tiles: [
    r22.e(), r22.e(), r22.e(),
    r22.mp([5,4], [55,4], [82,4]), r22.e(),
    r22.p(18, 5), r22.mp([40,3], [68,3]), r22.e(),
    r22.mp([28,6], [75,5]), r22.p(50, 4), r22.e(),
    r22.mp([62,5], [85,4]), r22.e(),
    r22.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3136, exitY: 370,
  checkpointX: 1600, checkpointY: 380,
  enemies: [
    { type: 'gato',    x: 400,  y: 390 },
    { type: 'rato',    x: 650,  y: 390 },
    { type: 'gato',    x: 900,  y: 390 },
    { type: 'morador', x: 1100, y: 390 },
    { type: 'rato',    x: 1300, y: 390 },
    { type: 'zelador', x: 1600, y: 390 },
    { type: 'gato',    x: 1800, y: 390 },
    { type: 'rato',    x: 2200, y: 390 },
    { type: 'gato',    x: 2600, y: 390 },
    { type: 'morador', x: 2900, y: 390 },
    { type: 'dono',    x: 3000, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 200,  y: 380 },
    { type: 'bone',           x: 500,  y: 380 },
    { type: 'bone',           x: 1000, y: 380 },
    { type: 'bone',           x: 1500, y: 380 },
    { type: 'bone',           x: 2100, y: 380 },
    { type: 'bone',           x: 2700, y: 380 },
    { type: 'petisco',        x: 750,  y: 380 },
    { type: 'petisco',        x: 2400, y: 380 },
    { type: 'surprise_block', x: 1200, y: 310 },
    { type: 'surprise_block', x: 2600, y: 310 },
    { type: 'chapeu',         x: 1800, y: 380 },
    { type: 'frisbee',        x: 2300, y: 380 },
    { type: 'bola',           x: 3000, y: 380 },
  ],
  goldenBones: [
    { x: 288,  y: 64 },
    { x: 1344, y: 96 },
    { x: 2240, y: 64 },
    { x: 2944, y: 80 },
  ],
  nextLevel: '2-3',
  intro: {
    complexity: 2,
    dialogue: [
      'O pátio... parece que tem gatos em todo lado.',
      'Óptimo. Uma visita guiada ao inferno felino.',
    ],
  },
  decorations: [
    { type: 'carro',    x: 300,  y: G, blocking: true },
    { type: 'lixeira',  x: 550,  y: G },
    { type: 'saco_lixo',x: 650,  y: G },
    { type: 'poste',    x: 800,  y: G },
    { type: 'carro',    x: 1100, y: G, blocking: true },
    { type: 'lixeira',  x: 1450, y: G },
    { type: 'arvore',   x: 1250, y: G },
    { type: 'grade',    x: 1700, y: G },
    { type: 'carro',    x: 2000, y: G, blocking: true },
    { type: 'poste',    x: 2100, y: G },
    { type: 'lixeira',  x: 2350, y: G },
    { type: 'saco_lixo',x: 2500, y: G },
    { type: 'arvore',   x: 2650, y: G },
    { type: 'grade',    x: 2900, y: G },
  ],
}

export const LEVEL_2_3: LevelData = {
  id: '2-3', name: 'Escadas de Emergência', bgColor: 0x0a0a1a,
  backgroundTheme: 'exterior' as const, timeLimit: 200, tileWidthCols: 110,
  tiles: [
    r23.e(), r23.e(),
    r23.mp([8,5], [22,4]),
    r23.mp([35,5], [48,3]), r23.e(),
    r23.mp([58,6], [70,4]), r23.e(),
    r23.mp([78,5], [90,4], [103,4]),
    r23.mp([82,3], [95,3], [106,4]),
    r23.e(), r23.e(), r23.e(), r23.e(),
    r23.g(),
  ],
  spawnX: 64, spawnY: 300, exitX: 3456, exitY: 370,
  checkpointX: 1760, checkpointY: 380,
  enemies: [
    { type: 'rato',    x: 350,  y: 390 },
    { type: 'pombo',   x: 500,  y: 120 },
    { type: 'gato',    x: 800,  y: 390 },
    { type: 'morador', x: 1000, y: 390 },
    { type: 'pombo',   x: 1200, y: 120 },
    { type: 'rato',    x: 1400, y: 390 },
    { type: 'gato',    x: 1600, y: 390 },
    { type: 'dono',    x: 1800, y: 390 },
    { type: 'pombo',   x: 2000, y: 120 },
    { type: 'rato',    x: 2200, y: 390 },
    { type: 'gato',    x: 2400, y: 390 },
    { type: 'morador', x: 2600, y: 390 },
    { type: 'pombo',   x: 2800, y: 120 },
    { type: 'dono',    x: 3200, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 160,  y: 380 },
    { type: 'bone',           x: 450,  y: 380 },
    { type: 'petisco',        x: 650,  y: 380 },
    { type: 'bone',           x: 900,  y: 380 },
    { type: 'surprise_block', x: 1100, y: 300 },
    { type: 'bone',           x: 1350, y: 380 },
    { type: 'pizza',          x: 1600, y: 380 },
    { type: 'bone',           x: 1900, y: 380 },
    { type: 'surprise_block', x: 2000, y: 300 },
    { type: 'petisco',        x: 2150, y: 380 },
    { type: 'bone',           x: 2450, y: 380 },
    { type: 'bandana',        x: 2700, y: 380 },
    { type: 'bone',           x: 3100, y: 380 },
    { type: 'surprise_block', x: 3000, y: 300 },
    { type: 'coleira',        x: 3300, y: 380 },
  ],
  goldenBones: [
    { x: 352,  y: 64 },
    { x: 1664, y: 96 },
    { x: 2560, y: 192 },
    { x: 3200, y: 64 },
  ],
  nextLevel: '2-boss',
  intro: {
    complexity: 3,
    dialogue: [
      'As escadas de emergência — vamos subir andar a andar!',
      'Sempre soube que morreria a subir escadas. Vamos lá.',
    ],
  },
  decorations: [
    { type: 'poste',    x: 200,  y: G },
    { type: 'saco_lixo',x: 400,  y: G },
    { type: 'grade',    x: 500,  y: G },
    { type: 'arvore',   x: 750,  y: G },
    { type: 'lixeira',  x: 1000, y: G },
    { type: 'grade',    x: 1200, y: G },
    { type: 'placa',    x: 1300, y: G },
    { type: 'saco_lixo',x: 1500, y: G },
    { type: 'arvore',   x: 1800, y: G },
    { type: 'poste',    x: 2000, y: G },
    { type: 'lixeira',  x: 2200, y: G },
    { type: 'grade',    x: 2400, y: G },
    { type: 'saco_lixo',x: 2700, y: G },
    { type: 'placa',    x: 2900, y: G },
    { type: 'lixeira',  x: 3000, y: G },
    { type: 'grade',    x: 3100, y: G },
  ],
}

export const LEVEL_2_BOSS: LevelData = {
  id: '2-boss', name: 'Telhado — Drone Ataca!', bgColor: 0x050510,
  backgroundTheme: 'telhado' as const, timeLimit: 0, tileWidthCols: 60,
  tiles: (() => {
    const BC = 60
    return [
      Array(BC).fill(0), Array(BC).fill(0), Array(BC).fill(0), Array(BC).fill(0),
      [...Array(6).fill(0), ...Array(5).fill(1), ...Array(BC - 11).fill(0)],
      [...Array(BC - 11).fill(0), ...Array(5).fill(1), ...Array(6).fill(0)],
      Array(BC).fill(0), Array(BC).fill(0), Array(BC).fill(0),
      Array(BC).fill(0), Array(BC).fill(0), Array(BC).fill(0),
      Array(BC).fill(0),
      Array(BC).fill(1),
    ]
  })(),
  spawnX: 64, spawnY: 300, exitX: 1856, exitY: 370,
  checkpointX: 80, checkpointY: 300,
  enemies: [], items: [], goldenBones: [],
  nextLevel: null, isBossLevel: true,
  intro: {
    complexity: 3,
    dialogue: [
      'Um drone de vigilância — tem câmeras em todo lado!',
      'Eu comprei um drone igual a este. O meu era mais elegante.',
    ],
  },
  decorations: [
    { type: 'poste',   x: 200,  y: G },
    { type: 'poste',   x: 600,  y: G },
    { type: 'lixeira', x: 900,  y: G },
    { type: 'poste',   x: 1300, y: G },
    { type: 'lixeira', x: 1700, y: G },
  ],
}

export const WORLD2_LEVELS: Record<string, LevelData> = {
  '2-1': LEVEL_2_1, '2-2': LEVEL_2_2, '2-3': LEVEL_2_3, '2-boss': LEVEL_2_BOSS,
}
