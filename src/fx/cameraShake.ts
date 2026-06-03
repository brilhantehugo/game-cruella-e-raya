import Phaser from 'phaser'
import { gameState } from '../GameState'

/** Decide se o shake deve ocorrer (pura, testável). */
export function shouldShake(reducedMotion: boolean): boolean {
  return !reducedMotion
}

/** Aplica camera shake, respeitando a preferência de reduzir movimento. */
export function cameraShake(scene: Phaser.Scene, duration: number, intensity: number): void {
  if (!shouldShake(gameState.reducedMotion)) return
  scene.cameras.main.shake(duration, intensity)
}
