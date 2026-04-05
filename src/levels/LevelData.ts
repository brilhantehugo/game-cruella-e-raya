export type EnemyType = 'gato' | 'pombo' | 'rato' | 'dono' | 'aspirador'
export interface DecorationSpawn { type: string; x: number; y: number }

export type ItemType =
  | 'bone' | 'golden_bone'
  | 'petisco' | 'pipoca' | 'pizza' | 'churrasco'
  | 'bola' | 'frisbee'
  | 'laco' | 'coleira' | 'chapeu' | 'bandana'
  | 'surprise_block'

export interface EnemySpawn { type: EnemyType; x: number; y: number }
export interface ItemSpawn  { type: ItemType;  x: number; y: number }

export type BackgroundTheme = 'rua' | 'praca' | 'mercado' | 'boss' | 'apartamento' | 'apto_boss'

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
  enemies: EnemySpawn[]
  items: ItemSpawn[]
  goldenBones: Array<{ x: number; y: number }>
  nextLevel: string | null
  isBossLevel?: boolean
  decorations: DecorationSpawn[]
}
