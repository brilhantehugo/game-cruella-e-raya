import { describe, it, expect } from 'vitest'
import { enemyAnimState } from '../src/entities/enemies/enemyAnimState'

describe('enemyAnimState', () => {
  it('velocidade 0 → idle', () => {
    expect(enemyAnimState(0)).toBe('idle')
  })
  it('abaixo de 10 → idle', () => {
    expect(enemyAnimState(9)).toBe('idle')
  })
  it('exatamente 10 → walk', () => {
    expect(enemyAnimState(10)).toBe('walk')
  })
  it('velocidade de patrulha (60-100) → walk', () => {
    expect(enemyAnimState(60)).toBe('walk')
    expect(enemyAnimState(80)).toBe('walk')
    expect(enemyAnimState(100)).toBe('walk')
  })
  it('logo abaixo de 150 → walk', () => {
    expect(enemyAnimState(149)).toBe('walk')
  })
  it('exatamente 150 → run', () => {
    expect(enemyAnimState(150)).toBe('run')
  })
  it('velocidades de chase/dash (200-400) → run', () => {
    expect(enemyAnimState(200)).toBe('run')
    expect(enemyAnimState(400)).toBe('run')
  })
  it('velocidade negativa usa magnitude absoluta', () => {
    expect(enemyAnimState(-80)).toBe('walk')
    expect(enemyAnimState(-300)).toBe('run')
  })
})
