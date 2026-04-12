export type EnemyType = 'gato' | 'pombo' | 'rato' | 'dono' | 'aspirador' | 'hugo' | 'hannah' | 'zelador' | 'morador'
export interface DecorationSpawn { type: string; x: number; y: number; blocking?: boolean }

export type ItemType =
  | 'bone' | 'golden_bone'
  | 'petisco' | 'pipoca' | 'pizza' | 'churrasco'
  | 'bola' | 'frisbee'
  | 'laco' | 'coleira' | 'chapeu' | 'bandana'
  | 'surprise_block'

export interface EnemySpawn { type: EnemyType; x: number; y: number }
export interface ItemSpawn  { type: ItemType;  x: number; y: number }

export type BackgroundTheme = 'rua' | 'praca' | 'mercado' | 'boss' | 'apartamento' | 'apto_boss'
  | 'exterior' | 'patio' | 'telhado'

export interface MiniBossConfig {
  /** Posição X que o jogador deve cruzar para disparar o encontro */
  triggerX: number
  /** Onde o mini-boss aparece */
  spawnX: number
  spawnY: number
  /** Limites da arena — grade esquerda e direita */
  leftBarrierX: number
  rightBarrierX: number
}

export interface LevelData {
  id: string
  name: string
  bgColor: number
  backgroundTheme: BackgroundTheme
  timeLimit: number  // segundos — 0 = sem limite (boss level)
  tiles: number[][]
  tileWidthCols: number
  spawnX: number
  spawnY: number
  exitX: number
  exitY: number
  checkpointX: number
  checkpointY: number
  checkpointSprite?: string  // default: KEYS.HYDRANT; override per-level
  enemies: EnemySpawn[]
  items: ItemSpawn[]
  goldenBones: Array<{ x: number; y: number }>
  nextLevel: string | null
  isBossLevel?: boolean
  decorations: DecorationSpawn[]
  intro?: {
    complexity: 1 | 2 | 3          // 1=fácil, 2=médio, 3=difícil
    dialogue: string[]          // 2–4 linhas, formato "Personagem: texto"
  }
  worldTransition?: string[]    // diálogo pós-boss mostrado em LevelCompleteScene
  miniBoss?: MiniBossConfig
}
