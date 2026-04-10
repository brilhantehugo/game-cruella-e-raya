// ─── Tipos exportados ────────────────────────────────────────────────────────

export type HumanState = 'PATROL' | 'DETECT' | 'CHASE' | 'SEARCH' | 'ATTACK' | 'COOLDOWN'

export interface HumanConfig {
  detectionRange: number
  coneAngle: number
  chaseSpeed: number
  patrolSpeed: number
  attackRange: number
  cooldownDuration: number
  hearingRadius: number
  patrolRange: number
}

export interface CounterWindow {
  character: 'raya' | 'cruella'
  state: string
  windowMs: number
  type: 'bark' | 'dash' | 'jump'
}

// ─── Funções puras (testáveis sem Phaser) ────────────────────────────────────

export function computeNextHumanState(params: {
  state: HumanState
  timeInState: number
  distToPlayer: number
  playerInCone: boolean
  config: HumanConfig
  reachedLastKnown: boolean
}): HumanState | null {
  const { state, timeInState, distToPlayer, playerInCone, config, reachedLastKnown } = params

  switch (state) {
    case 'PATROL':
      if (playerInCone) return 'DETECT'
      return null

    case 'DETECT':
      if (timeInState >= 500) return 'CHASE'
      return null

    case 'CHASE':
      if (distToPlayer <= config.attackRange) return 'ATTACK'
      if (distToPlayer > config.detectionRange * 1.5) return 'SEARCH'
      return null

    case 'SEARCH':
      if (reachedLastKnown) return 'COOLDOWN'
      return null

    case 'ATTACK':
      return null

    case 'COOLDOWN':
      if (timeInState >= config.cooldownDuration) return 'PATROL'
      return null
  }
}

export function onBarkHeardNextState(
  state: HumanState,
  dist: number,
  config: HumanConfig,
): HumanState | null {
  if (state === 'COOLDOWN') return 'PATROL'
  if (dist <= config.attackRange) return 'CHASE'
  if (dist <= config.hearingRadius) return 'DETECT'
  return null
}

export function isInCone(
  ex: number, ey: number, facingRight: boolean,
  px: number, py: number,
  range: number, halfAngleDeg: number,
): boolean {
  const dist = Math.hypot(px - ex, py - ey)
  if (dist === 0 || dist > range) return false
  const halfAngleRad = halfAngleDeg * (Math.PI / 180)
  const forwardX = facingRight ? 1 : -1
  const cosAngle = (forwardX * (px - ex)) / dist
  return cosAngle >= Math.cos(halfAngleRad)
}

export function checkCounterWindow(
  window: CounterWindow | null,
  windowOpenAt: number,
  now: number,
  character: 'raya' | 'cruella',
  type: 'bark' | 'dash' | 'jump',
): boolean {
  if (!window) return false
  if (window.character !== character) return false
  if (window.type !== type) return false
  return (now - windowOpenAt) <= window.windowMs
}

// ─── Classe EnemyStateMachine ─────────────────────────────────────────────────

export class EnemyStateMachine {
  private _state: HumanState = 'PATROL'
  private _stateEnteredAt: number = 0
  private _lastKnownX: number = 0
  private _lastKnownY: number = 0
  private readonly _getNow: () => number

  constructor(getNow: () => number) {
    this._getNow = getNow
    this._stateEnteredAt = this._getNow()
  }

  get state(): HumanState { return this._state }
  get lastKnownX(): number { return this._lastKnownX }
  get lastKnownY(): number { return this._lastKnownY }

  timeInState(): number {
    return this._getNow() - this._stateEnteredAt
  }

  transition(newState: HumanState): void {
    this._state = newState
    this._stateEnteredAt = this._getNow()
  }

  setLastKnown(x: number, y: number): void {
    this._lastKnownX = x
    this._lastKnownY = y
  }
}
