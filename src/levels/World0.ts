import { LevelData } from './LevelData'

const G = 416 // ground surface y

const COLS = 64
function emptyRow(): number[] { return Array(COLS).fill(0) }
function groundRow(): number[] { return Array(COLS).fill(1) }
function platformRow(x: number, len: number): number[] {
  const row = emptyRow(); for (let i = x; i < x + len; i++) row[i] = 2; return row
}

// ── 0-1: Sala de Estar — fugir da sala ───────────────────────────────────────
export const LEVEL_0_1: LevelData = {
  id: '0-1', name: 'Sala de Estar', bgColor: 0xf5e6c8,
  backgroundTheme: 'apartamento' as const, timeLimit: 180, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    platformRow(6, 5),  emptyRow(),  platformRow(16, 4), emptyRow(),
    platformRow(28, 5), emptyRow(),  platformRow(40, 4), emptyRow(),
    platformRow(50, 5), emptyRow(),  groundRow(),
  ],
  spawnX: 64, spawnY: 300, exitX: 1984, exitY: 370,
  checkpointX: 992, checkpointY: 380,
  checkpointSprite: 'vaso',   // planta de sala — faz sentido num apto
  enemies: [
    { type: 'hugo',   x: 500,  y: 390 },
    { type: 'hannah', x: 1200, y: 390 },
    { type: 'hugo',   x: 1650, y: 390 },
  ],
  items: [
    { type: 'bone',          x: 160,  y: 380 },
    { type: 'bone',          x: 400,  y: 380 },
    { type: 'petisco',       x: 650,  y: 380 },
    { type: 'bone',          x: 850,  y: 380 },
    { type: 'surprise_block', x: 1000, y: 310 },
    { type: 'laco',          x: 1200, y: 380 },
    { type: 'bone',          x: 1400, y: 380 },
    { type: 'pizza',         x: 1700, y: 380 },
    { type: 'bone',          x: 1900, y: 380 },
  ],
  goldenBones: [
    { x: 220,  y: 80 },
    { x: 1100, y: 96 },
    { x: 1760, y: 80 },
  ],
  nextLevel: '0-boss',
  intro: {
    complexity: 1,
    dialogue: [
      'Precisamos passar pela sala sem que Hugo e Hannah nos vejam!',
      'Deixa comigo, eu sei latir bem alto para distraí-los!',
    ],
  },
  // ── Mobília: sala (x 0–950) → corredor → cozinha (x 1050–1950) → saída
  decorations: [
    // Sala de estar
    { type: 'cadeira', x: 180,  y: G, blocking: true },
    { type: 'mesa',    x: 380,  y: G, blocking: true },
    { type: 'vaso',    x: 580,  y: G, blocking: true },
    { type: 'balcao',  x: 800,  y: G, blocking: true },
    // Cozinha — balcão, fogão, geladeira
    { type: 'balcao',    x: 1080, y: G, blocking: true },
    { type: 'fogao',     x: 1280, y: G, blocking: true },
    { type: 'geladeira', x: 1480, y: G, blocking: true },
    { type: 'balcao',    x: 1680, y: G, blocking: true },
    // Grade de segurança perto da porta de saída
    { type: 'grade',   x: 1900, y: G, blocking: true },
  ],
}

// ── 0-2: Estacionamento do Prédio ────────────────────────────────────────────
// Carros como obstáculos; zelador e porteiro patrulham; grade no final para pular
export const LEVEL_0_2: LevelData = {
  id: '0-2', name: 'Estacionamento do Prédio', bgColor: 0x2e2e40,
  backgroundTheme: 'apto_boss' as const, timeLimit: 200, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    emptyRow(), emptyRow(), emptyRow(),
    emptyRow(), emptyRow(), emptyRow(),
    emptyRow(), platformRow(55, 6),
    emptyRow(), emptyRow(), groundRow(),
  ],
  spawnX: 64, spawnY: 350, exitX: 1984, exitY: 370,
  checkpointX: 1024, checkpointY: 380,
  enemies: [
    { type: 'gato',    x: 400,  y: 390 },  // gato sozinho — zona de ensino do pounce
    { type: 'zelador', x: 700,  y: 390 },  // zelador — patrulha central
    { type: 'gato',    x: 1000, y: 390 },  // segundo gato após aprender
    { type: 'morador', x: 1200, y: 390 },  // morador tranquilo
    { type: 'zelador', x: 1500, y: 390 },  // zelador mais fundo
    { type: 'gato',    x: 1750, y: 390 },  // gato próximo do portão
  ],
  items: [
    { type: 'bone',    x: 160,  y: 380 },
    { type: 'bone',    x: 360,  y: 380 },
    { type: 'petisco', x: 700,  y: 380 },
    { type: 'bone',    x: 960,  y: 380 },
    { type: 'bone',    x: 1150, y: 380 },
    { type: 'pizza',   x: 1400, y: 380 },
    { type: 'bone',    x: 1640, y: 380 },
    { type: 'bone',    x: 1820, y: 380 },
  ],
  goldenBones: [
    { x: 272,  y: 64 },
    { x: 1024, y: 64 },
    { x: 1760, y: 64 },
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
    // Carros estacionados — salta por cima ou usa como plataforma
    { type: 'carro',   x: 224,  y: G, blocking: true },
    { type: 'carro',   x: 544,  y: G, blocking: true },
    { type: 'poste',   x: 720,  y: G },
    { type: 'carro',   x: 864,  y: G, blocking: true },
    { type: 'carro',   x: 1120, y: G, blocking: true },
    { type: 'poste',   x: 1280, y: G },
    { type: 'carro',   x: 1440, y: G, blocking: true },
    { type: 'carro',   x: 1664, y: G, blocking: true },
    // Portão de saída — 3 grades lado a lado para pular
    // Rampa (plataforma row 10, col 55–60 = x 1760–1952) serve de base para o salto
    { type: 'grade',   x: 1860, y: G, blocking: true },
    { type: 'grade',   x: 1900, y: G, blocking: true },
    { type: 'grade',   x: 1940, y: G, blocking: true },
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
