export type EnemyAnimState = 'idle' | 'walk' | 'run'

const WALK_THRESHOLD = 10   // abaixo disso → idle
const RUN_THRESHOLD  = 150  // a partir disso → run

/** Mapeia magnitude de velocidade (px/s) para estado de animação. */
export function enemyAnimState(speed: number): EnemyAnimState {
  const s = Math.abs(speed)
  if (s < WALK_THRESHOLD) return 'idle'
  if (s < RUN_THRESHOLD)  return 'walk'
  return 'run'
}
