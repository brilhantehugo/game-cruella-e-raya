export type EnemyType = 'gato' | 'pombo' | 'rato' | 'dono'

export type ItemType =
  | 'bone' | 'golden_bone'
  | 'petisco' | 'pipoca' | 'pizza' | 'churrasco'
  | 'bola' | 'frisbee'
  | 'laco' | 'coleira' | 'chapeu' | 'bandana'
  | 'surprise_block'

export interface EnemySpawn { type: EnemyType; x: number; y: number }
export interface ItemSpawn  { type: ItemType;  x: number; y: number }

export interface LevelData {
  id: string
  name: string
  bgColor: number
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
}
