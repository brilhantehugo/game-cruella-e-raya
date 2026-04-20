export interface CompiledSprite {
  frameWidth: number
  frameHeight: number
  frames: (string | null)[][][]  // [frameIndex][row][col]
}

function compile(
  frameWidth: number,
  frameHeight: number,
  palette: Record<string, string | null>,
  rawFrames: string[][]
): CompiledSprite {
  return {
    frameWidth,
    frameHeight,
    frames: rawFrames.map(rawFrame =>
      rawFrame.map(rowStr =>
        rowStr.split('').map(ch => (ch in palette ? palette[ch] : null))
      )
    ),
  }
}

// ─── Raya (black/gray Pomeranian, yellow bandana) ─────────────────────────────
// 32×32px, 6 frames: idle, walk1, walk2, walk3, walk4, jump
// Palette: . transparent  B black  D dark-gray  G gray  L light-gray
//          Y yellow(bandana)  W white(eye)  A amber(eye)  P pink(nose)

const rP: Record<string, string | null> = {
  '.': null, 'B': '#000000', 'D': '#2b3050', 'G': '#5a6b8a',
  'L': '#8fa3be', 'W': '#ccd8e8', 'H': '#e8eef6', 'A': '#cc8800', 'P': '#bb4455',
}

// Rows 0-24: head, ears, juba (mane), body — same for all walk frames
const rBase: string[] = [
  '................................',  // r00 blank
  '...........BB....BB.............',  // r01 ear tips
  '..........BGDB..BGDB............',  // r02 ears
  '..........BGGB..BGGB............',  // r03 ears
  '..........BGGGBBGGGB............',  // r04 ears merge
  '.........BGGLLLLLGGB............',  // r05 head top
  '.........BGGLWALLGPB............',  // r06 eye(W,A) + nose(P)
  '.........BGGLLLLLLGB............',  // r07 face
  '..........BGGLLLGGB.............',  // r08 chin
  '..........BGGGGGGGB.............',  // r09 neck
  '.......WLGGDLLLLDGGLLW..........',  // r10 juba start
  '......HLGGDDLLLLDDGGLH..........',  // r11 juba
  '.....WLGGDDDLLLLDDGGGLLW........',  // r12 juba widest
  '.....HLGGDDLLLLLDDGGLLH.........',  // r13 juba
  '......WLGGGDLLLLDGGGLLW.........',  // r14 juba
  '.......WLGGGLLLLGGGLLW..........',  // r15 juba bottom
  '........WLGGLLLLGGLLW...........',  // r16 juba fades
  '..........BGGLLLGGGB............',  // r17 body top
  '..........BGGLLLLGGB............',  // r18 body
  '..........BGGGLLGGGB............',  // r19 body
  '.........BDGGGLLGGGB............',  // r20 body
  '.........BDGGGLLLGGB............',  // r21 body lower
  '.........BDGGGGGGGB.............',  // r22 body
  '..........BDGGGGGB..............',  // r23 belly
  '...........BDGGGGB..............',  // r24 belly bottom
]

// Leg rows (7 rows: 25-31) for each animation frame
const rLegs: Record<string, string[]> = {
  idle: [
    '.....BDDGBBBBBDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BBBB....BBBB...............',
    '................................',
    '................................',
  ],
  walk1: [
    '.....BDDGBBBBBDDGB..............',
    '...BDDGB.....BDDGB..............',
    '..BDDGB.......BDDGB.............',
    '.BDDGB.........BDDGB............',
    '.BBBB...........BBBB............',
    '................................',
    '................................',
  ],
  walk2: [
    '.....BDDGBBBBBDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BBBB....BBBB...............',
    '................................',
    '................................',
  ],
  walk3: [
    '.....BDDGBBBBBDDGB..............',
    '.......BDDGB.....BDDGB..........',
    '........BDDGB.....BDDGB.........',
    '.........BDDGB.....BDDGB........',
    '.........BBBB......BBBB.........',
    '................................',
    '................................',
  ],
  walk4: [
    '.....BDDGBBBBBDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BDDGB...BDDGB..............',
    '.....BBBB....BBBB...............',
    '................................',
    '................................',
  ],
  jump: [
    '................................',
    '....BDDGB.....BDDGB.............',
    '..BDDGB...........BDDGB.........',
    'BDDGB...............BDDGB.......',
    'BBB...................BBB.......',
    '................................',
    '................................',
  ],
}

export const RAYA_SPRITE = compile(32, 32, rP, [
  [...rBase, ...rLegs.idle],
  [...rBase, ...rLegs.walk1],
  [...rBase, ...rLegs.walk2],
  [...rBase, ...rLegs.walk3],
  [...rBase, ...rLegs.walk4],
  [...rBase, ...rLegs.jump],
])

// ─── Cruella (dark Pomeranian, pink bow) ──────────────────────────────────────
// 28×28px, 6 frames: idle, walk1-4, jump
// Palette: . transparent  B black  D very-dark-purple  G dark-purple  L mauve
//          K pink(bow)  W white(eye)  A amber(eye)  P pink(nose)

const cP: Record<string, string | null> = {
  '.': null, 'B': '#110811', 'D': '#2a1a2a', 'G': '#5a3a5a',
  'L': '#9a7a9a', 'K': '#ff69b4', 'W': '#f0f0f0', 'A': '#cc8800', 'P': '#bb4455',
}

// 28-char wide rows, rows 0-21: head, ears, face, bow, body
const cBase: string[] = [
  '............................',  // r00
  '.........BB....BB...........',  // r01 ear tips
  '........BGDB..BGDB..........',  // r02 ears
  '........BGGB..BGGB..........',  // r03 ears
  '........BGGGBBGGGB..........',  // r04 ears merge
  '........BGGLLLLLGGB.........',  // r05 head
  '........BGGLWALLGPB.........',  // r06 eye+nose
  '........BGGLLLLLGGB.........',  // r07 face
  '.........BGGGGGGGGB.........',  // r08 chin
  '.........BGKKKKGGGB.........',  // r09 bow
  '.........BGKKKKKGB..........',  // r10 bow center
  '..BBB....BGKKKKGB...........',  // r11 tail+bow
  '.BDDGB...BGGGGGB............',  // r12 tail
  '.BDDGB...BDGGGGGB...........',  // r13 tail+body
  '.BDDGB..BDGGGLLGB...........',  // r14 body chest
  '..BDDGBBDGGGLLLLGB..........',  // r15 body chest
  '...BDDGDGGGLLLLGB...........',  // r16 body
  '....BDDGGGGGGGGB............',  // r17 body
  '.....BDDGGGGGGGB............',  // r18 body
  '.....BDGGGGGGGGB............',  // r19 body
  '.....BDGGGGGGGB.............',  // r20 body
  '.....BDGGGGGGB..............',  // r21 body bottom
]

const cLegs: Record<string, string[]> = {
  idle: [
    '....BDDGBBBBBDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BBBB....BBBB............',
    '............................',
    '............................',
    '............................',
  ],
  walk1: [
    '....BDDGBBBBBDDGB...........',
    '..BDDGB.....BDDGB...........',
    '.BDDGB.......BDDGB..........',
    '.BBBB.........BBBB..........',
    '............................',
    '............................',
    '............................',
  ],
  walk2: [
    '....BDDGBBBBBDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BBBB....BBBB............',
    '............................',
    '............................',
    '............................',
  ],
  walk3: [
    '....BDDGBBBBBDDGB...........',
    '......BDDGB...BDDGB.........',
    '.......BDDGB...BDDGB........',
    '.......BBBB....BBBB.........',
    '............................',
    '............................',
    '............................',
  ],
  walk4: [
    '....BDDGBBBBBDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BDDGB...BDDGB...........',
    '....BBBB....BBBB............',
    '............................',
    '............................',
    '............................',
  ],
  jump: [
    '............................',
    '...BDDGB.....BDDGB..........',
    '.BDDGB...........BDDGB......',
    '.BBB...............BBB......',
    '............................',
    '............................',
    '............................',
  ],
}

export const CRUELLA_SPRITE = compile(28, 28, cP, [
  [...cBase, ...cLegs.idle],
  [...cBase, ...cLegs.walk1],
  [...cBase, ...cLegs.walk2],
  [...cBase, ...cLegs.walk3],
  [...cBase, ...cLegs.walk4],
  [...cBase, ...cLegs.jump],
])

// ─── Enemies (1 frame each) ───────────────────────────────────────────────────

// GatoMalencarado — gray cat, sitting, 28×28
const gP: Record<string, string | null> = {
  '.': null, 'B': '#222222', 'G': '#777777', 'L': '#bbbbbb',
  'W': '#f0f0f0', 'Y': '#ccaa00', 'P': '#ee6688',
}
export const GATO_SPRITE = compile(28, 28, gP, [[
  '....BBBB.......BBBB.........',  // r00 ears
  '...BGGGGB.....BGGGGB........',  // r01 ears
  '...BGGGGB.....BGGGGB........',  // r02 ears
  '...BGGGGGBBBBBGGGGGB........',  // r03 head
  '...BGGGLLLLLLLLGGGB.........',  // r04 face
  '...BGGGLYWYLYWYGGB..........',  // r05 eyes
  '...BGGGLLLLLLLLGGGB.........',  // r06 face
  '....BGGGLLLLLLGGGB..........',  // r07 face
  '....BGGGLLLLLLGGGB..........',  // r08 face
  '.....BGGGGGGGGGGB...........',  // r09 chin
  '.....BGGGGGGGGGGB...........',  // r10 neck
  '....BBBBBBBBBBBBBB..........',  // r11 body top
  '....BGGGGGGGGGGGGGB.........',  // r12 body
  '....BGGGLLLLLLLLGGB.........',  // r13 belly
  '....BGGGLLLLLLLLGGB.........',  // r14 belly
  '....BGGGLLLLLLLLGGB.........',  // r15 belly
  '....BGGGLLLLLLLLGGB.........',  // r16 belly
  '....BGGGGGGGGGGGGGB.........',  // r17 body
  '....BBBBBBBBBBBBBBB.........',  // r18 body bottom
  '..BBGGGGGGGGGGGBBB..........',  // r19 tail
  '..BGGGGGGGGGGGGGGB..........',  // r20 tail
  '..BGGGGGGGGGGGGGB...........',  // r21 tail curl
  '....BGGB.....BGGB...........',  // r22 front paws
  '....BGGB.....BGGB...........',  // r23 paws
  '....BBBB.....BBBB...........',  // r24 feet
  '............................',  // r25
  '............................',  // r26
  '............................',  // r27
]])

// PomboAgitado — fat pigeon, wings open, 28×24
const pP: Record<string, string | null> = {
  '.': null, 'B': '#222222', 'G': '#778899', 'L': '#aabbcc',
  'W': '#ffffff', 'R': '#cc3322', 'Y': '#ccaa00',
}
export const POMBO_SPRITE = compile(28, 24, pP, [[
  '...........BBBB.............',  // r00 head
  '..........BGGGB.............',  // r01 head
  '..........BGWRB.............',  // r02 eye+beak
  '..........BGGB..............',  // r03 head
  'BBBBB......BBB.......BBBBB..',  // r04 wing + body + wing
  'BGGGGGBB.BGGGB.BBGGGGGB.....',  // r05 wings spread
  'BGLLLGGGBBGGGBBBGGGLLLLGB...',  // r06 wings
  'BGLLLLGGGBGGGGBGGGLLLLGB....',  // r07 wings
  '.BGLLLLGGGGGGGGGGLLLLGB.....',  // r08 wings inner
  '..BGLLLGGGGGGGGGGLLLGB......',  // r09 wings fold
  '...BGLLLGGGGGGGGLLLGB.......',  // r10 wings fold
  '....BGLLGGGGGGGGLLGB........',  // r11
  '.....BGGGGGGGGGGGGB.........',  // r12 body
  '.....BGGGWWWWWWGGGB.........',  // r13 belly
  '.....BGGGWWWWWWGGGB.........',  // r14 belly
  '.....BGGGWWWWWWGGGB.........',  // r15 belly
  '.....BGGGGGGGGGGB...........',  // r16 body bottom
  '......BBBYYYYYBBB...........',  // r17 feet
  '......BYYB...BYYB...........',  // r18 feet
  '......BYYB...BYYB...........',  // r19 feet
  '......BBYB...BBYB...........',  // r20 toes
  '............................',  // r21
  '............................',  // r22
  '............................',  // r23
]])

// RatoDeCalcada — slim rat, long tail, 24×20
const ratoP: Record<string, string | null> = {
  '.': null, 'B': '#221100', 'G': '#774422', 'L': '#aa7744',
  'P': '#ffaacc', 'W': '#ffddcc', 'R': '#cc2200',
}
export const RATO_SPRITE = compile(24, 20, ratoP, [[
  '.................BBBB...',  // r00 head
  '................BGGGGB..',  // r01 head
  '...............BGGGWRLB.',  // r02 eye+nose
  '...............BGGGGGGB.',  // r03 head
  '....BBB........BGGGGGB..',  // r04 tail + snout
  '...BPPPPB.....BGGGGB....',  // r05 tail
  '..BPPPPPPB..BGGGGB......',  // r06 tail
  '.BPPPPPPPBBGGGGB........',  // r07 tail
  '.BPPPPPPPGGGGGB.........',  // r08 tail+body
  '.BPPPPPPGGGGGB..........',  // r09 body
  '..BPPPPPGGGGGB..........',  // r10 body
  '..BPPPPGGLLLGGB.........',  // r11 belly
  '..BPPPGGLLLLLGB.........',  // r12 belly
  '..BPPGGGGGGGGB..........',  // r13 body
  '..BPGGGGGGGB............',  // r14 body bottom
  '...BBBBBBBB.............',  // r15 legs base
  '...BGGB.BGGB............',  // r16 legs
  '...BGGB.BGGB............',  // r17 legs
  '...BBBB.BBBB............',  // r18 feet
  '........................',  // r19
]])

// DonoNervoso — tall human silhouette, suit, 24×48
const donoP: Record<string, string | null> = {
  '.': null, 'B': '#111133', 'D': '#223366', 'G': '#334499',
  'L': '#ffddcc', 'W': '#ffffff', 'Y': '#ffcc00',
}
export const DONO_SPRITE = compile(24, 48, donoP, [[
  '.........BBBB...........',  // r00 head
  '........BLLLLB..........',  // r01 head
  '........BLLLLB..........',  // r02 head
  '........BLLLLB..........',  // r03 head
  '.........BBBB...........',  // r04 chin
  '........BDDDDDB.........',  // r05 shirt collar
  '.......BDGGGGGGGB.......',  // r06 shoulders
  '.......BDGGWWWGGDB......',  // r07 chest
  '.......BDGGWWWGGDB......',  // r08 chest
  '.......BDGGGGGGGGB......',  // r09 chest
  '......BDGGGGGGGGGDB.....',  // r10 jacket
  '......BDGGGGGGGGGDB.....',  // r11 jacket
  '......BDGGGGGGGGGDB.....',  // r12 jacket
  '.....BDGGGGGGGGGGGGB....',  // r13 arms out
  '....BDGGGGGGGGGGGGGDB...',  // r14 arms wider
  '...BDGGGGGGGGGGGGGGGGB..',  // r15 arms spread
  '..BDGGGLLLLLLLLLGGGGGDB.',  // r16 hands
  '..BBBBLLLLLLLLLLBBBBBBB.',  // r17 hands
  '......BDGGGGGGGDB.......',  // r18 waist
  '......BDGGGGGGGDB.......',  // r19 waist
  '......BDGGGGGGGDB.......',  // r20 hips
  '......BDGGGGGGGDB.......',  // r21 hips
  '.......BGGGBGGGB........',  // r22 legs split
  '.......BGGGBGGGB........',  // r23 legs
  '.......BGGGBGGGB........',  // r24 legs
  '.......BGGGBGGGB........',  // r25 legs
  '.......BGGGBGGGB........',  // r26 legs
  '.......BGGGBGGGB........',  // r27 legs
  '.......BGGGBGGGB........',  // r28 legs
  '.......BGGGBGGGB........',  // r29 legs
  '.......BGGGGGGB.........',  // r30 legs merge
  '.......BGGGGGGB.........',  // r31 legs
  '.......BBBBBBBB.........',  // r32 feet
  '........................',  // r33
  '........................',  // r34
  '........................',  // r35
  '........................',  // r36
  '........................',  // r37
  '........................',  // r38
  '........................',  // r39
  '........................',  // r40
  '........................',  // r41
  '........................',  // r42
  '........................',  // r43
  '........................',  // r44
  '........................',  // r45
  '........................',  // r46
  '........................',  // r47
]])

// SeuBigodes — enormous dark cat boss, 48×48
const bigP: Record<string, string | null> = {
  '.': null, 'B': '#111111', 'D': '#1a1a1a', 'G': '#2e2e2e',
  'L': '#555555', 'W': '#f0f0f0', 'Y': '#cc9900', 'P': '#ee3355',
  'R': '#ff0000',
}
export const BIGODES_SPRITE = compile(48, 48, bigP, [[
  '................................................',  // r00
  '......BBBB.......................BBBB...........',  // r01 ears
  '.....BGGGB.......................BGGGB..........',  // r02 ears
  '.....BGGGB.......................BGGGB..........',  // r03 ears
  '.....BGGGBBBBBBBBBBBBBBBBBBBBBBBGGGB............',  // r04 head
  '.....BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB............',  // r05 head
  '.....BGGGGGLLLLLLLLLLLLLLLLLLGGGGGB.............',  // r06 face
  '.....BGGGGLLLLLLLLLLLLLLLLLLLGGGGB..............',  // r07 face
  '....BGGGGGLLLWYLLYWYLLYWYLLLLGGGGGB.............',  // r08 eyes
  '....BGGGGGLLLLLLLLLLLLLLLLLLGGGGGGB.............',  // r09 face
  '....BGGGGGLLLLLLLLLLLLLLLLLGGGGGB...............',  // r10 face
  '....BGGGGGGGGLLLLLLLLLLGGGGGGGGGB...............',  // r11 muzzle
  '...BGGGGGGGGGLLLLPLLLLGGGGGGGGGB................',  // r12 nose
  '...BGGGGGGGGGLLLLLLLLLLGGGGGGGGGB...............',  // r13 muzzle
  'BBBBBBBGGGGGGGGLLLLLLGGGGGGGBBBBBB..............',  // r14 whiskers
  'BLLLLLLBGGGGGGGGGGGGGGGGGGGGBLLLLLB.............',  // r15 whiskers
  '.BLLLLLLBGGGGGGGGGGGGGGGGGGGBLLLLB..............',  // r16 whiskers
  '..BLLLLLBBGGGGGGGGGGGGGGGGGBBLLLLB..............',  // r17 whiskers
  '....BBBBBGGGGGGGGGGGGGGGGGGGBBBBB...............',  // r18 neck
  '....BGGGGGGGGGGGGGGGGGGGGGGGGGGB................',  // r19 neck
  '....BGGGGGGGGGGGGGGGGGGGGGGGGGGB................',  // r20 neck
  '...BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............',  // r21 body top
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB.............',  // r22 body
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB.............',  // r23 body
  '...BGGGGGLLLLLLLLLLLLLLLLLLLLGGGGGB.............',  // r24 belly
  '...BGGGGGLLLLLLLLLLLLLLLLLLLLGGGGGB.............',  // r25 belly
  '...BGGGGGLLLLLLLLLLLLLLLLLLLLGGGGGB.............',  // r26 belly
  '...BGGGGGLLLLLLLLLLLLLLLLLLLLGGGGGB.............',  // r27 belly
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB.............',  // r28 body
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB.............',  // r29 body
  '...BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB.............',  // r30 body
  '....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............',  // r31 body bottom
  '....BGGGB..BGGGB..BGGGB..BGGGB..................',  // r32 legs
  '....BGGGB..BGGGB..BGGGB..BGGGB..................',  // r33 legs
  '....BGGGB..BGGGB..BGGGB..BGGGB..................',  // r34 legs
  '....BGGGB..BGGGB..BGGGB..BGGGB..................',  // r35 legs
  '....BGGGB..BGGGB..BGGGB..BGGGB..................',  // r36 legs
  '....BBBBB..BBBBB..BBBBB..BBBBB..................',  // r37 paws
  '................................................',  // r38
  '................................................',  // r39
  '................................................',  // r40
  '................................................',  // r41
  '................................................',  // r42
  '................................................',  // r43
  '................................................',  // r44
  '................................................',  // r45
  '................................................',  // r46
  '................................................',  // r47
]])


// ─── Aspirador — textura gerada via Graphics em BootScene (não usa CompiledSprite)
// Mantido aqui apenas para referência histórica.
const aspP: Record<string, string | null> = {
  '.': null, 'B': '#111111', 'D': '#2a2a2a', 'G': '#555555',
  'L': '#888888', 'R': '#ff2222', 'W': '#ffffff', 'C': '#22ccff', 'Y': '#ffdd00',
}
const _ASPIRADOR_SPRITE_UNUSED = compile(28, 28, aspP, [[
  '..........BBBBBBBB..........',  // r0
  '.......BBDDGGGGGGGDBB.......',  // r1
  '.....BBDGLLLLLLLLLLGDBB.....',  // r2
  '....BDGLLLLLLLLLLLLLGDB.....',  // r3
  '...BDGLLLLLLLLLLLLLLLGDB....',  // r4
  '..BDGLLL..LLLLLLLLL..LLLGDB.',  // r5
  '..BGLLL..RLLLLLLLLRL..LLLGB.',  // r6
  '.BDGLLL.RRWLLLLLLWRRL.LLLGDB',  // r7
  '.BGLLL.RRRWWLLLWWRRRLLLLGB.',   // r8
  'BDGLLL.RRRWWCCCWWRRRLLLGDB.',   // r9
  'BDGLL..RRWWCCCCWWRR..LLLGDB',   // r10
  'BGLLL..RWWCCCCCWWR..LLLLGB.',   // r11
  'BGLL...BWWCCCCCWWB...LLLGB.',   // r12
  'BGLL...BWWCCCCCWWB...LLLGB.',   // r13
  'BGLL..RBBWWCCCCWWBBR.LLLGB.',   // r14
  'BDGLL..RWWWCCCWWWR..LLLGDB.',   // r15
  'BDGLL...BWWCCWWB...LLLLGDB.',   // r16
  '.BGLL...YYYYYYYYYYY.LLLGB..',   // r17 yellow bumper
  '.BDGLLL.YYYYYYYYYYY.LLLGDB.',   // r18
  '..BGLLL..YYYYYYYYY..LLLGB..',   // r19
  '..BDGLLL...........LLLGDB..',   // r20
  '...BDGLLLLLLLLLLLLLLLGDB...',   // r21
  '....BDGLLLLLLLLLLLLLGDB....',   // r22
  '.....BDDGLLLLLLLLLGDDB.....',   // r23
  '.......BBDDDGGGGGDDBB......',   // r24
  '..........BBBBBBBBB........',   // r25
  '............................',   // r26
  '............................',   // r27
]])
