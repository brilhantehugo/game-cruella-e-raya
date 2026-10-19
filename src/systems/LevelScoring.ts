import { SCORING } from '../constants'
import { LevelData } from '../levels/LevelData'
import { ALL_LEVELS } from '../levels'

// Pontuação máxima possível da fase, derivada dos dados da própria fase
export function maxLevelScore(level: LevelData): number {
  const bones = level.items.filter(i => i.type === 'bone').length
  return (
    level.enemies.length * SCORING.ENEMY_KILL +
    bones * SCORING.BONE +
    level.goldenBones.length * SCORING.GOLDEN_BONE +
    (level.isBossLevel ? SCORING.BOSS_KILL : 0)
  )
}

// Ids das fases do mundo que possuem ossos dourados, na ordem de declaração
export function levelsWithGoldenBones(worldId: string): string[] {
  return Object.keys(ALL_LEVELS).filter(
    id => id.startsWith(`${worldId}-`) && ALL_LEVELS[id].goldenBones.length > 0
  )
}
