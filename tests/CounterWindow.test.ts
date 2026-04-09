import { describe, it, expect } from 'vitest'
import { checkCounterWindow, type CounterWindow } from '../src/entities/enemies/EnemyStateMachine'

const GATO_BARK_WINDOW: CounterWindow = {
  character: 'cruella', state: 'CROUCH', windowMs: 400, type: 'bark',
}
const GATO_DASH_WINDOW: CounterWindow = {
  character: 'raya', state: 'LEAP', windowMs: 150, type: 'dash',
}
const POMBO_BARK_WINDOW: CounterWindow = {
  character: 'cruella', state: 'HOVER', windowMs: 300, type: 'bark',
}
const POMBO_JUMP_WINDOW: CounterWindow = {
  character: 'raya', state: 'PATROL_FLY', windowMs: 9999, type: 'jump',
}
const RATO_BARK_WINDOW: CounterWindow = {
  character: 'cruella', state: 'CHARGE', windowMs: 350, type: 'bark',
}
const RATO_JUMP_WINDOW: CounterWindow = {
  character: 'raya', state: 'DASH', windowMs: 200, type: 'jump',
}

describe('checkCounterWindow', () => {
  it('retorna true com personagem/tipo/tempo corretos', () => {
    expect(checkCounterWindow(GATO_BARK_WINDOW, 1000, 1200, 'cruella', 'bark')).toBe(true)
  })

  it('retorna false fora da janela de tempo', () => {
    expect(checkCounterWindow(GATO_BARK_WINDOW, 1000, 1500, 'cruella', 'bark')).toBe(false)
  })

  it('retorna false com personagem errado', () => {
    expect(checkCounterWindow(GATO_BARK_WINDOW, 1000, 1100, 'raya', 'bark')).toBe(false)
  })

  it('retorna false com tipo errado', () => {
    expect(checkCounterWindow(GATO_BARK_WINDOW, 1000, 1100, 'cruella', 'dash')).toBe(false)
  })

  it('retorna false quando window é null', () => {
    expect(checkCounterWindow(null, 1000, 1100, 'cruella', 'bark')).toBe(false)
  })

  it('Gato: dash window (150ms) — dentro', () => {
    expect(checkCounterWindow(GATO_DASH_WINDOW, 2000, 2100, 'raya', 'dash')).toBe(true)
  })

  it('Gato: dash window (150ms) — fora', () => {
    expect(checkCounterWindow(GATO_DASH_WINDOW, 2000, 2200, 'raya', 'dash')).toBe(false)
  })

  it('Pombo: bark window (300ms)', () => {
    expect(checkCounterWindow(POMBO_BARK_WINDOW, 0, 250, 'cruella', 'bark')).toBe(true)
    expect(checkCounterWindow(POMBO_BARK_WINDOW, 0, 350, 'cruella', 'bark')).toBe(false)
  })

  it('Pombo: jump window (aberta enquanto voa)', () => {
    expect(checkCounterWindow(POMBO_JUMP_WINDOW, 0, 5000, 'raya', 'jump')).toBe(true)
  })

  it('Rato: bark window (350ms)', () => {
    expect(checkCounterWindow(RATO_BARK_WINDOW, 500, 700, 'cruella', 'bark')).toBe(true)
    expect(checkCounterWindow(RATO_BARK_WINDOW, 500, 900, 'cruella', 'bark')).toBe(false)
  })

  it('Rato: jump window (200ms)', () => {
    expect(checkCounterWindow(RATO_JUMP_WINDOW, 1000, 1150, 'raya', 'jump')).toBe(true)
    expect(checkCounterWindow(RATO_JUMP_WINDOW, 1000, 1250, 'raya', 'jump')).toBe(false)
  })
})
