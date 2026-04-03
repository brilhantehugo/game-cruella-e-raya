import Phaser from 'phaser'
import { KEYS, TILE_SIZE } from '../constants'
import { CompiledSprite, RAYA_SPRITE, CRUELLA_SPRITE, GATO_SPRITE, POMBO_SPRITE, RATO_SPRITE, DONO_SPRITE, BIGODES_SPRITE } from '../sprites/SpriteData'

export class BootScene extends Phaser.Scene {
  constructor() { super(KEYS.BOOT) }

  create(): void {
    // ── Pixel sprites ──────────────────────────────────────────────────────────
    this._makePixelSprite(KEYS.RAYA,    RAYA_SPRITE)
    this._makePixelSprite(KEYS.CRUELLA, CRUELLA_SPRITE)
    this._makePixelSprite(KEYS.GATO,    GATO_SPRITE)
    this._makePixelSprite(KEYS.POMBO,   POMBO_SPRITE)
    this._makePixelSprite(KEYS.RATO,    RATO_SPRITE)
    this._makePixelSprite(KEYS.DONO,    DONO_SPRITE)
    this._makePixelSprite(KEYS.BIGODES, BIGODES_SPRITE)

    // ── Geometric tiles and items (unchanged) ──────────────────────────────────
    const g = this.make.graphics({ x: 0, y: 0 })

    const makeRect = (key: string, w: number, h: number, fill: number, stroke?: number) => {
      g.clear()
      g.fillStyle(fill)
      g.fillRect(0, 0, w, h)
      if (stroke !== undefined) {
        g.lineStyle(2, stroke)
        g.strokeRect(1, 1, w - 2, h - 2)
      }
      g.generateTexture(key, w, h)
    }

    const makeCircle = (key: string, r: number, fill: number) => {
      g.clear()
      g.fillStyle(fill)
      g.fillCircle(r, r, r)
      g.generateTexture(key, r * 2, r * 2)
    }

    makeRect(KEYS.TILE_GROUND,    TILE_SIZE,     TILE_SIZE,     0x8b5e3c, 0x5a3a1a)
    makeRect(KEYS.TILE_PLATFORM,  TILE_SIZE,     TILE_SIZE / 2, 0x5a8f3c, 0x3a6020)
    makeCircle(KEYS.BONE,         8,             0xf5f0e0)
    makeCircle(KEYS.GOLDEN_BONE,  10,            0xffd700)
    makeRect(KEYS.PETISCO,        20, 14,        0xff8c00)
    makeRect(KEYS.PIPOCA,         16, 20,        0xfffacd)
    makeRect(KEYS.PIZZA,          22, 22,        0xff6347)
    makeRect(KEYS.CHURRASCO,      24, 18,        0x8b0000)
    makeCircle(KEYS.BOLA,         10,            0xadff2f)
    makeRect(KEYS.FRISBEE,        24, 8,         0x00bcd4)
    makeRect(KEYS.LACO,           16, 12,        0xff69b4)
    makeRect(KEYS.COLEIRA,        24, 8,         0xcd853f)
    makeRect(KEYS.CHAPEU,         24, 14,        0xff1493)
    makeRect(KEYS.BANDANA,        20, 10,        0xff4500)
    makeRect(KEYS.COLLAR_GOLD,    24, 8,         0xffd700, 0xb8860b)
    makeCircle(KEYS.HEART,        12,            0xff3355)
    makeCircle(KEYS.HEART_EMPTY,  12,            0x333333)
    makeRect(KEYS.HYDRANT,        20, 32,        0xff2200, 0xaa0000)
    makeRect(KEYS.EXIT_GATE,      48, 64,        0x8b6914, 0x5a4010)
    makeRect(KEYS.SURPRISE_BLOCK, TILE_SIZE, TILE_SIZE, 0xffd700, 0xb8860b)

    g.destroy()
    this.scene.start(KEYS.MENU)
  }

  private _makePixelSprite(key: string, sprite: CompiledSprite): void {
    const { frameWidth, frameHeight, frames } = sprite
    const canvas = document.createElement('canvas')
    canvas.width  = frameWidth * frames.length
    canvas.height = frameHeight
    const ctx = canvas.getContext('2d')!

    frames.forEach((frame, fi) => {
      const offsetX = fi * frameWidth
      frame.forEach((rowPixels, ry) => {
        rowPixels.forEach((color, rx) => {
          if (color === null) return
          ctx.fillStyle = color
          ctx.fillRect(offsetX + rx, ry, 1, 1)
        })
      })
    })

    this.textures.addSpriteSheet(key, canvas, { frameWidth, frameHeight })
  }
}
