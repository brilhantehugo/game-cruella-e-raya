/**
 * Gera os 17 frames de pixel art da Cruella via Pixel Lab API
 * e monta o spritesheet em public/sprites/cruella.png
 *
 * Uso: node scripts/generate-cruella-sprites.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = join(__dirname, '..')
const TMP_DIR   = join(ROOT, 'scripts', '.cruella-frames')
const OUT_DIR   = join(ROOT, 'public', 'sprites')
const OUT_FILE  = join(OUT_DIR, 'cruella.png')
const API_KEY   = '793d3596-21e8-4a8f-884e-44ea4ec0b8ed'
const API_URL   = 'https://api.pixellab.ai/v1/generate-image-pixflux'

const BASE = 'Pomeranian dog lulu da pomerania black and white parti, small fluffy, pixel art 16-bit SNES style, ' +
             '32x32 pixels, side view facing right, black and white fluffy fur with distinct patches, ' +
             'very fluffy thick coat, curled tail over back, pointy ears, foxy face, ' +
             'pink bow on head, elegant intelligent expression, ' +
             'solid white background, no anti-aliasing, clean pixel edges'

const FRAMES = [
  // idle (0-1)
  { name: 'idle0',   desc: `${BASE}, standing still, all four paws on ground, ears up, tail gracefully raised` },
  { name: 'idle1',   desc: `${BASE}, standing still, slight elegant body shift, ears perky, tail slightly curved` },
  // walk (2-5)
  { name: 'walk0',   desc: `${BASE}, walking right, front right paw forward, rear left paw back, graceful gait` },
  { name: 'walk1',   desc: `${BASE}, walking right, mid stride, body slightly leaned forward, elegant posture` },
  { name: 'walk2',   desc: `${BASE}, walking right, front left paw forward, rear right paw back` },
  { name: 'walk3',   desc: `${BASE}, walking right, mid stride completing step, tail curved up` },
  // run (6-9)
  { name: 'run0',    desc: `${BASE}, running right, galloping, front paws extended forward, rear paws tucked` },
  { name: 'run1',    desc: `${BASE}, running right, galloping, all paws off ground, body stretched, fur flowing` },
  { name: 'run2',    desc: `${BASE}, running right, galloping, rear paws pushing off, front paws reaching` },
  { name: 'run3',    desc: `${BASE}, running right, galloping fast, low body posture, pink bow visible` },
  // jump (10-11)
  { name: 'jump0',   desc: `${BASE}, jumping upward, all paws off ground, body arched, pink bow in air` },
  { name: 'jump1',   desc: `${BASE}, at peak of jump, paws tucked under body, elegant mid-air pose` },
  // bark (12-13)
  { name: 'bark0',   desc: `${BASE}, barking, mouth open wide, facing right, spots on face visible` },
  { name: 'bark1',   desc: `${BASE}, barking, mouth slightly open, composed expression, facing right` },
  // stun (14)
  { name: 'stun0',   desc: `${BASE}, stunned dizzy, sitting down, stars around head, eyes swirling, facing right` },
  // death (15-16)
  { name: 'death0',  desc: `${BASE}, falling down, on side, legs splayed, fluffy fur disheveled, facing right` },
  { name: 'death1',  desc: `${BASE}, lying on side, eyes closed, pink bow askew, completely flat on ground` },
]

async function generateFrame(frame, index) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: frame.desc,
      image_size: { width: 32, height: 32 },
      text_guidance_scale: 8,
      no_background: false,
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Frame ${index} (${frame.name}) falhou: ${res.status} ${txt}`)
  }

  const data = await res.json()
  const b64  = data?.image?.base64
  if (!b64) throw new Error(`Frame ${index} sem base64: ${JSON.stringify(data)}`)

  const buf  = Buffer.from(b64, 'base64')
  const path = join(TMP_DIR, `${String(index).padStart(2,'0')}-${frame.name}.png`)
  writeFileSync(path, buf)
  console.log(`  ✓ frame ${index} — ${frame.name}`)
  return path
}

async function main() {
  mkdirSync(TMP_DIR, { recursive: true })
  mkdirSync(OUT_DIR, { recursive: true })

  console.log(`\n🎨 Gerando ${FRAMES.length} frames da Cruella…\n`)

  const paths = []
  for (let i = 0; i < FRAMES.length; i++) {
    const path = await generateFrame(FRAMES[i], i)
    paths.push(path)
  }

  console.log(`\n🔧 Montando spritesheet…`)

  const { execSync } = await import('child_process')
  execSync(`node scripts/assemble-spritesheet.mjs "${OUT_FILE}" ${paths.map(p => `"${p}"`).join(' ')}`, {
    cwd: ROOT,
    stdio: 'inherit',
  })

  console.log(`\n✅ Spritesheet pronto: public/sprites/cruella.png`)
  console.log(`   ${FRAMES.length} frames × 32×32 px = ${FRAMES.length * 32}×32 px total`)
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1) })
