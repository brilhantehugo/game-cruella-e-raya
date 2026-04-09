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
    { type: 'rato',    x: 320,  y: 390 },  // rato sozinho — zona de ensino do dash
    { type: 'morador', x: 600,  y: 390 },  // morador tranquilo
    { type: 'rato',    x: 900,  y: 390 },  // segundo rato
    { type: 'morador', x: 1200, y: 390 },  // morador
    { type: 'rato',    x: 1500, y: 390 },  // rato + morador combinados
    { type: 'dono',    x: 1900, y: 390 },  // dono nervoso no final
    { type: 'rato',    x: 2200, y: 390 },
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
  intro: {
    complexity: 2,
    dialogue: [
      'A rua está cheia de gatos e pombos hoje. Cuidado!',
      'Hm, que odor terrível... Vamos logo antes que eu desmaiee!',
    ],
  },
  decorations: [
    { type: 'loja',    x: 180,  y: G },
    { type: 'poste',   x: 420,  y: G },
    { type: 'banco',   x: 620,  y: G },
    { type: 'arvore',  x: 850,  y: G },
    { type: 'casa',    x: 1100, y: G },
    { type: 'lixeira', x: 1300, y: G },
    { type: 'placa',   x: 1500, y: G },
    { type: 'loja',    x: 1720, y: G },
    { type: 'arvore',  x: 1950, y: G },
    { type: 'poste',   x: 2150, y: G },
    { type: 'lixeira', x: 2350, y: G },
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
    { type: 'pombo',   x: 400,  y: 160 },  // pombo sozinho — zona de ensino do swoop
    { type: 'morador', x: 700,  y: 390 },
    { type: 'pombo',   x: 1000, y: 140 },  // segundo pombo
    { type: 'rato',    x: 1300, y: 390 },  // rato + pombo simultaneamente
    { type: 'pombo',   x: 1600, y: 150 },
    { type: 'dono',    x: 1900, y: 390 },
    { type: 'gato',    x: 2200, y: 390 },
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
  intro: {
    complexity: 2,
    dialogue: [
      'Uma praça cheia de ratos! Vamos usar o jardim como cobertura.',
      'Jardim? Eu preferia um spa, mas... vamos nessa, querida!',
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
    { type: 'rato',    x: 300,  y: 390 }, { type: 'gato',    x: 600,  y: 390 },
    { type: 'morador', x: 800,  y: 390 }, { type: 'pombo',   x: 1000, y: 120 },
    { type: 'dono',    x: 1200, y: 390 }, { type: 'rato',    x: 1500, y: 390 },
    { type: 'gato',    x: 1700, y: 390 }, { type: 'pombo',   x: 1900, y: 150 },
    { type: 'morador', x: 2100, y: 390 },
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
  intro: {
    complexity: 2,
    dialogue: [
      'O mercadinho está infestado! Donos nervosos por todo lado.',
      'Aquele cheiro de churrasco é perturbador... e delicioso.',
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
  nextLevel: null, isBossLevel: true,
  decorations: [
    { type: 'saco_lixo', x: 120, y: G },
    { type: 'lixeira',   x: 280, y: G },
    { type: 'saco_lixo', x: 450, y: G },
    { type: 'lixeira',   x: 640, y: G },
    { type: 'saco_lixo', x: 800, y: G },
  ],
}

export const WORLD1_LEVELS: Record<string, LevelData> = {
  '1-1': LEVEL_1_1, '1-2': LEVEL_1_2, '1-3': LEVEL_1_3, '1-boss': LEVEL_1_BOSS,
}
