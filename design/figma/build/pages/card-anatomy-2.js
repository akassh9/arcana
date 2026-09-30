// Chapter: Card anatomy & back, step 2 of 2 (a card's life, parity, open issues & whose choices, the base components).
//   node design/figma/bridge/run.mjs design/figma/build/pages/cards-lib.js design/figma/build/pages/card-anatomy-2.js
// Appends after step 1's boards; re-running replaces only this step's boards.
const L = S.lib
const K = S.cards
await K.load()
const sec = await L.chapter('Card anatomy & back', { clear: false })
const MINE = ['Card anatomy · A card’s life', 'Card anatomy · Parity with the app', 'Card anatomy · Open issues & whose choices', 'Card anatomy · The base components']
for (const b of sec.children.filter(n => MINE.includes(n.name))) { K.rescue(b); b.remove() }
K.refresh()
const P = await K.base()
for (const id of ['hierophant', 'fool', 'star']) await K.makeCard(id)

const cropImg = async (path, o) => {   // a window onto part of a render: o = { scale, x, y, w, h, name }
  const im = await L.img(path, { scale: o.scale || 3 })
  const f = L.frame({ name: o.name || 'Crop · ' + path.split('/').pop(), w: o.w, h: o.h, clip: true })
  f.appendChild(im); im.x = -o.x; im.y = -o.y
  return f
}
const cap = (node, title, caption, w) => L.col([node, title ? L.text(title, 'smallStrong', { w: w || node.width }) : null, caption ? L.text(caption, 'caption', { w: w || node.width }) : null], { gap: 6, name: 'Figure · ' + (title || '') })

// ---- 5. A card's life ---------------------------------------------------------------------------
const life = L.board({ name: MINE[0], kicker: 'CARD ANATOMY', title: 'A card’s life', w: 1600, titleStyle: 'h1',
  lead: 'Face down in the ribbon; a half-second turn; the card writing itself in gold that cools to ink; the finished face; and, when the reading is returned, the ink sinking back into the stock.' })
// The flip, as a diagram made from the components (no render of a mid-turn exists).
const flipTile = async (angle) => {
  const src = angle < 90 ? P.back.createInstance() : K.instance('star', 'Upright')
  const png = await src.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } }); src.remove()
  const im = figma.createImage(png)
  const k = 0.48, w = Math.max(2, 226 * k * Math.abs(Math.cos(angle * Math.PI / 180)))
  const r = figma.createRectangle(); r.name = `Flip · ${angle}°`; r.resize(w, 400 * k)
  r.fills = [{ type: 'IMAGE', imageHash: im.hash, scaleMode: 'CROP', imageTransform: [[1, 0, 0], [0, 1, 0]] }]
  const slot = L.frame({ name: `Flip slot · ${angle}°`, dir: 'h', w: 112, h: 192, justify: 'CENTER', align: 'CENTER', kids: [r] })
  return L.col([slot, L.text(angle + '°', 'code', { w: 112, align: 'CENTER' })], { gap: 8, align: 'CENTER', name: 'Flip · ' + angle })
}
const flips = []
for (const a of [0, 45, 80, 100, 135, 180]) flips.push(await flipTile(a))
const ink = await L.img('shots/13-ink.png', { w: 1218, name: 'Render · 13-ink' })
const sink = await L.img('shots/13b-sink.png', { w: 882, name: 'Render · 13b-sink' })
const T = (rows) => L.table([
  { key: 'when', label: 'When', w: 110, style: 'code' }, { key: 'what', label: 'What happens', w: 330 }, { key: 'src', label: 'Source', w: 150, style: 'code' },
], rows, { zebra: true })
L.add(life, L.section('The flip', { style: 'h3', lead: 'Diagram, not a render: each tile is the component squeezed to the cosine of its angle. The app turns the card in perspective (rotation3DEffect about the vertical axis, perspective 0.4); the back shows until 90°, then the face.' }))
L.add(life, L.row([L.row(flips, { gap: 12, align: 'MAX', name: 'Flip diagram' }), T([
  ['0.00 s', 'Click a card in the ribbon.', 'Game.swift:466'],
  ['0.16 s', 'The flip starts: 0.5 s, ease in-out.', 'Game.swift:472'],
  ['0.32 s', 'The land sound; 0.42 s the position’s bowl (an octave lower if reversed).', 'Game.swift:466-487'],
  ['0.46 s', 'A flash, and the card starts writing itself.', 'Game.swift:466-487'],
])], { gap: 48, align: 'MIN' }))
L.add(life, L.section('Writing itself', { style: 'h3', lead: 'Each line is laid from its start by a bright nib, wet in gold, and cools to ink; lines overlap, quick to start and careful to finish. Stage-only render: The Star at 8, 20, 34, 50, 68, 86 and 100% ink, 150 × 265 pt each.' }))
L.add(life, ink)
L.add(life, T([
  ['ink 0 → 1', 'Animated over 2.1 s, ease in-out. At 1 the live drawing is swapped for a cached raster.', 'Game.swift:486; CardImages.swift:50'],
  ['0 – 0.22', 'The frame, in gold cooling to ink.', 'CardImages.swift:57'],
  ['0.05 – 0.92', 'The art, stroke by stroke in drawing order.', 'CardImages.swift:61-67'],
  ['0.46 – 0.74', 'The numeral fades in; then the name (0.62 – 0.90), the essence (0.72 – 1.0) and the reversed mark (0.80 – 1.0).', 'CardImages.swift:73-103'],
]))
L.add(life, L.section('Sinking, and the blank', { style: 'h3', lead: 'Tied to the hold that returns the reading: each face fades off its blank, last-drawn card first. Let go early and the ink rises again (it drains at twice the speed). Stage-only render: Wheel of Fortune and The Sun reversed at 0, 25, 50, 75 and 100% of the return.' }))
L.add(life, L.row([sink, L.col([
  L.note({ w: 480, tags: [['panel', 'Design panel']], title: 'No gold on the way out', body: 'The sink is a plain crossfade of two rasters, face over blank. Nothing new is drawn, and the gold nib never comes back.', source: 'CardImages.swift:363-378' }),
  L.note({ w: 480, tags: ['open'], title: 'The flip ignores Reduce Motion', body: 'With Reduce Motion on, the writing is skipped but the flip still turns.', source: 'Game.swift:472' }),
], { gap: 16 })], { gap: 48, align: 'MIN' }))
L.add(life, L.source('Game.swift:306-320 (sink); Tools/shot/main.swift:401, 414 (these renders)'))

// ---- 6. Parity with the app ------------------------------------------------------------------------
const par = L.board({ name: MINE[1], kicker: 'CARD ANATOMY', title: 'Parity with the app', w: 1600, titleStyle: 'h1',
  lead: 'The Figma components next to the app’s own renders (Swift, ImageRenderer at 3×), with the difference magnified four times. Measured on the 678 × 1200 px exports, per channel, out of 255.',
  tags: ['measured'] })
const CASES = [
  ['hierophant', 'Upright', 'cards/faces/hierophant.png', 'hierophant-upright', 'The Hierophant, upright', '3.88 mean · 1.07% of pixels off by more than 24'],
  ['fool', 'Reversed', 'cards/faces-reversed/fool-reversed.png', 'fool-reversed', 'The Fool, reversed', '3.98 mean · 1.17% over 24'],
  ['star', 'Returned', 'cards/blanks/star-blank.png', 'star-returned', 'The Star, returned', '3.57 mean · 0.15% over 24 · max 37'],
  ['back', null, 'cards/shared/card-back.png', 'back', 'The back', '2.87 mean · 0.45% over 24 · max 73'],
]
const group = async ([id, st, png, key, title, stat]) => {
  const live = id === 'back' ? P.back.createInstance() : K.instance(id, st)
  const swift = await L.img(png, { scale: 3, w: 226, name: 'Swift render · ' + key })
  const diff = await cropImg('cards/parity/' + key + '.png', { scale: 3, x: 452, y: 0, w: 226, h: 400, name: 'Difference ×4 · ' + key })
  return L.col([
    L.row([cap(live, 'Figma component'), cap(swift, 'Swift render'), cap(diff, 'Difference × 4')], { gap: 12, align: 'MIN' }),
    L.text(title, 'h3', { w: 702 }), L.text(stat, 'code', { w: 702 }),
  ], { gap: 8, name: 'Parity · ' + title })
}
const gs = []
for (const c of CASES) gs.push(await group(c))
L.add(par, L.row([gs[0], gs[1]], { gap: 52, align: 'MIN' }), L.row([gs[2], gs[3]], { gap: 52, align: 'MIN' }))
L.add(par, L.row([
  L.note({ w: 464, tags: ['measured'], title: 'Where they differ', body: 'Almost all of the difference is the grain: Figma samples the 96 pt tile nearest-neighbour, so it is crisper than the app’s smoothed grain, with the same mean tone. The rest is antialiasing on the edges of lines and letters. The Moon, with its paper-cut crescent, measures 4.04.' }),
  L.note({ w: 464, tags: ['measured'], title: 'Type', body: 'Figma sets Didot a hair lighter than Core Text (no stem darkening). Positions land within 1/3 pt. Figma leaves out the trailing letter-spacing SwiftUI keeps, so the numeral is placed by its left edge.' }),
  L.note({ w: 464, tags: ['fixed'], title: 'How this was measured', body: 'Variants exported at 3× from this file and compared with cards/faces, faces-reversed, blanks and shared/card-back.png using render/cards/work/compare (composited over paper; the back over its own stock).', source: 'design/figma/render/cards/compare/main.swift' }),
], { gap: 32, align: 'MIN' }))

// ---- 7. Open issues & whose choices -------------------------------------------------------------
const iss = L.board({ name: MINE[2], kicker: 'CARD ANATOMY', title: 'Open issues and whose choices', w: 1600, titleStyle: 'h1',
  lead: 'What a designer may want to change on the card, and who decided what. Nothing tagged Claude chose was asked for by Akash: overturn it freely.' })
L.add(iss, L.section('Names break wherever TextKit breaks them', { style: 'h3', tags: ['open'],
  lead: 'Names are set in a 182 pt column with no manual breaks, so 28 of the 78 wrap to two lines, inconsistently: an orphaned THE, a lone MAN, and the same pattern breaking two ways. Crops of the app’s renders.' }))
const WRAP = [['hierophant', 'THE / HIEROPHANT'], ['hanged', 'THE HANGED / MAN'], ['wands-3', 'THREE / OF WANDS'], ['swords-3', 'THREE OF / SWORDS'], ['wands-knight', 'KNIGHT / OF WANDS'], ['swords-queen', 'QUEEN OF / SWORDS']]
const crops = []
for (const [id, t] of WRAP) crops.push(cap(await cropImg('cards/faces/' + id + '.png', { scale: 3, x: 0, y: 300, w: 226, h: 96, name: 'Name band · ' + id }), t))
L.add(iss, L.row(crops, { gap: 20, align: 'MIN', name: 'Name wraps' }), L.source('CardImages.swift:80-88 (lineLimit 2, minimumScaleFactor 0.7); deck.json name_lines'))
const N = (tags, title, body, source) => L.note({ w: 464, tags, title, body, source })
const grid3 = (notes, name) => L.frame({ name, dir: 'h', gap: 32, wrap: true, wrapGap: 24, w: 1456, kids: notes })
L.add(iss, L.section('Other open issues', { style: 'h3' }))
L.add(iss, grid3([
  N(['open'], 'The essence is 12.5 in code', 'Font.custom rounds to whole points, so it has always drawn at 13. This file specs 13; the code could say so.', 'CardImages.swift:90'),
  N(['open'], 'Reversed type sits 6.5 pt higher', 'The diamond joins a vertically centred stack, so name and essence rise when a card is reversed.', 'CardImages.swift:80-105'),
  N(['open'], 'The numeral centres on x 114', 'Everything else centres on 113. Possibly a compensation for trailing tracking; undocumented.', 'CardImages.swift:77'),
  N(['claude', 'open'], 'Court cards leave the numeral band empty', '41 pt of blank band on 16 cards. A rank glyph could go there.', 'Deck.swift:430'),
  N(['open'], 'An off-brand fallback', 'If a face fails to render, the SF Symbol “rectangle” is shown in its place.', 'CardImages.swift:274'),
  N(['fixed'], 'Vector export of a whole face', 'Rendered to PDF, the multiplied vignette comes out as a black disc. Export without it and rebuild it (as Card/Finish does).'),
], 'Open issues'))
L.add(iss, L.section('Whose choices', { style: 'h3' }))
L.add(iss, grid3([
  N(['claude'], 'The court scheme', 'Page on the ground, knight on the road, queen in the ring, king on the squared seat crowned in gold. Wings only on the Knight of Cups.', 'Suits.swift:1029'),
  N(['claude'], 'Numerals', 'Roman numerals on the pips, Ace = I, and an empty band on the courts. The Fool is O.', 'Deck.swift:57, 423, 430'),
  N(['claude'], 'A pentagram on each Pentacle', 'Every pentacle is a rimmed disc with the five-pointed star in it.', 'Suits.swift:215-217'),
  N(['claude'], 'About one gold per card', 'What the return leaves. Exceptions with two golds: the High Priestess, the Sun, the Five of Cups, the Two of Pentacles. The Sun’s eye counts as paint and sinks with the ink.', 'CardArt.swift:539-591, 556-559'),
  N(['claude'], 'Pips that tell a scene', 'A number card lays out that many emblems, as the Marseille pips did, but the way they lie tells the Rider–Waite–Smith scene with the figures taken out.', 'Suits.swift:4-11'),
  N(['akash'], 'The whole deck, and this back', 'Akash raised the full 78-card deck (after first saying “not yet”) and chose the cream embossed back over a saturated blue-and-gold one.'),
], 'Choices'))

// ---- 8. The base components -----------------------------------------------------------------
const baseB = L.board({ name: MINE[3], kicker: 'CARD ANATOMY', title: 'The base components', w: 1600, titleStyle: 'h1',
  lead: 'The masters every card is built from. Edit one and all 78 cards follow. They are generated by design/figma/build/pages/cards-lib.js from the app’s own marks (render/cards), so a regenerated deck matches the code again.' })
const holder = (comp, paper) => {
  const f = L.frame({ name: 'Holder · ' + comp.name, w: 226, h: 400, fill: paper || null, clip: false })
  f.appendChild(comp); comp.x = 0; comp.y = 0
  return f
}
const masters = [
  [P.stock, null, 'Card/Stock', 'Paper, the printed frame and the Finish (a boolean property). Standalone it is the empty face.'],
  [P.stockReturned, null, 'Card/Stock · Returned', 'Paper, the frame pressed as grooves, and the Finish.'],
  [P.finish, '#F3EDE0', 'Card/Finish', 'Vignette and grain, both Multiply. Shown here on paper; it has no fill of its own.'],
  [P.back, null, 'Card/Back', 'The layered back, grain included.'],
]
L.add(baseB, L.row(masters.map(([c, paper, t, d]) => cap(holder(c, paper), t, d, 226)), { gap: 40, align: 'MIN', name: 'Masters' }))
const code = s => L.text(s, 'code', { size: 12, lh: 20, alpha: 0.85, w: 680 })
L.add(baseB, L.row([
  L.note({ w: 700, title: 'How a Card/<name> variant is built', titleStyle: 'h3', kids: [
    code('Upright    Stock (Finish off) → Art/<name> at (20, 52)\n           → Numeral · Name · Essence → Finish'),
    code('Reversed   the same, Art turned 180° about (113, 176),\n           type lifted 6.5 pt, + Reversed mark'),
    code('Returned   Stock · Returned (Finish off)\n           → Art/Returned/<name> at (20, 52) → Finish'),
    L.text('The finish is its own layer on top because the app multiplies the vignette and grain over the art and type too (CardImages.swift:108-117).', 'small', { w: 660 }),
  ] }),
  L.note({ w: 700, title: 'Using and regenerating', titleStyle: 'h3', kids: [L.bullets([
    'Place an instance of Card/<name> and switch State. Text is live, with the Card/Numeral, Card/Name and Card/Essence styles and the card/ink and card/oxblood variables.',
    'Name line breaks are typed in, copied from where SwiftUI breaks them (deck.json name_lines). If you change the type, re-check them.',
    'To rebuild: node design/figma/bridge/run.mjs design/figma/build/pages/cards-lib.js <step>.js, where the step calls S.cards.makeCard(id, { rebuild: true }). Existing instances are swapped to the new set.',
  ], { style: 'small', w: 660, gap: 6 })] }),
], { gap: 56, align: 'MIN' }))

L.add(sec, life, par, iss, baseB)
K.unpark()
L.fit(sec)
await L.arrange('Design system')
const snaps = []
for (const b of [life, par, iss, baseB]) snaps.push(await L.snap(b, 'pages/card-anatomy/' + b.name.split(' · ')[1].replace(/[^\w ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.png', { scale: 0.4, wait: snaps.length ? 300 : 1500 }))
return snaps
