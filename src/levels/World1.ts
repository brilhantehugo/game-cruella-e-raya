import { LevelData, DecorationSpawn } from './LevelData'

const G = 416 // ground surface y (origin bottom = setOrigin(0.5,1) → y=416)

const COLS = 80
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function platformRow(x: number, len: number): number[] {
  const row = emptyRow(); for (let i = x; i < x + len; i++) row[i] = 2; return row
}

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
    { type: 'gato',  x: 320,  y: 390 }, { type: 'pombo', x: 640,  y: 200 },
    { type: 'gato',  x: 960,  y: 390 }, { type: 'rato',  x: 1280, y: 390 },
    { type: 'pombo', x: 1600, y: 180 }, { type: 'dono',  x: 1920, y: 390 },
    { type: 'gato',  x: 2200, y: 390 },
  ],
  items: [
    { type: 'bone', x: 160, y: 380 }, { type: 'bone', x: 352, y: 380 },
    { type: 'bone', x: 480, y: 180 }, { type: 'petisco', x: 700, y: 380 },
    { type: 'bone', x: 900, y: 380 }, { type: 'surprise_block', x: 1100, y: 320 },
    { type: 'bone', x: 1400, y: 380 }, { type: 'laco', x: 1600, y: 380 },
    { type: 'bone', x: 1800, y: 380 }, { type: 'bone', x: 2100, y: 380 },
    { type: 'pizza', x: 2300, y: 380 },
  ],
  goldenBones: [{ x: 352, y: 96 }, { x: 1536, y: 96 }, { x: 1952, y: 224 }],
  nextLevel: '1-2',
  decorations: [
    { type: 'casa',   x: 300,  y: G },
    { type: 'poste',  x: 750,  y: G },
    { type: 'arvore', x: 1200, y: G },
    { type: 'loja',   x: 1750, y: G },
    { type: 'poste',  x: 2300, y: G },
  ],
}

export const LEVEL_1_2: LevelData = {
  id: '1-2', name: 'Praça com Jardim', bgColor: 0x90EE90, backgroundTheme: 'praca' as const, timeLimit: 200, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), platformRow(5, 4), emptyRow(),
    platformRow(15, 5), platformRow(28, 3), emptyRow(),
    platformRow(38, 6), platformRow(52, 4), emptyRow(),
    platformRow(65, 5), emptyRow(), emptyRow(), groundRow(),
  ],
  spawnX: 64, spawnY: 300, exitX: 2496, exitY: 370,
  checkpointX: 1200, checkpointY: 380,
  enemies: [
    { type: 'gato',  x: 400,  y: 390 }, { type: 'rato',  x: 700,  y: 390 },
    { type: 'pombo', x: 900,  y: 150 }, { type: 'gato',  x: 1100, y: 390 },
    { type: 'dono',  x: 1400, y: 390 }, { type: 'pombo', x: 1700, y: 180 },
    { type: 'rato',  x: 2000, y: 390 }, { type: 'gato',  x: 2300, y: 390 },
  ],
  items: [
    { type: 'bone', x: 200, y: 380 }, { type: 'bone', x: 500, y: 380 },
    { type: 'pipoca', x: 750, y: 380 }, { type: 'surprise_block', x: 1000, y: 310 },
    { type: 'coleira', x: 1300, y: 380 }, { type: 'bone', x: 1500, y: 380 },
    { type: 'bone', x: 1800, y: 380 }, { type: 'chapeu', x: 2100, y: 380 },
    { type: 'bone', x: 2300, y: 380 },
  ],
  goldenBones: [{ x: 192, y: 64 }, { x: 1248, y: 96 }, { x: 2112, y: 160 }],
  nextLevel: '1-3',
  decorations: [
    { type: 'arvore', x: 250,  y: G },
    { type: 'casa',   x: 800,  y: G },
    { type: 'poste',  x: 1300, y: G },
    { type: 'arvore', x: 1800, y: G },
    { type: 'arvore', x: 2350, y: G },
  ],
}

export const LEVEL_1_3: LevelData = {
  id: '1-3', name: 'Mercadinho / Feirinha', bgColor: 0xFFD700, backgroundTheme: 'mercado' as const, timeLimit: 200, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), platformRow(8, 5), platformRow(20, 4),
    platformRow(32, 5), platformRow(45, 3), emptyRow(),
    platformRow(55, 6), platformRow(65, 4), emptyRow(),
    emptyRow(), emptyRow(), emptyRow(), groundRow(),
  ],
  spawnX: 64, spawnY: 300, exitX: 2496, exitY: 370,
  checkpointX: 1150, checkpointY: 380,
  enemies: [
    { type: 'rato',  x: 300,  y: 390 }, { type: 'gato',  x: 600,  y: 390 },
    { type: 'rato',  x: 800,  y: 390 }, { type: 'pombo', x: 1000, y: 120 },
    { type: 'dono',  x: 1200, y: 390 }, { type: 'rato',  x: 1500, y: 390 },
    { type: 'gato',  x: 1700, y: 390 }, { type: 'pombo', x: 1900, y: 150 },
    { type: 'dono',  x: 2200, y: 390 },
  ],
  items: [
    { type: 'bone', x: 160, y: 380 }, { type: 'petisco', x: 400, y: 380 },
    { type: 'surprise_block', x: 700, y: 310 }, { type: 'bola', x: 950, y: 380 },
    { type: 'bone', x: 1100, y: 380 }, { type: 'frisbee', x: 1350, y: 380 },
    { type: 'bandana', x: 1600, y: 380 }, { type: 'bone', x: 1850, y: 380 },
    { type: 'surprise_block', x: 2100, y: 300 }, { type: 'bone', x: 2300, y: 380 },
  ],
  goldenBones: [{ x: 288, y: 64 }, { x: 1472, y: 96 }, { x: 2048, y: 192 }],
  nextLevel: '1-boss',
  decorations: [
    { type: 'loja',   x: 250,  y: G },
    { type: 'arvore', x: 800,  y: G },
    { type: 'loja',   x: 1300, y: G },
    { type: 'poste',  x: 1850, y: G },
    { type: 'loja',   x: 2300, y: G },
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
  checkpointX: 480, checkpointY: 380,
  enemies: [], items: [], goldenBones: [],
  nextLevel: null, isBossLevel: true,
  decorations: [],
}

export const WORLD1_LEVELS: Record<string, LevelData> = {
  '1-1': LEVEL_1_1, '1-2': LEVEL_1_2, '1-3': LEVEL_1_3, '1-boss': LEVEL_1_BOSS,
}
