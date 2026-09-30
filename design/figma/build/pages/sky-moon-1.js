// Chapter: Sky & moon (Design system), step 1 of 3: header, the layer stack, the native rebuild, charge 0 and 1.
//   node design/figma/bridge/run.mjs design/figma/build/pages/sky-moon-1.js
const L = S.lib
const sec = await L.chapter('Sky & moon')
const W = 1260, H = 860

// ---- local helpers -------------------------------------------------------------------------
// An image in a clipped, stroked tile, optionally over a backing colour.
const tile = async (path, w, o = {}) => {
  const im = await L.img(path, { w, scale: o.scale || 1, name: o.name || 'Render · ' + path.split('/').pop() })
  const f = L.frame({ name: o.frameName || 'Tile · ' + path.split('/').pop().replace(/\.png$/, ''), w: im.width, h: im.height, r: o.r == null ? 10 : o.r, clip: true, fill: o.back, stroke: '#000000', strokeA: 0.08 })
  f.appendChild(im); im.x = 0; im.y = 0
  return f
}
const cap = (title, body, src, w) => L.col([
  title ? L.text(title, 'smallStrong', { w }) : null,
  body ? L.text(body, 'small', { w }) : null,
  src ? L.source(src, { w }) : null,
], { gap: 4, name: 'Caption · ' + (title || '') })
const vars = await figma.variables.getLocalVariablesAsync('COLOR')
const V = n => vars.find(v => v.name === n)
const bound = (hex, name, a = 1) => { const p = L.solid(hex, a); const v = V(name); return v ? figma.variables.setBoundVariableForPaint(p, 'color', v) : p }
const stop = (pos, hex, a) => ({ position: pos, color: L.rgba(hex, a) })

// ---- 1. Header ----------------------------------------------------------------------------
const head = L.board({ name: 'Sky & moon · Header', kicker: 'THE SKY', title: 'Sky & moon', w: 1600,
  lead: 'The whole backdrop of Arcana: a dawn sky at first light that fills the window and runs under the title bar. It is atmosphere, not chrome. It never takes a click, and only its near layer moves by itself.',
  tags: ['akash', 'shipped'] })
L.add(head, L.rich([['In this chapter   ', 'smallStrong'], ['The layer stack  ·  Rebuilt in Figma  ·  Charge 0 and 1  ·  The near sky  ·  The hold ring, flashes and given dust  ·  The engraved wheel  ·  The rays  ·  The moon  ·  Seeded positions  ·  Frame rates  ·  Open questions', 'small']], 'small', { w: 1456 }))
const hero = await tile('sky/composite/sky-full-charge-0-1260x860@2x.png', 1456, { scale: 2, r: 16, name: 'Render · the whole sky at rest' })
L.add(head, L.col([hero, cap('The whole sky at rest, as the app draws it', 'Backdrop, tonight’s moon (30 September 2026, waning gibbous) and the near sky: gold dust, lens blooms, glints and the hold ring round the deck. No words and no cards.', 'Chamber.swift:157-240; Tools/shot/main.swift:53-60', 1456)], { gap: 12, name: 'Hero' }))
L.add(head, L.row([
  L.note({ w: 464, tags: ['akash'], title: 'Light only', body: 'Akash doesn’t like dark themes. The first sky was a dark “lapis night”; it was rejected and replaced by first light. Every colour in the sky is light on light, and nothing in it ever darkens.', source: 'ArcanaApp.swift:11; Chamber.swift:183-234' }),
  L.note({ w: 464, tags: ['fixed'], title: 'How to read the numbers', body: 'Points, y down, in the full 1260 × 860 window with its 32 pt title bar (the sky runs under it). span = the window’s longer side (1260) and sizes every radial, the rays and the wheel. Colours are sRGB hexes as rendered; blending is plain Normal everywhere.', source: 'Chamber.swift:157-181' }),
  L.note({ w: 464, tags: ['measured'], title: 'Why it is built this way', body: 'A SwiftUI redraw costs about 5.5 ms in this window, so nothing large animates in SwiftUI. The gradients are drawn once and only faded by opacity; the near sky is Metal; transients are Core Animation. Idle: about 9–10% of one core on Akash’s M4 Pro.', source: 'SkyRenderer.swift:309-492; Chamber.swift:402-484' }),
], { gap: 32, align: 'MIN', name: 'Notes' }))

// ---- 2. The layer stack --------------------------------------------------------------------
const stack = L.board({ name: 'Sky & moon · The layer stack', kicker: 'THE SKY · BACKDROP', title: 'The layer stack', w: 2800,
  lead: 'Eight layers, bottom to top, each rendered alone from the app’s own code. Stacked at their layer opacities they match the app’s composite within 0.5/255 on average. The As Above lights, the moon and the near sky slot in between.', leadW: 1400 })
const order = ['1 Pearl', '2 High sky', '3 Lilac', '4 Rose', '5 First light · 86%', '6 Rays · 80%', 'As Above lights', '7 Wheel · 5.5%', 'Moon', 'Near sky (Metal)', '8 Vignette']
const strip = L.row([L.text('BOTTOM', 'kicker', { color: '#5E554C' })], { gap: 10, align: 'CENTER', name: 'Stack order' })
order.forEach((o, i) => {
  const layer = /^\d/.test(o)
  L.add(strip, L.frame({ name: 'Stack · ' + o, dir: 'h', pad: [6, 12], r: 999, fill: layer ? '#FFFFFF' : '#E9E6E1', stroke: L.C.stroke, kids: [L.text(o, layer ? 'smallStrong' : 'small', { alpha: layer ? 1 : 0.7 })] }))
  if (i < order.length - 1) L.add(strip, L.text('→', 'small', { alpha: 0.4 }))
})
L.add(strip, L.text('TOP', 'kicker', { color: '#5E554C' }))
L.add(stack, L.col([strip, L.source('Chamber.swift:183-234 (the ZStack, bottom first); Answers.swift:404-421 (the lights’ slot)')], { gap: 8, name: 'Stack order + source' }))
const LAYERS = [
  ['sky-layer-1-pearl', '1 · Pearl ground', 'Solid #F9F7F2, opaque', 'The ground of everything, and the window’s own background.', 'rest 100% · held 100%', 'Chamber.swift:184; Palette.swift:13'],
  ['sky-layer-2-high-sky', '2 · High sky (linear)', '#CCDBF5 100% @0 → 55% @0.34 → 0% @0.70', 'Pale cornflower blue overhead, straight down the full window, clear by 70% of its height.', 'rest 100% · held 100%', 'Chamber.swift:187-193'],
  ['sky-layer-3-lilac', '3 · Lilac in the air (radial)', '#E0D7F7 80% → 0%\ncentre (0.86, 0.14) = (1083.6, 120.4) · r 0.44 span = 554.4', 'Pools high on the right, where the moon hangs.', 'rest 100% · held 100%', 'Chamber.swift:196-198'],
  ['sky-layer-4-rose', '4 · Rose in the air (radial)', '#FDDDDC 70% → 0%\ncentre (0.08, 0.82) = (100.8, 705.2) · r 0.42 span = 529.2', 'Low on the left: the colour of the air before sunrise.', 'rest 100% · held 100%', 'Chamber.swift:199-201'],
  ['sky-layer-5-dawn', '5 · First light (radial)', '#FFE0B0 95% @0 → 42% @0.36 → 0% @1\ncentre (0.5, 1.04) = (630, 894.4) · r 0.74 span = 932.4', 'Warm apricot rising from just under the foot of the window. Shown at 100%.', 'rest 86% · held 100%', 'Chamber.swift:204-212'],
  ['sky-layer-6-rays', '6 · The nine rays', 'nine wedges from the dawn point, each a radial white\n17–27% @0 → 6% @0.5 → 0 at 0.85–1.19 span', 'White on transparent, shown over grey so it reads. Seeded, the same on every launch.', 'rest 80% · held 100%', 'Chamber.swift:214-215, 313-341'],
  ['sky-layer-7-wheel', '7 · The engraved wheel', 'line art in #97782F · 1663.2 pt square (1.32 span)\ncentred on (630, 379.76)', 'Twelve houses and a star of eight, in the cards’ own pen. Shown at full ink.', 'rest 5.5% · held 10.5%', 'Chamber.swift:58-90, 220-222'],
  ['sky-layer-8-vignette', '8 · Edge of the page (vignette)', '#4D381F 0% inside 478.8 (0.38 span) → 9% at 1008 (0.8 span)\ncentre (630, 430)', 'A breath of warm shade toward the corners, so the sky reads as a page. Shown at full strength; the app’s is 9%.', 'rest 100% · held 100%', 'Chamber.swift:230-233'],
]
const TW = 640
const cells = []
for (const [f, name, spec, what, op, src] of LAYERS) {
  const t = await tile(`sky/backdrop/${f}-1260x860.png`, TW, { back: /rays/.test(f) ? '#8F96A3' : null, frameName: 'Layer · ' + name })
  cells.push(L.col([t,
    L.text(name, 'h3', { w: TW }),
    L.text(spec, 'codeStrong', { w: TW, size: 12, lh: 18 }),
    L.text(what, 'small', { w: TW }),
    L.row([L.text('LAYER OPACITY', 'kicker', { color: '#5E554C' }), L.text(op, 'code', { alpha: 0.86 })], { gap: 10, align: 'CENTER' }),
    L.source(src, { w: TW }),
  ], { gap: 8, name: 'Layer card · ' + name }))
}
L.add(stack, L.row(cells.slice(0, 4), { gap: 32, align: 'MIN', name: 'Layers 1–4' }), L.row(cells.slice(4), { gap: 32, align: 'MIN', name: 'Layers 5–8' }))
L.add(stack, L.row([
  L.note({ w: 640, tags: ['fixed'], title: 'Radial gradients are circles', body: 'SwiftUI’s radial radii are in points, so every radial is a true circle whatever the window’s shape. In Figma, draw each on a square 2R wide centred on its point, clipped by the window (next board).', source: 'Chamber.swift:196-212' }),
  L.note({ w: 640, tags: ['fixed'], title: 'Each colour fades to itself', body: 'Every stop fades a colour to the same colour at 0 alpha, so Figma’s straight-alpha blending gives the same result as SwiftUI’s premultiplied one. Blending is gamma-encoded sRGB, as in Figma.', source: 'SkyRenderer.swift:114-118; Chamber.swift:183-234' }),
  L.note({ w: 640, tags: ['fixed'], title: 'The wheel’s ink is #97782F', body: 'The code’s colour is Generic RGB (0.52, 0.40, 0.14), painted into a Device RGB bitmap. On screen it comes out #97782F. The #856624 in older notes is the numbers read as sRGB, not what is drawn.', source: 'Chamber.swift:65-90' }),
], { gap: 32, align: 'MIN', name: 'Notes' }))

// ---- 3. Rebuilt in Figma -------------------------------------------------------------------
const G = await L.json('sky/backdrop/gradients.json')
const GL = G.window_1260x860.layers
const lay = id => GL.find(l => l.id === id)
const wheelSvg = await text('sky/wheel/engraved-wheel.svg')
const radial = (name, l, alpha) => {
  const e = figma.createEllipse(); e.name = name
  const R = l.radius
  e.resize(2 * R, 2 * R); e.x = l.center[0] - R; e.y = l.center[1] - R
  e.fills = [{ type: 'GRADIENT_RADIAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: l.stops.map(([p, h, a]) => stop(p, h, a)) }]
  if (alpha != null) e.opacity = alpha
  return e
}
const makeBackdrop = (charge) => {
  const c = figma.createComponent()
  c.name = 'Charge=' + charge
  c.resize(W, H); c.clipsContent = true; c.fills = []
  const pearl = figma.createRectangle(); pearl.name = '1 Pearl · sky/pearl'; pearl.resize(W, H); pearl.fills = [bound('#F9F7F2', 'sky/pearl')]
  const hs = figma.createRectangle(); hs.name = '2 High sky · linear'; hs.resize(W, H)
  hs.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: lay('high-sky').stops.map(([p, h, a]) => stop(p, h, a)) }]
  const kids = [pearl, hs, radial('3 Lilac · radial r 554.4', lay('lilac')), radial('4 Rose · radial r 529.2', lay('rose')), radial('5 First light · radial r 932.4', lay('dawn'), charge ? 1 : 0.86)]
  // The rays: nine wedges, each filled with a radial gradient centred on the dawn point.
  const rays = figma.createFrame(); rays.name = '6 Rays · 9 wedges'; rays.resize(W, H); rays.fills = []; rays.clipsContent = false
  rays.opacity = charge ? 1 : 0.8
  for (const r of lay('rays').rays) {
    const pts = r.triangle, xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
    const bx = Math.min(...xs), by = Math.min(...ys), bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by
    const v = figma.createVector(); v.name = 'Ray ' + r.index
    v.vectorPaths = [{ windingRule: 'NONZERO', data: 'M ' + pts.map(p => (p[0] - bx).toFixed(2) + ' ' + (p[1] - by).toFixed(2)).join(' L ') + ' Z' }]
    v.x = bx; v.y = by
    const [cx, cy] = pts[0], R2 = 2 * r.radius
    v.fills = [{ type: 'GRADIENT_RADIAL', gradientTransform: [[bw / R2, 0, 0.5 + (bx - cx) / R2], [0, bh / R2, 0.5 + (by - cy) / R2]], gradientStops: r.stops.map(([p, h, a]) => stop(p, h, a)) }]
    v.strokes = []
    rays.appendChild(v)
  }
  kids.push(rays)
  const wh = figma.createNodeFromSvg(wheelSvg); wh.name = '7 Wheel · #97782F'
  wh.fills = []; wh.clipsContent = false
  wh.x = 630 - wh.width / 2; wh.y = 379.76 - wh.height / 2
  wh.opacity = charge ? 0.105 : 0.055
  kids.push(wh)
  const vg = lay('vignette'); kids.push(radial('8 Vignette · shade/warm 9%', vg))
  for (const k of kids) c.appendChild(k)
  c.description = `The sky’s backdrop at ${charge ? 'full charge (dawn 100%, rays 100%, wheel 10.5%)' : 'rest (dawn 86%, rays 80%, wheel 5.5%)'}, rebuilt from gradients.json. Without the moon, the As Above lights and the near sky.`
  return c
}
const c0 = makeBackdrop(0), c1 = makeBackdrop(1)
const holder = L.frame({ name: 'Native rebuild', w: W, h: 2 * H + 140 })
holder.appendChild(c0); holder.appendChild(c1); c0.x = 0; c0.y = 0; c1.x = 0; c1.y = H + 140
const set = figma.combineAsVariants([c0, c1], holder)
set.name = 'Sky/Backdrop 1260×860'
set.x = 0; set.y = 0
c0.x = 0; c0.y = 0; c1.x = 0; c1.y = H + 140
set.resizeWithoutConstraints(W, 2 * H + 140)
set.fills = []; set.strokes = []
const capBox = (title, body, src) => { const f = L.frame({ name: 'Caption box', dir: 'v', gap: 4, w: W, h: 140, pad: [16, 0, 0, 0] }); L.add(f, L.text(title, 'smallStrong', { w: W }), L.text(body, 'small', { w: W }), src ? L.source(src, { w: W }) : null); return f }
const nativeCol = L.col([
  L.text('REBUILT IN FIGMA · EDITABLE LAYERS', 'kicker'),
  holder,
  capBox('Sky/Backdrop, Charge=1 · component variant', 'The same layers with dawn and rays at 100% and the wheel at 10.5%, as at the full charge of a held question.', 'Chamber.swift:212, 215, 222'),
], { gap: 0, name: 'Native' })
// Caption under variant 0 sits in the 140 pt gap between the variants.
const cap0 = L.frame({ name: 'Caption · Charge=0', dir: 'v', gap: 4, w: W, h: 140, pad: [16, 0, 0, 0] })
L.add(cap0, L.text('Sky/Backdrop, Charge=0 · component variant', 'smallStrong', { w: W }), L.text('Pearl, high sky, lilac, rose, first light (86%), nine ray wedges (80%), the wheel imported as vector (5.5%) and the vignette: every layer a native fill you can edit.', 'small', { w: W }))
holder.appendChild(cap0); cap0.x = 0; cap0.y = H
const realCol = L.col([
  L.text('THE APP’S RENDER', 'kicker'),
  await tile('sky/backdrop/backdrop-composite-charge-0-1260x860.png', W, { r: 0 }),
  capBox('backdrop-composite-charge-0 · the real Chamber view', 'The eight backdrop layers exactly as the app draws them, without the moon or the near sky. At rest.', 'Chamber.swift:183-234'),
  await tile('sky/backdrop/backdrop-composite-charge-1-1260x860.png', W, { r: 0 }),
  capBox('backdrop-composite-charge-1 · the real Chamber view', 'At the full charge of a held question.', 'Chamber.swift:212, 215, 222'),
], { gap: 0, name: 'Real' })
realCol.insertChild(1, L.spacer(W, 16))
nativeCol.insertChild(1, L.spacer(W, 16))
const rebuild = L.board({ name: 'Sky & moon · Rebuilt in Figma', kicker: 'THE SKY · BACKDROP', title: 'Rebuilt in Figma, beside the real render', w: 2800,
  lead: 'The backdrop as a component set of native, editable layers, built from the gradient data, next to the app’s own render. Change a stop and see it; the radials are circles on 2R squares, the rays are nine vector wedges.', leadW: 1400, tags: ['fixed'] })
L.add(rebuild, L.row([nativeCol, realCol], { gap: 136, align: 'MIN', name: 'Side by side' }))
const cmp = 'Each variant exported at 1× and compared with the render, pixel by pixel. At rest: mean difference 0.48/255, max 7/255. Full charge: 0.52/255, max 12/255. The larger differences sit on the wheel’s lines (7% of pixels), because the app shows a softer 1500 px bitmap and Figma the vector; everywhere else the mean is about 0.4/255.'
L.add(rebuild, L.row([
  L.note({ w: 820, tags: ['measured'], title: 'How close it is', body: cmp ? cmp : 'Measured after the build: export the variant at 1× and compare it with the render pixel by pixel.', source: 'sky/backdrop/gradients.json; backdrop-composite-charge-*.png' }),
  L.note({ w: 820, tags: ['fixed'], title: 'What stays raster', body: 'The moon’s face is painted per pixel and the near sky is drawn by Metal, so neither can be a native layer. Their parts are simple (discs, soft glows, tapered arms) and are specified on the boards that follow.', source: 'Moon.swift:49-177; SkyRenderer.swift:45-110' }),
  L.note({ w: 820, tags: ['fixed'], title: 'Other sizes', body: 'Everything is a fraction of the window or of span, so the same recipe works at any size. The 940 × 660 minimum window has its own renders and a native SVG (sky/backdrop/*-940x660).', source: 'Chamber.swift:157-181' }),
], { gap: 32, align: 'MIN', name: 'Notes' }))

// ---- 4. Charge 0 and 1 ---------------------------------------------------------------------
const charge = L.board({ name: 'Sky & moon · Charge 0 and 1', kicker: 'THE SKY · HOLDING', title: 'Charge 0 and 1', w: 2800,
  lead: 'Pressing and holding to ask fills a charge from 0 to 1 in 3.2 s, one slow inhale. The sky gathers as it fills: the light brightens a little, the dust swirls in and the ring’s gold arc closes. The gradients are never repainted; only layer opacities move.', leadW: 1400, tags: ['shipped'] })
const full0 = await tile('sky/composite/sky-full-charge-0-1260x860@2x.png', W, { scale: 2, r: 0 })
const full1 = await tile('sky/composite/sky-full-charge-1-1260x860@2x.png', W, { scale: 2, r: 0 })
L.add(charge, L.row([
  L.col([full0, cap('Charge 0 · at rest', 'The whole sky with the near sky, as the room waits.', 'Chamber.swift:157-240', W)], { gap: 12 }),
  L.col([full1, cap('Charge 1 · held to the full', 'The arc closed, the dust drawn in and turning about the deck, dawn and rays at 100%, the wheel at 10.5%. The next moment the deck is cut.', 'Chamber.swift:212-222, 538-567', W)], { gap: 12 }),
], { gap: 136, align: 'MIN', name: 'Renders' }))
const rows = [
  ['First light (layer 5)', '86%', '100%', 'Chamber.swift:212'],
  ['Rays (layer 6)', '80%', '100%', 'Chamber.swift:215'],
  ['Engraved wheel (layer 7)', '5.5%', '10.5%', 'Chamber.swift:222'],
  ['Charge arc', 'none', '360°, clockwise from twelve', 'Chamber.swift:538-543'],
  ['Ring outer hairline', 'alpha 0.10 + 0.08 × breath', '+0.14 alpha, radius +5%', 'Chamber.swift:532-534'],
  ['Gold dust', 'drifting up', 'pulled in and turned about the deck (gather = charge^1.4); core ×1.5, alpha ×1.8', 'Chamber.swift:553-567'],
  ['Glints', 'brightness ×0.8', '×1.0', 'Chamber.swift:509-517'],
  ['The room’s words', '100%', '10%', 'RootView.swift:702, 741'],
]
const tbl = L.table([
  { key: 'a', label: 'What', w: 300, style: 'smallStrong' }, { key: 'b', label: 'Charge 0', w: 320 }, { key: 'c', label: 'Charge 1', w: 520 }, { key: 'd', label: 'Source', w: 300, style: 'code' },
], rows.map(r => ({ a: r[0], b: r[1], c: r[2], d: r[3] })), { name: 'What the charge drives' })
tbl.children.forEach((row, i) => { if (i) { const s = row.children[3]; L.linkRefs(s) } })
L.add(charge, L.row([
  L.col([L.text('What the charge drives', 'h3'), tbl], { gap: 12 }),
  L.col([
    L.specs([
      ['Fill', '0 → 1 in 3.2 s, linear in time', 'Game.swift:36-37, 216'],
      ['Let go early', 'drains at twice the speed (1.6 s from full)', 'Game.swift:230, 258-266'],
      ['Reduce Motion', 'fill 0.8 s, drain 0.4 s', 'Game.swift:13-20'],
      ['At the full charge', 'the deck is cut: a bloom and a ripple (see the flashes)', 'Game.swift:413; Chamber.swift:613-636'],
      ['Cost', 'opacity only; the charge’s fades tick at 30 Hz, and only while the charge moves', 'SkyRenderer.swift:416-421; RootView.swift:928'],
    ], { w: 760, keyW: 200 }),
    L.chips(['shipped', 'measured']),
  ], { gap: 16 }),
], { gap: 96, align: 'MIN', name: 'Specs' }))

L.add(sec, head, stack, rebuild, charge)
L.fit(sec)
await L.arrange('Design system')
// Export the two variants at 1× for the pixel comparison.
await L.sleep(1200)
for (const [c, n] of [[c0, 0], [c1, 1]]) await save(`pages/sky-moon/_native-charge-${n}-1x.png`, await c.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1 } }))
const snaps = await L.snapChapter(sec, 'pages/sky-moon', { scale: 0.3 })
return { snaps, set: set.id }
