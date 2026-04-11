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
  ENEMY_INFO: 'EnemyInfoScene',
  LEVEL_INTRO: 'LevelIntroScene',
  PROFILE_SELECT: 'ProfileSelectScene',
  WORLD_MAP:      'WorldMapScene',
  // projéteis de boss
  DIRT_BALL: 'dirt_ball',
  BLADE:     'blade',
  // decorações de cenário — estacionamento
  CARRO:     'carro',
  // decorações de cenário — rua
  CASA:      'casa',
  ARVORE:    'arvore',
  LOJA:      'loja',
  POSTE:     'poste',
  LIXEIRA:   'lixeira',
  BANCO:     'banco',
  CANTEIRO:  'canteiro',
  BARRACA:   'barraca',
  SACO_LIXO: 'saco_lixo',
  // decorações de cenário — apartamento (sala)
  CADEIRA:   'cadeira',
  MESA:      'mesa',
  GRADE:     'grade',
  VASO:      'vaso',
  ESTANTE:   'estante',
  // decorações de cenário — apartamento (cozinha)
  FOGAO:     'fogao',
  GELADEIRA: 'geladeira',
  BALCAO:    'balcao',
  // inimigos world-0
  ASPIRADOR: 'aspirador',
  // NPCs world-0
  HUGO:    'hugo',
  HANNAH:  'hannah',
  ZELADOR: 'zelador',
  MORADOR: 'morador',
  // parallax de fundo
  BG_RUA_1:     'bg_rua_1',
  BG_RUA_2:     'bg_rua_2',
  BG_RUA_3:     'bg_rua_3',
  BG_PRACA_1:   'bg_praca_1',
  BG_PRACA_2:   'bg_praca_2',
  BG_PRACA_3:   'bg_praca_3',
  BG_MERCADO_1: 'bg_mercado_1',
  BG_MERCADO_2: 'bg_mercado_2',
  BG_MERCADO_3: 'bg_mercado_3',
  BG_BOSS_1:    'bg_boss_1',
  BG_BOSS_2:    'bg_boss_2',
  BG_BOSS_3:    'bg_boss_3',
  // parallax — apartamento
  BG_APTO_1:    'bg_apto_1',
  BG_APTO_2:    'bg_apto_2',
  BG_APTO_3:    'bg_apto_3',
  // parallax — boss aspirador
  BG_APTO_BOSS_1: 'bg_apto_boss_1',
  BG_APTO_BOSS_2: 'bg_apto_boss_2',
  BG_APTO_BOSS_3: 'bg_apto_boss_3',
  // parallax — exterior do prédio
  BG_EXT_1:       'bg_ext_1',
  BG_EXT_2:       'bg_ext_2',
  BG_EXT_3:       'bg_ext_3',
  // parallax — pátio interior
  BG_PATIO_1:     'bg_patio_1',
  BG_PATIO_2:     'bg_patio_2',
  BG_PATIO_3:     'bg_patio_3',
  // parallax — telhado
  BG_TELHADO_1:   'bg_telhado_1',
  BG_TELHADO_2:   'bg_telhado_2',
  BG_TELHADO_3:   'bg_telhado_3',
  // projéteis do boss Drone
  BOMB:  'bomb',
  LASER: 'laser',
  // boss Drone sprite
  DRONE: 'drone',
  ZELADOR_BOSS: 'zelador_boss',
  CHAVE:        'chave',
  // áudio BGM
  BGM_MENU:    'bgm_menu',
  BGM_WORLD1:  'bgm_world1',
  BGM_BOSS:    'bgm_boss',
  BGM_FANFARE: 'bgm_fanfare',
} as const

export const PHYSICS = {
  GRAVITY: 800,
  RAYA_SPEED: 240,
  CRUELLA_SPEED: 200,
  JUMP_VELOCITY: -450,
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

/**
 * Score máximo teórico por fase (inimigos × 50 + ossos × 10 + golden bones × 500).
 * Usado por ProfileManager.calcMedal() para determinar medalha de ouro/prata.
 */
export const MEDAL_THRESHOLDS: Record<string, number> = {
  '0-1':    2600,  // 7 inimigos×50 + 10 ossos×10 + 4 golden×500 (expandido)
  '0-2':     800,  // Corredor    — 5 inimigos×50 + 8 ossos×10 = 330; ouro ≈ 800
  '0-4':    1400,  // Est. N1     — 8 inimigos×50 + 10 ossos×10 = 500; ouro ≈ 1400
  '0-5':    1700,  // Est. N2     — 10 inimigos×50 + 11 ossos×10 = 610; ouro ≈ 1700
  '0-boss':  500,  // boss Wall-E apenas
  '1-1':    2200,  // 10 inimigos×50 + 7 ossos×10 + 3 golden×500 (densificado)
  '1-2':    1200,  // Beco Escuro — 8 inimigos×50 + 9 ossos×10 = 490; ouro ≈ 1200
  '1-3':    3000,  // 15 inimigos×50 + 9 ossos×10 + 4 golden×500 (110 cols)
  '1-4':    1500,  // Parque      — 9 inimigos×50 + 11 ossos×10 = 560; ouro ≈ 1500
  '1-boss': 1200,  // boss Seu Bigodes + minions estimados
  '2-1':    1900,  // 7 inimigos×50 + 6 ossos×10 + 3 golden×500
  '2-2':    2850,  // 11 inimigos×50 + 8 ossos×10 + 4 golden×500
  '2-3':    1400,  // Garagem     — 9 inimigos×50 + 10 ossos×10 = 550; ouro ≈ 1400
  '2-5':    1900,  // Varandas    — 12 inimigos×50 + 12 ossos×10 = 720; ouro ≈ 1900
  '2-boss':  500,  // boss Drone apenas
}
