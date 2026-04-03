export const GAME_WIDTH = 800
export const GAME_HEIGHT = 450
export const TILE_SIZE = 32

export const KEYS = {
  // personagens
  RAYA: 'raya',
  CRUELLA: 'cruella',
  // inimigos
  GATO: 'gato',
  POMBO: 'pombo',
  RATO: 'rato',
  DONO: 'dono',
  BIGODES: 'bigodes',
  // itens
  BONE: 'bone',
  GOLDEN_BONE: 'golden_bone',
  PETISCO: 'petisco',
  PIPOCA: 'pipoca',
  PIZZA: 'pizza',
  CHURRASCO: 'churrasco',
  BOLA: 'bola',
  FRISBEE: 'frisbee',
  // acessórios
  LACO: 'laco',
  COLEIRA: 'coleira',
  CHAPEU: 'chapeu',
  BANDANA: 'bandana',
  // tiles e ui
  TILE_GROUND: 'tile_ground',
  TILE_PLATFORM: 'tile_platform',
  HYDRANT: 'hydrant',
  EXIT_GATE: 'exit_gate',
  SURPRISE_BLOCK: 'surprise_block',
  HEART: 'heart',
  HEART_EMPTY: 'heart_empty',
  COLLAR_GOLD: 'collar_gold',
  // scenes
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  UI: 'UIScene',
  GAME_OVER: 'GameOverScene',
  LEVEL_COMPLETE: 'LevelCompleteScene',
  PAUSE: 'PauseScene',
  GALLERY: 'GalleryScene',
  HOW_TO_PLAY: 'HowToPlayScene',
  INTRO_CRAWL: 'IntroCrawlScene',
  CHARACTER_SELECT: 'CharacterSelectScene',
} as const

export const PHYSICS = {
  GRAVITY: 800,
  RAYA_SPEED: 240,
  CRUELLA_SPEED: 200,
  JUMP_VELOCITY: -520,
  DASH_VELOCITY: 600,
  DASH_DURATION: 200,
  BARK_RADIUS: 120,
  SWAP_COOLDOWN: 1500,
  SWAP_BLOCK_AFTER_HIT: 2000,
  COLLAR_GOLD_SPEED_BONUS: 60,
} as const

export const POWER_UP_DURATION = 10000

export const SCORING = {
  BONE: 10,
  ENEMY_KILL: 50,
  GOLDEN_BONE: 500,
  BOSS_KILL: 1000,
} as const
