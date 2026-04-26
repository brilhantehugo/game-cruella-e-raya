/**
 * Monta spritesheet de 17 frames (48×48 px cada) a partir dos frames east-facing
 * gerados pelo Pixel Lab MCP. Layout:
 *   idle(0-1)  walk(2-5)  run(6-9)  jump(10-11)  bark(12-13)  stun(14)  death(15-16)
 *
 * Animações disponíveis: idle (8fr) + walk (4fr)
 * Animações ausentes usam fallback de idle/walk.
 *
 * Uso: node scripts/assemble-mcp-spritesheet.mjs <character> <idleDir> <walkDir> <outFile>
 *   character: raya | cruella
 *   idleDir:   pasta da animação idle (ex: animation-530eb687)
 *   walkDir:   pasta da animação walk (ex: walking-6db72d49)
 *   outFile:   caminho de saída (ex: public/sprites/raya.png)
 */
import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const [,, character, idleDir, walkDir, outFile] = process.argv
if (!character || !idleDir || !walkDir || !outFile) {
  console.error('Uso: node scripts/assemble-mcp-spritesheet.mjs <character> <idleDir> <walkDir> <outFile>')
  process.exit(1)
}

const TMP = `/tmp/pixellab-${character}`
const FRAME_W = 48
const FRAME_H = 48
const TOTAL_FRAMES = 17

// helpers
const idleFr  = (n) => join(TMP, 'animations', idleDir, 'east', `frame_00${n}.png`)
const walkFr  = (n) => join(TMP, 'animations', walkDir, 'east', `frame_00${n}.png`)

// 17 frame slots → source file
const SLOTS = [
  idleFr(0), idleFr(1),                         // 0-1  idle
  walkFr(0), walkFr(1), walkFr(2), walkFr(3),   // 2-5  walk
  walkFr(0), walkFr(1), walkFr(2), walkFr(3),   // 6-9  run (fallback=walk)
  idleFr(2), idleFr(3),                         // 10-11 jump (fallback=idle)
  idleFr(4), idleFr(5),                         // 12-13 bark (fallback=idle)
  idleFr(6),                                    // 14    stun (fallback=idle)
  idleFr(6), idleFr(7),                         // 15-16 death (fallback=idle)
]

async function main() {
  const composites = SLOTS.map((file, i) => ({
    input: file,
    left: i * FRAME_W,
    top: 0,
  }))

  await sharp({
    create: { width: TOTAL_FRAMES * FRAME_W, height: FRAME_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite(composites)
    .png()
    .toFile(outFile)

  console.log(`✓ ${outFile} (${TOTAL_FRAMES * FRAME_W}×${FRAME_H}, ${TOTAL_FRAMES} frames)`)
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
