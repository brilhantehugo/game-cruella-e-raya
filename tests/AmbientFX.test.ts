import { describe, it, expect } from 'vitest'
import { getAmbientConfig, AmbientConfig } from '../src/fx/AmbientFX'

describe('AmbientFX', () => {
  it('returns null for boss theme', () => {
    const config = getAmbientConfig('boss')
    expect(config).toBeNull()
  })

  it('returns rain config for rua_noite', () => {
    const config = getAmbientConfig('rua_noite')
    expect(config).not.toBeNull()
    expect(config?.type).toBe('rain')
    expect(config?.maxCount).toBe(35)
    expect(config?.intervalMs).toBe(180)
    expect(config?.alphaMax).toBe(0.55)
    expect(config?.speedBase).toBe(200)
  })

  it('returns dust config for apartamento', () => {
    const config = getAmbientConfig('apartamento')
    expect(config).not.toBeNull()
    expect(config?.type).toBe('dust')
    expect(config?.maxCount).toBe(18)
    expect(config?.alphaMax).toBe(0.35)
    expect(config?.speedBase).toBe(20)
  })

  it('returns dust config for apto_boss', () => {
    const config = getAmbientConfig('apto_boss')
    expect(config).not.toBeNull()
    expect(config?.type).toBe('dust')
    expect(config?.maxCount).toBe(14)
    expect(config?.alphaMax).toBe(0.35)
    expect(config?.speedBase).toBe(20)
  })

  it('returns leaves config for rua', () => {
    const config = getAmbientConfig('rua')
    expect(config).not.toBeNull()
    expect(config?.type).toBe('leaves')
    expect(config?.maxCount).toBe(12)
    expect(config?.alphaMax).toBe(0.55)
  })

  it('returns leaves config for praca', () => {
    const config = getAmbientConfig('praca')
    expect(config).not.toBeNull()
    expect(config?.type).toBe('leaves')
    expect(config?.maxCount).toBe(10)
    expect(config?.alphaMax).toBe(0.55)
  })

  it('returns leaves config for patio', () => {
    const config = getAmbientConfig('patio')
    expect(config).not.toBeNull()
    expect(config?.type).toBe('leaves')
    expect(config?.maxCount).toBe(8)
    expect(config?.alphaMax).toBe(0.45)
  })

  it('returns wind config for telhado', () => {
    const config = getAmbientConfig('telhado')
    expect(config).not.toBeNull()
    expect(config?.type).toBe('wind')
    expect(config?.maxCount).toBe(15)
    expect(config?.alphaMax).toBe(0.50)
    expect(config?.speedBase).toBe(140)
  })

  it('returns wind config for exterior', () => {
    const config = getAmbientConfig('exterior')
    expect(config).not.toBeNull()
    expect(config?.type).toBe('wind')
    expect(config?.maxCount).toBe(12)
    expect(config?.alphaMax).toBe(0.50)
    expect(config?.speedBase).toBe(140)
  })

  it('returns acvent config for mercado', () => {
    const config = getAmbientConfig('mercado')
    expect(config).not.toBeNull()
    expect(config?.type).toBe('acvent')
    expect(config?.maxCount).toBe(12)
    expect(config?.alphaMax).toBe(0.35)
    expect(config?.speedBase).toBe(15)
  })

  it('validates alphaMax constraint', () => {
    const config = getAmbientConfig('rua_noite')
    expect(config?.alphaMax).toBeLessThanOrEqual(1)
    expect(config?.alphaMax).toBeGreaterThanOrEqual(0)
  })

  it('validates color array is present', () => {
    const config = getAmbientConfig('rua_noite')
    expect(config?.colors).toBeDefined()
    expect(Array.isArray(config?.colors)).toBe(true)
  })
})
