import { LevelData, HUMAN_SPAWN_Y } from './LevelData'

const COLS = 80
const BOSS_COLS = 60

function emptyRow(cols = COLS): number[] { return Array(cols).fill(0) }
function groundRow(cols = COLS): number[] { return Array(cols).fill(1) }
function platformRow(x: number, len: number, cols = COLS): number[] {
  const row = emptyRow(cols); for (let i = x; i < x + len; i++) row[i] = 2; return row
}

// ── 3-1: Passeio Nocturno ─────────────────────────────────────────────────────

export const LEVEL_3_1: LevelData = {
  id: '3-1', name: 'Passeio Nocturno', bgColor: 0x050510,
  backgroundTheme: 'exterior', timeLimit: 180, tileWidthCols: COLS,
  hasSpotlight: true, playerAuraRadius: 130,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(), emptyRow(),
    platformRow(8, 5),   emptyRow(),
    platformRow(22, 4),  emptyRow(),
    platformRow(42, 5),  platformRow(58, 4), emptyRow(),
    platformRow(68, 5),  emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 360, exitX: 2464, exitY: 380,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'rato',      x: 320,  y: 390 },
    { type: 'gato',      x: 660,  y: 390 },
    { type: 'seguranca', x: 960,  y: 390 },
    { type: 'rato',      x: 1340, y: 390 },
    { type: 'gato',      x: 1720, y: 390 },
    { type: 'seguranca', x: 2100, y: 390 },
  ],
  items: [
    { type: 'bone',           x: 200,  y: 380 },
    { type: 'bone',           x: 500,  y: 380 },
    { type: 'petisco',        x: 780,  y: 380 },
    { type: 'bone',           x: 1100, y: 380 },
    { type: 'bone',           x: 1500, y: 380 },
    { type: 'surprise_block', x: 1900, y: 310 },
  ],
  goldenBones: [
    { x: 370,  y: 190 },
    { x: 1220, y: 190 },
    { x: 2040, y: 190 },
  ],
  decorations: [
    { type: 'poste',   x: 160,  y: 388 },
    { type: 'arvore',  x: 340,  y: 388 },
    { type: 'lixeira', x: 520,  y: 388 },
    { type: 'banco',   x: 720,  y: 388 },
    { type: 'poste',   x: 900,  y: 388 },
    { type: 'arvore',  x: 1100, y: 388 },
    { type: 'lixeira', x: 1300, y: 388 },
    { type: 'poste',   x: 1500, y: 388 },
    { type: 'banco',   x: 1700, y: 388 },
    { type: 'arvore',  x: 1880, y: 388 },
    { type: 'lixeira', x: 2060, y: 388 },
    { type: 'poste',   x: 2260, y: 388 },
  ],
  nextLevel: '3-2',
  intro: {
    complexity: 1,
    dialogue: [
      'Raya: "Finalmente ar fresco! E... escuridão total."',
      'Cruella: "Tem alguém com uma lanterna lá no fundo."',
      'Raya: "Amigo ou inimigo?"',
      'Cruella: "Neste bairro? Inimigo."',
    ],
  },
}

// ── 3-2: Parque de Noite ──────────────────────────────────────────────────────

export const LEVEL_3_2: LevelData = {
  id: '3-2', name: 'Parque de Noite', bgColor: 0x040812,
  backgroundTheme: 'exterior', timeLimit: 180, tileWidthCols: COLS,
  hasSpotlight: true, playerAuraRadius: 110,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    platformRow(5, 6),   emptyRow(),
    platformRow(18, 5),  platformRow(30, 4), emptyRow(),
    platformRow(48, 5),  emptyRow(),
    platformRow(60, 6),  platformRow(72, 5), emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 360, exitX: 2464, exitY: 380,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'gato_selvagem', x: 350,  y: 390 },
    { type: 'seguranca',     x: 700,  y: 390 },
    { type: 'gato_selvagem', x: 1050, y: 390 },
    { type: 'gato_selvagem', x: 1450, y: 390 },
    { type: 'seguranca',     x: 1800, y: 390 },
    { type: 'gato',          x: 2150, y: 390 },
  ],
  items: [
    { type: 'bone',    x: 180,  y: 380 },
    { type: 'petisco', x: 520,  y: 380 },
    { type: 'bone',    x: 900,  y: 380 },
    { type: 'bone',    x: 1280, y: 380 },
    { type: 'pizza',   x: 1620, y: 380 },
    { type: 'bone',    x: 2000, y: 380 },
  ],
  goldenBones: [
    { x: 400,  y: 185 },
    { x: 1150, y: 185 },
    { x: 2050, y: 185 },
  ],
  decorations: [
    { type: 'poste',   x: 180,  y: 388 },
    { type: 'arvore',  x: 360,  y: 388 },
    { type: 'banco',   x: 580,  y: 388 },
    { type: 'lixeira', x: 760,  y: 388 },
    { type: 'poste',   x: 960,  y: 388 },
    { type: 'arvore',  x: 1140, y: 388 },
    { type: 'grade',   x: 1340, y: 388 },
    { type: 'poste',   x: 1540, y: 388 },
    { type: 'lixeira', x: 1720, y: 388 },
    { type: 'arvore',  x: 1920, y: 388 },
    { type: 'banco',   x: 2100, y: 388 },
    { type: 'poste',   x: 2300, y: 388 },
  ],
  nextLevel: '3-3',
  intro: {
    complexity: 2,
    dialogue: [
      'Raya: "Um parque! De noite! Completamente assustador!"',
      'Cruella: "Tem gatos correndo em direção à nossa luz."',
      'Raya: "...Os gatos correm em direção à luz agora?"',
      'Cruella: "Aparentemente só os desta rua."',
    ],
  },
}

// ── 3-3: Travessa Escura ──────────────────────────────────────────────────────

export const LEVEL_3_3: LevelData = {
  id: '3-3', name: 'Travessa Escura', bgColor: 0x020408,
  backgroundTheme: 'exterior', timeLimit: 210, tileWidthCols: COLS,
  hasSpotlight: true, playerAuraRadius: 90,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(), emptyRow(),
    platformRow(10, 4), emptyRow(),
    platformRow(24, 4), platformRow(38, 4), emptyRow(),
    platformRow(52, 4), platformRow(66, 4), emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 360, exitX: 2464, exitY: 380,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'porteiro',  x: 500,  y: HUMAN_SPAWN_Y },
    { type: 'rato',      x: 780,  y: 388 },
    { type: 'porteiro',  x: 1100, y: HUMAN_SPAWN_Y },
    { type: 'rato',      x: 1400, y: 388 },
    { type: 'porteiro',  x: 1750, y: HUMAN_SPAWN_Y },
    { type: 'gato',      x: 2100, y: 388 },
  ],
  items: [
    { type: 'bone',    x: 200,  y: 380 },
    { type: 'bone',    x: 660,  y: 380 },
    { type: 'petisco', x: 950,  y: 380 },
    { type: 'bone',    x: 1250, y: 380 },
    { type: 'bone',    x: 1600, y: 380 },
    { type: 'pizza',   x: 1950, y: 380 },
  ],
  goldenBones: [
    { x: 440,  y: 185 },
    { x: 1200, y: 185 },
    { x: 2060, y: 185 },
  ],
  decorations: [
    { type: 'poste',   x: 200,  y: 388 },
    { type: 'lixeira', x: 400,  y: 388 },
    { type: 'grade',   x: 600,  y: 388 },
    { type: 'arvore',  x: 800,  y: 388 },
    { type: 'poste',   x: 1000, y: 388 },
    { type: 'lixeira', x: 1200, y: 388 },
    { type: 'arvore',  x: 1400, y: 388 },
    { type: 'grade',   x: 1600, y: 388 },
    { type: 'poste',   x: 1800, y: 388 },
    { type: 'lixeira', x: 2000, y: 388 },
    { type: 'grade',   x: 2200, y: 388 },
  ],
  nextLevel: '3-4',
  intro: {
    complexity: 2,
    dialogue: [
      'Cruella: "Travessa. Porteiros em cada entrada. Sem alternativa."',
      'Raya: "Podemos ir devagar e não fazer barulho."',
      'Cruella: "Você. Devagar. Sem barulho."',
      'Raya: "Estou a tentar."',
    ],
  },
}

// ── 3-4: Supermercado 24h (SEM OVERLAY) ──────────────────────────────────────

export const LEVEL_3_4: LevelData = {
  id: '3-4', name: 'Supermercado 24h', bgColor: 0x2a2a3a,
  backgroundTheme: 'mercado', timeLimit: 180, tileWidthCols: COLS,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    platformRow(5, 5),   emptyRow(),
    platformRow(20, 4),  platformRow(35, 5), emptyRow(),
    platformRow(50, 4),  platformRow(65, 5), emptyRow(),
    emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 360, exitX: 2464, exitY: 380,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'dono',    x: 320,  y: HUMAN_SPAWN_Y },
    { type: 'morador', x: 650,  y: HUMAN_SPAWN_Y },
    { type: 'dono',    x: 980,  y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 1280, y: 388 },
    { type: 'morador', x: 1600, y: HUMAN_SPAWN_Y },
    { type: 'dono',    x: 1940, y: HUMAN_SPAWN_Y },
  ],
  items: [
    { type: 'bone',    x: 200,  y: 380 },
    { type: 'petisco', x: 480,  y: 380 },
    { type: 'bone',    x: 820,  y: 380 },
    { type: 'bone',    x: 1150, y: 380 },
    { type: 'pizza',   x: 1450, y: 380 },
    { type: 'bone',    x: 1780, y: 380 },
  ],
  goldenBones: [
    { x: 390,  y: 185 },
    { x: 1080, y: 185 },
    { x: 2000, y: 185 },
  ],
  decorations: [
    { type: 'poste',   x: 180,  y: 388 },
    { type: 'lixeira', x: 380,  y: 388 },
    { type: 'arvore',  x: 580,  y: 388 },
    { type: 'grade',   x: 780,  y: 388 },
    { type: 'poste',   x: 980,  y: 388 },
    { type: 'lixeira', x: 1180, y: 388 },
    { type: 'arvore',  x: 1380, y: 388 },
    { type: 'grade',   x: 1580, y: 388 },
    { type: 'poste',   x: 1780, y: 388 },
    { type: 'lixeira', x: 1980, y: 388 },
    { type: 'banco',   x: 2200, y: 388 },
  ],
  nextLevel: '3-5',
  intro: {
    complexity: 1,
    dialogue: [
      'Raya: "LUZ! Luz de verdade! Estou vendo tudo!"',
      'Cruella: "Também significa que todo mundo nos vê."',
      'Raya: "...Devia ter pensado nisso."',
      'Cruella: "Sim."',
    ],
  },
}

// ── 3-5: Regresso ao Prédio ───────────────────────────────────────────────────

export const LEVEL_3_5: LevelData = {
  id: '3-5', name: 'Regresso ao Prédio', bgColor: 0x050510,
  backgroundTheme: 'exterior', timeLimit: 210, tileWidthCols: COLS,
  hasSpotlight: true, playerAuraRadius: 100,
  tiles: [
    emptyRow(), emptyRow(), emptyRow(),
    platformRow(8, 5),   emptyRow(),
    platformRow(22, 4),  platformRow(38, 4), emptyRow(),
    platformRow(52, 5),  emptyRow(),
    platformRow(64, 4),  platformRow(74, 5), emptyRow(),
    groundRow(),
  ],
  spawnX: 64, spawnY: 360, exitX: 2464, exitY: 380,
  checkpointX: 1280, checkpointY: 380,
  enemies: [
    { type: 'gato_selvagem', x: 300,  y: 388 },
    { type: 'seguranca',     x: 600,  y: 388 },
    { type: 'porteiro',      x: 920,  y: HUMAN_SPAWN_Y },
    { type: 'gato_selvagem', x: 1250, y: 388 },
    { type: 'seguranca',     x: 1600, y: 388 },
    { type: 'porteiro',      x: 1950, y: HUMAN_SPAWN_Y },
    { type: 'gato_selvagem', x: 2200, y: 388 },
  ],
  items: [
    { type: 'bone',    x: 180,  y: 380 },
    { type: 'petisco', x: 460,  y: 380 },
    { type: 'bone',    x: 760,  y: 380 },
    { type: 'bone',    x: 1100, y: 380 },
    { type: 'pizza',   x: 1420, y: 380 },
    { type: 'bone',    x: 1780, y: 380 },
    { type: 'bone',    x: 2060, y: 380 },
  ],
  goldenBones: [
    { x: 420,  y: 185 },
    { x: 1200, y: 185 },
    { x: 2100, y: 185 },
  ],
  decorations: [
    { type: 'poste',   x: 160,  y: 388 },
    { type: 'arvore',  x: 340,  y: 388 },
    { type: 'lixeira', x: 540,  y: 388 },
    { type: 'grade',   x: 740,  y: 388 },
    { type: 'poste',   x: 940,  y: 388 },
    { type: 'arvore',  x: 1120, y: 388 },
    { type: 'banco',   x: 1320, y: 388 },
    { type: 'poste',   x: 1520, y: 388 },
    { type: 'lixeira', x: 1700, y: 388 },
    { type: 'arvore',  x: 1900, y: 388 },
    { type: 'grade',   x: 2080, y: 388 },
    { type: 'poste',   x: 2280, y: 388 },
  ],
  nextLevel: '3-boss',
  intro: {
    complexity: 3,
    dialogue: [
      'Raya: "Nosso prédio! Estamos quase!"',
      'Cruella: "Tem um segurança de moto lá no fundo."',
      'Raya: "Vamos nessa."',
      'Cruella: "Pela última vez, espero."',
    ],
  },
}

// ── 3-boss: Perseguição da Viatura ────────────────────────────────────────────

export const LEVEL_3_BOSS: LevelData = {
  id: '3-boss', name: 'Perseguição da Viatura', bgColor: 0x020408,
  backgroundTheme: 'boss', timeLimit: 0, tileWidthCols: BOSS_COLS,
  hasSpotlight: true, playerAuraRadius: 80,
  tiles: [
    emptyRow(BOSS_COLS), emptyRow(BOSS_COLS), emptyRow(BOSS_COLS),
    platformRow(2, 6, BOSS_COLS), emptyRow(BOSS_COLS),
    platformRow(20, 6, BOSS_COLS), emptyRow(BOSS_COLS),
    platformRow(38, 6, BOSS_COLS), emptyRow(BOSS_COLS),
    platformRow(52, 6, BOSS_COLS), emptyRow(BOSS_COLS),
    groundRow(BOSS_COLS),
  ],
  spawnX: 64, spawnY: 360, exitX: 1824, exitY: 380,
  checkpointX: 0, checkpointY: 0,
  enemies: [],
  items:   [],
  goldenBones: [],
  decorations: [],
  nextLevel: null,
  isBossLevel: true,
  worldTransition: [
    'Raya: "Conseguimos. Estamos em casa."',
    'Cruella: "Nunca mais saio de casa sem lápis de olhos e plano de fuga."',
    'Raya: "...Obrigada, Cruella."',
    'Cruella: "Não digas isso em voz alta."',
  ],
  intro: {
    complexity: 3,
    dialogue: [
      'Raya: "Uma moto. Com farol. Vindo em nossa direção."',
      'Cruella: "Dito de outra forma: uma morte bem iluminada."',
      'Raya: "Vou pular. É meu plano."',
      'Cruella: "Claro que é."',
    ],
  },
}

// ── Export ────────────────────────────────────────────────────────────────────

export const WORLD3_LEVELS: Record<string, LevelData> = {
  '3-1': LEVEL_3_1, '3-2': LEVEL_3_2, '3-3': LEVEL_3_3,
  '3-4': LEVEL_3_4, '3-5': LEVEL_3_5, '3-boss': LEVEL_3_BOSS,
}
