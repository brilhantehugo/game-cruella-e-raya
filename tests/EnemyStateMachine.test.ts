import { describe, it, expect } from 'vitest'
import {
  computeNextHumanState,
  onBarkHeardNextState,
  isInCone,
  EnemyStateMachine,
  type HumanState,
  type HumanConfig,
} from '../src/entities/enemies/EnemyStateMachine'

const BASE_CONFIG: HumanConfig = {
  detectionRange: 180,
  coneAngle: 60,
  chaseSpeed: 90,
  patrolSpeed: 55,
  attackRange: 40,
  cooldownDuration: 1200,
  hearingRadius: 120,
  patrolRange: 180,
}

describe('computeNextHumanState', () => {
  it('PATROL → DETECT quando player entra no cone', () => {
    const next = computeNextHumanState({
      state: 'PATROL', timeInState: 999, distToPlayer: 100,
      playerInCone: true, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('DETECT')
  })

  it('PATROL permanece quando player fora do cone', () => {
    const next = computeNextHumanState({
      state: 'PATROL', timeInState: 999, distToPlayer: 100,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBeNull()
  })

  it('DETECT → CHASE após 500ms', () => {
    const next = computeNextHumanState({
      state: 'DETECT', timeInState: 501, distToPlayer: 100,
      playerInCone: true, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('CHASE')
  })

  it('DETECT permanece antes de 500ms', () => {
    const next = computeNextHumanState({
      state: 'DETECT', timeInState: 400, distToPlayer: 100,
      playerInCone: true, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBeNull()
  })

  it('CHASE → SEARCH quando player sai do range (> detectionRange * 1.5)', () => {
    const next = computeNextHumanState({
      state: 'CHASE', timeInState: 0, distToPlayer: 300,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('SEARCH')
  })

  it('CHASE → ATTACK quando player dentro do attackRange', () => {
    const next = computeNextHumanState({
      state: 'CHASE', timeInState: 0, distToPlayer: 30,
      playerInCone: true, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('ATTACK')
  })

  it('SEARCH → COOLDOWN quando reachedLastKnown', () => {
    const next = computeNextHumanState({
      state: 'SEARCH', timeInState: 100, distToPlayer: 300,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: true,
    })
    expect(next).toBe('COOLDOWN')
  })

  it('COOLDOWN → PATROL após cooldownDuration', () => {
    const next = computeNextHumanState({
      state: 'COOLDOWN', timeInState: 1300, distToPlayer: 300,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('PATROL')
  })

  it('COOLDOWN permanece antes de cooldownDuration', () => {
    const next = computeNextHumanState({
      state: 'COOLDOWN', timeInState: 900, distToPlayer: 300,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBeNull()
  })
})

describe('onBarkHeardNextState', () => {
  it('bark dentro de hearingRadius → DETECT', () => {
    expect(onBarkHeardNextState('PATROL', 100, BASE_CONFIG)).toBe('DETECT')
  })

  it('bark dentro de attackRange → CHASE direto', () => {
    expect(onBarkHeardNextState('PATROL', 30, BASE_CONFIG)).toBe('CHASE')
  })

  it('bark durante COOLDOWN → PATROL (levou susto)', () => {
    expect(onBarkHeardNextState('COOLDOWN', 200, BASE_CONFIG)).toBe('PATROL')
  })

  it('bark fora do hearingRadius → sem efeito', () => {
    expect(onBarkHeardNextState('PATROL', 200, BASE_CONFIG)).toBeNull()
  })
})

describe('isInCone', () => {
  it('player à frente e dentro do range → true', () => {
    expect(isInCone(0, 0, true, 100, 0, 180, 30)).toBe(true)
  })

  it('player atrás → false', () => {
    expect(isInCone(0, 0, true, -100, 0, 180, 30)).toBe(false)
  })

  it('player fora do range → false', () => {
    expect(isInCone(0, 0, true, 200, 0, 180, 30)).toBe(false)
  })

  it('player dentro do range mas fora do ângulo → false', () => {
    expect(isInCone(0, 0, true, 100, 100, 180, 20)).toBe(false)
  })
})

describe('EnemyStateMachine class', () => {
  it('timeInState() retorna ~0 imediatamente após construção', () => {
    let fakeNow = 1500  // simula scene.time.now > 0 ao criar
    const sm = new EnemyStateMachine(() => fakeNow)
    expect(sm.timeInState()).toBeLessThan(5)
  })

  it('timeInState() acumula tempo após transição', () => {
    let fakeNow = 1500
    const sm = new EnemyStateMachine(() => fakeNow)
    sm.transition('DETECT')
    fakeNow = 1800
    expect(sm.timeInState()).toBeCloseTo(300, -1)
  })
})
