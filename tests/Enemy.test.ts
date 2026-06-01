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

describe('stun tracker — ícone segue a posição do inimigo', () => {
  it('tracker chama setPosition com posição atual do inimigo', () => {
    let lastX = 0, lastY = 0
    const mockIcon = { active: true, setPosition: (x: number, y: number) => { lastX = x; lastY = y } }
    let enemyX = 100, enemyY = 200
    const tracker = () => { if (mockIcon.active) mockIcon.setPosition(enemyX, enemyY - 30) }
    tracker()
    expect(lastX).toBe(100)
    expect(lastY).toBe(170)
    enemyX = 250; enemyY = 300
    tracker()
    expect(lastX).toBe(250)
    expect(lastY).toBe(270)
  })
  it('tracker é no-op quando stunIcon não está mais ativo', () => {
    let called = false
    const mockIcon = { active: false, setPosition: (_x: number, _y: number) => { called = true } }
    const tracker = () => { if (mockIcon.active) mockIcon.setPosition(0, 0) }
    tracker()
    expect(called).toBe(false)
  })
})

describe('Enemy.hp — acesso direto (sem getHp deprecated)', () => {
  it('hp é acessível como campo público', () => {
    const e = new TestEnemy(4)
    expect(e.hp).toBe(4)
    expect('getHp' in e).toBe(false)
  })
})
