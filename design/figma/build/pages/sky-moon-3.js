// Chapter: Sky & moon (Design system), step 3 of 3: the moon, seeded positions, frame rates, open questions.
//   node design/figma/bridge/run.mjs design/figma/build/pages/sky-moon-3.js
const L = S.lib
const sec = await L.chapter('Sky & moon', { clear: false })
const MINE = ['Sky & moon · The moon', 'Sky & moon · Seeded positions', 'Sky & moon · Frame rates', 'Sky & moon · Open questions']
for (const c of [...sec.children]) if (MINE.includes(c.name)) c.remove()
const BACK = 'sky/backdrop/backdrop-composite-charge-0-1260x860.png'
const LILAC = '#DDD8F2'          // the flat lilac of moon-phases-strip-on-sky.png, like the sky round the moon
const MOON = [1083.6, 131.36]     // the moon's centre in the 1260 × 860 window

const box = (name, w, h, o = {}) => L.frame({ name, w, h, r: o.r == null ? 10 : o.r, clip: true, fill: o.back, stroke: '#000000', strokeA: 0.08 })
const put = (f, n, x = 0, y = 0) => { f.appendChild(n); n.x = x; n.y = y; return n }
const cap = (title, body, src, w) => L.col([
  title ? L.text(title, 'smallStrong', { w }) : null,
  body ? L.text(body, 'small', { w }) : null,
  src ? L.source(src, { w }) : null,
], { gap: 4, name: 'Caption · ' + (title || '') })
const fig = (node, title, body, src) => L.col([node, cap(title, body, src, node.width)], { gap: 10, name: 'Figure · ' + title })
// A square overlay (pt × pt, centred on window point c) over the resting backdrop, shown tw wide.
const cropSky = async (path, pt, c, tw, name) => {
  const k = tw / pt
  const f = box(name, tw, tw)
  put(f, await L.img(BACK, { w: 1260 * k, name: 'Backdrop (real render, at rest)' }), tw / 2 - c[0] * k, tw / 2 - c[1] * k)
  put(f, await L.img(path, { w: tw, name: 'Render · ' + path.split('/').pop() }))
  return f
}
const vars = await figma.variables.getLocalVariablesAsync('COLOR')
const bindTo = (paint, name) => { const v = vars.find(x => x.name === name); return v ? figma.variables.setBoundVariableForPaint(paint, 'color', v) : paint }
// A vector polyline in a frame's space.
const line = (parent, pts, o = {}) => {
  const v = figma.createVector(); v.name = o.name || 'Curve'
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const bx = Math.min(...xs), by = Math.min(...ys)
  v.vectorPaths = [{ windingRule: 'NONE', data: 'M ' + pts.map(p => (p[0] - bx).toFixed(2) + ' ' + (p[1] - by).toFixed(2)).join(' L ') }]
  v.strokes = [L.solid(o.color || L.C.gold, o.alpha == null ? 1 : o.alpha)]; v.strokeWeight = o.sw || 2; v.fills = []
  v.strokeCap = 'ROUND'; v.strokeJoin = 'ROUND'
  if (o.dash) v.dashPattern = o.dash
  parent.appendChild(v); v.x = bx; v.y = by
  return v
}
const lbl = (parent, s, x, y, o = {}) => { const t = L.text(s, o.preset || 'code', Object.assign({ size: 11, lh: 14 }, o)); parent.appendChild(t); t.x = x; t.y = y; return t }

// ---- 9. The moon ---------------------------------------------------------------------------
const moon = L.board({ name: MINE[0], kicker: 'THE SKY · THE MOON', title: 'The moon', w: 2800,
  lead: 'Tonight’s real moon, still up in the day sky: a 32 pt disc top right, worked out from a known new moon. Pearl-ivory where the sun is on it, lilac seas you can see the sky through, the unlit part a translucent lilac ghost. It is also the door to kept readings.', leadW: 1400, tags: ['akash', 'shipped'] })
const crop = box('Moon in its corner of the sky', 720, 540); put(crop, await L.img('sky/moon/moon-in-sky-crop@2x.png', { w: 720 }))
const face = box('Tonight’s face, 12×', 420, 420, { back: LILAC }); put(face, await L.img('sky/moon/moon-tonight-2026-09-30.png', { w: 387, scale: 8 }), 16.5, 16.5)
const ST = 420
const states = [
  fig(await cropSky('sky/moon/moon-composite-tonight@8x.png', 192, MOON, ST, 'Moon · at rest'), 'At rest', 'The face over its white aureole: clear inside the limb (r 16), (22% + 14% × illumination) at the limb, 0 at r 48.', 'Chamber.swift:386-393'),
  fig(await cropSky('sky/moon/moon-composite-hover@8x.png', 192, MOON, ST, 'Moon · hover'), 'Under the hand', 'White 50% at the limb → 0 at r 46, eased in over 0.3 s. Only when the moon can open (there are kept readings and the room is at rest) or its door is open; the cursor becomes a pointing hand.', 'Chamber.swift:360-367; Keeping.swift:993'),
  fig(await cropSky('sky/moon/moon-composite-took-glow-peak@8x.png', 192, MOON, ST, 'Moon · taking a reading'), 'Taking a reading (peak)', 'For one breath as it keeps a returned reading: white 70% to 0.17 of r 96, 28% at 0.42, 0 at the edge. 5 s, from 0.3 s after the return completes.', 'Keeping.swift:1083-1113, 1153-1169'),
]
L.add(moon, L.row([
  fig(crop, 'In its corner of the sky, 3×', 'A 240 × 180 pt crop of the whole sky round the moon (window x 964–1204, y 41–221): the aureole, the lilac pooling round it, two glints and some dust.', 'Chamber.swift:343-400'),
  fig(face, 'Tonight’s face, 12×', '30 September 2026, 21:00 Chicago: age 0.6512, 79% lit, WANING GIBBOUS. On flat lilac so the translucent ghost reads.', 'Moon.swift:22-33'),
  ...states,
], { gap: 32, align: 'MIN', name: 'The moon, and its three looks' }))
L.add(moon, L.text('The three looks: the app’s renders of the moon view, each over the resting backdrop at the moon, 2.2×.', 'caption'))

// Sixteen phases
const PH = await L.json('sky/moon/moon-phases.json')
const phaseCells = []
for (const p of PH.phases) {
  const t = box('Phase ' + (p.index + 1), 146, 146, { back: LILAC })
  put(t, await L.img(p.file, { w: 129, scale: 8 }), 8.5, 8.5)
  phaseCells.push(L.col([t, L.text(p.name, 'smallStrong', { w: 146 }), L.text(`age ${p.age.toFixed(4)} · ${Math.round(p.illumination * 100)}% lit`, 'code', { w: 146, size: 11 })], { gap: 4, name: 'Phase · ' + p.name + ' ' + p.age }))
}
L.add(moon, L.rule(null, { color: L.C.gold, alpha: 0.35 }), L.col([
  L.text('Sixteen phases', 'h2'),
  L.text('The same face through one synodic month, on the lilac of the sky. Waxing is lit from the right, waning from the left. The terminator is jagged where crater rims catch the light first.', 'body', { w: 1300 }),
  L.row(phaseCells, { gap: 20, name: 'Phases' }),
  L.specs([
    ['Age', 'frac((date − epoch) / 29.530588853 days); epoch 947,182,440 s after 1970 (6 January 2000, 18:14 UTC, a new moon)', 'Moon.swift:22-33'],
    ['Illumination', '(1 − cos 2π·age) / 2: 0 at new, 1 at full. The Moon card’s answer scales with it (As Above)', 'Moon.swift:33; Answers.swift:122-124'],
    ['Names', 'new moon (age < 0.03 or ≥ 0.97), waxing crescent < 0.22, first quarter < 0.28, waxing gibbous < 0.47, full moon < 0.53, waning gibbous < 0.72, last quarter < 0.78, waning crescent', 'Moon.swift:36-44'],
  ], { w: 2000, keyW: 140 }),
], { gap: 16, name: 'Sixteen phases' }))

// Colours and the per-pixel painting
const MC = [
  ['moon/highland', '#FFF9EE', 0.97, 'Highland, lit', 'Moon.swift:94'],
  ['moon/sea', '#DEDDF0', 0.88, 'Sea, lit', 'Moon.swift:95'],
  ['moon/limb', '#F7EDDB', 0.95, 'Warm limb', 'Moon.swift:96, 161'],
  ['moon/ghost-highland', '#B5BBE0', 0.44, 'Ghost highland, unlit', 'Moon.swift:97'],
  ['moon/ghost-sea', '#A6ACD6', 0.48, 'Ghost sea, unlit', 'Moon.swift:98'],
]
const sw = MC.map(([v, hex, a, name, src]) => {
  const s = L.swatch({ hex, alpha: a, name, value: `${hex} · ${Math.round(a * 100)}%`, usage: v, source: src, w: 196, h: 96 })
  const block = s.children[0]
  block.fills = [bindTo(L.solid(hex, a), v)]
  // Over lilac, as they sit on the sky.
  const under = box('On the sky', 196, 96, { back: LILAC, r: 12 })
  s.insertChild(0, under)
  under.appendChild(block); block.x = 0; block.y = 0
  return s
})
L.add(moon, L.rule(null, { color: L.C.gold, alpha: 0.35 }), L.row([
  L.col([
    L.row([L.text('Colours', 'h2'), L.chips(['akash', 'lesson'])], { gap: 16, align: 'CENTER' }),
    L.text('Akash asked for a prettier moon and sent Apple’s emoji moons as the reference (“texture and color”). A literal copy, with a saturated yellow lit side and a navy shadow, was “very out of theme”. What stayed was the idea: real seas and craters and a jagged terminator, in the sky’s own palette. Take a reference’s idea, not its palette.', 'body', { w: 1100 }),
    L.row(sw, { gap: 24, align: 'MIN', name: 'Moon colours (bound to the moon/ variables, over lilac)' }),
    L.text('Swatches are bound to the moon/ colour variables and shown over the sky’s lilac, because every moon colour is partly see-through.', 'caption', { w: 1100 }),
  ], { gap: 16 }),
  L.col([
    L.text('Painted per pixel', 'h2'),
    L.text('Not a picture but a small render of the real near side, made in code: 57 overlapping patches of dark lava seas (Procellarum, Imbrium, Serenitatis, Tranquillitatis, Crisium and more), about 61 named plains and bright young craters (Tycho with 18 rays, Copernicus 16, Kepler, Aristarchus) and 300 unnamed craters on the highlands, with ragged shores from fractal noise.', 'body', { w: 1180 }),
    L.specs([
      ['Size', 'radius 16 pt; an n × n image, n = ceil(2 × 16 × scale) + 2 (66 px at 2×); 3 × 3 supersampling, premultiplied sRGB', 'Moon.swift:49-177'],
      ['Sun', '(sin 2π·age, 0, −cos 2π·age): x east (right), y north (up), z toward you; the terminator is always vertical', 'Moon.swift:112-115, 181-183'],
      ['Day colour', 'mix(sea, highland, pale), pale = clamp((albedo − 0.44) / 0.56); fresh ground up to ×1.4; warm limb up to 35%; a low sun thins the light so the sky shows through near the terminator', 'Moon.swift:91-177'],
      ['Night colour', 'mix(ghost sea, ghost highland, pale) at 44–48%', 'Moon.swift:97-98'],
      ['Terminator', 'smoothstep of (light × 0.3 + dot(p, sun) × 0.7 + roughness × 0.22) over −0.012…0.038: crisp but ragged', 'Moon.swift:179-465'],
      ['Craters', 'seed 1969, the same on every launch; raster only, any scale', 'Moon.swift:349'],
    ], { w: 1180, keyW: 120 }),
  ], { gap: 16 }),
], { gap: 96, align: 'MIN', name: 'Colours and painting' }))

// The label, and the glow's timing
const lab = box('Label, 4×', 534, 72, { back: LILAC }); put(lab, await L.img('sky/moon/moon-label-tonight@8x.png', { w: 534, scale: 8 }))
const lab2 = box('Kept-night label, 4×', 451, 72, { back: LILAC }); put(lab2, await L.img('sky/moon/moon-label-kept-night-example@8x.png', { w: 451, scale: 8 }))
const NAMES = ['NEW MOON', 'WAXING CRESCENT', 'FIRST QUARTER', 'WAXING GIBBOUS', 'FULL MOON', 'WANING GIBBOUS', 'LAST QUARTER', 'WANING CRESCENT']
const nameCol = L.col(NAMES.map(n => L.text(n, 'body', { family: 'Didot', style: 'Regular', size: 13, lh: 18, ls: 45, alpha: 0.75, name: n })), { gap: 10, name: 'The eight names (Didot, 13 pt here; 8 pt in the app)' })
// The glow curve
const GC = await L.json('sky/moon/moon-took-glow-curve.json')
const CW = 720, CH = 220, PX = 48, PY = 20
const chart = L.frame({ name: 'Chart · the moon’s glow over 5 s', w: CW + PX + 20, h: CH + PY + 40, fill: '#FFFFFF', fillA: 0.6, r: 12, stroke: L.C.stroke })
line(chart, [[PX, PY + CH], [PX + CW, PY + CH]], { color: L.C.ink, alpha: 0.35, sw: 1, name: 'Axis · time' })
line(chart, [[PX, PY], [PX, PY + CH]], { color: L.C.ink, alpha: 0.35, sw: 1, name: 'Axis · strength' })
for (let s = 0; s <= 5; s++) { line(chart, [[PX + s * CW / 5, PY + CH], [PX + s * CW / 5, PY + CH + 5]], { color: L.C.ink, alpha: 0.35, sw: 1, name: 'Tick' }); lbl(chart, s + ' s', PX + s * CW / 5 - 8, PY + CH + 10) }
for (const k of [0.28, 0.4]) line(chart, [[PX + k * CW, PY], [PX + k * CW, PY + CH]], { color: L.C.blood, alpha: 0.4, sw: 1, dash: [4, 4], name: 'Keyframe ' + k })
lbl(chart, '1', 30, PY - 6); lbl(chart, '0', 30, PY + CH - 8)
line(chart, GC.samples.map(p => [PX + p.t / 5 * CW, PY + CH - p.strength * CH]), { name: 'Glow strength (samples every 0.25 s)', sw: 2.5 })
L.add(moon, L.rule(null, { color: L.C.gold, alpha: 0.35 }), L.row([
  L.col([
    L.text('The label', 'h2'),
    L.row([L.col([lab, L.text('Tonight, the app’s render at 4×', 'caption')], { gap: 6 }), L.col([lab2, L.text('Door open: the night that reading was asked', 'caption')], { gap: 6 })], { gap: 24 }),
    L.specs([
      ['Type', 'Caps/Moon: Didot 8 pt, tracking 3.6 pt, capitals, centred, one line', 'RootView.swift:737-740; Palette.swift:88-100'],
      ['Colour', 'text #26201C at 40% (the phase); 55% (the kept date)', 'RootView.swift:739; Keeping.swift:1036'],
      ['Place', 'centred 36 pt below the moon’s centre (16 + 20)', 'RootView.swift:740'],
      ['Behaviour', 'quiets to 10% as the question is held; leaves with the room when a reading is on the table; while the door is open the kept night’s date takes its place, cross-fading 0.6 s', 'RootView.swift:702, 741; Keeping.swift:1024-1045'],
      ['Date format', '“MMMM d” this year, “MMMM d, yyyy” in another (e.g. SEPTEMBER 18, 2025)', 'Keeping.swift:1015-1022'],
    ], { w: 1000, keyW: 120 }),
    L.chips([['claude', 'Claude chose · date only while the door is open']]),
  ], { gap: 16 }),
  L.col([L.text('The eight names, verbatim', 'h3'), nameCol, L.source('Moon.swift:37-44')], { gap: 12 }),
  L.col([
    L.text('The glow, and the other timings', 'h2'),
    chart,
    L.text('Opacity keyframes 0 → 1 → 1 → 0 at 0, 0.28, 0.40 and 1.0 of 5 s, each span eased with smoothstep, cubic-bezier(0.333, 0, 0.667, 1). Core Animation, so it costs the main thread nothing.', 'caption', { w: 788 }),
    L.specs([
      ['Glow', '5.0 s, from 0.3 s after the return completes; not reduced under Reduce Motion', 'Keeping.swift:1086-1093, 1153-1169'],
      ['Hover', '0.3 s ease-out, opacity 0 ↔ 1', 'Chamber.swift:366-367'],
      ['Another night', 'the face cross-fades 0.9 s ease-in-out when the door shows another reading’s night', 'Chamber.swift:368-372'],
      ['Hit target', 'a 60 pt circle round the moon; the view is 96 × 96 (192 × 192 for the glow)', 'Chamber.swift:358, 374, 398; Keeping.swift:993'],
      ['Place', '(0.86 × stage w, max(70, 0.12 × stage h)) + the stage’s origin = (1083.6, 131.36) in the 1260 × 860 window', 'Chamber.swift:43-45, 175'],
    ], { w: 788, keyW: 120 }),
    L.chips([['akash', 'Akash decided · keep only returned readings'], ['claude', 'Claude chose · the glow’s look and timing']]),
  ], { gap: 16 }),
], { gap: 80, align: 'MIN', name: 'Label and timings' }))

// ---- 10. Seeded positions --------------------------------------------------------------------
const SP = await L.json('sky/positions/seeded-positions.json')
const pos = L.board({ name: MINE[1], kicker: 'THE SKY · LAYOUT', title: 'Seeded positions', w: 2400,
  lead: 'Every drifting thing is placed by a seeded generator (mulberry32), so the sky is the same composition on every launch. The map shows where everything stands in the default window.', leadW: 1300, tags: ['claude'] })
const MW = 1560, MK = MW / 1260
const map = await L.svg('sky/positions/seeded-positions-map.svg', { w: MW }); map.name = 'Map · seeded positions (diagram)'
const mapBox = L.frame({ name: 'Map with glint numbers', w: MW, h: 860 * MK, clip: true })
put(mapBox, map)
const GL = (SP.glints || SP.glint || [])
GL.forEach((g, i) => { const t = L.text(String(i + 1), 'label', { family: 'Inter', style: 'Bold', size: 12, lh: 14, color: L.C.blood, alpha: 1 }); put(mapBox, t, g.x * 1260 * MK + 12, g.y * 860 * MK - 22); t.name = 'Glint ' + (i + 1) })
const legend = L.col([
  L.text('Legend', 'h3'),
  ...[
    ['#C9A82F', 'The nine ray wedges from the dawn point'], ['#97782F', 'The wheel’s rings'], ['#8F6C21', 'Blooms, as circles at their radii'],
    ['#8F6C21', 'Glints at their peak arm length (numbered in seed order; crosses here are map marks, not the glint’s look)'], ['#8C2E25', 'Dashed: where no glint may stand (the words’ place)'],
    ['#C9A82F', 'Mote lanes along the foot, and the motes where they stood at the stills’ moment'], ['#26201C', 'The moon and its aureole (r 48); the title bar strip'], ['#8F6C21', 'The hold ring (R and 1.2 R) round the deck'],
  ].map(([c, s]) => L.row([L.frame({ name: 'Key', w: 16, h: 3, fill: c }), L.text(s, 'small', { w: 560 })], { gap: 10, align: 'CENTER' })),
  L.rule(null, { color: L.C.rule }),
  L.specs([
    ['Motes', 'seed 4231 · 46', 'Chamber.swift:108'],
    ['Blooms', 'seed 7707 · 13', 'Chamber.swift:128'],
    ['Glints', 'seed 3301 · 11, rejection-sampled out of the words’ box', 'Chamber.swift:142-153'],
    ['Rays', 'seed 1919 · 9', 'Chamber.swift:320'],
    ['Given dust', 'seed 911 + the letter’s index', 'Chamber.swift:596'],
    ['Moon craters', 'seed 1969 · 300', 'Moon.swift:349'],
    ['Wheel pen', 'seed 1212', 'CardArt.swift:495'],
    ['Generator', 'Rng = mulberry32', 'Ink.swift:10-24'],
  ], { w: 600, keyW: 120 }),
  L.text('All the numbers are in sky/positions/seeded-positions.json (fractions of the full window, radii, rates and phases), recomputed with a port of the generator and matched to the renders.', 'caption', { w: 600 }),
], { gap: 10, w: 600, name: 'Legend' })
L.add(pos, L.row([mapBox, legend], { gap: 96, align: 'MIN' }))
const gRows = GL.map((g, i) => [String(i + 1), g.x.toFixed(4) + ', ' + g.y.toFixed(4), Math.round(g.x * 1260) + ', ' + Math.round(g.y * 860), g.size.toFixed(2), (2 * Math.PI / g.rate).toFixed(1) + ' s'])
const BL = SP.blooms || []
const bRows = BL.map((b, i) => [String(i + 1), b.x.toFixed(4) + ', ' + b.y.toFixed(4), b.r.toFixed(1) + ' pt', b.alpha.toFixed(2), (2 * Math.PI / b.speed).toFixed(0) + ' s'])
const cols = (a, b, c, d, e) => [{ key: 0, label: a, w: 40 }, { key: 1, label: b, w: 170, style: 'code' }, { key: 2, label: c, w: 110, style: 'code' }, { key: 3, label: d, w: 80, style: 'code' }, { key: 4, label: e, w: 90, style: 'code' }]
L.add(pos, L.row([
  L.col([L.text('The eleven glints', 'h3'), L.table(cols('#', 'x, y (fraction)', 'window pt', 'size', 'period'), gRows, { name: 'Glints' }), L.source('Chamber.swift:136-153 · period = 2π / rate')], { gap: 10 }),
  L.col([L.text('The thirteen blooms', 'h3'), L.table(cols('#', 'x, y (fraction)', 'radius', 'alpha', 'x period'), bRows, { name: 'Blooms' }), L.source('Chamber.swift:122-134 · period = 2π / speed')], { gap: 10 }),
  L.col([
    L.note({ w: 560, tags: ['open'], title: 'A frozen sky nobody chose', body: 'Under Reduce Motion the near sky is frozen at t = 0, so glints 2, 5, 6, 7 and 10 stay part-lit and every mote sits at its t = 0 place. Harmless, but it is a fixed composition that was never designed.', source: 'Chamber.swift:444, 509-511' }),
    L.note({ w: 560, tags: ['fixed'], title: 'Positions move a little', body: 'These are resting places. Blooms wander ±3% / ±2% and drift −22 / −14 pt with the pointer; glints drift −16 / −11 pt; motes climb and sway.', source: 'Chamber.swift:486-517, 550-577' }),
  ], { gap: 16 }),
], { gap: 64, align: 'MIN' }))

// ---- 11. Frame rates -------------------------------------------------------------------------
const fr = L.board({ name: MINE[2], kicker: 'THE SKY · ENGINEERING', title: 'Frame rates', w: 1600,
  lead: 'The near sky runs on its own Metal clock and only goes fast when something is happening. Everything else in the sky is drawn once and faded by opacity.', tags: ['measured'] })
L.add(fr, L.table([
  { key: 'a', label: 'State', w: 200, style: 'smallStrong' }, { key: 'b', label: 'Frame rate', w: 220, style: 'code' }, { key: 'c', label: 'When', w: 560 }, { key: 'd', label: 'Source', w: 360, style: 'code' },
], [
  ['Calm', '30–60, preferred 60', 'the room at rest, breathing; a reading on the table', 'SkyRenderer.swift:416-421'],
  ['Lively', '60–120, preferred 120', 'holding in the ask, the charge moving, or for 2.3 s after a flash (each flash renews it)', 'SkyRenderer.swift:416-421; Game.swift:812-822'],
  ['Paused', '0', 'the window can’t be seen, or Reduce Motion (then a still sky, redrawn only when what it shows changes)', 'SkyRenderer.swift:325-328, 398-408'],
  ['Still', 'once', 'the render tool: read back from the GPU as one image', 'SkyRenderer.swift:494-505'],
  ['Charge fades', '30 Hz', 'SwiftUI’s clock for the charge-driven opacities, only while the charge moves', 'RootView.swift:928'],
], { name: 'Frame rates' }))
for (const row of fr.children[fr.children.length - 1].children.slice(1)) L.linkRefs(row.children[3])
L.add(fr, L.row([
  L.note({ w: 464, tags: ['measured'], title: 'What it costs', body: 'Idle, the app takes about 9–10% of one core on Akash’s M4 Pro. A SwiftUI pass costs about 5.5 ms in this window, which is why large things never animate in SwiftUI and the gradients’ colours are never animated (that forces a repaint on the CPU).', source: 'Chamber.swift:183-234' }),
  L.note({ w: 464, tags: ['claude', 'measured'], title: 'Why Metal', body: '“I love how good it looks” — Akash asked whether it could be faster on their 120 Hz display. Claude moved the near sky to Metal, pixel-faithful to the old SwiftUI drawing (about 0.02/255 mean difference).', source: 'SkyRenderer.swift:1-505' }),
  L.note({ w: 464, tags: ['fixed'], title: 'How a frame is made', body: 'Each frame is at most 1024 soft shapes worked out from the time, drawn for the moment it will be seen and handed to the GPU one at a time: it skips ticks rather than queueing them. The layer never takes a click.', source: 'SkyRenderer.swift:309-492' }),
], { gap: 32, align: 'MIN' }))
L.add(fr, L.note({ w: 1456, tags: ['open'], title: 'The sky never quickens for the return', body: 'The sky goes lively only for the ask, never for the return (a comment in the code says “the sky never answers the return”). It may follow the design panel’s rule that gold never re-appears on the way out; whose choice it was is not recorded.', source: 'Chamber.swift:418' }))

// ---- 12. Open questions ----------------------------------------------------------------------
const oq = L.board({ name: MINE[3], kicker: 'THE SKY · OPEN', title: 'Open questions', w: 1600,
  lead: 'Things a designer should decide or check. Some were found by reading the code and have not been seen in the app; each says so.', tags: ['open'] })
const Q = [
  ['Reduce Motion may not fill the arc', 'The Metal clock is paused under Reduce Motion and a still sky is redrawn only at press, release, the cut and rest. So the charge arc probably jumps from 0 to full at the cut while the words still fade. Not verified in the app.', 'Chamber.swift:419-426, 437-439; SkyRenderer.swift:325-328, 398-408'],
  ['A northern-hemisphere moon', 'The moon is always drawn as seen from the north, with a vertical terminator and no tilt for latitude or the time of night. “The sky over the table is the sky over the reader” holds only in the north.', 'Moon.swift:7-8, 112-115, 181-183'],
  ['Yesterday’s moon', 'Tonight’s phase is read only when the views redraw (no clock, to keep idle CPU low). A window left alone across a phase boundary may show yesterday’s moon or name. Not verified.', 'RootView.swift:738; Chamber.swift:355'],
  ['A softer wheel', 'The wheel is a 1500 px bitmap shown at 1663 pt, under 1 px per point on Retina, and in Device RGB while the rest of the sky is sRGB. Invisible at 5.5%; exports should use the vector.', 'Chamber.swift:66-71, 220'],
  ['Motes don’t follow the pointer', 'Blooms and glints drift with the pointer in slow parallax; the dust doesn’t. Whether that is deliberate is not recorded.', 'Chamber.swift:490-491, 513, 556-557'],
  ['The cut’s flash overshoots', 'The cut asks for 0.85 × 1.4 = 1.19 alpha at the bloom’s centre, clamped to 1, so its first frames are a flat white disc. Probably intended (“first light”), but the numbers overshoot.', 'Chamber.swift:623-626; SkyRenderer.swift:28-32'],
  ['Glow and hover under Reduce Motion', 'The moon’s 5 s glow and its hover halo are not reduced under Reduce Motion. They only change opacity, so this is arguably fine.', 'Keeping.swift:1153-1169; Chamber.swift:366-367'],
  ['Two alphas in one place', 'The phase name is 40% and the kept date that replaces it is 55%, in the same style and place. Should they match?', 'RootView.swift:739; Keeping.swift:1036'],
  ['A frozen composition', 'Under Reduce Motion the near sky freezes at t = 0 with five glints part-lit (see Seeded positions).', 'Chamber.swift:444, 509-511'],
]
const qn = Q.map(([t, b, s]) => L.note({ w: 464, tags: ['open'], title: t, body: b, source: s }))
for (let i = 0; i < qn.length; i += 3) L.add(oq, L.row(qn.slice(i, i + 3), { gap: 32, align: 'MIN', name: 'Questions ' + (i + 1) + '–' + (i + 3) }))

L.add(sec, moon, pos, fr, oq)
const want = ['Sky & moon · Header', 'Sky & moon · The layer stack', 'Sky & moon · Rebuilt in Figma', 'Sky & moon · Charge 0 and 1', 'Sky & moon · The near sky', 'Sky & moon · The hold ring, flashes and given dust', 'Sky & moon · The engraved wheel', 'Sky & moon · The rays', ...MINE]
const kids = [...sec.children].sort((a, b) => { const i = want.indexOf(a.name), j = want.indexOf(b.name); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) })
kids.forEach((k, i) => sec.insertChild(i, k))
L.fit(sec)
await L.arrange('Design system')
const out = []
for (const b of [moon, pos, fr, oq]) out.push(await L.snap(b, 'pages/sky-moon/' + b.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: out.length ? 300 : 1500 }))
return { out, glints: GL.length, blooms: BL.length }
