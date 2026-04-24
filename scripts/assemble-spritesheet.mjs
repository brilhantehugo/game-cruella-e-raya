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
import { mkdirSync } from 'fs'
import { dirname } from 'path'

const [,, output, ...inputs] = process.argv
if (!output || inputs.length === 0) {
  console.error('Usage: assemble-spritesheet.mjs <output.png> <frame1.png> ...')
  process.exit(1)
}

const frames = await Promise.all(
  inputs.map(async (p) => {
    let meta
    try {
      meta = await sharp(p).metadata()
    } catch (err) {
      console.error(`Error: cannot read frame: ${p}`)
      process.exit(1)
    }
    return { path: p, width: meta.width, height: meta.height }
  })
)

const frameWidth  = frames[0].width
const frameHeight = frames[0].height

for (const f of frames) {
  if (f.width !== frameWidth || f.height !== frameHeight) {
    console.error(
      `Error: inconsistent frame dimensions — expected ${frameWidth}×${frameHeight} ` +
      `but "${f.path}" is ${f.width}×${f.height}`
    )
    process.exit(1)
  }
}

const totalWidth = frameWidth * frames.length

const composites = frames.map((f, i) => ({
  input: f.path,
  left: i * frameWidth,
  top: 0,
}))

mkdirSync(dirname(output), { recursive: true })

await sharp({
  create: { width: totalWidth, height: frameHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite(composites)
  .png()
  .toFile(output)

console.log(`✓ Spritesheet criado: ${output} (${totalWidth}×${frameHeight}, ${frames.length} frames)`)
