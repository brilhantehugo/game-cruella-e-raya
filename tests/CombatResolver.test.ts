import { describe, it, expect } from 'vitest'
import { resolveBarkHit, resolveDashHit, resolveStompHit } from '../src/systems/CombatResolver'

describe('resolveBarkHit', () => {
  it('counter tem prioridade máxima mesmo com hp=1 e dentro do raio', () => {
    expect(resolveBarkHit({ hp: 1, dist: 50, barkRadius: 120, countered: true, isNPC: false }))
      .toEqual({ action: 'counter' })
  })

  it('mata inimigo com hp=1 dentro do raio sem counter', () => {
    expect(resolveBarkHit({ hp: 1, dist: 80, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'ko' })
  })

  it('stuna inimigo com hp=3 dentro do raio', () => {
    expect(resolveBarkHit({ hp: 3, dist: 80, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'stun', duration: 2000 })
  })

  it('nada quando dist > barkRadius', () => {
    expect(resolveBarkHit({ hp: 1, dist: 121, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'nothing' })
  })

  it('nada quando dist === barkRadius (limite inclusivo — exatamente no limite afeta)', () => {
    expect(resolveBarkHit({ hp: 1, dist: 120, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'ko' })
  })

  it('nada em NPC mesmo dentro do raio', () => {
    expect(resolveBarkHit({ hp: 1, dist: 50, barkRadius: 120, countered: false, isNPC: true }))
      .toEqual({ action: 'nothing' })
  })

  it('stun usa duração padrão 2000 quando stunDuration não é fornecido', () => {
    expect(resolveBarkHit({ hp: 3, dist: 80, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'stun', duration: 2000 })
  })

  it('stun usa duração customizada quando stunDuration é fornecido', () => {
    expect(resolveBarkHit({ hp: 3, dist: 80, barkRadius: 120, countered: false, isNPC: false, stunDuration: 500 }))
      .toEqual({ action: 'stun', duration: 500 })
  })

})

describe('resolveDashHit', () => {
  it('counter quando countered=true mesmo com hpAfterDamage=0', () => {
    expect(resolveDashHit({ hpAfterDamage: 0, countered: true }))
      .toEqual({ action: 'counter' })
  })

  it('ko quando hpAfterDamage=0 sem counter', () => {
    expect(resolveDashHit({ hpAfterDamage: 0, countered: false }))
      .toEqual({ action: 'ko' })
  })

  it('damage quando inimigo sobrevive com 2 hp', () => {
    expect(resolveDashHit({ hpAfterDamage: 2, countered: false }))
      .toEqual({ action: 'damage' })
  })

  it('damage quando inimigo sobrevive com 1 hp', () => {
    expect(resolveDashHit({ hpAfterDamage: 1, countered: false }))
      .toEqual({ action: 'damage' })
  })

  it('ko quando hpAfterDamage negativo', () => {
    expect(resolveDashHit({ hpAfterDamage: -3, countered: false }))
      .toEqual({ action: 'ko' })
  })
})

describe('resolveStompHit', () => {
  it('stomp quando queda rápida sobre inimigo não-NPC', () => {
    expect(resolveStompHit({ velocityY: 200, pBottom: 100, eTop: 95, isNPC: false }))
      .toEqual({ action: 'stomp' })
  })

  it('npc_push quando queda sobre NPC', () => {
    expect(resolveStompHit({ velocityY: 200, pBottom: 100, eTop: 95, isNPC: true }))
      .toEqual({ action: 'npc_push' })
  })

  it('nada quando velocityY <= 50', () => {
    expect(resolveStompHit({ velocityY: 30, pBottom: 100, eTop: 95, isNPC: false }))
      .toEqual({ action: 'nothing' })
  })

  it('nada quando velocityY === 50 (exatamente no limite)', () => {
    expect(resolveStompHit({ velocityY: 50, pBottom: 100, eTop: 95, isNPC: false }))
      .toEqual({ action: 'nothing' })
  })

  it('stomp quando velocityY === 51 (um acima do limite)', () => {
    expect(resolveStompHit({ velocityY: 51, pBottom: 100, eTop: 95, isNPC: false }))
      .toEqual({ action: 'stomp' })
  })

  it('nada quando pBottom > eTop + 12', () => {
    expect(resolveStompHit({ velocityY: 200, pBottom: 110, eTop: 95, isNPC: false }))
      .toEqual({ action: 'nothing' })
  })

  it('stomp quando pBottom exatamente no limite (pBottom === eTop + 12)', () => {
    expect(resolveStompHit({ velocityY: 100, pBottom: 107, eTop: 95, isNPC: false }))
      .toEqual({ action: 'stomp' })
  })

  it('nada quando pBottom ultrapassa o limite (pBottom === eTop + 13)', () => {
    expect(resolveStompHit({ velocityY: 100, pBottom: 108, eTop: 95, isNPC: false }))
      .toEqual({ action: 'nothing' })
  })
})
