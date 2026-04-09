import Phaser from 'phaser'
import { KEYS, GAME_WIDTH } from '../constants'
import { BackgroundTheme } from '../levels/LevelData'

interface LayerConfig {
  key: string
  speed: number
  y: number
  height: number
  alpha?: number
}

const THEME_LAYERS: Record<BackgroundTheme, LayerConfig[]> = {
  rua: [
    { key: KEYS.BG_RUA_1,     speed: 0.05, y: 0, height: 450 },
    { key: KEYS.BG_RUA_2,     speed: 0.2,  y: 0, height: 450, alpha: 0.7 },
    { key: KEYS.BG_RUA_3,     speed: 0.5,  y: 0, height: 450 },
  ],
  praca: [
    { key: KEYS.BG_PRACA_1,   speed: 0.05, y: 0, height: 450 },
    { key: KEYS.BG_PRACA_2,   speed: 0.2,  y: 0, height: 450 },
    { key: KEYS.BG_PRACA_3,   speed: 0.5,  y: 0, height: 450 },
  ],
  mercado: [
    { key: KEYS.BG_MERCADO_1, speed: 0.05, y: 0, height: 450 },
    { key: KEYS.BG_MERCADO_2, speed: 0.2,  y: 0, height: 450 },
    { key: KEYS.BG_MERCADO_3, speed: 0.5,  y: 0, height: 450 },
  ],
  boss: [
    { key: KEYS.BG_BOSS_1,    speed: 0.05, y: 0, height: 450 },
    { key: KEYS.BG_BOSS_2,    speed: 0.2,  y: 0, height: 450 },
    { key: KEYS.BG_BOSS_3,    speed: 0.5,  y: 0, height: 450 },
  ],
  apartamento: [
    { key: KEYS.BG_APTO_1,    speed: 0.03, y: 0, height: 450 },
    { key: KEYS.BG_APTO_2,    speed: 0.15, y: 0, height: 450 },
    { key: KEYS.BG_APTO_3,    speed: 0.4,  y: 0, height: 450 },
  ],
  apto_boss: [
    { key: KEYS.BG_APTO_BOSS_1, speed: 0.02, y: 0, height: 450 },
    { key: KEYS.BG_APTO_BOSS_2, speed: 0.1,  y: 0, height: 450 },
    { key: KEYS.BG_APTO_BOSS_3, speed: 0.35, y: 0, height: 450 },
  ],
}

export class ParallaxBackground {
  private layers: Array<{ sprite: Phaser.GameObjects.TileSprite; speed: number }> = []

  constructor(scene: Phaser.Scene, theme: BackgroundTheme) {
    const configs = THEME_LAYERS[theme]
    configs.forEach((cfg, i) => {
      // sky=-5, mid=-4, near=-3 (decorations are -1, tilemap 0+)
      const depth = -5 + i
      const sprite = scene.add.tileSprite(0, cfg.y, GAME_WIDTH, cfg.height, cfg.key)
      sprite.setOrigin(0, 0)
      sprite.setDepth(depth)
      if (cfg.alpha !== undefined) {
        sprite.setAlpha(cfg.alpha)
      }
      this.layers.push({ sprite, speed: cfg.speed })
    })
  }

  update(cameraScrollX: number): void {
    this.layers.forEach(({ sprite, speed }) => {
      sprite.tilePositionX = cameraScrollX * speed
    })
  }

  destroy(): void {
    this.layers.forEach(({ sprite }) => sprite.destroy())
    this.layers = []
  }
}
