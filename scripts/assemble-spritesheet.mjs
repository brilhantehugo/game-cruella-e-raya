#!/usr/bin/env node
/**
 * Monta frames individuais num spritesheet horizontal.
 * Uso: node scripts/assemble-spritesheet.mjs <output.png> <frame1.png> [frame2.png ...]
 *
 * Exemplo:
 *   node scripts/assemble-spritesheet.mjs public/sprites/raya.png \
 *     /tmp/raya/idle-0.png /tmp/raya/idle-1.png ...
 */
import sharp from 'sharp'
import { readFileSync } from 'fs'

const [,, output, ...inputs] = process.argv
if (!output || inputs.length === 0) {
  console.error('Usage: assemble-spritesheet.mjs <output.png> <frame1.png> ...')
  process.exit(1)
}

const frames = await Promise.all(
  inputs.map(async (p) => {
    const buf = readFileSync(p)
    const meta = await sharp(buf).metadata()
    return { buf, width: meta.width, height: meta.height }
  })
)

const frameWidth  = frames[0].width
const frameHeight = frames[0].height
const totalWidth  = frameWidth * frames.length

const composites = frames.map((f, i) => ({
  input: f.buf,
  left: i * frameWidth,
  top: 0,
}))

await sharp({
  create: { width: totalWidth, height: frameHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite(composites)
  .png()
  .toFile(output)

console.log(`✓ Spritesheet criado: ${output} (${totalWidth}×${frameHeight}, ${frames.length} frames)`)
