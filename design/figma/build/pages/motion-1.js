// Chapter: Motion, step 1 of 4 (header, principles, curves). Clears the chapter.
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/motion-1.js
const L = S.lib, F = S.fb
const sec = await L.chapter('Motion')
const GOLD = '#8F6C21', LIT = '#D9A934', INK = '#26201C', LILAC = '#6E5BA8', SKY = '#2F5E9E', ROSE = '#B0473C'
// cubic-bezier(x1, y1, x2, y2) as a function of t (SwiftUI easeOut = (0, 0, 0.58, 1), easeInOut = (0.42, 0, 0.58, 1))
const bez = (x1, y1, x2, y2) => t => {
  if (t <= 0) return 0; if (t >= 1) return 1
  let u = t
  for (let i = 0; i < 12; i++) { const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t; const dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2); if (Math.abs(dx) < 1e-6) break; u -= x / dx; u = Math.max(0, Math.min(1, u)) }
  return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u
}
const easeOut = bez(0, 0, 0.58, 1), easeInOut = bez(0.42, 0, 0.58, 1)

// ---- Header -------------------------------------------------------------------------------------------
const head = L.board({ name: 'Motion · Header', kicker: 'FOUNDATIONS', title: 'Motion', w: 1600,
  lead: 'Arcana moves like breath and ink, not like software. The room breathes on a 10 s cycle, every ritual is a 3.2 s hold, and everything written arrives as wet gold that cools to ink. Motion is light: opacity, blur and transform, never layout.' })
L.add(head, F.intro(['Principles', 'Curves', 'All 47 motion tokens', 'One reading, start to finish', 'Frame strips']))
L.add(head, L.row([
  L.note({ w: 346, tags: ['claude', 'shipped'], title: 'Where these came from', body: 'The breath, the hold, the self-writing cards and the chord were built by Claude in the first (dark) direction on 23 Sep and kept when Akash moved the app to first light.' }),
  L.note({ w: 346, tags: ['panel'], title: 'The Return', body: 'The closing hold (ink sinking into the stock, last drawn first, then the cards turning face down) was the design panel’s pick on 24 Sep, approved by Akash.' }),
  L.note({ w: 346, tags: ['fixed'], title: 'Timings are the code’s', body: 'Every duration here is read from the source. Springs are SwiftUI’s (response, damping); their curves are drawn from its spring model.', source: 'Game.swift:36-39' }),
  L.note({ w: 346, tags: ['fixed'], title: 'Figma can’t animate these', body: 'The curves and the timeline are drawn natively; the frame strips are real renders from the app’s own code.' }),
], { gap: 24, name: 'Notes' }))
L.add(sec, head)

// ---- Principles ----------------------------------------------------------------------------------------------
const bP = L.board({ name: 'Motion · Principles', kicker: 'MOTION', title: 'Principles', titleStyle: 'h1', w: 2400,
  lead: 'Five rules cover almost every moving thing in the room.' })
const breath = t => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 10)
const colW = 420
const pcol = (kids) => L.col(kids.filter(Boolean), { gap: 10, w: colW, name: 'Principle' })
// gold cooling swatches bound to the colour variables
const vars = await figma.variables.getLocalVariablesAsync('COLOR')
const swatch = async (varName, hex, label, sub) => {
  const r = figma.createRectangle(); r.name = 'Swatch · ' + varName; r.resize(128, 72); r.cornerRadius = 10
  let p = L.solid(hex); const v = vars.find(x => x.name === varName)
  if (v) p = figma.variables.setBoundVariableForPaint(p, 'color', v)
  r.fills = [p]; r.strokes = [L.solid('#000000', 0.06)]; r.strokeAlign = 'INSIDE'
  return L.col([r, L.text(label, 'smallStrong', { w: 128 }), F.mono(varName + '\n' + hex, { w: 128, size: 10, lh: 14 }), sub ? L.text(sub, 'caption', { w: 128 }) : null].filter(Boolean), { gap: 4, name: 'Cool step · ' + label })
}
const cool = L.row([
  await swatch('gold/light', '#ECCE6E', 'Nib', '0 – 0.15 s'),
  await swatch('gold/metal', '#C9A82F', 'Wet gold', 'from 0.15 s'),
  await swatch('ink/text', '#26201C', 'Ink', 'by 0.9 s, at 62%'),
], { gap: 12, name: 'Gold cools' })
L.add(bP, L.row([
  pcol([L.chips([['claude'], ['shipped']]), L.text('The 10 s breath', 'h2'),
    F.chart({ title: 'breath', w: colW, h: 170, t0: 0, t1: 30, ticks: [0, 10, 20, 30], tfmt: x => x + ' s', fns: [{ f: breath, color: GOLD }] }),
    F.mono('b = 0.5 − 0.5 cos(2π t / 10), t = wall clock', { w: colW, alpha: 0.9 }),
    L.text('Six breaths a minute. The blooms, the ring, the motes, the stars, the altar card’s float and halo, and the drone all breathe together. It is keyed to the wall clock, so a window brought back resumes in step. Reduce Motion holds it at 0.5.', 'small', { w: colW }),
    L.source('Chamber.swift:40-41; Sfx.swift:146, 431-460', { w: colW })]),
  pcol([L.chips([['claude'], ['shipped']]), L.text('The 3.2 s hold', 'h2'),
    F.chart({ title: 'hold', w: colW, h: 170, t0: 0, t1: 4, ticks: [0, 1.6, 2.4, 3.2, 4], tfmt: x => x + ' s', fns: [{ f: t => Math.min(1, t / 3.2), color: GOLD, name: 'held' }, { f: t => (t <= 1.6 ? t / 3.2 : Math.max(0, 0.5 - (t - 1.6) * 2 / 3.2)), color: ROSE, dash: [4, 3], name: 'let go at 1.6 s' }], legend: true, legendX: 60, legendY: 0 }),
    F.mono('charge += dt / 3.2 held · −2 dt / 3.2 let go', { w: colW, alpha: 0.9 }),
    L.text('Asking, returning and remembering are one gesture: press and hold for 3.2 s. The room quiets (1 − 0.9 c), the ink darkens (0.62 + 0.36 c), the ring draws its arc, the drone rises. Let go and it drains at twice the speed. Reduce Motion: 0.8 s.', 'small', { w: colW }),
    L.source('Game.swift:36-37, 201, 232, 245', { w: colW })]),
  pcol([L.chips([['claude', 'Claude chose · cards'], ['panel', 'Design panel · question'], ['shipped']]), L.text('Gold cools to ink', 'h2'), cool,
    L.text('Everything written arrives as wet gold and cools: a typed letter in 0.9 s, a card’s strokes as its 2.1 s writing runs, each stroke led by a bright nib. The one piece of gold on each card is laid as leaf and stays.', 'small', { w: colW }),
    L.source('Quill.swift:216-257; CardImages.swift:57-101, 146', { w: colW })]),
  pcol([L.chips([['measured'], ['claude']]), L.text('Light, not layout', 'h2'),
    L.bullets(['Opacity, blur, offset, scale, rotation', 'Glows and blooms drawn by Metal (the near sky) or Core Animation', 'Nothing re-lays out while it moves'], { style: 'small', w: colW, gap: 4 }),
    L.text('Measured on Akash’s 120 Hz Mac: one SwiftUI pass costs about 5.5 ms, so short transients such as the moon’s glow and the title’s light run in Core Animation, and the near sky runs on the GPU (60 fps calm, 120 lively). As Above was specified as opacity and transform only.', 'small', { w: colW }),
    L.source('Keeping.swift:1153-1169; RootView.swift:1040-1083; SkyRenderer.swift:312-316', { w: colW })]),
  pcol([L.chips([['claude'], ['shipped']]), L.text('Reduce Motion', 'h2'),
    L.bullets(['Holds take 0.8 s', 'Cards arrive written; letters are laid dry', 'No flashes, ripples, drift or blur-rise: words fade', 'Breath fixed at 0.5; the title and thread lights rest', 'The recital: 0.15 s between lines', 'As Above in 1.2 s', 'The flip still turns'], { style: 'small', w: colW, gap: 4 }),
    L.text('Only accessibilityReduceMotion is read. Increase Contrast and Reduce Transparency are ignored.', 'caption', { w: colW }),
    L.source('RootView.swift:12, 40-43; Game.swift:70; Chamber.swift:469-482', { w: colW })]),
], { gap: 48, align: 'MIN', name: 'Five principles' }))
L.add(sec, bP)

// ---- Curves -----------------------------------------------------------------------------------------------------
const bC = L.board({ name: 'Motion · Curves', kicker: 'MOTION', title: 'Curves', titleStyle: 'h1', w: 2400,
  lead: 'The eases and springs the room uses, drawn from their formulas. Springs follow SwiftUI’s model (response is the undamped period); settle times are to within 1%.' })
const W = 480, Hc = 230
const sp = (r, z, color, name) => ({ f: F.spring(r, z), color, name: `${name} ${r} / ${z} · settles ${F.settle(r, z).toFixed(2)} s` })
const legendBottom = (n) => Hc - 28 - 14 - 18 * n - 6
const cards = [
  F.chartCard({ title: 'ease/ramp · the house ease', w: W, h: Hc, fns: [{ f: F.smooth, color: GOLD, name: 'smoothstep' }, { f: t => t, color: INK, alpha: 0.35, dash: [4, 3], name: 'linear' }], legend: true, legendX: 330, legendY: legendBottom(2), ticks: [0, 0.5, 1],
    formula: 't²(3 − 2t) ≈ cubic-bezier(0.333, 0, 0.667, 1)', body: 'Every progress-driven fade, the As Above curves and the moon’s glow. Core Animation uses the cubic twin.', source: 'Palette.swift:129-133; Keeping.swift:1161-1164' }),
  F.chartCard({ title: 'ease/nib · a stroke being laid', w: W, h: Hc, fns: [{ f: t => 1 - Math.pow(1 - t, 2.2), color: GOLD, name: '1 − (1 − t)^2.2' }, { f: F.smooth, color: INK, alpha: 0.35, dash: [4, 3], name: 'smoothstep' }], legend: true, legendX: 320, legendY: legendBottom(2), ticks: [0, 0.5, 1],
    formula: '1 − (1 − t)^2.2 ≈ cubic-bezier(0.2, 0.6, 0.35, 1)', body: 'How far each card stroke is laid over its own span: quick to start, careful to finish.', source: 'CardImages.swift:146' }),
  F.chartCard({ title: 'Springs · cards', w: W, h: Hc, t0: 0, t1: 1.8, y1: 1.12, ticks: [0, 0.5, 1, 1.5], tfmt: x => x + ' s', legend: true, legendX: 150, legendY: legendBottom(4),
    fns: [sp(0.64, 0.76, GOLD, 'take'), sp(0.72, 0.8, SKY, 'deal'), sp(0.8, 0.86, ROSE, 'home'), sp(1.1, 0.86, LILAC, 'settle')],
    formula: '.spring(response, dampingFraction)', body: 'A card flying to its slot (take), the fan dealt (deal, per card), the spread going home (home), the reading settling into place (settle).', source: 'Game.swift:367, 467, 493; RootView.swift:408-411' }),
  F.chartCard({ title: 'Springs · the hand', w: W, h: Hc, t0: 0, t1: 1.8, y1: 1.12, ticks: [0, 0.5, 1, 1.5], tfmt: x => x + ' s', legend: true, legendX: 150, legendY: legendBottom(3),
    fns: [sp(0.3, 0.68, GOLD, 'ribbon lift'), sp(0.3, 0.7, SKY, 'hover lift'), sp(0.8, 0.86, ROSE, 'altar tilt')],
    formula: 'lift 38 (1 − d/2.5)^1.6 · hover −12 pt · tilt X −6°, Y 8°', body: 'Quick springs under the pointer: ribbon cards rising, a placed card lifting, the altar card turning toward the hand (interactive).', source: 'RootView.swift:304-311, 404, 406; RootView.swift:1558-1571' }),
  F.chartCard({ title: 'return/sink · ink into the stock', w: W, h: Hc, fns: [{ f: t => Math.pow(t, 1.8), color: GOLD, name: 'sink = p^1.8' }, { f: t => Math.pow(1 - t, 1.8), color: LILAC, name: 'remember (1 − p)^1.8' }], legend: true, legendX: 250, legendY: 30, ticks: [0, 0.5, 1],
    formula: 'face opacity = 1 − sink, p = progress through the card’s window', body: 'Each face fades off its pressed blank: grooves stay, the leaf stays, the type goes. Remembering a kept reading runs it backwards.', source: 'Game.swift:298-319; Keeping.swift:399-444' }),
  F.chartCard({ title: 'The return hold · three cards', w: W, h: Hc, t0: 0, t1: 3.2, ticks: [0, 0.96, 1.82, 2.69, 3.2], tfmt: x => x.toFixed(2), legend: true, legendX: 44, legendY: legendBottom(4),
    fns: [{ f: t => 1 - F.ramp(t / 3.2, 0.08, 0.30), color: INK, alpha: 0.5, dash: [4, 3], name: 'hush: the room fades' }, ...[[0.30, 'What Tends (last drawn)', ROSE], [0.435, 'What Is', SKY], [0.57, 'What Was', GOLD]].map(([a, n, c]) => ({ f: t => { const p = Math.max(0, Math.min(1, (t / 3.2 - a) / 0.27)); return 1 - Math.pow(p, 1.8) }, color: c, name: n }))],
    formula: 'stagger s = 0.54 / (n + 1); each window two staggers long; last drawn first', body: 'Face opacity of each card over the 3.2 s hold. Each card’s bowl sounds as its window opens. Let go and it drains back at twice the speed.', source: 'Game.swift:298-340' }),
  F.chartCard({ title: 'moon/glow · the moon takes a reading', w: W, h: Hc, t0: 0, t1: 5, ticks: [0, 1.4, 2, 5], tfmt: x => x + ' s', legend: true, legendX: 300, legendY: 0,
    fns: [{ f: t => { const k = t / 5; return k < 0.28 ? F.smooth(k / 0.28) : k < 0.40 ? 1 : 1 - F.smooth((k - 0.40) / 0.60) }, color: GOLD, name: 'glow' }],
    formula: 'keyframes 0 → 1 → 1 → 0 at 0, 0.28, 0.40, 1; smoothstep spans', body: 'Starts 0.3 s after the return completes and runs 5.0 s, in Core Animation.', source: 'Keeping.swift:1087-1094, 1153-1169' }),
  F.chartCard({ title: 'A card lands · flash and halo', w: W, h: Hc, t0: 0, t1: 2.5, ticks: [0, 0.3, 0.65, 1.3, 2.25], tfmt: x => x + ' s', legend: true, legendX: 300, legendY: 0,
    fns: [{ f: t => (t < 1.3 ? Math.pow(1 - t / 1.3, 2) : 0), color: ROSE, name: 'flash alpha k², 1.3 s' }, { f: t => (t < 0.3 ? easeOut(t / 0.3) : t < 0.65 ? 1 : t < 2.25 ? 1 - easeInOut((t - 0.65) / 1.6) : 0), color: GOLD, name: 'halo flare' }],
    formula: 'flare: 0.3 s easeOut up, hold 0.35 s, 1.6 s easeInOut down', body: 'At landing the sky flashes (radius 70 → 310) and the card’s halo flares; the same flare marks each line as it is spoken.', source: 'Chamber.swift:619-627; Game.swift:551-559' }),
]
L.add(bC, L.row(cards.slice(0, 4), { gap: 48, align: 'MIN', name: 'Curves row 1' }))
L.add(bC, L.row(cards.slice(4), { gap: 48, align: 'MIN', name: 'Curves row 2' }))
L.add(sec, bC)

L.fit(sec)
await L.arrange('Design system')
const out = []
for (const b of [head, bP, bC]) out.push(await L.snap(b, 'pages/motion/' + b.name.replace(/[^\w]+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: 600 }))
return out
