import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../constants'
import type { GameScene } from './GameScene'
import { cameraShake } from '../fx/cameraShake'

const BOSS_SPEECHES: Record<string, { header: string; hColor: string; speech: string; sColor: string }> = {
  '0-boss': { header: '🧹 ZELADOR DO PRÉDIO 🧹', hColor: '#ffa040',
              speech: '"Ninguém passa enquanto eu estiver de guarda!"', sColor: '#ffcc88' },
  '1-boss': { header: '🐱 SEU BIGODES 🐱',       hColor: '#ff8800',
              speech: '"Meu território, minha lixeira! Não vão a lugar algum!"', sColor: '#ffcc88' },
  '2-boss': { header: '🤖 DRONE DE VIGILÂNCIA 🤖', hColor: '#22ccff',
              speech: '"Intruso detectado. A activar protocolo de eliminação."', sColor: '#aaeeff' },
  '3-boss': { header: '🏍️ SEGURANÇA EM MOTO 🏍️', hColor: '#ff4444',
              speech: '"Desta vez não escapam. Acabou!"', sColor: '#ffaaaa' },
}

export class BossIntro {
  /** Executa a cinematic de intro do boss. Chamado por GameScene.create(). */
  static run(scene: GameScene): void {
    scene._cinematicActive = true
    const cam = scene.cameras.main
    const mapWidth = scene.currentLevel.tileWidthCols * TILE_SIZE

    // Etapa 1 (0–500ms): para de seguir o player, zoom out suave
    cam.stopFollow()
    scene.tweens.add({
      targets: cam,
      zoom: 0.85,
      duration: 500,
      ease: 'Sine.easeInOut',
    })

    // Etapa 2 (500–1500ms): pan até o boss
    // 3-boss nasce à direita; todos os outros ficam no centro da arena
    const bossWorldX = scene.currentLevel.id === '3-boss'
      ? mapWidth - 100
      : mapWidth / 2
    scene.time.delayedCall(500, () => {
      if (!scene.scene.isActive(KEYS.GAME)) return
      const bossX = bossWorldX
      const bossY = GAME_HEIGHT / 2
      // scrollX = worldX - (viewportWidth / zoom / 2) para centrar o boss na tela
      const scrollX = Phaser.Math.Clamp(bossX - GAME_WIDTH / 2 / 0.85, 0, mapWidth - GAME_WIDTH)
      const scrollY = bossY - GAME_HEIGHT / 2 / 0.85
      scene.tweens.add({
        targets: cam,
        scrollX,
        scrollY,
        duration: 800,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          cameraShake(scene, 200, 0.003)
        },
      })
    })

    // Etapa 2.5 (1100ms): fala do boss
    const bossData = BOSS_SPEECHES[scene.currentLevel.id]
    if (bossData) {
      scene.time.delayedCall(1100, () => {
        if (!scene.scene.isActive(KEYS.GAME)) return
        const header = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10,
          bossData.header, {
            fontSize: '20px', color: bossData.hColor, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4,
            backgroundColor: '#000000ee', padding: { x: 16, y: 8 },
          }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)
        const speech = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 36,
          bossData.speech, {
            fontSize: '14px', color: bossData.sColor, fontStyle: 'italic',
            stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#000000cc', padding: { x: 12, y: 6 },
          }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)
        scene.tweens.add({ targets: [header, speech], alpha: 1, duration: 300 })
        scene.time.delayedCall(3000, () => {
          if (!scene.scene.isActive(KEYS.GAME)) return
          scene.tweens.add({
            targets: [header, speech], alpha: 0, duration: 400,
            onComplete: () => {
              if (header.active) header.destroy()
              if (speech.active) speech.destroy()
            },
          })
        })
      })
    }

    // Etapa 3 (1500–2000ms): volta ao player, restaura zoom, libera controle
    scene.time.delayedCall(1500, () => {
      if (!scene.scene.isActive(KEYS.GAME)) return
      scene.tweens.add({
        targets: cam,
        zoom: 1,
        duration: 500,
        ease: 'Sine.easeInOut',
      })
      scene._followingSprite = scene.player.active
      cam.startFollow(scene._followingSprite, true, 0.1, 0.1)
      cam.setDeadzone(160, 80)
    })

    scene.time.delayedCall(2000, () => {
      if (!scene.scene.isActive(KEYS.GAME)) return
      // Activa o boss agora que a cinemática terminou
      if (scene._mainBoss) {
        scene._mainBoss.setVisible(true)
        ;(scene._mainBoss.body as Phaser.Physics.Arcade.Body).enable = true
      }
      scene._cinematicActive = false
      // Trava a câmera dentro dos limites da arena
      cam.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    })
  }
}
