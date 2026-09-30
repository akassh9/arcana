// Chapter: Colour, step 1 of 2 (header, the sky, type on the sky & contrast).
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-lib.js design/figma/build/pages/colour-1.js
// Clears the chapter: always run colour-2.js after it.
const L = S.lib, F = S.fa
const sec = await L.chapter('Colour')
const W = 1600, CW = 1456

// ---- 1. Header ---------------------------------------------------------------------------------
const head = L.board({ name: 'Colour · Header', kicker: 'FOUNDATIONS', title: 'Colour', w: W,
  lead: 'Arcana is the sky a moment before sunrise: a pearl ground, pale blue overhead, lilac high on the right, rose low on the left, dawn rising from under the table. Type is one warm ink and a dark gold, as on vellum. The cards are cream cotton with black ink, oxblood and one piece of gold.' })
L.add(head, F.intro(['The sky', 'Type on the sky & contrast', 'The three golds', 'Card stock, shade, light & the moon', 'Outside the app', 'Rendered vs code']))
const rule = (tags, title, body, source) => L.note({ w: 346, tags, title, body, source })
L.add(head, L.row([
  rule(['akash', 'shipped'], 'Light only', 'No dark theme. Akash rejected the dark “lapis night” build on 24 September: they don’t like dark themes. The app forces the light appearance.', 'ArcanaApp.swift:11; Settings.swift:44'),
  rule(['claude'], 'Gold has three jobs', 'Gold you can read (gold/ink), wet gold being laid (gold/metal), and gold as light (gold/light), which is never type. gold/ink was added for the light sky.', 'Palette.swift:22-30'),
  rule(['claude'], 'Shadows are warm, light is gold', 'Every shadow is shade/warm at a low opacity, never black. Every glow is gold/light.', 'Palette.swift:18, 29'),
  rule(['lesson'], 'Take the idea, not the palette', 'Akash sent Apple’s emoji moon as a reference. A literal copy was “very out of theme”; its seas and craters stayed, repainted in the sky’s colours.'),
], { gap: 24, name: 'Rules' }))
L.add(head, L.note({ w: CW, fill: '#FFFFFF', fillA: 0.5, title: 'The tokens are real',
  body: 'All 60 colours are variables in the Arcana colour collection, named group/role, or group/role-opacity where the app uses one colour at a fixed opacity (ink/text-62 is the ink at 62%). Every swatch in this chapter is bound to its variable: select one and Inspect shows the token. Hex values are 8-bit sRGB, as the app renders them.',
  source: 'Palette.swift:11-56' }))
L.add(sec, head)

// ---- 2. The sky -----------------------------------------------------------------------------------
const sky = L.board({ name: 'Colour · The sky', kicker: 'COLOUR', title: 'The sky', titleStyle: 'h1', w: W,
  lead: 'Five colours over a pearl ground. Each gradient fades a colour to itself at zero, so nothing in the sky has an edge. Holding the deck (the charge) raises the dawn and the rays and darkens the engraved wheel; nothing else moves.' })
L.add(sky, L.row([
  F.swatch('sky/pearl', { usage: 'The ground: the window, the sky, Settings, the altar and keys veils.', source: 'Palette.swift:13; RootView.swift:1659-1660' }),
  F.swatch('sky/blue', { usage: 'High sky: a linear fade, 100% at the top, 55% at 0.34, gone by 0.70 of the window.', source: 'Palette.swift:14; Chamber.swift:187-193' }),
  F.swatch('sky/lilac', { usage: 'High right: a radial at (0.86, 0.14), radius 0.44 of the span. Also the Moon’s half-light.', source: 'Palette.swift:15; Chamber.swift:196-198' }),
  F.swatch('sky/rose', { usage: 'Low left: a radial at (0.08, 0.82), radius 0.42 of the span.', source: 'Palette.swift:16; Chamber.swift:199-201' }),
  F.swatch('sky/dawn', { usage: 'First light from under the table: radial from (0.5, 1.04), radius 0.74 of the span. 86% at rest, 100% held. Also the Sun’s morning.', source: 'Palette.swift:17; Chamber.swift:204-212' }),
], { gap: 24, name: 'Sky colours', align: 'MIN' }))

// the two answer/engraving colours, the wheel shown both as drawn and at full strength
const wheelBlock = L.row([
  F.rect(136, 120, [L.solid('#97782F', 1)], { name: 'Wheel ink at 100% (for legibility, not a token)', r: 0 }),
  F.rect(136, 120, [F.paint('sky/wheel-ink')], { name: 'Swatch · sky/wheel-ink', r: 0 }),
], { gap: 0, name: 'Wheel ink · full and as drawn' })
wheelBlock.cornerRadius = 12; wheelBlock.clipsContent = true
const wheelSw = L.col([wheelBlock,
  L.text('sky/wheel-ink', 'h3', { w: 272 }),
  L.text('#97782F · 5.5% → 10.5% held', 'codeStrong', { size: 12, lh: 18, w: 272 }),
  L.text('The engraved celestial wheel. Left: the ink at full strength; right: as the sky shows it at rest.', 'small', { w: 272 }),
  L.source('Chamber.swift:65-90, 220-222', { w: 272 }),
], { gap: 6, w: 272, name: 'Colour · sky/wheel-ink' })
L.add(sky, L.row([
  F.swatch('sky/clearing', { usage: 'The reversed Moon’s clearing: 78% → 36% → 0 over the lilac field.', source: 'Answers.swift:210-218' }),
  wheelSw,
  L.note({ w: 568, tags: ['fixed'], title: 'The span', body: 'Radial radii are fractions of the span, max(window width, window height), and every radial is a circle. In Figma draw each one on a square 2R wide centred on its point and clip it to the window (Figma stretches gradients to their box), or import the native SVG in the sky family.', source: 'Chamber.swift:180-233' }),
], { gap: 24, name: 'Answer and engraving colours', align: 'MIN' }))

// gradient swatches: each gradient at its real place in a 1260 × 860 window, 0.216 scale
const GW = 272, GH = Math.round(860 * GW / 1260)
const mini = (name, paints, opacity) => {
  const f = L.frame({ name: 'Gradient · ' + name, w: GW, h: GH, r: 12, clip: true, fill: '#F9F7F2', stroke: '#000000', strokeA: 0.06 })
  const r = figma.createRectangle(); r.name = name; r.resize(GW, GH); r.fills = paints; if (opacity != null) r.opacity = opacity
  f.appendChild(r)
  return f
}
const gcard = (name, node, stops, note, source) => L.col([node, L.text(name, 'h3', { w: GW }),
  L.col(stops.map(s => F.mono(s, { w: GW })), { gap: 0 }), note ? L.text(note, 'small', { w: GW }) : null, L.source(source, { w: GW })], { gap: 6, w: GW, name: 'Gradient swatch · ' + name })
const WW = 1260, WH = 860
L.add(sky, L.section('The gradients, with their stops', { style: 'h3', lead: 'Each swatch is a 1260 × 860 window at one-fifth size with the gradient at its real centre and radius, on pearl. Stops are position · colour · alpha.', leadW: 1100 }))
L.add(sky, L.row([
  gcard('High sky · linear', mini('High sky', [F.linearV([[0, '#CCDBF5', 1], [0.34, '#CCDBF5', 0.55], [0.7, '#CCDBF5', 0]])]),
    ['0 · sky/blue · 100%', '0.34 · sky/blue · 55%', '0.70 · sky/blue · 0%'], 'Top to bottom of the whole window.', 'Chamber.swift:187-193'),
  gcard('Lilac · radial', mini('Lilac', [F.radial([[0, '#E0D7F7', 0.8], [1, '#E0D7F7', 0]], 1083.6, 120.4, 554.4, WW, WH)]),
    ['0 · sky/lilac · 80%', '1 · sky/lilac · 0%'], 'Centre (1083.6, 120.4), r 554.4.', 'Chamber.swift:196-198'),
  gcard('Rose · radial', mini('Rose', [F.radial([[0, '#FDDDDC', 0.7], [1, '#FDDDDC', 0]], 100.8, 705.2, 529.2, WW, WH)]),
    ['0 · sky/rose · 70%', '1 · sky/rose · 0%'], 'Centre (100.8, 705.2), r 529.2.', 'Chamber.swift:199-201'),
  gcard('Dawn · radial', mini('Dawn', [F.radial([[0, '#FFE0B0', 0.95], [0.36, '#FFE0B0', 0.42], [1, '#FFE0B0', 0]], 630, 894.4, 932.4, WW, WH)], 0.86),
    ['0 · sky/dawn · 95%', '0.36 · sky/dawn · 42%', '1 · sky/dawn · 0%'], 'Centre (630, 894.4), below the window; layer 86% at rest.', 'Chamber.swift:204-212'),
  gcard('The page’s edge · radial', mini('Vignette', [F.radial([[0, '#4D381F', 0], [0.475, '#4D381F', 0], [1, '#4D381F', 0.09]], 630, 430, 1008, WW, WH)]),
    ['0 · shade/warm · 0%', '0.475 · shade/warm · 0%', '1 · shade/warm · 9%'], 'Clear inside 0.38 of the span, 9% at 0.8.', 'Chamber.swift:231-233'),
], { gap: 24, name: 'Gradient swatches', align: 'MIN' }))

// the real sky
L.add(sky, L.section('The whole sky, as the app draws it', { style: 'h3', lead: 'The app’s own renders of the backdrop at 1260 × 860, then its eight layers from the bottom up. The moon and the near sky (dust, the ring, ripples) are drawn between the wheel and the page’s edge.', leadW: 1100 }))
const comp = async (path, title, caption) => L.col([await L.img(path, { w: 716, r: 12, stroke: '#000000', strokeA: 0.06 }), L.text(title, 'smallStrong'), L.text(caption, 'caption', { w: 716 })], { gap: 8, name: 'Render · ' + title })
L.add(sky, L.row([
  await comp('sky/backdrop/backdrop-composite-charge-0-1260x860.png', 'At rest (charge 0)', 'Pearl, high sky, lilac, rose, dawn at 86%, rays at 80%, the wheel at 5.5%, the vignette.'),
  await comp('sky/backdrop/backdrop-composite-charge-1-1260x860.png', 'Held (charge 1)', 'Dawn and rays at 100%, the wheel at 10.5%. Nothing else changes.'),
], { gap: 24, name: 'Backdrop renders' }))
const layers = [['1', 'pearl', 'Pearl ground'], ['2', 'high-sky', 'High sky'], ['3', 'lilac', 'Lilac'], ['4', 'rose', 'Rose'], ['5', 'dawn', 'First light'], ['6', 'rays', 'The nine rays'], ['7', 'wheel', 'The engraved wheel'], ['8', 'vignette', 'The page’s edge']]
const TW = (CW - 7 * 12) / 8
const thumbs = []
for (const [n, id, t] of layers) thumbs.push(L.col([await L.img(`sky/backdrop/sky-layer-${n}-${id}-1260x860.png`, { w: TW, r: 8, stroke: '#000000', strokeA: 0.08 }), L.text(n + '  ' + t, 'label', { w: TW })], { gap: 6, name: 'Layer ' + n + ' · ' + t }))
L.add(sky, L.row(thumbs, { gap: 12, name: 'Sky layers' }))
L.add(sky, L.source('Chamber.swift:180-233 (backdrop); sky/backdrop/gradients.json (every gradient as data)'))
L.add(sec, sky)

// ---- 3. Type on the sky & contrast ---------------------------------------------------------------------
const CR = {"ink/text": ["#26201C", 15.02], "ink/text-98": ["#2A2420", 14.3], "ink/text-92": ["#37312D", 11.96], "ink/text-82": ["#4C4743", 8.57], "ink/text-74": ["#5D5854", 6.56], "ink/text-66": ["#6E6965", 5.07], "ink/text-62": ["#76726D", 4.46], "ink/text-55": ["#85817C", 3.61], "ink/text-52": ["#8B8783", 3.33], "ink/text-50": ["#908C87", 3.12], "ink/text-48": ["#94908B", 2.96], "ink/text-42": ["#A09D98", 2.52], "ink/text-40": ["#A5A19C", 2.4], "ink/text-36": ["#ADAAA5", 2.16], "ink/text-32": ["#B5B2AE", 1.97], "ink/text-30": ["#BAB6B2", 1.88], "ink/text-28": ["#BEBBB6", 1.79], "ink/text-20": ["#CFCCC7", 1.5], "gold/ink": ["#8F6C21", 4.52], "gold/ink-95": ["#94732B", 4.13], "gold/ink-90": ["#9A7A36", 3.76], "gold/ink-80": ["#A4884B", 3.16], "gold/ink-75": ["#AA8F55", 2.9], "gold/ink-60": ["#B9A475", 2.27], "gold/ink-55": ["#BFAB7F", 2.1], "gold/ink-45": ["#C9B894", 1.82], "gold/ink-42": ["#CCBD9A", 1.73], "gold/ink-40": ["#CFBF9E", 1.69], "gold/metal": ["#C9A82F", 2.15], "gold/light": ["#ECCE6E", 1.44], "gold/deep": ["#8A6819", 4.81]}
// kind: t = type, g = a graphic that carries state, d = decoration
const INK = [
  ['ink/text', 't', 'All type on the sky at full strength: ARCANA, THE KEYS, the altar name, the chosen spread, the dry written question', 'Palette.swift:21'],
  ['ink/text-98', 't', 'The invitation and the question at full charge (0.62 + 0.36 × charge)', 'RootView.swift:830, 949'],
  ['ink/text-92', 't', 'The verse line being read, the thread’s sentences, the altar line', 'RootView.swift:1223, 1339, 1496'],
  ['ink/text-82', 't', 'Keys-page descriptions (“choose”, “hold”…)', 'Legend.swift:137'],
  ['ink/text-74', 't', 'Keycap names and the drawn key signs', 'Legend.swift:176-184'],
  ['ink/text-66', 't', 'The keys-page word TYPE', 'Legend.swift:125'],
  ['ink/text-62', 't', 'The invitation and the written question at rest; the epigraph (19 and 16 pt italic)', 'RootView.swift:830, 949, 1009'],
  ['ink/text-55', 't', 'The kept date, the returned question, Settings’ quiet lines', 'Keeping.swift:1036, 1065; Settings.swift:36, 59'],
  ['ink/text-52', 't', 'DRAW THREE, LETTING THE CARDS SETTLE, THE THREAD STAYED QUIET (10 pt caps)', 'RootView.swift:1172, 1313, 1321'],
  ['ink/text-50', 't', 'Altar keywords; also the key glyph at rest and the bowl ringing', 'Legend.swift:369; RootView.swift:1509, 1633'],
  ['ink/text-48', 't', 'An unchosen spread name (11 pt caps)', 'RootView.swift:1109'],
  ['ink/text-42', 't', 'The altar’s roman numeral (10 pt caps)', 'RootView.swift:1475'],
  ['ink/text-40', 't', 'The moon’s phase name (8 pt caps), an unchosen spread’s gloss; the keycap outline', 'RootView.swift:739, 1116; Legend.swift:191'],
  ['ink/text-36', 't', 'ONE MOON AGO (7 pt caps, the smallest type); the page-turn chevrons at rest', 'Keeping.swift:954, 1062'],
  ['ink/text-32', 't', 'A position name before its card is face up (9 pt caps)', 'RootView.swift:678'],
  ['ink/text-30', 't', 'Verse lines not being read; the bowl muted', 'RootView.swift:1223, 1633'],
  ['ink/text-28', 'g', 'An unchosen spread’s pips', 'RootView.swift:1097'],
  ['ink/text-20', 'g', 'Draw pips not yet taken; the altar’s 54 × 1 rule', 'RootView.swift:1147, 1491'],
]
const GOLD = [
  ['gold/ink', 't', 'Gold you can read: lit slot names, FIND THE THREAD, try again, the altar label and essence, the thread’s question, the lit key glyph', 'Palette.swift:23'],
  ['gold/ink-95', 'g', 'The charge arc’s core stroke (1.8 pt); kept thread nodes', 'Chamber.swift:540; Keeping.swift:782'],
  ['gold/ink-90', 'g', 'The thread glyph’s diamond', 'RootView.swift:1371'],
  ['gold/ink-80', 't', 'A slot name once its card is face up, before it is read (9 pt caps)', 'RootView.swift:677; Keeping.swift:808'],
  ['gold/ink-75', 't', 'PRESS AND HOLD (9 pt caps)', 'RootView.swift:448'],
  ['gold/ink-60', 't', 'HOLD · RETURN THE CARDS, HOLD · REMEMBER (9 pt caps); the chosen spread’s brackets', 'RootView.swift:1124, 1181; Keeping.swift:897'],
  ['gold/ink-55', 'd', 'The 46 × 1 rule over ARCANA and THE KEYS; the keyword diamonds', 'RootView.swift:709, 1504; Legend.swift:108'],
  ['gold/ink-45', 'd', 'The epigraph’s 30 × 1 rule; the ripple hairline', 'RootView.swift:1013; Chamber.swift:634'],
  ['gold/ink-42', 'g', 'An empty slot’s corner brackets', 'RootView.swift:669'],
  ['gold/ink-40', 'g', 'An unlit thread node, the thread glyph’s stem, the thread line at rest', 'RootView.swift:587, 1375'],
  ['gold/metal', 'g', 'Never type: wet gold, shown for comparison', 'Palette.swift:28'],
  ['gold/light', 'g', 'Never type: light, shown for comparison', 'Palette.swift:29'],
  ['gold/deep', 'g', 'The keyline of the card back’s sun only', 'Palette.swift:30'],
]
const verdict = (kind, cr) => {
  if (kind === 't') return cr >= 7 ? L.chip('measured', 'AAA') : cr >= 4.5 ? L.chip('measured', 'AA') : cr >= 3 ? L.chip('open', 'AA large only') : L.chip('open', 'Below AA')
  if (kind === 'd') return L.chip('fixed', 'Decoration')
  return cr >= 3 ? L.chip('measured', 'Graphic ≥ 3:1') : L.chip('open', 'Graphic < 3:1')
}
const COLS = [56, 128, 64, 84, 84, 132, 528, 244]
const cell = (s, i, o) => L.text(s, o && o.mono ? 'code' : 'small', Object.assign({ w: COLS[i], alpha: 0.86 }, o && o.mono ? { size: 11, lh: 18, alpha: 0.8 } : {}))
const ladderRow = ([name, kind, use, src], i) => {
  const [comp, cr] = CR[name]
  const a = F.val(name).a
  const chip = F.rect(COLS[0], 28, [F.paint(name)], { name: 'Swatch · ' + name, r: 6 })
  const vc = L.frame({ name: 'Verdict', w: COLS[5], dir: 'h', kids: [verdict(kind, cr)] }); vc.layoutSizingVertical = 'HUG'
  const r = L.row([chip, cell(name, 1, { mono: true }), cell(Math.round(a * 100) + '%', 2, { mono: true }), cell(comp, 3, { mono: true }),
    L.text(cr.toFixed(2) + ':1', 'codeStrong', { w: COLS[4], size: 12, lh: 18 }), vc, cell(use, 6), L.source(src, { w: COLS[7] })], { gap: 16, pad: [8, 12], name: 'Contrast · ' + name, align: 'CENTER' })
  r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  return r
}
const ladderHead = () => {
  const r = L.row(['', 'Token', 'Alpha', 'On pearl', 'Contrast', 'WCAG 2', 'Used for', 'Source'].map((s, i) => L.text(s, 'kicker', { w: COLS[i] })), { gap: 16, pad: [8, 12], name: 'Header row' })
  r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  return r
}
const ladder = (name, rows) => L.col([ladderHead(), ...rows.map(ladderRow)], { gap: 0, name })

const ts = L.board({ name: 'Colour · Type on the sky & contrast', kicker: 'COLOUR', title: 'Type on the sky, and its contrast', titleStyle: 'h1', w: W, leadW: 1180,
  lead: 'There is one ink for type, #26201C, and one gold you can read, #8F6C21. Quietness is made with opacity, never a second grey. Each step below is composited on pearl and measured against it with the WCAG 2 contrast formula.' })
L.add(ts, L.row([
  L.note({ w: 460, tags: ['open'], title: 'Low contrast by design', body: 'Most labels are 7–11 pt capitals at 32–55% ink or 60–80% gold: 1.97–3.61:1 on pearl, below WCAG AA for small text. It is deliberate quiet, but nobody has tested it with readers. A designer’s call.' }),
  L.note({ w: 460, tags: ['open'], title: 'No high-contrast variant', body: 'The app reads only Reduce Motion. Increase Contrast, Reduce Transparency and larger text are ignored, so these faint labels never get darker for people who ask for it.', source: 'RootView.swift:12' }),
  L.note({ w: 488, tags: ['measured'], title: 'Pearl is the kind case', body: 'The upper third of the window sits on sky/blue, not pearl. There ink/text-62 falls to 4.04:1, ink/text-52 to 3.07:1 and ink/text-36 to 2.08:1. Card type is dark ink on paper: 16.1:1, oxblood 7.11:1.' }),
], { gap: 24, name: 'Contrast notes', align: 'MIN' }))
L.add(ts, L.section('The ink ladder · ink/text', { style: 'h3', lead: 'Rows are ordered by opacity. “Graphic” rows are marks, not type, and are held to 3:1.' }))
L.add(ts, ladder('Ink ladder', INK))
L.add(ts, L.section('The gold ladder · gold/ink, with the other golds for comparison', { style: 'h3', lead: 'gold/ink is only just AA at full strength (4.52:1). gold/metal and gold/light are shown to make the rule plain: they are never type.' }))
L.add(ts, ladder('Gold ladder', GOLD))
L.add(sec, ts)

L.fit(sec)
await L.arrange('Design system')
return JSON.stringify(await L.snapChapter(sec, "pages/colour", { scale: 0.3 }))
