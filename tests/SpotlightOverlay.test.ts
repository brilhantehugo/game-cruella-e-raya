import { describe, it, expect } from 'vitest'
import { isNearLight, buildSegurancaLightSource, type LightSource } from '../src/fx/SpotlightOverlay'

describe('isNearLight', () => {
  it('returns true when enemy is within playerAura + checkRadius', () => {
    // player at (0,0), aura 130, enemy at (100,0) — dist 100 < 130+200=330
    expect(isNearLight(100, 0, 0, 0, 130, [], 200)).toBe(true)
  })

  it('returns false when enemy is far from all lights', () => {
    // dist 500 > 330
    expect(isNearLight(500, 0, 0, 0, 130, [], 200)).toBe(false)
  })

  it('returns true when enemy is near a circle light source', () => {
    const sources: LightSource[] = [{ x: 400, y: 0, type: 'circle', radius: 60 }]
    // enemy at (500,0): dist to source = 100, 60+200=260 > 100
    expect(isNearLight(500, 0, 0, 0, 130, sources, 200)).toBe(true)
  })

  it('returns false when enemy is far from all sources', () => {
    const sources: LightSource[] = [{ x: 0, y: 0, type: 'circle', radius: 30 }]
    // dist to player=800 > 330; dist to source=800 > 30+200=230
    expect(isNearLight(800, 0, 0, 0, 130, sources, 200)).toBe(false)
  })
})

describe('buildSegurancaLightSource', () => {
  it('returns a cone facing right (angle=0) when facingLeft=false', () => {
    const src = buildSegurancaLightSource(100, 200, false)
    expect(src.type).toBe('cone')
    expect(src.angle).toBe(0)
    expect(src.radius).toBe(200)
    expect(src.spread).toBe(180)
    expect(src.y).toBe(196)   // y - 4
  })

  it('returns a cone facing left (angle=180) when facingLeft=true', () => {
    const src = buildSegurancaLightSource(100, 200, true)
    expect(src.angle).toBe(180)
  })
})
