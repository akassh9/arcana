// Chapter: Ink, gold & materials, step 1 of 2 (header, the pen, gold leaf, gold cooling to ink).
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-lib.js design/figma/build/pages/ink-gold-materials-1.js
// Clears the chapter: always run ink-gold-materials-2.js after it.
const L = S.lib, F = S.fa
const sec = await L.chapter('Ink, gold & materials')
const W = 1600, CW = 1456, PAPER = '#F3EDE0'
const svgOn = async (path, w, o = {}) => { const n = await L.svg(path, { w }); n.fills = []; n.name = o.name || n.name; return n }
const paperCell = (kids, w, h, o = {}) => L.frame(Object.assign({ name: 'Paper', dir: 'v', w, h, fill: PAPER, r: 10, align: 'CENTER', justify: 'CENTER', stroke: '#000000', strokeA: 0.05 }, o, { kids }))

// ---- 1. Header -----------------------------------------------------------------------------------
const head = L.board({ name: 'Ink, gold & materials · Header', kicker: 'FOUNDATIONS', title: 'Ink, gold & materials', w: W, leadW: 1100,
  lead: 'Everything in Arcana is drawn by one hand: a seeded pen that bows every stroke. Gold is laid wet and cools into ink. The cards are heavy cotton stock, printed or pressed. Glows are gold light; shadows are warm.' })
L.add(head, F.intro(['The pen', 'Gold leaf', 'Gold cooling to ink', 'Card materials', 'Glow & shadow']))
L.add(head, L.row([
  L.note({ w: 346, tags: ['shipped'], title: 'Kept through the redesign', body: 'The hand-drawn pen and Didot are the craft identity. Both came through the change from the dark build to first light unchanged.' }),
  L.note({ w: 346, tags: ['claude'], title: 'Drawn, not symbols', body: 'The app’s few icons (the old key, the bowl, the chevrons, the key signs) are drawn by the same pen. There are no SF Symbols in the room.', source: 'Legend.swift:335-377; Keeping.swift:928-968' }),
  L.note({ w: 346, tags: ['claude'], title: 'Gold cools to ink', body: 'Cards write themselves in gold that cools to ink. Built in the dark version and kept when Akash approved the direction.', source: 'CardImages.swift:125-172' }),
  L.note({ w: 346, tags: ['panel'], title: 'The question in gold', body: 'Your typed question is laid in gold, cools, and is given to the deck as dust: Question in Gold, the design panel’s runner-up, approved by Akash.', source: 'Quill.swift:214-257' }),
], { gap: 24, name: 'Header notes', align: 'MIN' }))
L.add(sec, head)

// ---- 2. The pen ------------------------------------------------------------------------------------
const pen = L.board({ name: 'Ink, gold & materials · The pen', kicker: 'INK', title: 'The pen', titleStyle: 'h1', w: W, leadW: 1120,
  lead: 'One pen draws the 78 cards, their frame and back, the engraved wheel and every small glyph. Straight strokes bow into faint C and S curves, circles wander about a point in radius, polygons keep sharp corners but never true edges. There is no pressure and no taper: one width per stroke, round caps and joins.' })
// the primitives, each from the app's own code path, with its default width and wobble (amp)
const PRIMS = [
  ['line', '1.5 pt · amp 1.1'], ['ring', '1.5 pt · amp 1.3 · 22 points'], ['ring-squashed', 'the ring, squashed in y'], ['dot', 'leaf · amp 0.25 · keyline'], ['dot-ink', 'ink · amp 0.25'], ['poly', '1.5 pt · amp 1.1'],
  ['poly-open', '1.5 pt · amp 1.1 · open'], ['fillPoly', 'leaf · amp 0.8 · keyline'], ['fillPoly-accent', 'oxblood · amp 0.8'], ['smooth', '1.5 pt · no wobble'], ['smooth-open', 'no wobble · open'], ['fillSmooth', 'leaf · no wobble'],
  ['fillChord', 'leaf · no wobble'], ['fillSmoothPts', 'paper · no wobble'], ['diamond', '1.1 pt · amp 1 · oxblood'], ['fillDiamond', 'oxblood · amp 0.6'], ['fillDiamond-gold', 'leaf · amp 0.6 · keyline'], ['rays', '1.5 pt · amp 0.9 · ends ±4%'],
  ['hatch', '0.75 pt · gap 5 · −34.4°'], ['ticks', '0.8 pt · amp 0.4'], ['ripples', '1.1 pt · 4 lines, gap 9'], ['crescent', 'leaf · amp 0.15'], ['eye', 'leaf almond · ink pupil'],
]
const cells = []
for (const [id, spec] of PRIMS) cells.push(L.col([paperCell([await svgOn(`glyphs/pen/pen-${id}.svg`, 120, { name: 'Pen · ' + id })], 160, 136),
  L.text(id, 'smallStrong', { w: 160 }), F.mono(spec, { w: 160, size: 10, lh: 14 })], { gap: 4, w: 160, name: 'Primitive · ' + id }))
const grid = L.frame({ name: 'The pen’s primitives', dir: 'h', w: CW, gap: 24, wrap: true, wrapGap: 24, kids: cells })
grid.layoutSizingVertical = 'HUG'
L.add(pen, L.section('Its vocabulary: 23 primitives', { style: 'h3', lead: 'Each drawn by the app’s own code path on its own seeded pen, at its default settings. amp is the wobble: how far, in points, the pen may push a point or a control off true.', leadW: 1100 }))
L.add(pen, grid)
L.add(pen, L.source('Ink.swift:77-325 (Pen); glyphs/pen/pen-*.svg; the whole set as one sheet: glyphs/pen/pen-primitives-sheet.svg'))
// ladders
const wob = [['0', 'smooth, fillSmooth, fillChord (Catmull-Rom, no jitter)'], ['0.03–0.12', 'the keys page’s signs'], ['0.15', 'crescent'], ['0.15–0.22', 'the old key glyph'], ['0.25', 'dot'], ['0.4', 'ticks'], ['0.5', 'hatch'], ['0.6', 'fillDiamond'], ['0.8', 'fillPoly, eye'], ['0.9', 'rays'], ['1.0', 'diamond'], ['1.1', 'line, poly (the default)'], ['1.3', 'ring']]
const wobble = L.col([L.text('The wobble ladder', 'h3'), L.text('Default amp by primitive, from the steadiest to the loosest. The small UI glyphs use the smallest amps.', 'small', { w: 420 }),
  L.col(wob.map(([a, w]) => L.row([L.text(a, 'codeStrong', { w: 90, size: 12, lh: 18 }), L.text(w, 'small', { w: 320 })], { gap: 10, name: 'amp ' + a })), { gap: 2 }),
  L.source('Ink.swift:85-325; Legend.swift:254-377', { w: 420 })], { gap: 10, w: 420, name: 'Wobble ladder' })
L.add(pen, L.section('Weight, seed and wobble', { style: 'h3' }))
L.add(pen, L.row([
  L.col([paperCell([await svgOn('glyphs/pen/pen-stroke-ladder.svg', 480, { name: 'Stroke weights 0.8–2.6 pt' })], 520, 400), L.text('The weight ladder: one 272 pt line (seed 7) at 0.8 to 2.6 pt. Frame hairlines 0.8–1.1, most drawing 1.1–1.6, heavy staves and swords 1.8–3.2, the leaf keyline 0.8. Card art is shown scaled (about 0.64× in a three-card slot), so these read thinner on screen.', 'caption', { w: 520 }), L.source('Ink.swift:37-42, 101-107', { w: 520 })], { gap: 8, w: 520, name: 'Weight ladder' }),
  L.col([paperCell([await svgOn('glyphs/pen/pen-seed-wobble.svg', 270, { name: 'One line, six seeds' })], 380, 400), L.text('Seeds 1–6: the same line and ring, each drawn a little differently. A card’s seed is seedHash(its name) XOR 0x9E3779B9, so it is the same on every launch.', 'caption', { w: 380 }), L.source('Ink.swift:10-33; CardArt.swift:39', { w: 380 })], { gap: 8, w: 380, name: 'Seed variations' }),
  wobble,
], { gap: 68, name: 'Ladders', align: 'MIN' }))
L.add(pen, L.row([
  L.note({ w: 346, tags: ['fixed'], title: 'How the pen is seeded', body: 'Mulberry32 random numbers from a 32-bit FNV-1a hash of a name. Fixed seeds: the frame 7, the back 21/22, the wheel 1212, the key glyph 421, the chevrons 611/612, the grain 9121.', source: 'Ink.swift:10-33' }),
  L.note({ w: 346, tags: ['open'], title: 'Editing one stroke re-rolls the rest', body: 'The generator is consumed in drawing order, so changing or inserting one stroke changes the wobble of every later stroke on that card. Tweaks are never local.', source: 'Ink.swift:77-81' }),
  L.note({ w: 346, tags: ['open'], title: 'No taper', body: 'The pen has one width per stroke. Akash chose tapered “fading glints” for the Star’s lights and asked every glint to take that shape: a taste for taper the pen lacks. Worth knowing before drawing new marks.', source: 'Ink.swift:40; CardImages.swift:23' }),
  L.note({ w: 346, tags: ['fixed'], title: 'Scaled from the top left', body: 'The printer (MarksCanvas) scales a drawing uniformly from its top-left corner and does not centre it; art put in a box of a different shape hugs the top left.', source: 'CardImages.swift:9-29' }),
], { gap: 24, name: 'Pen notes', align: 'MIN' }))
L.add(sec, pen)

// ---- 3. Gold leaf --------------------------------------------------------------------------------------
const leaf = L.board({ name: 'Ink, gold & materials · Gold leaf', kicker: 'GOLD', title: 'Gold leaf', titleStyle: 'h1', w: W, leadW: 1120,
  lead: 'Gold on a card is beaten leaf: the four bands of Palette.leaf laid across each shape’s own box, top left to bottom right, and always outlined by a 0.8 pt ink keyline. Most cards carry about one gold shape.' })
const pairs = []
for (const [id, name] of [['sun', 'The Sun'], ['star', 'The Star'], ['magician', 'The Magician']]) {
  pairs.push(L.col([L.row([
    await L.img(`cards/faces/${id}.png`, { w: 150, scale: 3, name: name + ' · face' }),
    paperCell([await svgOn(`cards/leaf/${id}-leaf.svg`, 150, { name: name + ' · leaf only' })], 170, 266),
  ], { gap: 12, name: name }), L.text(name + ': the face, and its gold alone', 'caption')], { gap: 8, name: 'Leaf · ' + name }))
}
L.add(leaf, L.row(pairs, { gap: 40, name: 'Leaf on cards' }))
L.add(leaf, L.source('cards/leaf/*.svg (leaf only, vector, one per card); CardArt.swift:543-571 (the leaf filter)'))
const box = async (w, h, n) => { const r = F.rect(w, h, [L.solid('#C9A333')], { name: 'Gold/Leaf on ' + n, r: 4 }); await L.useFill(r, 'Gold/Leaf'); return r }
L.add(leaf, L.row([
  L.col([L.row([await box(56, 200, 'a tall box'), await box(150, 150, 'a square'), await box(280, 80, 'a wide box')], { gap: 28, align: 'MAX', name: 'Leaf on three boxes' }),
    L.text('The Gold/Leaf paint style on three boxes. The bands follow each box’s diagonal, so a tall shape bands steeply and a wide one shallowly.', 'caption', { w: 560 }), L.source('CardImages.swift:31-39; Palette.swift:40-46', { w: 560 })], { gap: 10, w: 560, name: 'Leaf angle' }),
  L.col([paperCell([await svgOn('glyphs/pen/pen-fillDiamond-gold.svg', 240, { name: 'Leaf diamond with keyline' })], 280, 220), L.text('The keyline: every gold fill is outlined in card/ink at 0.8 pt, drawn over the leaf.', 'caption', { w: 280 })], { gap: 8, w: 280, name: 'Keyline' }),
  L.col([
    L.note({ w: 456, tags: ['claude'], title: 'About one gold per card', body: 'Leaf is used sparingly: a sun, a cup, a crown. A habit of Claude’s while drawing the deck, open to change.', source: 'CardImages.swift:197' }),
    L.note({ w: 456, tags: ['open'], title: 'The angle changes with the shape', body: 'Because the gradient spans each shape’s own box, its angle differs from shape to shape. Intended or not, anyone re-drawing leaf in Figma has to set it per shape.', source: 'CardImages.swift:34-38' }),
  ], { gap: 16, name: 'Leaf notes' }),
], { gap: 48, name: 'Leaf rules', align: 'MIN' }))
L.add(sec, leaf)

// ---- 4. Gold cooling to ink ---------------------------------------------------------------------------
const cool = L.board({ name: 'Ink, gold & materials · Gold cooling to ink', kicker: 'GOLD', title: 'Gold cooling to ink', titleStyle: 'h1', w: W, leadW: 1120,
  lead: 'The signature motion. A card writes itself in 2.1 s after it turns face up; a letter you type cools in 0.9 s. They look alike, but they are made two different ways.',
  tags: [['open', 'Two methods, two end inks']] })
L.add(cool, L.section('A card stroke: two strokes cross-fading', { style: 'h3', lead: 'Each mark is laid from its start by a bright nib, drawn twice (wet gold under its own ink) and the two cross-fade. Gold fills fade in as leaf, with no cooling.', leadW: 1100 }))
L.add(cool, L.col([await L.img('type-ink/ink/writing-the-star-strip@2x.png', { w: CW, name: 'The Star writing itself · strip' }), L.text('The app’s renders: the Star writing itself, ink 0 → 1 (nine frames over 2.1 s).', 'caption')], { gap: 8, name: 'Star writing strip' }))
L.add(cool, L.col([await L.img('type-ink/ink/stroke-ramp-line@2x.png', { w: CW, name: 'One stroke cooling · a line of the water' }), await L.img('type-ink/ink/stroke-ramp-leaf@2x.png', { w: 600, name: 'One stroke cooling · the leaf sun' }), L.text('One stroke of the Star’s water, and its gold-leaf sun, at mark progress 0 → 1.', 'caption')], { gap: 12, name: 'Stroke ramps' }))
const RAMP = [[0, 1, 0], [0.1, 1, 0], [0.2, 1, 0], [0.3, 0.987, 0.013], [0.4, 0.896, 0.104], [0.5, 0.741, 0.259], [0.6, 0.55, 0.45], [0.7, 0.352, 0.648], [0.8, 0.175, 0.825], [0.9, 0.049, 0.951], [1, 0, 1]]
const KW = (CW - 10 * 12) / 11
const rampSw = RAMP.map(([p, g, i]) => {
  const f = L.frame({ name: 'Stroke at p ' + p, w: KW, h: 64, fill: PAPER, r: 8, clip: true, stroke: '#000000', strokeA: 0.05 })
  const a = F.rect(KW, 64, [F.paint('gold/metal')], { name: 'gold/metal at ' + g, r: 0, stroke: false, opacity: g })
  const b = F.rect(KW, 64, [F.paint('card/ink')], { name: 'card/ink at ' + i, r: 0, stroke: false, opacity: i })
  f.appendChild(a); f.appendChild(b)
  const alpha = 1 - (1 - g) * (1 - i)
  return L.col([f, L.text('p ' + p, 'codeStrong', { size: 11, lh: 16 }), F.mono(`gold ${Math.round(g * 100)} · ink ${Math.round(i * 100)}`, { size: 10, lh: 14, w: KW }), F.mono(`alpha ${alpha.toFixed(2)}`, { size: 10, lh: 14, w: KW, alpha: alpha < 0.9 ? 1 : 0.6, color: alpha < 0.9 ? L.C.blood : L.C.ink })], { gap: 3, w: KW, name: 'Keyframe · p ' + p })
})
L.add(cool, L.row(rampSw, { gap: 12, name: 'Card stroke keyframes' }))
L.add(cool, L.specs([
  ['Laid', 'to e = 1 − (1 − p)^2.2 of its length; mark i starts at i/(n − 1) × spread', 'CardImages.swift:143-168'],
  ['Cooling', 'gold/metal at (1 − c) under the mark’s ink at c, c = smoothstep(0.25, 1, p): two stacked layers, not a colour blend', 'CardImages.swift:148-160'],
  ['The nib', 'the last 6% of the laid length, 2.4 × the width, gold/light at 0.9 × (1 − p), round cap', 'CardImages.swift:143-168'],
  ['The card', 'ink 0 → 1 over 2.1 s (ease in-out), 0.46 s after the card is taken: frame over 0–0.22, art 0.05–0.92, numeral 0.46–0.74, name 0.62–0.90, essence 0.72–1.0', 'Game.swift:466-487; CardImages.swift:45-123'],
], { w: CW, keyW: 160, name: 'Card cooling spec' }))

L.add(cool, L.section('A typed letter: one colour, blended', { style: 'h3', lead: 'Each letter is laid lit (gold/light), is wet gold for a moment, then its colour is mixed channel by channel into the ink while its opacity falls to the line’s rest.', leadW: 1100 }))
const TONES = [[0, '#ECCE6E', 1, 'gold/light'], [0.05, '#E3C45E', 1], [0.1, '#D2B23F', 0.999], [0.15, '#C6A52F', 0.992], [0.25, '#B7992D', 0.958], [0.4, '#927A28', 0.872], [0.6, '#584921', 0.735], [0.9, '#26201C', 0.62, 'ink/text-62']]
const TW = (CW - 7 * 16) / 8
L.add(cool, L.row(TONES.map(([t, h, a, v]) => L.col([F.rect(TW, 64, [v ? F.paint(v) : L.solid(h, a)], { name: v ? 'Swatch · ' + v : 'Letter at ' + t + ' s · ' + h, r: 8 }), L.text(t.toFixed(2) + ' s', 'codeStrong', { size: 11, lh: 16 }), F.mono(h + ' · ' + Math.round(a * 1000) / 10 + '%', { size: 10, lh: 14, w: TW }), v ? F.mono(v, { size: 10, lh: 14 }) : null], { gap: 3, w: TW, name: 'Letter keyframe · ' + t + ' s' })), { gap: 16, name: 'Letter keyframes' }))
L.add(cool, L.row([
  L.col([await L.img('type-ink/quill/cooling-winter-strip@3x.png', { w: 900, scale: 3, name: 'A pasted word cooling · strip' }), L.text('The app’s render: a pasted word cooling, 0 → 0.9 s.', 'caption')], { gap: 8, name: 'Letter strip' }),
  L.specs([
    ['Nib light', 'l = 1 − smoothstep(0, 0.15, age): gold/light → gold/metal', 'Quill.swift:216-257'],
    ['Cooling', 't = smoothstep(0.08, 0.9, age): mix → ink/text, alpha 1 → rest', 'Quill.swift:248-257'],
    ['Rest', '0.62, rising to 0.98 as the question is held', 'Quill.swift:248-257'],
  ], { w: 520, keyW: 110, name: 'Letter cooling spec' }),
], { gap: 36, name: 'Letter row', align: 'MIN' }))
L.add(cool, L.row([
  L.note({ w: 716, tags: ['open'], title: 'Two methods, two end inks', body: 'A card stroke stacks two strokes, so mid-cool it dips to about 75% opacity (0.75 at p 0.6) and it ends in card/ink #15110E. A letter blends one colour and ends in ink/text #26201C at 62%. Both look right; they are not the same system. Keep both, or unify them?', source: 'CardImages.swift:159-160; Quill.swift:248-257' }),
  L.note({ w: 716, tags: ['open'], title: 'The middle goes olive', body: 'Both blend in gamma-encoded sRGB, so halfway from gold to ink turns khaki (#8F7F4D for a letter at 0.5 s over pearl, about #82754C for a card stroke). A perceptual blend (OKLCH) would stay warmer.' }),
], { gap: 24, name: 'Cooling notes', align: 'MIN' }))

L.add(cool, L.section('On the way out, the ink sinks', { style: 'h3', tags: ['panel'], lead: 'When cards are returned each face fades off the pressed blank under it: heavy lines stay as grooves, the leaf stays where it was laid, the type goes. No gold comes back.', leadW: 1100 }))
L.add(cool, L.col([await L.img('type-ink/ink/sink-the-star-strip@2x.png', { w: 1100, name: 'The Star given back · strip' }), L.text('The app’s renders: the Star given back. The face’s opacity is 1 − sink, sink = (progress through the card’s own window)^1.8: 0, 0.055, 0.19, 0.40, 0.67, 1.', 'caption', { w: 1100 }), L.source('Game.swift:318; Keeping.swift:423; CardImages.swift:198-235', { w: 1100 })], { gap: 8, name: 'Sink strip' }))
L.add(sec, cool)

L.fit(sec)
await L.arrange('Design system')
return JSON.stringify((await L.snapChapter(sec, 'pages/ink-gold-materials', { scale: 0.3 })).map(s => s.path + ' ' + s.h))
