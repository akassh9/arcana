// Experience & notes · Engineering notes (1 of 2) — header, what rendering costs, what is cheap and what is expensive.
// Run: node design/figma/bridge/run.mjs design/figma/build/pages/notes-kit.js design/figma/build/pages/engineering-1.js
const L = S.lib, N = S.nk
const CH = 'Engineering notes', PX = 'Engineering · '
const ORDER = ['Header', 'What rendering costs', 'Cheap and expensive changes', 'The codebase', 'How this file was made', 'Build and release'].map(n => PX + n)
const sec = await L.chapter(CH, { clear: false })
N.clearMine(sec, ORDER, ORDER.slice(0, 3))

// ---------- header -------------------------------------------------------------------------------
const head = N.header(PX + 'Header', {
  title: 'Engineering notes',
  lead: 'What to know before proposing changes. Arcana is one SwiftUI app of about 11,000 lines with no dependencies, and its look rests on a few measured rules. Some changes are a number in one file; others mean redrawing art in code.',
  toc: ['What rendering costs', 'Cheap and expensive changes', 'The codebase', 'How this file was made', 'Build and release'],
  notes: [
    { tags: ['measured'], title: 'Light moves by opacity', body: 'Animating a gradient’s colours repaints it on the CPU every frame. Fade fixed gradients instead.' },
    { tags: ['measured'], title: 'No always-on clocks', body: 'A SwiftUI clock costs about 5.5 ms per tick, whatever it draws. Transients run on Core Animation.' },
    { tags: ['lesson'], title: 'Check a real window', body: 'Renders have no title bar or safe area. Window-level layout must be checked in a live titled window.' },
    { tags: ['fixed'], title: 'Art is code', body: 'Every card, glyph and the moon are drawn by code, stroke by stroke or pixel by pixel. There are no image files to swap.' },
  ],
})
sec.appendChild(head)

// ---------- what rendering costs -------------------------------------------------------------------
const BW = 2300, IN = BW - 144, FW = Math.floor((IN - 2 * 32) / 3)
const rc = L.board({ name: PX + 'What rendering costs', kicker: 'ENGINEERING', title: 'What rendering costs', titleStyle: 'h1', w: BW, leadW: 1300,
  lead: 'Measured by Claude on Akash’s Mac (an M4 Pro MacBook Pro with a 120 Hz ProMotion display), 23–27 September, by interleaved A/B runs and medians of four. The numbers come from the build sessions’ notes; there is no benchmark in the repo. Percentages are of one CPU core.',
  tags: ['measured'] })
const FACTS = [
  ['5.5 ms', 'A SwiftUI clock costs a pass, whatever it draws', 'Any SwiftUI clock in the window costs about 5.5 ms per tick: layout, constraints, the graph update and a Core Animation commit. A 10 fps clock updating a 1 × 1 view adds about 5.5% of a core. Even a clock meant to tick every ten minutes raised idle from 9.2% to 11.5%; it was removed.', 'Don’t add an always-on clock. Re-read slow values when the phase or visibility changes.', 'RootView.swift:517-519, 825, 1040, 1417-1420'],
  ['opacity', 'Light is animated by opacity, never by colour', 'Animating a gradient’s colours makes SwiftUI repaint it on the CPU every frame. The card halos did this on every flare, about 18% of the main thread while cards landed. A fixed gradient with animated opacity took the landing from 40% to 37% and late frames from 18 to 1.', 'Glows and halos are fixed gradients whose opacity fades.', 'RootView.swift:463-478'],
  ['24 → 7.6%', 'Transients run on Core Animation', 'Anything that moves for more than a moment is a CALayer animation inside an NSViewRepresentable, reckoned from its start time, so SwiftUI doesn’t re-render. Moving As Above’s arrivals there took them from about 24% to 7.6% of a core.', 'A new transient goes to Core Animation, not a SwiftUI clock.', 'Answers.swift:347-380, 475 · Keeping.swift:1115-1169'],
  ['60 / 120 fps', 'The near sky is Metal', 'Dust, blooms, glints, the hold ring and its arc, ripples and the cut’s flash are one Metal shader on a display link: 30–60 fps when calm, 60–120 while lively. A Metal frame costs about 0.8 ms of CPU whatever it draws. It matches the old SwiftUI drawing to 0.02/255 on average.', 'Change the near sky, then re-run the pixel-parity check against a frozen render.', 'SkyRenderer.swift:380, 416-420 · Chamber.swift:412-560'],
  ['11.7 → 0.3%', 'The room rests when nobody is looking', 'Every clock pauses when the window isn’t visible or its view isn’t showing (the title’s light rests while the moon’s door is open), and the drone fades and the audio engine pauses. A hidden window went from 11.7% to 0.3%.', 'Anything new that moves pauses with game.visible.', 'RootView.swift:519, 715, 779, 1040, 1420'],
  ['32 pt', 'Renders have no safe area', 'ImageRenderer sees no title bar, so stage-only renders sit about 32 pt higher than the live window (a 1260 × 828 stage under a transparent 32 pt title bar). A white strip under the live sky showed in no render until Akash found it. ImageRenderer can’t see Metal or Core Animation layers either; the shot tool draws their specs in SwiftUI.', 'Check window-level layout in a real titled window.', 'Tools/shot/main.swift:14, 58 · Chamber.swift:254, 277, 414'],
  ['12.5 → 13', 'Font.custom rounds sizes to whole points', 'Every fractional size draws at the nearest whole point (halves round up, 12.25 → 12); Font.custom(_:fixedSize:) keeps it exact. Didot has no tracking table, so a width that looks tracked is this rounding. Only the written question (NSFont 19) is exact.', 'Spec drawn sizes, in whole points.', 'Palette.swift:82-84 · CardImages.swift:89-94'],
  ['10–12 ms', 'Painting is expensive, so it is cached', 'A moon face takes 10–12 ms to paint, so other nights are painted on a background task and the last six are kept. Card faces are rasterised once (about 2 ms each; the real cost lands on first draw), reused, and let go after a reading (memory 339 → 280 MB).', 'New art that changes per frame needs a cheaper route.', 'Moon.swift:58-69 · CardImages.swift:271'],
  ['150 ms', 'Known hitches, not fixed', 'About 150 ms at 60–75 fps when a card’s ink starts writing just as its flash goes out; the cut’s first frame takes about 22 ms; the open altar costs about 29.5% of a core (large blurs and 3D). Ideas not tried: the altar at 30 fps, an 8-bit window depth.', 'Motion added near these moments will make them worse.', 'Game.swift:466-487 · RootView.swift (Inspector)'],
]
const cards = FACTS.map(([big, t, body, rule, src]) => L.note({ w: FW, pad: 28, fillA: 0.8, kids: [
  L.text(big, 'title', { family: 'Didot', style: 'Bold', size: 44, lh: 52, color: L.C.gold, w: FW - 56 }),
  L.text(t, 'h3', { w: FW - 56, size: 18, lh: 26 }),
  L.text(body, 'small', { w: FW - 56 }),
  L.rich([['Rule  ', 'smallStrong', { color: '#2F6140' }], [rule, 'small', { alpha: 0.9 }]], 'small', { w: FW - 56 }),
  N.src(src, { w: FW - 56 }),
] }))
const grid = L.col([], { gap: 32, name: 'Facts' })
for (let i = 0; i < cards.length; i += 3) { const r = L.row(cards.slice(i, i + 3), { gap: 32, align: 'MIN', name: 'Facts row ' + (i / 3 + 1) }); L.add(grid, r); N.equalize(r.children) }
L.add(rc, grid)

// A dumbbell chart: before and after, % of one core.
const PAIRS = [
  ['A hidden window, idle', 11.7, 0.3, 'Everything pauses when unseen'],
  ['Cards landing', 40, 37, 'Halos faded by opacity, not colour'],
  ['As Above arriving', 24, 7.6, 'Moved to Core Animation'],
  ['Idle, with a 10-minute clock', 9.2, 11.5, 'Added, measured, removed'],
]
const CX = 1100, LBW = 360, MAXV = 40
const chart = L.col([L.text('Before and after, % of one core', 'h3')], { gap: 10, name: 'Chart · before and after' })
const axis = L.frame({ name: 'Axis', w: LBW + 24 + CX + 40, h: 20 })
for (const v of [0, 10, 20, 30, 40]) { const t = L.text(v + '%', 'code', { size: 11, lh: 14 }); axis.appendChild(t); t.x = LBW + 24 + (v / MAXV) * CX - t.width / 2; t.y = 0 }
L.add(chart, axis)
for (const [name, a, b2, why] of PAIRS) {
  const tr = L.frame({ name: 'Track', w: CX, h: 36 })
  for (const v of [0, 10, 20, 30, 40]) { const g = figma.createRectangle(); g.name = 'Grid'; g.resize(1, 36); g.fills = [L.solid(L.C.rule, 1)]; tr.appendChild(g); g.x = Math.min(CX - 1, (v / MAXV) * CX); g.y = 0 }
  const x1 = (a / MAXV) * CX, x2 = (b2 / MAXV) * CX
  const ln = figma.createRectangle(); ln.name = 'Change'; ln.resize(Math.max(2, Math.abs(x2 - x1)), 3); ln.fills = [L.solid(b2 < a ? '#2F6140' : '#8C2E25', 0.55)]; tr.appendChild(ln); ln.x = Math.min(x1, x2); ln.y = 16.5
  const d1 = figma.createEllipse(); d1.name = 'Before'; d1.resize(14, 14); d1.fills = [L.solid('#FFFFFF', 1)]; d1.strokes = [L.solid(L.C.ink, 0.5)]; d1.strokeWeight = 2; tr.appendChild(d1); d1.x = x1 - 7; d1.y = 11
  const d2 = figma.createEllipse(); d2.name = 'After'; d2.resize(14, 14); d2.fills = [L.solid(b2 < a ? '#2F6140' : '#8C2E25', 1)]; tr.appendChild(d2); d2.x = x2 - 7; d2.y = 11
  L.add(chart, L.row([L.text(name, 'body', { w: LBW, align: 'RIGHT' }), tr, L.col([L.text(a + '% → ' + b2 + '%', 'codeStrong'), L.text(why, 'caption')], { gap: 0, w: 340 })], { gap: 24, align: 'CENTER', name: 'Pair · ' + name }))
}
L.add(chart, L.text('Hollow dot: before. Filled dot: after (green if it fell, red if it rose).', 'caption', { w: 1400 }))
L.add(rc, chart)
sec.appendChild(rc)

// ---------- cheap and expensive changes ----------------------------------------------------------------
const ce = L.board({ name: PX + 'Cheap and expensive changes', kicker: 'ENGINEERING', title: 'Cheap and expensive changes', titleStyle: 'h1', w: BW, leadW: 1300,
  lead: 'Roughly what each kind of change costs to make and verify. Everything is in code, so “cheap” means a value in one known place, and “expensive” means drawing again.',
  tags: [['fixed', 'Engineering fact']] })
const COLS = [
  ['Cheap', 'minutes: one value in one place', '#2F6140', [
    ['Colours', 'The 17 palette colours and the leaf stops. Everything reads them.', 'Palette.swift:13-38'],
    ['Type sizes and tracking', 'Didot sizes and Caps tracking, set at each call site (19 Caps sites).', 'Palette.swift:82-92'],
    ['Words', 'Every string is a literal: the room, the keys, Settings. The cards’ words are one line per card per orientation; changing them also changes the agent reading (agent/deploy.sh regenerates deck.json).', 'RootView.swift · Legend.swift · Settings.swift · Deck.swift'],
    ['Layout numbers', 'Card, fan and slot sizes are formulas of the stage size; positions are fractions of it.', 'Game.swift:853-905'],
    ['Timings and levels', 'Durations of each beat, and every sound’s gain.', 'Game.swift:466-487 · Sfx.swift'],
  ]],
  ['Moderate', 'hours: new code, within the rules', '#8A4B12', [
    ['A new state or transition', 'Fine if it follows the rules: opacity not colour, Core Animation for transients, pausing when unseen.', 'Answers.swift:347-380'],
    ['A new glyph', 'Drawn by the pen as marks, like the key and the bowl; its SVG comes from design/figma/render/glyphs.', 'Ink.swift · Legend.swift'],
    ['A new sound', 'Synthesised at launch (no files), inside fixed pools of shared voices: 12 for the room’s air, 6 for the hand.', 'Sfx.swift:76-86, 331-337'],
    ['Window-level layout', 'Anything touching the title-bar inset or the sky’s frame needs a check in a real titled window.', 'RootView.swift:18-23'],
  ]],
  ['Expensive', 'days: drawing again, or a new route', '#8C2E25', [
    ['Card art', 'The 22 Majors and 56 minors are code, stroke by stroke. Inserting one stroke re-rolls the wobble of every later stroke on that card.', 'CardArt.swift · Suits.swift · Ink.swift:77-81'],
    ['The moon', 'Painted per pixel from real near-side seas and craters, 10–12 ms a face. A new look is new paint code.', 'Moon.swift'],
    ['The near sky', 'One Metal shader, pixel-matched to the old drawing; any change needs the parity check.', 'SkyRenderer.swift'],
    ['A different typeface', '29 of 78 card names already wrap in Didot; every size, break and centred layout would need re-checking.', 'CardImages.swift:81-88'],
    ['Always-on motion', 'About 5.5 ms per SwiftUI tick; it needs a Core Animation or Metal route instead.', 'RootView.swift:1040'],
  ]],
]
const cw = FW
const colNodes = COLS.map(([t, sub, c, items]) => L.col([
  L.col([L.text(t, 'h1', { color: c }), L.text(sub, 'small', { w: cw })], { gap: 2, name: 'Head' }),
  ...items.map(([h, b, s]) => L.col([L.text(h, 'bodyStrong', { w: cw }), L.text(b, 'small', { w: cw }), N.src(s, { w: cw })], { gap: 4, pad: [14, 0, 0, 0], name: 'Item · ' + h, w: cw })),
], { gap: 14, w: cw, name: 'Cost · ' + t }))
L.add(ce, L.row(colNodes, { gap: 32, align: 'MIN', name: 'Costs' }))
L.add(ce, L.note({ w: IN, tags: [['rejected', 'Not possible today']], title: 'Needs Apple’s paid signing', body: 'Widgets and notarization both need an Apple Developer team signature, which Arcana doesn’t have. The widget was scrapped for this reason; the app is ad hoc signed, so people choose Open Anyway once.', source: 'build.sh (codesign --sign -)' }))
sec.appendChild(ce)

N.sortIn(sec, ORDER)
L.fit(sec)
await L.arrange('Experience & notes')
return await N.snap([head, rc, ce], 'engineering', PX, { scale: 0.3 })
