import { describe, it, expect } from 'vitest'

// NOTE: TestEnemy mirrors Enemy's constructor logic because Enemy extends
// Phaser.Physics.Arcade.Sprite and cannot be instantiated in a Node test
// environment. Changes to Enemy's constructor must be manually verified here.
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
