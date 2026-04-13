// Minimal Phaser mock for vitest (node environment).
// Only stubs the surface used by GatoSelvagem → GatoMalencarado → Enemy.

const noop = () => undefined
const returnThis = function (this: unknown) { return this }

class FakeSprite {
  x = 0; y = 0
  active = true
  displayWidth = 32; displayHeight = 32
  scene: unknown = null
  body: unknown = null

  constructor(..._args: unknown[]) {}

  setScale = returnThis
  setTint = returnThis
  clearTint = returnThis
  setFlipX = returnThis
  setCollideWorldBounds = returnThis
  setVelocityX = returnThis
  setVelocityY = returnThis
  setDepth = returnThis
  destroy = noop
  emit = noop
}

const Phaser = {
  Physics: {
    Arcade: {
      Sprite: FakeSprite,
    },
  },
  Math: {
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) =>
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    },
    Between: (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min,
  },
  GameObjects: {
    Graphics: FakeSprite,
  },
}

export default Phaser
