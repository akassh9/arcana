// Chapter: Sky & moon (Design system), step 2 of 3: the near sky, the ring/flashes/given dust, the wheel, the rays.
//   node design/figma/bridge/run.mjs design/figma/build/pages/sky-moon-2.js
const L = S.lib
const sec = await L.chapter('Sky & moon', { clear: false })
const MINE = ['Sky & moon · The near sky', 'Sky & moon · The hold ring, flashes and given dust', 'Sky & moon · The engraved wheel', 'Sky & moon · The rays']
for (const c of [...sec.children]) if (MINE.includes(c.name)) c.remove()
const BACK = 'sky/backdrop/backdrop-composite-charge-0-1260x860.png'
const SKYBLUE = '#CCDBF5'

// ---- local helpers -------------------------------------------------------------------------
const box = (name, w, h, o = {}) => L.frame({ name, w, h, r: o.r == null ? 10 : o.r, clip: true, fill: o.back, stroke: '#000000', strokeA: 0.08 })
const put = (f, n, x = 0, y = 0) => { f.appendChild(n); n.x = x; n.y = y; return n }
// A full-window overlay (1260×860 pt) laid over the resting backdrop, scaled to width w.
const overSky = async (path, w, name) => {
  const h = Math.round(860 * w / 1260)
  const f = box(name || 'Over the sky · ' + path.split('/').pop(), w, h)
  put(f, await L.img(BACK, { w, name: 'Backdrop (real render, at rest)' }))
  put(f, await L.img(path, { w, name: 'Render · ' + path.split('/').pop() }))
  return f
}
// A square overlay (pt × pt, centred on window point c) over the backdrop crop, shown tw wide.
const cropSky = async (path, pt, c, tw, name) => {
  const k = tw / pt
  const f = box(name || 'Crop · ' + path.split('/').pop(), tw, tw)
  put(f, await L.img(BACK, { w: 1260 * k, name: 'Backdrop (real render, at rest)' }), tw / 2 - c[0] * k, tw / 2 - c[1] * k)
  if (path.endsWith('.svg')) { const v = await L.svg(path, { w: tw }); put(f, v) } else put(f, await L.img(path, { w: tw }))
  return f
}
const zoom = async (path, tw, back, name) => { const f = box(name || 'Close-up · ' + path.split('/').pop(), tw, tw, { back }); put(f, await L.img(path, { w: tw })); return f }
const cap = (title, body, src, w) => L.col([
  title ? L.text(title, 'smallStrong', { w }) : null,
  body ? L.text(body, 'small', { w }) : null,
  src ? L.source(src, { w }) : null,
], { gap: 4, name: 'Caption · ' + (title || '') })
const fig = (node, title, body, src) => L.col([node, cap(title, body, src, node.width)], { gap: 10, name: 'Figure · ' + title })

// ---- 5. The near sky: dust, blooms, glints ------------------------------------------------
const near = L.board({ name: MINE[0], kicker: 'THE SKY · NEAR SKY', title: 'The near sky', w: 2800,
  lead: 'The only part of the sky that moves by itself, drawn by Metal: 46 motes of gold dust, 13 lens blooms and 11 glints. Everything breathes together on one 10 s cosine, six breaths a minute, in phase with the drone.', leadW: 1400, tags: ['shipped'] })
const FW = 864
L.add(near, L.row([
  fig(await overSky('sky/near/field-motes-charge-0-1260x860@2x.png', FW, 'Field · 46 motes'), 'Gold dust · 46 motes', 'Rising slowly on warm air from 8% below the window to 8% above it, swaying and flickering; fading in over the first quarter of the climb and out over the last third. Seed 4231.', 'Chamber.swift:93-120, 550-577'),
  fig(await overSky('sky/near/field-blooms-1260x860@2x.png', FW, 'Field · 13 blooms'), 'Lens blooms · 13', 'Soft white discs, like sun through a lens, wandering very slowly (periods 90–314 s) and breathing, each with a hair-thin gold rim. Seed 7707.', 'Chamber.swift:122-134, 486-498'),
  fig(await overSky('sky/near/field-glints-1260x860@2x.png', FW, 'Field · 11 glints'), 'Glints · 11', 'Places round the edges where the light catches gold for a moment; none in the middle of the stage, where the words are. This still catches 8 of the 11 lit. Seed 3301.', 'Chamber.swift:136-153, 500-528'),
], { gap: 32, align: 'MIN', name: 'Fields over the resting backdrop' }))
L.add(near, L.text('Each field is the app’s render alone, laid over the resting backdrop render.', 'caption'))

// Close-ups
const moteTiles = []
for (const s of ['0.6', '1.3', '2.0']) for (const c of [0, 1]) moteTiles.push(L.col([await zoom(`sky/near/mote-size-${s}-charge-${c}@16x.png`, 144, '#F9F7F2', `Mote ${s} · charge ${c}`), L.text(`size ${s} · charge ${c}`, 'code', { w: 144 })], { gap: 6 }))
const motes = L.col([
  L.text('Gold dust, 6× size', 'h3'),
  L.row(moteTiles, { gap: 12, name: 'Motes' }),
  L.specs([
    ['Core', 'disc, gold #C9A82F at a; radius size × (1 + 0.5 charge), size 0.6–2.0 pt', 'Chamber.swift:101, 572-575'],
    ['Halo', 'disc 3.6× the core, goldLit #ECCE6E at 22% × a', 'Chamber.swift:572-575'],
    ['a', 'alpha × edge × flicker × (0.8 + 0.2 breath) × (1 + 0.8 charge), at most 1', 'Chamber.swift:550-577'],
    ['Motion', 'one climb 28–100 s; sway 0.8–3.8% of the width, 28.6 s period; flicker 0.5–2.7 rad/s', 'Chamber.swift:550-577'],
    ['Held', 'pulled toward the deck and turned about it, gather = charge^1.4', 'Chamber.swift:553-567'],
  ], { w: 936, keyW: 110 }),
], { gap: 14, name: 'Close-up · dust' })
const bloomTiles = []
for (const [r, t] of [['9', 104], ['24', 224], ['39', 344]]) bloomTiles.push(L.col([await zoom(`sky/near/bloom-r-${r}@8x.png`, t, SKYBLUE, 'Bloom r ' + r), L.text(`r ${r} pt`, 'code')], { gap: 6 }))
const blooms = L.col([
  L.text('Lens blooms, 4× size, over flat sky blue', 'h3'),
  L.row(bloomTiles, { gap: 16, align: 'MAX', name: 'Blooms' }),
  L.specs([
    ['Glow', 'white 55% × a at the centre → 35% × a at r/2 → 0 at r', 'Chamber.swift:492-495; SkyRenderer.swift:175-179'],
    ['Rim', '0.8 pt ring at 0.92 r, gold at 10% × a', 'Chamber.swift:496'],
    ['Radius', '9 + u^1.5 × 30, so 9–39 pt (seeded)', 'Chamber.swift:131'],
    ['a', 'alpha 0.35–0.75 × (0.75 + 0.25 breath)', 'Chamber.swift:486-498'],
    ['Drift', '±3% of the width, ±2% of the height; parallax −22 / −14 pt against the pointer', 'Chamber.swift:489-497'],
  ], { w: 760, keyW: 110 }),
], { gap: 14, name: 'Close-up · blooms' })
L.add(near, L.row([motes, blooms], { gap: 96, align: 'MIN', name: 'Close-ups · dust and blooms' }))

// The fading glint: Akash's choice.
const glintTiles = []
for (const s of [3, 5, 7]) glintTiles.push(L.col([await zoom(`sky/near/glint-size-${s}-peak@16x.png`, 256, SKYBLUE, 'Glint size ' + s), L.text(`size ${s} · at its height`, 'code')], { gap: 6 }))
const twTiles = []
for (let i = 0; i < 9; i++) twTiles.push(await zoom(`sky/near/glint-twinkle-0${i}@16x.png`, 120, SKYBLUE, 'Twinkle ' + (i + 1)))
// Diagrams of the rejected and chosen shapes (drawn here from the description; the old crosses were not rendered as assets).
const diag = (kind) => {
  const f = L.frame({ name: 'Diagram · ' + kind, w: 256, h: 256, r: 10, fill: SKYBLUE, stroke: '#000000', strokeA: 0.08 })
  const ink = L.hex('#8F6C21')
  if (kind === 'rejected') {
    for (const [w, h] of [[10, 180], [180, 10]]) { const r = figma.createRectangle(); r.resize(w, h); r.x = 128 - w / 2; r.y = 128 - h / 2; r.fills = [{ type: 'SOLID', color: ink, opacity: 0.9 }]; r.name = w > h ? 'Level arm (equal)' : 'Upright arm (equal)'; f.appendChild(r) }
  } else {
    for (const [l, w, n] of [[100, 10, 'Upright arm'], [62, 10, 'Level arm (62%)']]) {
      const v = figma.createVector(); v.name = n
      const up = n.startsWith('Upright')
      const d = up ? `M ${w / 2} 0 L ${w} ${l} L ${w / 2} ${2 * l} L 0 ${l} Z` : `M 0 ${w / 2} L ${l} 0 L ${2 * l} ${w / 2} L ${l} ${w} Z`
      v.vectorPaths = [{ windingRule: 'NONZERO', data: d }]
      v.fills = [{ type: 'GRADIENT_DIAMOND', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [[0, 1], [0.25, 0.5625], [0.5, 0.25], [0.75, 0.0625], [1, 0]].map(([p, a]) => ({ position: p, color: Object.assign({}, ink, { a: a * 0.9 }) })) }]
      f.appendChild(v); v.x = 128 - v.width / 2; v.y = 128 - v.height / 2
    }
  }
  return f
}
const glint = L.col([
  L.row([L.text('The fading glint', 'h2'), L.chips(['akash', 'lesson'])], { gap: 16, align: 'CENTER' }),
  L.text('On 25 September Akash said the Star’s stars “look bad”: they were equal-armed gold crosses with square ends, which read as plus signs. Claude rendered five looks over the real sky (crosses, soft points, fading glints, the card’s eight-point star, a filled ✦ sparkle). Akash chose fading glints and asked that every glint in the sky take that shape.', 'body', { w: 1180 }),
  L.row([
    L.col([L.row(glintTiles, { gap: 16 }), L.text('The app’s render, 8× size, over flat sky blue. Four fine arms that thin to nothing, the upright pair longest, the level pair 62% as long, over a tiny warm glow.', 'caption', { w: 800 })], { gap: 10 }),
    L.col([L.row([
      L.col([diag('rejected'), L.text('Rejected · equal arms, square ends', 'smallStrong'), L.chips(['rejected'])], { gap: 6 }),
      L.col([diag('chosen'), L.text('Chosen · tapered, 62% level arms', 'smallStrong'), L.chips(['akash'])], { gap: 6 }),
    ], { gap: 16 }), L.text('Diagrams drawn in this file from the description. The old crosses are not among the rendered assets.', 'caption', { w: 528 })], { gap: 10 }),
  ], { gap: 64, align: 'MIN' }),
  L.row([
    L.col([L.text('One twinkle, frame by frame', 'smallStrong'), L.row(twTiles, { gap: 10, name: 'Twinkle frames' }), L.text('A size-5 glint across one swell: the arms grow and brighten to the middle frame, then die away.', 'caption', { w: 1160 })], { gap: 8 }),
    L.col([L.text('Brightness over one period', 'smallStrong'), await L.svg('sky/near/glint-brightness-curve.svg', { w: 480 }), L.text('Sharp, brief peaks (sine to the 6th power) and a long dark half: a glint, not a pulse. x = one period, 7.4–18 s by glint; y = brightness 0–0.8.', 'caption', { w: 480 })], { gap: 8 }),
  ], { gap: 64, align: 'MIN' }),
  L.specs([
    ['Arms', 'goldInk #8F6C21 at 55% × a; 1 pt wide at the heart, tapering linearly to 0; opacity (1 − t)² along the arm', 'Chamber.swift:515; SkyRenderer.swift:90-94, 154-160'],
    ['Length', 'upright 1.6 × size × (0.6 + 0.4 tw) each way (4.8–11.2 pt at the height); level arms 62% of it; size 3–7', 'Chamber.swift:147, 515'],
    ['Glow', 'goldLit #ECCE6E, r 5 pt, 70% × a → 0', 'Chamber.swift:516'],
    ['a', 'tw^6 × (0.8 + 0.2 charge), tw = max(0, sin(t × rate + phase)); lit about a third of each period', 'Chamber.swift:509-517'],
    ['Placement', 'x 0.05–0.95, y 0.05–0.90 of the window, never inside 0.28 < x < 0.72 when 0.10 < y < 0.80; parallax −16 / −11 pt', 'Chamber.swift:141-153, 513'],
    ['In SVG', 'two thin rhombi (tips at ±l and ±0.62 l), each filled from the heart outward with stops 1, 0.56, 0.25, 0.06, 0; the two arms combine by max, not by adding', 'SkyRenderer.swift:145-207'],
  ], { w: 1840, keyW: 120 }),
], { gap: 20, name: 'The fading glint' })
L.add(near, L.rule(null, { color: L.C.gold, alpha: 0.35 }), glint)

// ---- 6. The hold ring, flashes and given dust ------------------------------------------------
const ring = L.board({ name: MINE[1], kicker: 'THE SKY · NEAR SKY', title: 'The hold ring, flashes and given dust', w: 2800,
  lead: 'Two fine gold circles breathe round the squared deck: the invitation to press and hold. Holding fills a glowing gold arc clockwise from twelve o’clock; a full circle cuts the deck, and light goes out across the whole sky.', leadW: 1400, tags: ['shipped'] })
const DECK = [630, 662.7], RT = 400
const fill = []
for (const c of ['0.0', '0.25', '0.5', '0.75', '1.0']) fill.push(L.col([await cropSky(`sky/near/ring-charge-${c}@4x.png`, 360, DECK, RT, 'Ring · charge ' + c), L.text('charge ' + c, 'code')], { gap: 6 }))
fill.push(L.col([await cropSky('sky/near/ring-vector-charge-0.75.svg', 360, DECK, RT, 'Ring · vector, charge 0.75'), L.text('vector rebuild · charge 0.75 · editable', 'code')], { gap: 6 }))
L.add(ring, L.col([L.text('Filling, over the backdrop at the deck', 'h3'), L.row(fill, { gap: 24, name: 'Ring filling' }), L.text('The last tile is the ring rebuilt from its stroke specs as vector (ring-vector-charge-*.svg): within 0.01–0.04/255 of the Metal render.', 'caption')], { gap: 12, name: 'Filling' }))
const rest = []
for (const b of [0, 1]) rest.push(L.col([await cropSky(`sky/near/ring-rest-breath-${b}@4x.png`, 360, DECK, RT, 'Ring · breath ' + b), L.text(b ? 'at rest · top of the breath' : 'at rest · bottom of the breath', 'code')], { gap: 6 }))
for (const [i, s, c] of [[1, '0.40', 0.75], [2, '0.80', 0.5], [3, '1.20', 0.25], [4, '1.44', 0.1]]) rest.push(L.col([await cropSky(`sky/near/ring-draining-${i}-${s}s@4x.png`, 360, DECK, RT, 'Ring · draining ' + s), L.text(`after the cut · ${s} s · charge ${c}`, 'code')], { gap: 6 }))
L.add(ring, L.col([L.text('Breathing, and draining after the cut', 'h3'), L.row(rest, { gap: 24, name: 'Ring breathing and draining' })], { gap: 12 }))
L.add(ring, L.row([
  L.specs([
    ['Centre, radius', 'on the deck, (630, 662.7) in the window; R = 117.48 pt (fanH × 0.66); 89.1 pt at 940 × 660', 'Game.swift:863-864, 886-891'],
    ['Inner hairline', '1 pt goldInk at (0.26 + 0.14 breath) × shown, radius R × (1 + 0.02 breath)', 'Chamber.swift:535'],
    ['Outer hairline', '1 pt goldInk at (0.10 + 0.08 breath + 0.14 charge) × shown, radius 1.2 R × (1 + 0.035 breath + 0.05 charge)', 'Chamber.swift:532-534'],
    ['Charge arc', 'three round-capped strokes on R, clockwise from twelve: 14 pt goldLit at 0.20 + 0.18 charge, 6 pt goldLit at 45%, 1.8 pt goldInk at 95%', 'Chamber.swift:538-543'],
    ['Head spark', 'goldLit glow r 14 at 90% → 0, over a goldInk disc r 2.5', 'Chamber.swift:546-547'],
  ], { w: 1300, keyW: 150 }),
  L.specs([
    ['After the cut', 'shown = min(1, 1.5 × charge): full for about 0.53 s, then gone by 1.6 s', 'Chamber.swift:452'],
    ['Moon’s door, keys', 'out 0.45 s and back over 0.6 s (door); out 0.25 s, back 0.5 s (keys); smoothstep', 'Chamber.swift:453-466'],
    ['Table cleared', 'fades back in over 0.6 s', 'Chamber.swift:449-451'],
    ['Its caption', '“PRESS AND HOLD” under the ring, fading as 1 − charge (see The room)', 'RootView.swift:448-451'],
  ], { w: 1200, keyW: 150 }),
], { gap: 96, align: 'MIN', name: 'Ring specs' }))

// Flashes
const SW = 2656
const strip = async (path, name) => { const f = box(name, SW, Math.round(SW * 884 / 7644)); put(f, await L.img(path, { w: SW })); return f }
const FK = SW / 7644
const flashRow = (secs) => L.row(secs.map(s => L.text(s, 'code', { w: 1260 * FK })), { gap: 12 * FK, pad: [0, 0, 0, 12 * FK], name: 'Frame times' })
const T6 = ['0.00 s', '0.15 s', '0.35 s', '0.65 s', '1.00 s', '1.60 s']
L.add(ring, L.rule(null, { color: L.C.gold, alpha: 0.35 }), L.col([
  L.text('The flashes', 'h2'),
  L.text('When a card lands face up (strength 1, at its slot) or the deck is cut at the full charge (strength 1.5, at the deck), a white-gold bloom swells and fades on the spot while a ring of light goes out across the whole sky and thins away.', 'body', { w: 1300 }),
  L.text('A card landing · strength 1', 'smallStrong'), await strip('sky/near/flash-landing-strip-over-sky.png', 'Flash · landing strip'), flashRow(T6),
  L.text('The cut · strength 1.5', 'smallStrong'), await strip('sky/near/flash-cut-strip-over-sky.png', 'Flash · cut strip'), flashRow(T6),
  L.text('Six frames of the app’s render, each over the resting backdrop.', 'caption'),
  L.row([
    L.specs([
      ['Bloom', '1.3 s; white 85% × k² × s at the centre → goldLit 35% at r/2 → 0; k = 1 − age/1.3, s = min(strength, 1.4)', 'Chamber.swift:619-627; SkyRenderer.swift:28-32'],
      ['Bloom radius', '70 + (1 − k) × 240 × strength: 70 → 310 pt (landing), 70 → 430 pt (the cut)', 'Chamber.swift:622'],
    ], { w: 1280, keyW: 150 }),
    L.specs([
      ['Ripple', '2.2 s; two rings on one radius: 7 pt goldLit at 35% × fade and 1 pt goldInk at 45% × fade; fade (1 − k)^2.2', 'Chamber.swift:629-634'],
      ['Ripple radius', 'ease-out cubic, 30 → 550 pt (landing), 30 → 810 pt (the cut). Neither is drawn under Reduce Motion', 'Chamber.swift:631; Game.swift:466-479'],
    ], { w: 1280, keyW: 150 }),
  ], { gap: 96, align: 'MIN' }),
], { gap: 14, name: 'Flashes' }))

// Given dust
const gd = []
// Crop the window region between the question's line and the deck (x 370–890, y 250–710), at 1.6×.
const cropRect = async (path, x0, y0, w, h, k, name) => {
  const f = box(name, w * k, h * k)
  put(f, await L.img(BACK, { w: 1260 * k, name: 'Backdrop (real render, at rest)' }), -x0 * k, -y0 * k)
  put(f, await L.img(path, { w: 1260 * k, name: 'Render · ' + path.split('/').pop() }), -x0 * k, -y0 * k)
  return f
}
for (const c of ['0.5', '0.7', '0.9']) gd.push(fig(await cropRect(`sky/near/given-dust-charge-${c}-1260x860@2x.png`, 370, 250, 520, 460, 1.6, 'Given dust · charge ' + c), 'charge ' + c, null, null))
L.add(ring, L.rule(null, { color: L.C.gold, alpha: 0.35 }), L.col([
  L.text('The given dust', 'h2'),
  L.text('If you wrote a question, each letter gives up its gold as one mote while the question is held. The motes fall from their letters, turn in and spiral into the deck in the order they were written, and are taken under it as they arrive. Let go, and each mote fades where it is while its letter inks again.', 'body', { w: 1300 }),
  L.row(gd, { gap: 32, align: 'MIN', name: 'Given dust frames' }),
  L.text('The given dust alone (31 letters), over the resting backdrop, cropped to the window between the question’s line (y ≈ 281) and the deck (y ≈ 663), at 1.6×. The words and the rest of the near sky are left out.', 'caption'),
  L.specs([
    ['Starts', 'once the charge passes 0.44; only while asking, never under Reduce Motion', 'Chamber.swift:468-469, 579-611'],
    ['Alpha', '0.9 × ramp(given, 0.3, 0.7) × (1 − ramp(flight, 0.9, 1))', 'Chamber.swift:583-611'],
    ['Path', 'the letter’s point, turned about the deck by (0.6–1.5) × u² rad and pulled in by (1 − u), u = flight 0–1; seed 911 + the letter’s index', 'Chamber.swift:579-611'],
  ], { w: 1600, keyW: 150 }),
], { gap: 14, name: 'Given dust' }))

// ---- 7. The engraved wheel -----------------------------------------------------------------
const wheel = L.board({ name: MINE[2], kicker: 'THE SKY · BACKDROP', title: 'The engraved wheel', w: 1600,
  lead: 'A great astrological chart engraved faintly across the whole sky, in the same unsteady pen as the cards. It is barely there (5.5%) and a little stronger while the question is held (10.5%).', tags: ['shipped'] })
const WW = 700
const w0 = await L.svg('sky/wheel/engraved-wheel.svg', { w: WW }); w0.name = 'Wheel · vector · unturned'
const w1 = await L.svg('sky/wheel/engraved-wheel-turned-30.svg', { w: WW }); w1.name = 'Wheel · vector · turned 30°'
L.add(wheel, L.row([
  fig(w0, 'Unturned · vector, full ink', 'Six rings, twelve house lines with a small ring in each house, 120 and 72 tick rings, a star of eight (two overlapping squares) and sixteen rays in the inner court. 241 paths.', 'CardArt.swift:492-526'),
  fig(w1, 'Turned one house (30° clockwise)', 'Where the upright Wheel of Fortune’s answer ends and stays (As Above). The houses and ticks land back on themselves; only the star of eight and the inner rays show the turn.', 'Answers.swift:151-158'),
], { gap: 56, align: 'MIN' }))
// Bitmap vs vector, same patch at 3×.
const patch = async (isVec) => {
  const f = box(isVec ? 'Patch · vector' : 'Patch · app bitmap', 330, 330, { back: '#F9F7F2' })
  const k = 3, side = 1663.2 * k
  let n
  if (isVec) n = await L.svg('sky/wheel/engraved-wheel.svg', { w: side })
  else n = await L.img('sky/wheel/engraved-wheel-bitmap-1500px.png', { w: side })
  put(f, n, 165 - (831.6 - 190) * k, 165 - (831.6 - 190) * k)
  return f
}
L.add(wheel, L.row([
  L.col([L.row([await patch(false), await patch(true)], { gap: 16 }), L.text('The same patch at 3×: the app’s 1500 px bitmap (left) and the vector (right). Shown at 1663 pt, the bitmap is under 1 px per point on Retina, so softer; at 5.5% nobody can see it.', 'caption', { w: 676 })], { gap: 10 }),
  L.specs([
    ['Size, place', 'square, side 1.32 × span (1663.2 pt at 1260 wide, 1240.8 at 940), centred on (stage w/2, 0.42 stage h) = (630, 379.76) in the window, so it overflows every edge', 'Chamber.swift:49-51, 220-222'],
    ['Ink', '#97782F as drawn (sky/wheel-ink); the code’s Generic RGB (0.52, 0.40, 0.14) in a Device RGB bitmap', 'Chamber.swift:65-90'],
    ['Opacity', '0.055 + 0.05 × charge: 5.5% at rest, 10.5% at full charge', 'Chamber.swift:222'],
    ['Pen', 'seeded (1212), so the wobble is the same on every launch', 'CardArt.swift:495'],
    ['In the app', 'a 1500 px bitmap made once; use the vector for design work', 'Chamber.swift:58-90'],
  ], { w: 720, keyW: 120 }),
], { gap: 56, align: 'MIN' }))

// ---- 8. The rays ---------------------------------------------------------------------------
const RAYS = [[-51.58, 2.51, 1.12, 0.215], [-40.03, 3.54, 1.066, 0.257], [-27.86, 4.02, 1.066, 0.239], [-16.09, 3.85, 0.954, 0.183], [2.86, 3.65, 0.993, 0.212], [13.09, 3.51, 0.864, 0.177], [24.38, 3.28, 1.185, 0.231], [42.27, 4.42, 0.853, 0.183], [55.9, 3.16, 0.902, 0.261]]
const rays = L.board({ name: MINE[3], kicker: 'THE SKY · BACKDROP', title: 'The rays', w: 1600,
  lead: 'Nine soft shafts of white light fan up from the dawn point, from about 52° left of vertical to 56° right. Each is a thin wedge filled with a radial gradient that fades along its length. Most run off the top of the window.', tags: ['shipped'] })
const rl = box('Layer · rays over grey', 820, Math.round(820 * 860 / 1260), { back: '#8F96A3' })
put(rl, await L.img('sky/backdrop/sky-layer-6-rays-1260x860.png', { w: 820 }))
const tbl = L.table([
  { key: 'n', label: 'Ray', w: 40 }, { key: 'a', label: 'Angle from up', w: 110, style: 'code' }, { key: 'h', label: 'Half-width', w: 90, style: 'code' }, { key: 'l', label: 'Length', w: 150, style: 'code' }, { key: 'o', label: 'Centre white', w: 100, style: 'code' },
], RAYS.map((r, i) => ({ n: String(i + 1), a: (r[0] > 0 ? '+' : '') + r[0].toFixed(2) + '°', h: r[1].toFixed(2) + '°', l: `${r[2].toFixed(3)} span · ${Math.round(r[2] * 1260)} pt`, o: Math.round(r[3] * 1000) / 10 + '%' })), { name: 'The nine rays' })
L.add(rays, L.row([
  fig(rl, 'The rays alone, over grey', 'White on transparent, at layer opacity 100%. In the sky the layer is 80%, and 100% at full charge.', 'Chamber.swift:214-215'),
  L.col([tbl, L.source('Chamber.swift:313-341 · seed 1919 · left to right; negative angles lean left'), L.specs([
    ['Origin', 'the dawn point (0.5 W, 1.04 H) = (630, 894.4), just below the foot of the window', 'Chamber.swift:54-56, 214'],
    ['Fill', 'radial white from the origin: centre white @0 → 6% @0.5 → 0 at the ray’s length', 'Chamber.swift:331-337'],
    ['Drawn', 'once, as Canvas paths, and again only on resize', 'Chamber.swift:313-341'],
    ['The Sun’s rays', 'the same nine, 1.4× longer and a touch brighter (As Above)', 'Answers.swift:250-292'],
  ], { w: 520, keyW: 110 })], { gap: 16 }),
], { gap: 56, align: 'MIN' }))

// Insert after the step-1 boards, in reading order.
L.add(sec, near, ring, wheel, rays)
const want = ['Sky & moon · Header', 'Sky & moon · The layer stack', 'Sky & moon · Rebuilt in Figma', 'Sky & moon · Charge 0 and 1', ...MINE]
const kids = [...sec.children].sort((a, b) => { const i = want.indexOf(a.name), j = want.indexOf(b.name); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) })
kids.forEach((k, i) => sec.insertChild(i, k))
L.fit(sec)
await L.arrange('Design system')
const out = []
for (const b of [near, ring, wheel, rays]) out.push(await L.snap(b, 'pages/sky-moon/' + b.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: out.length ? 300 : 1500 }))
return out
