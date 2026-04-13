import { describe, it, expect } from 'vitest'
import { gatoSelvagemNextState } from '../src/entities/enemies/GatoSelvagem'

describe('gatoSelvagemNextState', () => {
  it('WANDER → CHASE when near light', () => {
    expect(gatoSelvagemNextState('WANDER', true, 0)).toBe('CHASE')
  })

  it('CHASE stays CHASE when near light', () => {
    expect(gatoSelvagemNextState('CHASE', true, 500)).toBe('CHASE')
  })

  it('CHASE stays CHASE when not near light but deactivate timer still running', () => {
    expect(gatoSelvagemNextState('CHASE', false, 1000)).toBe('CHASE')
  })

  it('CHASE → WANDER when not near light and deactivate timer expired', () => {
    expect(gatoSelvagemNextState('CHASE', false, 0)).toBe('WANDER')
  })

  it('WANDER stays WANDER when not near light', () => {
    expect(gatoSelvagemNextState('WANDER', false, 0)).toBe('WANDER')
  })
})
