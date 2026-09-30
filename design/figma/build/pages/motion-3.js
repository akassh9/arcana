// Chapter: Motion, step 3 of 4 (one reading, start to finish: a native timeline). Run after motion-2.js.
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/motion-3.js
const L = S.lib, F = S.fb
const sec = await L.chapter('Motion', { clear: false })
for (const n of sec.children.filter(n => n.name === 'Motion · One reading, start to finish')) n.remove()
const f2 = x => (Math.round(x * 100) / 100).toString()

// ---- the schedule (seconds). Person-paced moments are set to a plausible pace; the rest is the code's timing.
const T = { type0: 0, type1: 4.4, hold: 5.2, takes: [10.0, 11.6, 13.2], ret: 27.0 }
T.cut = T.hold + 3.2
T.read = T.takes[2] + 0.46 + 2.1 + 0.35           // Game.swift:489-494
T.q = T.read + 0.9                                // Game.swift:505-514
T.lines = [0, 1, 2].map(i => T.q + 1.8 + 1.45 * i) // Game.swift:515-527
T.chord = T.lines[2] + 1.45                       // Game.swift:529-534
T.kept = T.ret + 3.2
const settle = (r, z) => F.settle(r, z)
const NOTES = [['C4', 'bright', 5.5], ['E4', 'bright', 5.5], ['G3', 'dark', 6.5]] // What Was, What Is, What Tends (the Hermit reversed)
const SINK = [0.57, 0.435, 0.30]                  // window starts (of the hold) per slot; last drawn first
const lanes = [
  { name: 'You', sub: 'the person', fill: '#F6E2DF', tc: '#8C2E25', bars: [
    { s: T.type0, e: T.type1, l: 'type the question (your pace)', pace: true },
    { s: T.hold, e: T.cut, l: 'press and hold · 3.2 s' },
    ...T.takes.map((t, i) => ({ s: t, e: t + 0.12, l: 'take ' + (i + 1) + (i === 0 ? ' (your pace)' : '') })),
    { s: T.chord + 0.3, e: T.ret, l: 'the reading lies open (your pace)', pace: true },
    { s: T.ret, e: T.kept, l: 'hold to return · 3.2 s' },
  ] },
  { name: 'Words', sub: 'pen, question, verse', fill: '#DCE6F7', tc: '#2F4F80', bars: [
    { s: 0, e: 0.25, l: 'invitation breathes out' },
    { s: 0.22, e: T.type1 + 0.9, l: 'letters laid (nib 0.15 s), each cools to ink in 0.9 s' },
    { s: T.hold + 0.45 * 3.2, e: T.hold + 0.8 * 3.2, l: 'given as dust to the deck' },
    { s: T.q, e: T.q + 1.1, l: 'question read back · 1.1 s' },
    ...T.lines.map((t, i) => ({ s: t, e: t + 1.1, l: 'line ' + (i + 1) })),
    { s: T.chord, e: T.chord + 0.35, l: '‘HOLD · RETURN THE CARDS’ appears' },
    { s: T.ret + 0.26, e: T.ret + 0.96, l: 'hush: words fade' },
  ] },
  { name: 'Room & ring', sub: 'quiet, ring, rest', fill: '#E9E3F6', tc: '#54457F', bars: [
    { s: T.hold, e: T.cut, l: 'room quiets (1 − 0.9 c) · ring draws its arc' },
    { s: T.cut, e: T.cut + 1.6, l: 'ring holds, gone by 1.6 s' },
    { s: T.kept + 0.45, e: T.kept + 1.45, l: 'room returns · 1.0 s' },
    { s: T.kept + 0.6, e: T.kept + 1.2, l: 'ring back · 0.6 s' },
  ] },
  { name: 'Cards', sub: 'deck, flight, ink', fill: '#F1E6C6', tc: '#6B4F12', bars: [
    { s: T.cut, e: T.cut + 0.52 + settle(0.72, 0.8), l: 'deal: 78 springs 6.8 ms apart' },
    ...T.takes.flatMap((t, i) => [
      { s: t, e: t + settle(0.64, 0.76), l: 'flies' },
      { s: t + 0.16, e: t + 0.66, l: 'flip' },
      { s: t + 0.46, e: t + 2.56, l: 'writes itself · 2.1 s' },
    ]),
    { s: T.read, e: T.read + 0.5, l: 'the rest fall away' },
    { s: T.read, e: T.read + settle(1.1, 0.86), l: 'reading settles' },
    ...SINK.map((a, i) => ({ s: T.ret + a * 3.2, e: T.ret + (a + 0.27) * 3.2, l: ['What Was', 'What Is', 'What Tends'][i] + ' sinks' })),
    { s: T.kept, e: T.kept + 0.5, l: 'faces turn' },
    { s: T.kept + 0.45, e: T.kept + 0.45 + settle(0.8, 0.86), l: 'home' },
  ] },
  { name: 'Light', sub: 'flash, halo, thread', fill: '#FCE6C4', tc: '#8A4B12', bars: [
    { s: T.cut, e: T.cut + 1.3, l: 'bloom 1.3 s' },
    { s: T.cut, e: T.cut + 2.2, l: 'ripple 2.2 s' },
    ...T.takes.flatMap((t, i) => [
      { s: t + 0.46, e: t + 1.76, l: 'flash' },
      { s: t + 0.46, e: t + 2.71, l: 'halo flare' },
      { s: t + 0.46, e: t + 1.36, l: 'thread' },
    ]),
    ...T.lines.map((t, i) => ({ s: t, e: t + 2.25, l: 'flare' })),
    { s: T.chord, e: T.chord + 1.8, l: 'light runs the thread · 1.8 s' },
  ] },
  { name: 'Sound', sub: 'voices, gain', fill: '#E4DDF3', tc: '#4A3C75', bars: [
    { s: T.hold, e: T.cut + 0.5, l: 'swell 0.55' },
    { s: T.cut, e: T.cut + 0.74, l: 'riffle 0.8' },
    { s: T.cut, e: T.cut + 6.5, l: 'bowl C3 dark 0.55' },
    ...T.takes.flatMap((t, i) => [
      { s: t, e: t + 0.3, l: 'slide' },
      { s: t + 0.32, e: t + 0.58, l: 'thud' },
      { s: t + 0.42, e: t + 0.42 + NOTES[i][2], l: `bowl ${NOTES[i][0]}${NOTES[i][1] === 'dark' ? ' dark' : ''} 0.5` },
    ]),
    { s: T.q, e: T.q + 6.5, l: 'C3 dark 0.3' },
    ...T.lines.map((t, i) => ({ s: t, e: t + NOTES[i][2], l: `${NOTES[i][0]} 0.26` })),
    { s: T.chord, e: T.chord + 6.5, l: 'the chord 0.34' },
    ...SINK.map((a, i) => ({ s: T.ret + a * 3.2, e: T.ret + a * 3.2 + NOTES[i][2], l: `${NOTES[i][0]} 0.2` })),
    { s: T.kept, e: T.kept + 0.3, l: 'slide 0.22' },
    { s: T.kept + 1.05, e: T.kept + 1.31, l: 'thud 0.25' },
  ] },
  { name: 'Drone level', sub: 'the mood, 0–1', curve: 'drone' },
  { name: 'Moon', sub: 'keeps the reading', curve: 'moon' },
]
const phases = [[0, T.hold, 'Writing the question'], [T.hold, T.cut, 'Asking'], [T.cut, T.read, 'The cut and the draw'], [T.read, T.ret, 'The reading'], [T.ret, T.kept, 'The return'], [T.kept, 36, 'The moon keeps it']]
const moments = [[0, 'first letter'], [T.hold, 'hold'], [T.cut, 'the cut'], ...T.takes.map((t, i) => [t, 'take ' + (i + 1)]), [T.read, 'reading'], [T.chord, 'chord'], [T.ret, 'hold'], [T.kept, 'kept']]

// ---- drawing -------------------------------------------------------------------------------------------------
const CW = 3456, X0 = 250, PX = (CW - X0 - 30) / 36, X = t => X0 + t * PX
const g = L.frame({ name: 'Timeline · one Three Fates reading', w: CW, h: 100 })
let y = 0
// phase band
for (const [a, b, n] of phases) {
  F.rect(g, X(a) + 1, y, (b - a) * PX - 2, 34, { fill: '#FFFFFF', fillA: 0.7, stroke: false, r: 6, name: 'Phase · ' + n })
  F.put(g, L.text(n, 'smallStrong', { color: L.C.gold }), X(a) + 10, y + 7)
}
y += 44
// axis
const axisY = y
F.poly(g, [[X(0), axisY + 18], [X(36), axisY + 18]], { color: L.C.ink, alpha: 0.3, name: 'Axis' })
for (let s = 0; s <= 36; s++) {
  F.poly(g, [[X(s), axisY + (s % 2 ? 14 : 10)], [X(s), axisY + 18]], { color: L.C.ink, alpha: 0.3, name: 'Tick' })
  if (s % 2 === 0) { const t = F.mono(s + ' s', { size: 10, alpha: 0.55 }); F.put(g, t, X(s) - t.width / 2, axisY - 6) }
}
y += 26
// key moments row
const momentsY = y
let lastEnd = -1e9, lift = 0
for (const [t, n] of moments) {
  const tag = F.tag(n + ' · ' + f2(t) + ' s', { color: L.C.ink, size: 10 })
  lift = X(t) < lastEnd + 6 ? (lift ? 0 : 20) : 0
  F.put(g, tag, X(t) - 2, momentsY + lift); lastEnd = X(t) - 2 + tag.width
}
y += 50
const laneTop0 = y
const smoothK = t => { const k = (t - T.kept - 0.3) / 5; if (k < 0 || k > 1) return 0; return k < 0.28 ? F.smooth(k / 0.28) : k < 0.4 ? 1 : 1 - F.smooth((k - 0.4) / 0.6) }
for (const lane of lanes) {
  const top = y
  let h
  if (lane.curve) {
    h = 96
    const pts = []
    if (lane.curve === 'drone') {
      const target = t => t < T.hold ? 0.42 : t < T.cut ? 0.42 + 0.5 * (t - T.hold) / 3.2 : t < T.read ? 0.62 : t < T.ret ? 0.78 : t < T.kept ? 0.78 - 0.48 * F.ramp((t - T.ret) / 3.2, 0.08, 1) : t < T.kept + 0.45 ? 0.30 : 0.42
      let lv = 0.42
      for (let t = 0; t <= 36; t += 0.033) { lv += (target(t) - lv) * 0.035; pts.push([X(t), top + h - 10 - lv * (h - 20)]) }
      for (const [t, v, n] of [[1, 0.42, 'rest 0.42'], [T.cut - 0.3, 0.92, '0.42 + 0.5 c'], [T.cut + 2.4, 0.62, 'the cut 0.62'], [T.read + 2.2, 0.78, 'the reading 0.78'], [T.kept - 0.2, 0.30, '0.30'], [T.kept + 3, 0.42, 'rest 0.42']]) {
        const t2 = F.mono(n, { size: 10, color: '#4A3C75', alpha: 1 }); F.put(g, t2, X(t) + 4, top + h - 10 - v * (h - 20) + (v < 0.35 ? 6 : -18))
      }
    } else {
      for (let t = T.kept; t <= 36; t += 0.02) pts.push([X(t), top + h - 10 - smoothK(t) * (h - 20)])
      { const mt = F.mono('the moon glows 5.0 s from +0.3 s · keyframes 0 → 1 → 1 → 0', { size: 10, color: '#6B4F12', alpha: 1 }); F.put(g, mt, X(T.kept) - mt.width - 14, top + h / 2 - 8) }
    }
    F.rect(g, X0 - 8, top + 2, CW - X0 + 8, h - 4, { fill: '#FFFFFF', fillA: 0.45, stroke: false, r: 6, name: 'Lane · ' + lane.name })
    F.poly(g, [[X(0), top + h - 10], [X(36), top + h - 10]], { color: L.C.ink, alpha: 0.15, name: 'Zero' })
    F.poly(g, pts, { color: lane.curve === 'drone' ? '#6E5BA8' : L.C.gold, sw: 2, name: 'Curve · ' + lane.name, cap: 'ROUND' })
  } else {
    const ends = [], placed = []
    for (const bar of [...lane.bars].sort((a, b) => a.s - b.s)) {
      const x = X(bar.s), w = Math.max(4, (bar.e - bar.s) * PX)
      const t = L.text(bar.l, 'caption', { size: 11, lh: 14, alpha: 1, color: lane.tc, style: 'Medium', family: 'Inter' })
      const inside = w >= t.width + 14
      const ext = inside ? x + w : x + w + 6 + t.width
      let r = ends.findIndex(e => e + 10 <= x); if (r < 0) { r = ends.length; ends.push(0) }
      ends[r] = ext
      placed.push({ x, w, t, inside, r, bar })
    }
    h = Math.max(1, ends.length) * 24 + 14
    F.rect(g, X0 - 8, top + 2, CW - X0 + 8, h - 4, { fill: '#FFFFFF', fillA: 0.45, stroke: false, r: 6, name: 'Lane · ' + lane.name })
    for (const p of placed) {
      const by = top + 8 + p.r * 24
      F.rect(g, p.x, by, p.w, 18, { fill: lane.fill, fillA: p.bar.pace ? 0.5 : 1, color: lane.tc, alpha: p.bar.pace ? 0.6 : 0.35, dash: p.bar.pace ? [4, 3] : null, r: 4, align: 'INSIDE', name: 'Bar · ' + p.bar.l })
      F.put(g, p.t, p.inside ? p.x + 7 : p.x + p.w + 6, by + 2)
    }
  }
  F.put(g, L.text(lane.name, 'smallStrong'), 0, top + 8)
  F.put(g, L.text(lane.sub, 'caption'), 0, top + 28)
  y += h + 6
}
// key moment lines over the lanes (drawn last, faint)
for (const [t] of moments) F.poly(g, [[X(t), momentsY - 4], [X(t), y]], { color: L.C.ink, alpha: 0.22, dash: [3, 4], name: 'Moment' })
g.resize(CW, y)

const b = L.board({ name: 'Motion · One reading, start to finish', kicker: 'MOTION', title: 'One reading, start to finish', titleStyle: 'h1', w: 3600,
  lead: 'A written question, Three Fates, the recital and the return, from the first letter to the moon’s glow: about 36 s. Everything is the code’s timing except the moments that are the person’s own (dashed), set here to a plausible pace.', tags: [['shipped']] })
L.add(b, g)
L.add(b, L.row([
  L.note({ w: 820, tags: ['fixed'], title: 'The cards', body: 'As posed in the renders: The Emperor (What Was, C4), Nine of Pentacles (What Is, E4) and The Hermit reversed (What Tends, dark G3). None is a sky card, so As Above stays still; with one, the sky would begin to answer 2.1 s after it lands, over 9 s.', source: 'Deck.swift:39-49; Answers.swift:59-62' }),
  L.note({ w: 820, tags: ['fixed'], title: 'Each take', body: 'Click: slide, and the card flies (spring 0.64 / 0.76). +0.16 s the flip (0.5 s). +0.32 s the thud. +0.42 s its bowl. +0.46 s the flash, the halo and the ink (2.1 s). The reading begins 2.45 s after the last card lands.', source: 'Game.swift:457-494' }),
  L.note({ w: 820, tags: ['fixed'], title: 'The recital and the return', body: 'The question is read back 0.9 s into the reading, the verse 1.8 s later, a line every 1.45 s, then the chord. Returning: the hush over 0.08–0.30 of the hold, each face sinks in its own window, then the faces turn, the spread goes home at +0.45 s and the moon glows from +0.3 s.', source: 'Game.swift:298-375, 501-547; Keeping.swift:1087-1094' }),
  L.note({ w: 820, tags: ['fixed'], title: 'Bar lengths', body: 'Springs are drawn to their 1% settle. Sound bars run the length of their buffer (bowls 5.5 s bright, 6.5 s dark). The drone curve is simulated with the app’s own easing: 3.5% of the gap every 33 ms.', source: 'Sfx.swift:229-242, 394, 399' }),
], { gap: 32, align: 'MIN', name: 'Timeline notes' }))
L.add(sec, b)
L.fit(sec)
await L.arrange('Design system')
return [await L.snap(b, 'pages/motion/motion-timeline.png', { scale: 0.3, wait: 300 }), T]
