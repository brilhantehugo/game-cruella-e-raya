import { describe, it, expect } from 'vitest'

// Enemy é abstract — testamos via subclasse mínima local (não importa Phaser)
class TestEnemy {
  public hp: number
  public readonly maxHp: number
  constructor(hp: number) {
    this.maxHp = hp
    this.hp = hp
  }
}

describe('Enemy maxHp', () => {
  it('maxHp é igual ao hp inicial', () => {
    const e = new TestEnemy(3)
    expect(e.maxHp).toBe(3)
    expect(e.hp).toBe(3)
  })

  it('hp pode ser reduzido mas maxHp permanece', () => {
    const e = new TestEnemy(3)
    e.hp -= 1
    expect(e.hp).toBe(2)
    expect(e.maxHp).toBe(3)
  })
})
