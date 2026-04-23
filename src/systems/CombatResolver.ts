export type BarkResult =
  | { action: 'counter' }
  | { action: 'ko' }
  | { action: 'stun'; duration: number }
  | { action: 'nothing' }

export type DashResult =
  | { action: 'counter' }
  | { action: 'ko' }
  | { action: 'damage' }

export type StompResult =
  | { action: 'stomp' }
  | { action: 'npc_push' }
  | { action: 'nothing' }

export function resolveBarkHit(p: {
  hp: number
  dist: number
  barkRadius: number
  countered: boolean
  isNPC: boolean
}): BarkResult {
  if (p.countered) return { action: 'counter' }
  if (p.isNPC || p.dist > p.barkRadius) return { action: 'nothing' }
  if (p.hp <= 1) return { action: 'ko' }
  return { action: 'stun', duration: 2000 }
}

export function resolveDashHit(p: {
  hpAfterDamage: number
  countered: boolean
}): DashResult {
  if (p.countered) return { action: 'counter' }
  if (p.hpAfterDamage <= 0) return { action: 'ko' }
  return { action: 'damage' }
}

export function resolveStompHit(p: {
  velocityY: number
  pBottom: number
  eTop: number
  isNPC: boolean
}): StompResult {
  if (p.velocityY <= 50 || p.pBottom > p.eTop + 12) return { action: 'nothing' }
  if (p.isNPC) return { action: 'npc_push' }
  return { action: 'stomp' }
}
