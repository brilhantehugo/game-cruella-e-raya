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
    { type: 'hugo',   x: 400,  y: 390 },   // zelador (Hugo patrulha a entrada)
    { type: 'gato',   x: 620,  y: 390 },
    { type: 'hannah', x: 900,  y: 390 },   // porteira (Hannah de plantão)
    { type: 'rato',   x: 1100, y: 390 },
    { type: 'gato',   x: 1350, y: 390 },
    { type: 'hugo',   x: 1600, y: 390 },   // zelador (Hugo novamente, mais fundo)
    { type: 'hannah', x: 1800, y: 390 },   // Hannah próxima ao portão
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

// ── 0-boss: Cozinha — batalha contra o Aspirador ─────────────────────────────
export const LEVEL_0_BOSS: LevelData = {
  id: '0-boss', name: 'Cozinha — O Aspirador Ataca!', bgColor: 0xf0f0e8,
  backgroundTheme: 'apto_boss' as const, timeLimit: 0, tileWidthCols: 26,
  tiles: [
    Array(26).fill(0), Array(26).fill(0), Array(26).fill(0),
    // Prateleiras da cozinha para saltar
    [...Array(4).fill(0), ...Array(4).fill(2), ...Array(6).fill(0),
     ...Array(4).fill(2), ...Array(8).fill(0)],
    Array(26).fill(0), Array(26).fill(0), Array(26).fill(0),
    // Central platform (bancada da cozinha)
    [...Array(8).fill(0), ...Array(10).fill(2), ...Array(8).fill(0)],
    Array(26).fill(0), Array(26).fill(0), Array(26).fill(0),
    Array(26).fill(0), Array(26).fill(0), Array(26).fill(1),
  ],
  spawnX: 64, spawnY: 300, exitX: 768, exitY: 370,
  checkpointX: 80, checkpointY: 300,
  enemies: [], items: [], goldenBones: [],
  nextLevel: '0-2', isBossLevel: true,
  decorations: [
    { type: 'mesa',   x: 200, y: G, blocking: true },   // bancada da cozinha
    { type: 'cadeira', x: 430, y: G, blocking: true },  // cadeira da cozinha
    { type: 'balcao',  x: 680, y: G, blocking: true },  // balcão de cozinha
  ],
}

export const WORLD0_LEVELS: Record<string, LevelData> = {
  '0-1':    LEVEL_0_1,
  '0-boss': LEVEL_0_BOSS,
  '0-2':    LEVEL_0_2,
}
