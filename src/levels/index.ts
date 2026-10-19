import { WORLD0_LEVELS } from './World0'
import { WORLD1_LEVELS } from './World1'
import { WORLD2_LEVELS } from './World2'
import { WORLD3_LEVELS } from './World3'
import { LevelData } from './LevelData'

// Fonte única de todas as fases do jogo
export const ALL_LEVELS: Record<string, LevelData> = {
  ...WORLD0_LEVELS,
  ...WORLD1_LEVELS,
  ...WORLD2_LEVELS,
  ...WORLD3_LEVELS,
}
