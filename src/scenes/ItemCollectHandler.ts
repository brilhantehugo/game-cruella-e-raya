import Phaser from 'phaser'
import { POWERUP_LABEL } from '../constants'
import { gameState } from '../GameState'
import { GoldenBone } from '../items/GoldenBone'
import { SoundManager } from '../audio/SoundManager'
import type { GameScene } from './GameScene'

export class ItemCollectHandler {
  /** Processa a coleta de um item pelo player. Chamado por CollisionSetup. */
  static handle(scene: GameScene, type: string, item: Phaser.Physics.Arcade.Image): void {
    const now = scene.time.now
    switch (type) {
      case 'checkpoint':
        if (!gameState.checkpointReached) {
          gameState.setCheckpoint(item.x, item.y)
          SoundManager.play('checkpoint')
          scene._fx.checkpointSparkle(item.x, item.y)
          scene._spawnScorePopup(item.x, item.y - 32, '✅ checkpoint!', '#00ffcc')
          scene._fx.checkpointActivatedGlow(item)
        }
        return // don't destroy
      case 'exit':
        scene._levelComplete()
        return
      case 'bone':
        gameState.addScore(10)
        SoundManager.play('collectBone')
        scene._fx.boneSpark(item.x, item.y)
        scene._spawnScorePopup(item.x, item.y - 16, '+10', '#ffff00')
        scene._am?.notify('item_collected', { type: 'bone' })
        break
      case 'golden_bone':
        gameState.collectGoldenBone(gameState.currentLevel, (item as unknown as GoldenBone).boneIndex)
        gameState.addScore(500)
        SoundManager.play('collectGolden')
        scene._fx.goldenBoneBurst(item.x, item.y)
        scene._spawnScorePopup(item.x, item.y - 16, '+500', '#ffd700')
        scene._am?.notify('golden_bone')
        break
      case 'pizza':
        gameState.restoreHeart()
        scene._spawnScorePopup(item.x, item.y - 16, '❤️', '#ff6b6b')
        scene._am?.notify('item_collected', { type: 'pizza' })
        break
      case 'heart':
        gameState.restoreHeart()
        SoundManager.play('powerUp')
        scene._spawnScorePopup(item.x, item.y - 16, '❤️ +vida!', '#ff4466')
        scene._am?.notify('item_collected', { type: 'heart' })
        break
      case 'laco':
        gameState.equipAccessory(type as any)
        scene._spawnScorePopup(item.x, item.y - 16, '🎀 laço!',   '#ff88cc')
        break
      case 'coleira':
        gameState.equipAccessory(type as any)
        scene._spawnScorePopup(item.x, item.y - 16, '📿 coleira!', '#88ccff')
        break
      case 'chapeu':
        gameState.equipAccessory(type as any)
        scene._spawnScorePopup(item.x, item.y - 16, '🎩 chapéu!', '#ccaa44')
        break
      case 'bandana':
        gameState.equipAccessory(type as any)
        scene._spawnScorePopup(item.x, item.y - 16, '🏴 bandana!', '#ff4444')
        break
      default: {
        gameState.applyPowerUp(type, now)
        SoundManager.play('powerUp')
        scene._fx.powerUpBurst(scene.player.x, scene.player.y, type)
        const lbl = POWERUP_LABEL[type] ?? { text: '✨', color: '#00ffff' }
        scene._spawnScorePopup(item.x, item.y - 16, lbl.text, lbl.color)
        scene._am?.notify('item_collected', { type })
      }
    }
    item.destroy()
  }
}
