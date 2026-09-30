// Chapter: Card anatomy & back, step 1 of 2 (header, the face, reversed & returned, the back).
//   node design/figma/bridge/run.mjs design/figma/build/pages/cards-lib.js design/figma/build/pages/card-anatomy-1.js
// Rescues the deck components first (the base components live on this chapter’s last board, made by step 2).
// It clears the whole chapter, so always run card-anatomy-2.js after it.
const L = S.lib
const K = S.cards
await K.load()
const sec = await L.chapter('Card anatomy & back', { clear: false })
K.rescue(sec)
for (const c of [...sec.children]) c.remove()
K.refresh()
await K.base()
for (const id of ['hierophant', 'fool', 'star']) await K.makeCard(id)

// Local helpers --------------------------------------------------------------------------
const big = (id, state, scale) => { const i = K.instance(id, state); i.rescale(scale); return i }
const pinned = (node, pins, scale, name) => {
  const h = L.frame({ name: 'Pinned · ' + name, w: node.width, h: node.height, clip: false })
  h.appendChild(node); node.x = 0; node.y = 0
  pins.forEach((p, i) => { const pn = L.pin(i + 1); h.appendChild(pn); pn.x = p.x * scale - 13; pn.y = p.y * scale - 13 })
  return h
}
const legend = (pins, w) => L.col(pins.map((p, i) => L.row([L.pin(i + 1), L.col([
  L.text(p.label, 'smallStrong', { w: w - 40 }),
  p.body ? L.text(p.body, 'small', { w: w - 40 }) : null,
  p.source ? L.source(p.source, { w: w - 40 }) : null,
], { gap: 2 })], { gap: 12, align: 'MIN', name: 'Legend · ' + p.label })), { gap: 14, w, name: 'Legend' })
const chipRow = (tags) => L.chips(tags)
const tokenRow = (hex, varName, label, value, src) => {
  const r = figma.createRectangle(); r.name = 'Swatch · ' + varName; r.resize(32, 32); r.cornerRadius = 8
  r.fills = [K.paint(hex, varName)]; r.strokes = [L.solid('#000000', 0.08)]; r.strokeAlign = 'INSIDE'
  return L.row([r, L.col([L.text(label, 'smallStrong', { w: 330 }), L.text(value, 'code', { w: 330 }), src ? L.source(src, { w: 330 }) : null], { gap: 1 })], { gap: 12, name: 'Token · ' + label, align: 'MIN' })
}
const leafSwatch = w => {
  const r = figma.createRectangle(); r.name = 'Gold leaf gradient'; r.resize(w, 64); r.cornerRadius = 10
  const stops = [[0, '#F6E08F'], [0.42, '#C9A333'], [0.66, '#E7C761'], [1, '#94701F']]
  r.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: stops.map(([p, h]) => ({ position: p, color: L.rgba(h, 1) })) }]
  return r
}

// ---- 1. Header ------------------------------------------------------------------------------
const head = L.board({ name: 'Card anatomy · Header', kicker: 'THE DECK', title: 'Card anatomy & back', w: 1600,
  lead: 'Every card is 226 × 400 pt of cream cotton stock, drawn by a seeded pen that bows each line, so a card is the same every time and never mechanical. This chapter takes one face apart, then the reversed and returned rules, the back, a card’s life on the table, and the open questions.',
  tags: ['shipped'] })
L.add(head, L.rich([['In this chapter   ', 'smallStrong'], ['The face  ·  Reversed & returned  ·  The back  ·  A card’s life  ·  Parity with the app  ·  Open issues & whose choices  ·  The base components', 'small']], 'small', { w: 1456 }))

// ---- 2. The face -------------------------------------------------------------------------------
const SC = 2
const PINS = [
  { x: 60, y: 5, label: 'Outer hairline', body: '5–221 × 5–395 pt, 1.1 pt ink. Like every line on the card, bowed a hair by the pen.', source: 'CardArt.swift:439-453' },
  { x: 11, y: 150, label: 'Heavy border', body: '11–215 × 11–389 pt, 2.4 pt.' },
  { x: 150, y: 33, label: 'Numeral band', body: 'y 11–52. Didot Bold 15, tracking 3.2, centred at (114, 33). The Fool is the letter O; court cards leave the band empty.', source: 'CardImages.swift:73-78' },
  { x: 206, y: 120, label: 'Art window', body: '20–206 × 52–300 pt, 1.3 pt. The art box (186 × 248) sits at (20, 52) and is not clipped to it.' },
  { x: 28, y: 60, label: 'Corner brackets', body: 'Four oxblood L-brackets inside the window corners, arms 4–13 pt in, 1.1 pt.' },
  { x: 147, y: 160, label: 'Gold leaf', body: 'About one gold shape per card, laid as beaten leaf: four bands across the shape’s own box, top left to bottom right, with a 0.8 pt ink outline.', source: 'Palette.swift:40-46; CardImages.swift:31-39' },
  { x: 40, y: 300, label: 'Band rule', body: 'y 300, across the full inner width, 2.2 pt. It closes the art window and opens the name band.' },
  { x: 196, y: 336, label: 'Name', body: 'Didot Bold 17, capitals, tracking 1.4, line 21, centred in a 182 pt column; up to two lines.', source: 'CardImages.swift:80-88' },
  { x: 170, y: 368, label: 'Essence', body: 'Didot Italic 13 (12.5 in code, which draws at 13), oxblood, one line, 4 pt under the name.', source: 'CardImages.swift:89-94' },
  { x: 204, y: 380, label: 'Candle vignette', body: 'Candle #734D20, clear to 110 pt from the centre, 16% at 250 pt, Multiply. The corners get about 13.6%, the side edges almost none.', source: 'CardImages.swift:108-111' },
  { x: 90, y: 280, label: 'Paper grain', body: 'A 96 pt tile of greys 200–254, seeded so it never changes, multiplied at 50% over everything, art and type included.', source: 'Palette.swift:103-127; CardImages.swift:113-118' },
]
const face = L.board({ name: 'Card anatomy · The face', kicker: 'CARD ANATOMY', title: 'The face', w: 1600, titleStyle: 'h1',
  lead: 'The Hierophant at twice its size, as a live instance of Card/The Hierophant. Paper, frame, art and type are printed first; the vignette and the grain are multiplied over all of them.' })
const right = L.col([
  L.text('Where the gold sits', 'h3'),
  leafSwatch(388),
  L.text('#F6E08F 0 · #C9A333 42% · #E7C761 66% · #94701F 100%', 'code', { w: 388 }),
  L.text('The only metal on a face. It is also the only colour a returned card keeps, so most drawings have exactly one leaf shape: the heart of the idea (a sun, an eye, a hub). The back’s hairline is flat gold #C9A82F instead.', 'small', { w: 388 }),
  L.source('Palette.swift:40-46 (Palette.leaf); CardImages.swift:31-39', { w: 388 }),
  L.spacer(1, 12),
  L.text('Colours on the face', 'h3'),
  tokenRow('#F3EDE0', 'card/paper', 'Paper', '#F3EDE0 · card/paper', 'Palette.swift'),
  tokenRow('#15110E', 'card/ink', 'Ink', '#15110E · card/ink'),
  tokenRow('#8C2E25', 'card/oxblood', 'Oxblood', '#8C2E25 · card/oxblood'),
  tokenRow('#734D20', 'card/candle', 'Candle (vignette)', '#734D20 · card/candle · renders 4D, not 4C'),
], { gap: 10, w: 388, name: 'Gold and colours' })
L.add(face, L.row([pinned(big('hierophant', 'Upright', SC), PINS, SC, 'The Hierophant'), legend(PINS, 520), right], { gap: 48, align: 'MIN', name: 'Face, pins and tokens' }))
L.add(face, L.section('Type on the face', { style: 'h3' }))
L.add(face, L.table([
  { key: 'layer', label: 'Layer', w: 120, style: 'smallStrong' }, { key: 'style', label: 'Text style', w: 140, style: 'code' },
  { key: 'font', label: 'Font · size / line', w: 200 }, { key: 'track', label: 'Tracking', w: 90 },
  { key: 'colour', label: 'Colour', w: 170, style: 'code' }, { key: 'place', label: 'Placement (Figma, in the card)', w: 330 },
  { key: 'src', label: 'Source', w: 190, style: 'code' },
], [
  ['Numeral', 'Card/Numeral', 'Didot Bold · 15 / 19', '3.2 pt', '#15110E card/ink', 'Auto width, left edge at SwiftUI frame x + 0.33, y 23.5 (Figma drops the trailing tracking)', 'CardImages.swift:73-78'],
  ['Name', 'Card/Name', 'Didot Bold · 17 / 21, capitals', '1.4 pt', '#15110E card/ink', 'x 22, 182 wide, centred; y 324.5 (one line) or 314 (two); 6.5 pt higher reversed', 'CardImages.swift:80-88'],
  ['Essence', 'Card/Essence', 'Didot Italic · 13 / 16', '0', '#8C2E25 card/oxblood', 'x 22, 182 wide, centred, 4 pt under the name', 'CardImages.swift:89-94'],
  ['Reversed mark', '—', '5 × 5 pt square at 45°', '—', '#8C2E25 card/oxblood', 'centre (113, 369.5) under a one-line name, (113, 380) under two; 8 pt under the essence', 'CardImages.swift:95-102'],
], { zebra: true, name: 'Type on the face' }))

// ---- 3. Reversed & returned --------------------------------------------------------------
const RS = 1.4
const pose = (node, title, caption, tags) => L.col([node, L.text(title, 'smallStrong', { w: node.width }), caption ? L.text(caption, 'caption', { w: node.width }) : null, tags ? L.chips(tags) : null], { gap: 8, name: 'Pose · ' + title })
const rb = await L.img('cards/blanks-reversed/fool-blank-reversed.png', { scale: 3, w: 226 * RS, name: 'Render · fool-blank-reversed' })
const rr = L.board({ name: 'Card anatomy · Reversed & returned', kicker: 'CARD ANATOMY', title: 'Reversed and returned', w: 1600, titleStyle: 'h1',
  lead: 'The Fool in its three component states, and the one pose that is not a variant: a reversed card once it is returned.' })
L.add(rr, L.row([
  pose(big('fool', 'Upright', RS), 'Upright', 'State=Upright'),
  pose(big('fool', 'Reversed', RS), 'Reversed', 'State=Reversed. The sun moves to the lower left; the type stays put.'),
  pose(big('fool', 'Returned', RS), 'Returned', 'State=Returned. Grooves and the leaf; no type.'),
  pose(rb, 'Returned, reversed', 'Swift render only (cards/blanks-reversed). The grooves turn with the art but the light still falls from the upper left, so it is not the upright blank turned.'),
], { gap: 40, align: 'MIN' }))
const rule = (title, tags, items, source) => L.note({ w: 704, tags, title, titleStyle: 'h3', kids: [L.bullets(items, { style: 'small', w: 660, gap: 6 }), L.source(source, { w: 660 })] })
L.add(rr, L.row([
  rule('Reversed', ['shipped', ['fixed', 'Since the first build']], [
    'About 42% of draws land reversed, decided per card at each shuffle.',
    'Only the art turns, 180° about its centre (113, 176). The frame, numeral, name and essence stay upright.',
    'A 5 × 5 pt oxblood square turned 45° appears under the essence. It joins the centred name stack, so name and essence rise 6.5 pt.',
    'The card’s bowl sounds an octave lower, in a darker voice; the altar adds “· reversed”.',
  ], 'Game.swift:156; CardImages.swift:70, 95-102; Deck.swift:27-50'),
  rule('Returned', [['panel', 'The Return · design panel'], 'shipped'], [
    'When a spoken reading is returned with the hold, the ink sinks into the stock, last-drawn card first. Let go early and it rises again.',
    'What stays: strokes of 1.2 pt and more, as blind grooves; filled ink and oxblood shapes as 1.0 pt outline grooves; the gold leaf and paper cuts.',
    'What goes: hatching, hairlines, ticks and fine rays, the outer hairline, the oxblood brackets and all the type.',
    'Each groove is the same marks three times: light #FFFFFF 95% at (+0.7, +0.8), shade #4D381F 24% at (−0.5, −0.6), floor 8%, all × 0.85 on a face.',
    'Gold never comes back on the way out: the sink is a plain crossfade. Kept readings are laid out again as blanks; a hold brings the ink back up.',
  ], 'CardImages.swift:178-235; CardArt.swift:539-591; Game.swift:308; Keeping.swift:688'),
], { gap: 48, align: 'MIN' }))

// ---- 4. The back ---------------------------------------------------------------------------------
const back = L.board({ name: 'Card anatomy · The back', kicker: 'CARD ANATOMY', title: 'The back', w: 1600, titleStyle: 'h1',
  lead: 'Pressed into the stock rather than printed on it: a celestial rose seen only as light and shade from the upper left, a gold hairline and one small sun of gold leaf. Mirrored through its centre, so it never shows which way up a card lies. Seen on every face-down card: the ribbon, the deal, the first half of the flip.',
  tags: [['akash', 'Akash chose the cream embossed back'], ['rejected', 'Saturated blue-and-gold back: “tacky”']] })
const bigBack = K.parts.back.createInstance(); bigBack.name = 'Card/Back'; bigBack.rescale(2)
const LAYERS = [
  ['Stock', ['stock'], '#F2EBDD, card/back-stock. Heavier and a shade darker than the face.'],
  ['Blind emboss', ['stock', 'blind-emboss'], 'The rose, three passes at full strength: light 95% (+0.7, +0.8), shade 24% (−0.5, −0.6), floor 8%.'],
  ['Gold hairline', ['stock', 'gold-hairline'], 'Flat gold #C9A82F, 0.9 pt.'],
  ['Gold-leaf sun', ['stock', 'gold-leaf-sun'], 'Leaf disc r 11 with a gold-deep #8A6819 outline, 0.8 pt.'],
  ['Grain', ['stock', 'Grain'], 'The same tile as the face, Multiply at 35% (the face has 50%).'],
  ['Stock edge', ['stock', 'stock-edge'], '#4D381F 13%, 1.2 pt inside the edge. No vignette on the back.'],
]
const layerTile = ([title, keep, body]) => {
  const i = K.parts.back.createInstance(); i.name = 'Back layer · ' + title
  for (const ch of i.children) ch.visible = keep.includes(ch.name)
  i.rescale(0.75)
  return L.col([i, L.text(title, 'smallStrong', { w: 170 }), L.text(body, 'caption', { w: 170 })], { gap: 6, w: 170, name: 'Layer · ' + title })
}
const tiles = L.frame({ name: 'Layers', dir: 'h', gap: 24, wrap: true, wrapGap: 28, w: 558 })
L.add(tiles, LAYERS.map(layerTile))
L.add(back, L.row([
  L.col([bigBack, L.source('CardImages.swift:239-260 (CardBackStatic); CardArt.swift:465-491')], { gap: 10 }),
  L.col([L.text('Its layers, bottom to top', 'h3'), tiles], { gap: 16 }),
  L.col([
    L.note({ w: 350, tags: ['open'], title: 'Two edges, two finishes', body: 'The back has a shaded stock edge and 35% grain with no vignette; the face has no edge line, a vignette and 50% grain. Probably deliberate (different stock), but never written down.', source: 'CardImages.swift:108-117, 249-256' }),
    L.note({ w: 350, tags: ['open'], title: 'Square corners', body: 'Every card is clipped square. Real tarot stock is round-cornered.', source: 'CardImages.swift:121' }),
    L.note({ w: 350, tags: ['fixed'], title: 'In this file', body: 'Card/Back is the layered vector from the app’s marks with the grain as a top layer. The stock edge is drawn #4D381F here, as the app renders it (the SVG said 4C).' }),
  ], { gap: 16 }),
], { gap: 48, align: 'MIN' }))

L.add(sec, head, face, rr, back)
L.fit(sec)
await L.arrange('Design system')
const snaps = await L.snapChapter(sec, 'pages/card-anatomy', { scale: 0.4 })
return snaps
