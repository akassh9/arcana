// Components, step 3: the thread and the lights (thread, thread glyph and node, halo, hold ring, glint, moon label).
//   node design/figma/bridge/run.mjs design/figma/build/pages/components-lib.js design/figma/build/pages/components-3.js
const L = S.lib, CL = S.cl
const MINE = ['Components · Thread & light']
const sec = await CL.start(MINE)
const BW = 2400, HALF = (BW - 144 - 24) / 2

const b = L.board({ name: 'Components · Thread & light', kicker: 'PARTS · THE SKY AND THE TABLE', title: 'Thread & light', w: BW,
  lead: 'The gold that moves: the thread of light under the spread and its nodes, the warm halo behind each card, the ring the question is held in, the glints of the near sky, and the moon’s label. Shown over the real sky, which they need.' })
const pair = (a, c) => { const r = L.row([a, c], { gap: 24, align: 'MIN', name: 'Pair', fillW: true }); a.layoutSizingVertical = 'FILL'; c.layoutSizingVertical = 'FILL'; return r }

// ---- Thread: every state, one per row, with its label to the left
const TS = [['draw', 'Drawing'], ['reading', 'Reading'], ['reading-lit', 'Reading · card lit'], ['woven', 'Woven'], ['running', 'Running'], ['kept', 'Kept']]
const WHAT = {
  draw: { 1: 'the card landing, its wings half grown; base 30 %', 3: 'first card down, the second landing, the rest outlined; base 30 %' },
  reading: 'every card down; base 40 %', 'reading-lit': 'the cursor on a card: its node grows to 5.5 with a 26 pt glow', woven: 'the thread found; base 62 %',
  running: 'the light running the thread, 40 % of the way', kept: 'a kept reading: laid whole, nodes 95 %, no light',
}
const NUM = { 1: 'One card', 3: 'Three cards', 5: 'Five cards' }
const threads = []
for (const n of [1, 3, 5]) for (const [id, st] of TS) {
  if (n === 1 && id === 'running') continue
  const c = await CL.comp('ui/thread/thread-' + n + '-' + id + '.svg', 'Cards=' + n + ', State=' + st)
  const w = WHAT[id]; threads.push({ c, n, label: NUM[n] + ' · ' + st.toLowerCase(), sub: typeof w === 'string' ? w : w[n] || w[3] })
}
const tHold = L.frame({ name: 'Thread · masters' })
const tSet = figma.combineAsVariants(threads.map(t => t.c), tHold)
tSet.name = 'Thread'; tSet.fills = []
{
  let y = 8, last = 0
  for (const t of threads) { if (last && t.n !== last) y += 28; t.c.x = 0; t.c.y = y; y += 72 + 6; last = t.n }
  tSet.resizeWithoutConstraints(1260, y + 2)
  const LW = 300
  tSet.x = LW; tSet.y = 0
  tHold.resize(LW + 1260, tSet.height)
  for (const t of threads) {
    const a = L.text(t.label, 'smallStrong', { w: LW - 24 }), s = L.text(t.sub, 'caption', { w: LW - 24 })
    tHold.appendChild(a); tHold.appendChild(s); a.x = 0; a.y = t.c.y + 36 - (20 + s.height) / 2; s.x = 0; s.y = a.y + 20
  }
}
CL.doc(tSet, 'The line of light under the spread, laid card by card: a 1 pt gold-ink line over a 5 pt goldLit underlay between the cards (wings fading out either side of a lone card), and a diamond node under each position. Frame 1260 × 72, centred on the thread (its canvas is the stage’s width × 40 pt; glows up to 26 pt, the running light 34 pt, spill past it). Base opacity: drawing 30 %, reading 40 %, woven 62 %. Kept readings use KeptThread (Keeping.swift:743-796).', 'Sources/Arcana/RootView.swift:506-633')
L.add(b, await CL.card({ name: 'Thread', stack: true, infoW: 620,
  what: 'The line of light under the spread, laid card by card: a gold line between the cards, wings fading out either side of a lone card, and a diamond node under each position. It brightens when the thread (the reading’s summary) is found, and a light runs along it.',
  stage: [CL.masters(tHold, 'Masters · 1× · frame 1260 × 72, the stage’s width')],
  specs: [
    ['Variants', 'Cards = 1 · 3 · 5  ×  State = Drawing · Reading · Reading · card lit · Woven · Running (3 and 5) · Kept'],
    ['Line', '1 pt gold ink over a 5 pt goldLit underlay; base opacity drawing 30 %, reading 40 %, woven 62 %', 'RootView.swift:506-633'],
    ['Frame', '1260 × 72, centred on the thread; its canvas is the stage’s width × 40 pt and its glows spill past it (up to 26 pt, the running light 34 pt)'],
    ['Motion', 'a segment grows over 0.9 s (smoothstep) as its card lands; the light crosses in 1.8 s after the reading is spoken, then every 13 s; while the thread is being found it swings on a ≈3.3 s loop', 'RootView.swift:533-536, 591-625; Game.swift:529-547'],
    ['Kept', 'a kept reading’s thread is laid whole, every node 95 %, no light running', 'Keeping.swift:743-796'],
  ],
  tags: [['claude', 'Claude: built 23 Sep, kept at first light'], 'shipped'] }))

// ---- Thread glyph + Thread node
const tg = [
  { c: await CL.comp('ui/diamonds/thread-glyph-8.svg', 'Size=8'), label: 'Size 8', sub: 'before FIND THE THREAD' },
  { c: await CL.comp('ui/diamonds/thread-glyph-7.svg', 'Size=7'), label: 'Size 7', sub: 'before LETTING THE CARDS SETTLE' },
]
const tgSet = CL.grid(tg, 'Thread glyph', { labels: false, pad: 12, gap: 20,
  desc: 'A diamond on a vertical hairline, left of the invitation under the verse: size 8 before ‘find the thread’, size 7 while ‘letting the cards settle’. Diamond gold ink 90 %, stem 1 × 18 gold ink 40 %. 18 × 18 frame, 11 pt (size 8) or 12 pt (size 7) before the caps.', src: 'Sources/Arcana/RootView.swift:1365-1379' })
const tgCard = await CL.card({ name: 'Thread glyph', w: HALF,
  what: 'A diamond on a vertical hairline, left of the invitation under the verse, and a little smaller while the thread is being found.',
  stage: [CL.previews(tg, { k: 5, gap: 40, colW: 200 }), CL.masters(tgSet.holder)],
  specs: [
    ['Variants', 'Size = 8 · 7'],
    ['Size', '18 × 18 pt frame; 11 pt (8) or 12 pt (7) before the caps', 'RootView.swift:1365-1379'],
    ['Ink', 'diamond gold ink 90 %; stem 1 × 18 gold ink 40 %'],
    ['Words', '‘find the thread’ (9.5, tracking 3.8) and ‘letting the cards settle’ (9.5, tracking 3.2)', 'RootView.swift:1297-1313'],
  ],
  tags: ['shipped'] })
const NS = [['empty', 'Empty', 'outline 0.8 pt, gold ink 40 %'], ['growing', 'Landing', 'gold ink 65 %, glow r 7 at 30 %'], ['', 'Laid', 'gold ink 95 %, glow r 14'], ['lit', 'Lit', 'half-diagonal 5.5, glow r 26']]
const nodes = []
for (const [f, st, sub] of NS) nodes.push({ c: await CL.comp('ui/diamonds/thread-node' + (f ? '-' + f : '') + '.svg', 'State=' + st), label: st, sub })
const nSet = CL.grid(nodes, 'Thread node', { labels: false, pad: 8, gap: 12,
  desc: 'A node on the thread under each card position: a diamond of half-diagonal 4.2 pt (5.5 when lit), with its own gold glow (a radial gradient, normal blend). Empty: 0.8 pt gold-ink outline at 40 %, mitred. Landing (half-way through its 0.9 s growth): gold ink 65 %, glow r 7 at 30 %. Laid: gold ink 95 %, glow goldLit 60 % → 0 over r 14. Lit (the cursor on its card): half-diagonal 5.5, glow r 26. 60 × 60 frame centred on the node.', src: 'Sources/Arcana/RootView.swift:568-590' })
const nCard = await CL.card({ name: 'Thread node', w: HALF,
  what: 'A node on the thread under each card position: a diamond with its own gold glow. It is drawn as an outline until its card lands, then grows in.',
  stage: [CL.previews(nodes, { k: 2, gap: 20, colW: 120 }), CL.masters(nSet.holder)],
  specs: [
    ['Variants', 'State = Empty · Landing · Laid · Lit'],
    ['Size', 'diamond half-diagonal 4.2 pt (5.5 lit); 60 × 60 frame centred on the node', 'RootView.swift:568-590'],
    ['Glow', 'a radial goldLit gradient, normal blend: r 7 landing, 14 laid, 26 lit'],
    ['Motion', 'grows over 0.9 s (smoothstep) as its card lands', 'RootView.swift:533-536'],
    ['Kept', 'always laid, gold ink 95 %', 'Keeping.swift:743-796'],
  ],
  tags: ['shipped'] })
L.add(b, pair(tgCard, nCard))

// ---- Halo (Screen blend)
const HS = [['3-draw', 'Cards=3, State=Drawing', 'Three · drawing', 'empty slot · 0.112'], ['3-rest', 'Cards=3, State=Rest', 'Three · rest', 'card laid · 0.336'],
  ['3-read', 'Cards=3, State=Read', 'Three · read', 'cursor on the card · 0.644'], ['3-flare', 'Cards=3, State=Flare', 'Three · flare', 'its line spoken · 0.966'],
  ['1-rest', 'Cards=1, State=Rest', 'One card · rest', '529 × 612 · 0.336'], ['5-rest', 'Cards=5, State=Rest', 'Five · rest', 'same size as three · 0.336']]
const halos = []
for (const [f, name, label, sub] of HS) {
  const c = await CL.comp('ui/halo/halo-' + f + '.svg', name)
  for (const k of c.findAll(x => x.type === 'ELLIPSE' || x.type === 'VECTOR')) k.blendMode = 'SCREEN'
  halos.push({ c, label, sub })
}
// row 1: at rest, by spread (one, three, five); row 2: three cards through the other states
const hSet = CL.grid(halos, 'Halo', { rows: [[halos[4], halos[1], halos[5]], [halos[0], halos[2], halos[3]]], pad: 24, gap: 48, rowGap: 32, valign: 'bottom',
  desc: 'The warm light behind each card on the table: an ellipse 2.6 slot widths by 1.7 slot heights, filled with a round goldLit gradient that ends at 0.78 slot heights (so the ellipse’s sides cut it). Blend Screen. Layer opacity = min(1, 1.4 × strength): drawing 0.112, rest 0.336, read 0.644, flare 0.966; × (1 − hush) as the room goes quiet. 529 × 612 (one card), 378 × 437 (three or five) at the default stage; centre on the slot.', src: 'Sources/Arcana/RootView.swift:467-500' })
L.add(b, await CL.card({ name: 'Halo', stack: true, infoW: 620,
  what: 'The warm light behind each card on the table. It rises when a card lands, brightens under the cursor and flares as the card’s line is spoken. It only works in Screen blend over the sky.',
  bg: 'blue', align: 'CENTER', stage: [CL.masters(hSet.holder, 'Masters · 1× · blend Screen, over sky blue #CCDBF5 as in the reference render (on the pale sky they all but vanish)')],
  specs: [
    ['Variants', 'Cards = 1 · 3 · 5  ×  State = Drawing · Rest · Read · Flare (the one- and five-card sets need only rest; other states are the same opacities)'],
    ['Shape', 'an ellipse 2.6 slot widths × 1.7 slot heights, a round goldLit gradient ending at 0.78 slot heights', 'RootView.swift:467-500'],
    ['Opacity', 'min(1, 1.4 × strength): drawing 0.112, rest 0.336, read 0.644, flare 0.966; × (1 − hush) as the room goes quiet'],
    ['Motion', 'flare: 0.3 s up (ease-out), holds 0.35 s, 1.6 s down (ease-in-out)', 'Game.swift:551-559'],
    ['Blend', 'Screen, set on each halo layer here (SVG can’t carry it)'],
  ],
  tags: ['shipped'] }))

// ---- Hold ring
const RS = [['0', '0 %'], ['0.25', '25 %'], ['0.5', '50 %'], ['0.75', '75 %'], ['1', '100 %']]
const rings = []
for (const [f, pct] of RS) rings.push({ c: await CL.comp('sky/near/ring-vector-charge-' + f + '.svg', 'Charge=' + pct), label: 'Charge ' + pct })
const rSet = CL.grid(rings, 'Hold ring', { pad: 16, gap: 24,
  desc: 'The ring the question is held in, around the deck: an outer hairline at 1.2 R and the ring at R (117.48 pt at 1260 × 860; 89.11 at 940 × 660), both gold ink; the charge arc fills clockwise from twelve o’clock: 14 pt and 6 pt goldLit glows under a 1.8 pt gold-ink core, round caps, a glowing spark at its head. Breath 0.5. Drawn by Metal in the app; this vector matches the render to 0.01–0.04 of 255.', src: 'Sources/Arcana/Chamber.swift:530-548' })
L.add(b, await CL.card({ name: 'Hold ring', stack: true, infoW: 620,
  what: 'The ring the question is held in, around the deck. Holding space (or the pointer) fills its arc clockwise from twelve; letting go drains it twice as fast. At full charge the question is asked, the cards are cut and the ring leaves.',
  stage: [CL.masters(rSet.holder, 'Masters · 1× · 360 × 360, centred on the deck')],
  specs: [
    ['Variants', 'Charge = 0 · 25 · 50 · 75 · 100 %'],
    ['Geometry', 'ring at R = 117.48 pt (89.11 at the minimum window), outer hairline at 1.2 R; centre on the deck (630, 662.7 in a 1260 × 860 window)', 'Game.swift:885-891'],
    ['Arc', '14 pt and 6 pt goldLit glows under a 1.8 pt gold-ink core, round caps, a spark at its head', 'Chamber.swift:530-548'],
    ['Motion', 'fills over 3.2 s held (0.8 s with Reduce Motion), drains at 2×; breathes on the 10 s breath (radius +2 %, opacity +14 %); after the cut it holds ≈0.53 s, then fades out by 1.6 s', 'Game.swift:36-37, 201, 232; Chamber.swift:40-41, 452'],
    ['Drawn by', 'Metal in the app; rebuilt here as vectors from its stroke specs'],
  ],
  tags: [['claude', 'Claude: built 23 Sep, kept at first light'], 'shipped'] }))

// ---- Glint + Moon label
const glints = []
for (const s of [3, 5, 7]) glints.push({ c: await CL.comp('sky/near/glint-vector-size-' + s + '.svg', 'Size=' + s), label: 'Size ' + s })
const gSet = CL.grid(glints, 'Glint', { labels: false, pad: 8, gap: 12,
  desc: 'A glint catching the light: four fine arms of gold ink at 44 % thinning from 1 pt at the heart to nothing and fading as (1 − s)², the upright 8 pt each way at size 5, the level ones 62 % as long, over a 5 pt goldLit glow at 56 %. Sizes 3–7, 32 × 32 frame, centred. At its height (tw 1, charge 0). Scale the arm groups for the twinkle.', src: 'Sources/Arcana/Chamber.swift:503-517' })
const frames = []
for (let i = 0; i < 9; i++) frames.push(await L.img('sky/near/glint-twinkle-0' + i + '@16x.png', { scale: 16 / 1.5, name: 'Twinkle ' + (i + 1) }))
const twinkle = L.col([CL.cap('The twinkle, nine frames (Metal render ×1.5)'), L.row(frames, { gap: 6, name: 'Frames' })], { gap: 10, name: 'Twinkle' })
const gCard = await CL.card({ name: 'Glint', w: HALF,
  what: 'A glint of the near sky catching the light: four fine arms that thin to nothing, the upright one longest, over a soft glow. The Star answers by keeping them lit.',
  stage: [CL.previews(glints, { k: 5, gap: 24 }), twinkle, CL.masters(gSet.holder)],
  specs: [
    ['Variants', 'Size = 3 · 5 · 7'],
    ['Arms', 'gold ink 44 %, 1 pt at the heart to nothing, fading as (1 − s)²; upright 1.6 × size each way, level 62 % as long', 'SkyRenderer.swift:154-160'],
    ['Glow', 'a 5 pt goldLit glow at 56 %', 'SkyRenderer.swift:90-94'],
    ['Twinkle', 'brightness tw⁶ × 0.8 (× (0.8 + 0.2 × charge)), tw = sin(t × rate + phase); arms × (0.6 + 0.4 tw)', 'Chamber.swift:509-516'],
    ['Drawn by', 'Metal; this vector matches it to 0.03 of 255'],
  ],
  tags: [['akash', 'Akash chose fading glints'], ['lesson', 'Equal square arms read as plus signs'], 'shipped'] })

const ml = []
for (const [st, word, v, sub] of [['Tonight', 'waning gibbous', 'ink/text-40', 'tonight’s phase · text 40 %'], ['Door open', 'september 18', 'ink/text-55', 'the night it was asked · text 55 %']]) {
  const c = figma.createComponent(); c.name = 'State=' + st; c.fills = []
  c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'
  c.appendChild(await CL.type(word, 'Caps/Moon', v, { name: 'Label' }))
  ml.push({ c, label: st, sub })
}
const mSet = CL.grid(ml, 'Moon label', { labels: false, pad: 12, gap: 24,
  desc: 'Under the moon, in Caps/Moon (Didot 8, tracking 3.6, capitals), centred 36 pt below the moon’s centre. Tonight: the phase’s name, text 40 %, fading with the room while a question is held (1 − 0.9 × charge). Door open: the night the reading was asked (‘september 18’; with the year in another year), text 55 %, cross-fading 0.6 s between nights. Native type: set the words, don’t place a picture.', src: 'Sources/Arcana/RootView.swift:737-742' })
const mCard = await CL.card({ name: 'Moon label', w: HALF,
  what: 'Under the moon, tonight’s phase in small tracked capitals; while the moon’s door is open, the night the reading was asked.',
  stage: [CL.previews([ml[0]], { k: 3 }), await CL.render('sky/moon/moon-label-tonight@8x.png', 'App render ×3 · tonight', { scale: 8 / 3 }),
    CL.previews([ml[1]], { k: 3 }), await CL.render('sky/moon/moon-label-kept-night-example@8x.png', 'App render ×3 · door open', { scale: 8 / 3 }),
    CL.masters(mSet.holder)], gap: 20,
  specs: [
    ['Variants', 'State = Tonight · Door open'],
    ['Type', 'Caps/Moon: Didot 8 pt, tracking 3.6, capitals; centred 36 pt below the moon’s centre', 'RootView.swift:737-742'],
    ['Words', 'one of eight phase names (‘new moon’ … ‘waning crescent’); open, the date, with the year only in another year', 'Moon.swift:35-46; Keeping.swift:1013-1045'],
    ['Ink', 'tonight text 40 %, fading with the room as a question is held (1 − 0.9 × charge); door open text 55 %'],
    ['Motion', 'cross-fades 0.6 s ease-in-out between nights', 'Keeping.swift:1036-1039'],
  ],
  tags: [['claude', 'Claude: the date-only label'], 'shipped'] })
L.add(b, pair(gCard, mCard))

sec.appendChild(b)
await CL.finish(sec)
return { bound: CL.bound, snap: await L.snap(b, 'pages/components/components-thread-light.png', { scale: 0.3 }) }
