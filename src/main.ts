import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'
import { UIScene } from './scenes/UIScene'
import { GameOverScene } from './scenes/GameOverScene'
import { LevelCompleteScene } from './scenes/LevelCompleteScene'
import { PauseScene } from './scenes/PauseScene'
import { GalleryScene } from './scenes/GalleryScene'
import { HowToPlayScene } from './scenes/HowToPlayScene'
import { IntroCrawlScene } from './scenes/IntroCrawlScene'
import { CharacterSelectScene } from './scenes/CharacterSelectScene'
import { EnemyInfoScene } from './scenes/EnemyInfoScene'
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from './constants'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.GRAVITY },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    UIScene,
    GameOverScene,
    LevelCompleteScene,
    PauseScene,
    GalleryScene,
    HowToPlayScene,
    IntroCrawlScene,
    CharacterSelectScene,
    EnemyInfoScene,
  ],
}

new Phaser.Game(config)
