// Chapter: Layout, step 3 of 3 (slots per spread, the ribbon, the altar, the keys page, kept pages, large windows).
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/layout-3.js
const L = S.lib, F = S.fb
const sec = await L.chapter('Layout', { clear: false })
const MINE = ['Layout · Slots per spread', 'Layout · The ribbon', 'Layout · The altar', 'Layout · The keys page', 'Layout · Kept pages', 'Layout · Large windows']
for (const n of sec.children.filter(n => MINE.includes(n.name))) n.remove()
const f1 = F.fmt
const V = (y, off = 32) => `${f1(y)} · window ${f1(y + off)}`
const CREAM = '#F3EDE0', GOLD = '#8F6C21'
// a card outline centred at (cx, cy), turned clockwise by deg (SwiftUI rotationEffect)
const card = (parent, cx, cy, w, h, deg = 0, o = {}) => {
  const r = figma.createRectangle(); r.name = o.name || 'Card'
  r.resize(w, h); r.cornerRadius = Math.max(1, w * 0.04)
  r.fills = [L.solid(o.fill || CREAM, 1)]; r.strokes = [L.solid(o.stroke || GOLD, o.strokeA == null ? 0.55 : o.strokeA)]; r.strokeWeight = o.sw || 0.75
  parent.appendChild(r)
  const t = deg * Math.PI / 180, a = Math.cos(t), b = Math.sin(t), c = -Math.sin(t), d = Math.cos(t)
  r.relativeTransform = [[a, c, cx - (a * w / 2 + c * h / 2)], [b, d, cy - (b * w / 2 + d * h / 2)]]
  return r
}
const NAMES = { 1: ['THE ANSWER'], 3: ['WHAT WAS', 'WHAT IS', 'WHAT TENDS'], 5: ['SITUATION', 'CROSSING', 'ROOT', 'COUNSEL', 'OUTCOME'] }
const SPREAD = { 1: 'One Card', 3: 'Three Fates', 5: 'The Long Road' }

// ---- Slots per spread ---------------------------------------------------------------------------------
const bS = L.board({ name: 'Layout · Slots per spread', kicker: 'LAYOUT', title: 'Slots per spread', titleStyle: 'h1', w: 2400,
  lead: 'The same slot rule for every spread: as tall as 31% of the stage (36% / 44% for one card), unless the row would be wider than 84% of the stage. Cards are 226 : 400 with gaps of a fifth of a card. Drawn to scale at 0.4; gold bars mark where the position labels hang.', tags: [['claude'], ['shipped']] })
const mini = (W, H, n, phase) => {
  const P = F.layout(W, H, n, phase), k = 0.4
  const f = L.frame({ name: `Stage · ${SPREAD[n]} · ${W} × ${H} · ${phase}`, w: W * k, h: H * k, fill: '#FFFFFF', fillA: 0.55, stroke: L.C.stroke, r: 8, clip: true })
  F.poly(f, [[W * k / 2, 0], [W * k / 2, H * k]], { color: F.BLUE, alpha: 0.35, dash: [3, 3], name: 'W/2' })
  F.poly(f, [[0, P.rowY * k], [W * k, P.rowY * k]], { color: F.RED, alpha: 0.5, dash: [3, 3], name: 'rowY' })
  P.slots.forEach((x, i) => {
    card(f, x * k, P.rowY * k, P.slotW * k, P.slotH * k, 0, { name: 'Slot ' + NAMES[n][i] })
    // the position's name, as a gold bar where its label hangs (at 0.4 the real 7 pt caps would be unreadable)
    if (phase === 'reading') { const lw = Math.min(P.slotW * k * 0.7, 36), bar = figma.createRectangle(); bar.name = 'Label · ' + NAMES[n][i]; bar.resize(lw, 2); bar.cornerRadius = 1; bar.fills = [L.solid(GOLD, 0.6)]; F.put(f, bar, x * k - lw / 2, P.labelY * k - 1) }
  })
  return { f, P }
}
const grid = L.frame({ name: 'Spreads at two sizes', dir: 'v', gap: 36 })
for (const n of [1, 3, 5]) {
  const row = L.row([], { gap: 40, align: 'MIN', name: 'Spread · ' + SPREAD[n] })
  L.add(row, L.col([L.text(SPREAD[n], 'h2'), L.text(n + (n === 1 ? ' card' : ' cards'), 'small')], { gap: 4, w: 200, name: 'Spread name' }))
  for (const [W, H] of [[1260, 828], [940, 628]]) for (const ph of ['draw', 'reading']) {
    const { f, P } = mini(W, H, n, ph)
    L.add(row, L.col([f, F.mono(`${W} × ${H} · ${ph === 'draw' ? 'drawing' : 'reading'} · slot ${f1(P.slotW)} × ${f1(P.slotH)} · gap ${f1(P.gap)}`, { w: W * 0.4 }),
      F.mono('x ' + P.slots.map(x => f1(x)).join(' · ') + ' · rowY ' + f1(P.rowY) + (ph === 'reading' ? ' · labels ' + f1(P.labelY) : ''), { w: W * 0.4, alpha: 0.55 })], { gap: 6, name: 'Stage and numbers' }))
  }
  L.add(grid, row)
}
L.add(bS, grid)
L.add(bS, L.row([
  L.note({ w: 520, tags: ['fixed'], title: 'Height decides, width only guards', body: 'At both window sizes every spread is bound by height, not width: 0.84 W would allow cards up to ' + f1((1260 * 0.84) / (5 * 0.565 + 4 * 0.113)) + ' pt tall for five at 1260. Width only binds on a window far wider than tall.', source: 'Game.swift:852-858' }),
  L.note({ w: 520, tags: ['fixed'], title: 'One card grows as the reading begins', body: 'From 0.36 H to 0.44 H (capped at 360), on the reading-settle spring (response 1.1, damping 0.86). Three and five cards keep their size; only the row moves from 0.33 H to 0.36 H.', source: 'Game.swift:489-494, 852-867' }),
  L.note({ w: 520, tags: ['fixed'], title: 'Minimum slot 110', body: 'No slot is ever smaller than 110 pt tall; the minimum window never gets close (194.7).', source: 'Game.swift:858' }),
], { gap: 24, name: 'Slot notes' }))
L.add(sec, bS)

// ---- The ribbon -------------------------------------------------------------------------------------------
const bR = L.board({ name: 'Layout · The ribbon', kicker: 'LAYOUT', title: 'The ribbon', titleStyle: 'h1', w: 2400,
  lead: 'After the cut the 78 cards fan out along a shallow parabola across 74% of the stage, tilting outward to ±12°. Cards near the hand rise with it. Drawn natively from the formula at 0.6, beside the real render.', tags: [['claude'], ['shipped']] })
{
  const W = 1260, H = 828, P = F.layout(W, H, 3, 'draw'), k = 0.6, n = 78, hov = 39
  const f = L.frame({ name: 'Ribbon, drawn from the formula', w: W * k, h: H * k, fill: '#FFFFFF', fillA: 0.55, stroke: L.C.stroke, r: 10, clip: true })
  const pts = []
  for (let i = 0; i <= 60; i++) { const kk = i / 30 - 1; pts.push([(W / 2 + kk * P.span / 2) * k, (P.handY + kk * kk * P.sag) * k]) }
  const order = [...Array(n).keys()]
  for (const i of order) {
    const t = i / (n - 1), kk = 2 * t - 1, d = Math.abs(i - hov)
    const lift = d < 2.5 ? Math.pow(1 - d / 2.5, 1.6) * 38 : 0
    card(f, (W / 2 + kk * P.span / 2) * k, (P.handY + kk * kk * P.sag - lift) * k, P.fanW * k, P.fanH * k, 12 * kk, { name: 'Card ' + i, strokeA: d === 0 ? 1 : 0.45, sw: d === 0 ? 1.5 : 0.6 })
  }
  F.poly(f, pts, { color: F.RED, dash: [5, 4], sw: 1.25, name: 'Centre line y = handY + 0.055 H k²' })
  F.poly(f, [[W / 2 * k, 0], [W / 2 * k, H * k]], { color: F.BLUE, alpha: 0.4, dash: [4, 4], name: 'W/2' })
  const tg = (s, x, y, c) => F.put(f, F.tag(s, { color: c }), x, y)
  tg('0.74 W = ' + f1(P.span), (W / 2 - 60) * k, (P.handY + 130) * k, F.RED)
  tg('k = −1 · −12°', (W / 2 - P.span / 2 - 70) * k, (P.handY - 170) * k, F.RED)
  tg('k = +1 · +12°', (W / 2 + P.span / 2 - 70) * k, (P.handY - 170) * k, F.RED)
  tg('sag 0.055 H = ' + f1(P.sag), (W / 2 + P.span / 2 - 150) * k, (P.handY + P.sag + 105) * k, F.RED)
  tg('the hand: lift 38 · 16.8 · 2.9', (W / 2 + 60) * k, (P.handY - 175) * k, F.BLUE)
  tg('handY 0.775 H = ' + f1(P.handY), 14, (P.handY - 8) * k - 60, F.RED)
  const draw = await L.window('shots-window/3-draw.png', { shadow: false }); draw.rescale(k)
  const liftChart = F.chartCard({ title: 'Lift under the hand', w: 420, h: 200, t0: 0, t1: 2.5, ticks: [0, 1, 2, 2.5], tfmt: x => 'd ' + F.fmt(x, 1), fns: [{ f: d => Math.pow(1 - d / 2.5, 1.6), color: GOLD, name: '38 (1 − d/2.5)^1.6 pt' }], legend: true, legendX: 150,
    formula: 'lift = 38 × (1 − d/2.5)^1.6 for d < 2.5 cards', body: 'Springs 0.3 / 0.68. Cards within 2.5 places of the hovered one rise; the hovered card lights (goldLit 55%, blur 26).', source: 'RootView.swift:304-311, 357, 406' })
  L.add(bR, L.row([
    L.col([f, L.text('Drawn from the formula at 1260 × 828, with the hand over card 39.', 'caption', { w: W * k })], { gap: 8, name: 'Drawn' }),
    L.col([draw, L.text('The real draw (shots-window/3-draw.png) at the same scale, window included, so it sits 19 pt lower.', 'caption', { w: W * k })], { gap: 8, name: 'Render' }),
    liftChart,
  ], { gap: 48, align: 'MIN', name: 'Ribbon row' }))
  L.add(bR, L.specs([
    ['Card i of n', 't = i/(n − 1), k = 2t − 1; x = W/2 + k × 0.37 W; y = handY + k² × 0.055 H − lift; turned 12k° clockwise. Taken cards leave gaps; the others keep their places.', 'Game.swift:894-905'],
    ['Card size', 'fanH × fanW = ' + f1(P.fanH) + ' × ' + f1(P.fanW) + ' at 1260 × 828 (135.0 × 76.3 at the minimum).', 'Game.swift:862-863'],
    ['Nearest card to x', 'round((k + 1)/2 × (n − 1)), k = (x − W/2) ÷ (0.37 W), clamped to ±1. This is how the pointer and the arrow keys find the hand.', 'Game.swift:908-913'],
    ['The squared deck', 'Before the cut every card sits at (W/2, handY − 16 + 0.5 depth), depth = (n − 1 − i) × min(1, √(21/(n − 1))): 78 cards stand about 20 pt tall.', 'Game.swift:918-923'],
    ['The deal', 'Each card springs (0.72 / 0.8) from the deck to its place, 6.8 ms after the one before (13 ms × √(21/77)): about 0.52 s for the whole fan.', 'RootView.swift:408-411'],
  ], { w: 1500, keyW: 200, name: 'Ribbon specs' }))
}
L.add(sec, bR)

// ---- The altar -----------------------------------------------------------------------------------------------
{
  const P = F.layout(1260, 828, 3), h = P.altarH, w = P.altarW, g = P.altarGap, tw = 360
  const left = (1260 - (w + g + tw)) / 2, cy = 414, cx = left + w / 2
  const bA = L.board({ name: 'Layout · The altar', kicker: 'LAYOUT', title: 'The altar', titleStyle: 'h1', w: 1980,
    lead: 'A drawn card opened full size. The card and its words form one row centred in the stage: the card, a gap, and a text column up to 360 wide. A pearl veil covers the room.', tags: [['claude'], ['shipped']] })
  L.add(bA, await F.redlines('shots-window/7-inspect.png', {
    labelW: 400, title: 'The altar',
    guides: [
      { y: cy - h / 2, name: 'Card top', f: 'centre − h/2', v: V(cy - h / 2) },
      { y: cy, name: 'Stage centre', f: 'H/2', v: V(cy) },
      { y: cy + h / 2, name: 'Card foot', f: 'h = min(480, 0.62 H)', v: V(cy + h / 2) + ' · card ' + f1(h) + ' × ' + f1(w) },
    ],
    boxes: [
      { x: left, y: cy - h / 2, w, h, name: `card ${f1(w)} × ${f1(h)}` },
      { x: left + w, y: cy - 40, w: g, h: 80, name: `gap ${f1(g)}`, color: F.BLUE },
      { x: left + w + g, y: cy - h / 2, w: tw, h, name: 'text column ≤ 360, leading', color: F.BLUE },
    ],
    rings: [{ x: cx, y: cy, r: h * 0.95, name: 'halo 1.9 h square', tx: -60, ty: -h * 0.95 - 22 }],
    vs: [{ x: 630, name: 'W/2' }],
  }))
  L.add(bA, L.specs([
    ['Card', 'h = min(480, 0.62 H), w = 0.565 h: 480 × 271.2 by default, 389.4 × 220.0 at the minimum. Floats ±3 pt on the 10 s breath and turns toward the pointer (X −6°, Y 8°).', 'RootView.swift:1406-1407, 1424, 1456'],
    ['Row', 'HStack(spacing: min(72, 0.055 W)) of the card and a text column (maxWidth 360, leading, spacing 16), centred in the stage. Its left edge here: ' + f1(left) + '.', 'RootView.swift:1440, 1515'],
    ['Halo', 'An ellipse 1.9 h square behind the card: goldLit (0.55 + 0.12 breath) → dawn 35% → 0 at 0.9 h, screen.', 'RootView.swift:1442-1452'],
    ['Veil', 'Radial pearl 82% → 62% → 36%, end radius 0.72 × max(W, H) (907 pt by default), under the title bar too.', 'RootView.swift:1430-1438'],
  ], { w: 1400, keyW: 120, name: 'Altar specs' }))
  L.add(sec, bA)
}

// ---- The keys page ---------------------------------------------------------------------------------------------
{
  const top = 251, row0 = 344
  const bK = L.board({ name: 'Layout · The keys page', kicker: 'LAYOUT', title: 'The keys page', titleStyle: 'h1', w: 1980,
    lead: 'Two 150 pt columns meeting at the stage’s centre line: keys right-aligned on the left, what they do on the right, 22 pt apart. Seven rows 22 pt tall, 15 apart. The whole 322 × 326 composition is centred in the stage.', tags: [['claude'], ['shipped']] })
  L.add(bK, await F.redlines('shots-window/62-keys.png', {
    labelW: 400, title: 'The keys page',
    guides: [
      { y: top, name: 'Rule 46 × 1', f: 'composition top', v: V(top) },
      { y: top + 1 + 18 + 12.5, name: 'THE KEYS', f: 'Didot Bold 21, tracking 8; 18 below the rule', v: '≈ ' + V(top + 31.5) + ' (line ≈ 25, measured)' },
      { y: row0, name: 'First row centre', f: '38 below the title', v: V(row0) },
      { y: row0 + 6 * 37, name: 'Seventh row centre', f: 'rows 22 tall, 15 apart (pitch 37)', v: V(row0 + 222) },
      { y: top + 326, name: 'Composition foot', f: 'centred: (828 − 326) ÷ 2 = 251 at the top', v: V(top + 326) },
    ],
    boxes: [...Array(7)].map((_, i) => ({ x: 469, y: row0 - 11 + 37 * i, w: 322, h: 22, name: i === 0 ? 'row 322 × 22' : null, color: F.RED, dash: [2, 3] })),
    vs: [
      { x: 469, name: 'keys 150', y0: top - 20, y1: top + 346, ty: top + 340 },
      { x: 619, name: 'right edge', y0: top - 20, y1: top + 346, ty: top + 356 },
      { x: 641, name: 'gutter 22', y0: top - 20, y1: top + 346, ty: top + 340 },
      { x: 791, name: 'labels 150', y0: top - 20, y1: top + 346, ty: top + 356 },
    ],
  }))
  L.add(bK, L.specs([
    ['Columns', 'Keys 150 wide, right-aligned, keys 5 pt apart; gutter 22; labels 150 wide, leading, Didot Italic 17 at text 82%.', 'Legend.swift:118-139'],
    ['Rows', '7 rows, each 22 tall, 15 apart, 38 below the title. The title block: rule 46 × 1 (goldInk 55%), 18, THE KEYS.', 'Legend.swift:106-146'],
    ['Keycaps', 'At least 22 × 22, radius 4; named caps as wide as their word + 1.6 + 14.', 'Legend.swift:180-187, 203'],
    ['Measured', 'The title line’s height is not in the code; ≈ 25 pt, measured on the render (the rule at window y 283).', 'Legend.swift:109-114'],
  ], { w: 1400, keyW: 120, name: 'Keys specs' }))
  L.add(sec, bK)
}

// ---- Kept pages ----------------------------------------------------------------------------------------------------
{
  const P = F.layout(1260, 828, 3)
  const bP = L.board({ name: 'Layout · Kept pages', kicker: 'LAYOUT', title: 'Kept pages', titleStyle: 'h1', w: 1980,
    lead: 'A kept reading uses the table’s own layout, so a page from the moon sits exactly where the reading lay. Two chevrons turn the pages, 58 pt out from the outer cards.', tags: [['claude'], ['shipped']] })
  L.add(bP, await F.redlines('shots-window/46-kept-remembered.png', {
    labelW: 400, title: 'Kept page',
    guides: [
      { y: P.epigraphY, name: 'Question (epigraph)', f: 'max(44, rowY − slotH/2 − 40)', v: V(P.epigraphY) },
      { y: P.rowY, name: 'rowY, chevrons', f: '0.36 H', v: V(P.rowY) },
      { y: P.threadY, name: 'threadY', f: 'band 40 tall', v: V(P.threadY) },
      { y: P.labelY, name: 'Position names', f: 'Caps 9, goldInk 80%', v: V(P.labelY) },
      { y: P.stanzaTop, name: 'stanzaTop', f: 'verse column 0.86 W', v: V(P.stanzaTop) },
      { y: P.askY, name: 'askY', f: '‘hold · remember’ on a blank page', v: V(P.askY) },
      { y: P.moonLabelY, name: 'Date label', f: 'moon.y + 36, while the door is open', v: V(P.moonLabelY) },
    ],
    boxes: P.slots.map((x, i) => ({ x: x - P.slotW / 2, y: P.rowY - P.slotH / 2, w: P.slotW, h: P.slotH, name: i === 0 ? `slot ${f1(P.slotW)} × ${f1(P.slotH)}` : null })),
    pts: [{ x: P.chevL, y: P.rowY, name: 'chevron ' + f1(P.chevL), tx: -40, ty: 18 }, { x: P.chevR, y: P.rowY, name: 'chevron ' + f1(P.chevR), tx: -40, ty: 18 }],
    vs: [{ x: 630, name: 'W/2' }],
  }))
  L.add(bP, L.specs([
    ['Cards', 'Same slots as the table: ' + P.slots.map(x => f1(x)).join(' · ') + ' at 1260 × 828.', 'Game.swift:880-885'],
    ['Chevrons', 'Drawn 12 × 24, hit target 44 × 64; x = max(30, first slot − (slotW/2 + 58)) and min(W − 30, last slot + slotW/2 + 58), at rowY.', 'Keeping.swift:913-922, 934, 955-957'],
    ['Folio', 'min(660, 0.62 W) wide, from stanzaTop to inviteY + 20, top-aligned, spacing 18.', 'Keeping.swift:856-886'],
    ['Page drift', 'A page arrives 28 pt from the side time was turned (0.8 s easeOut, blur 4 → 0) and leaves in place.', 'Keeping.swift:588-607'],
  ], { w: 1400, keyW: 120, name: 'Kept specs' }))
  L.add(sec, bP)
}

// ---- Large windows -----------------------------------------------------------------------------------------------
{
  const bL = L.board({ name: 'Layout · Large windows', kicker: 'LAYOUT', title: 'Large windows', titleStyle: 'h1', w: 2900,
    lead: 'Every size cap is reached by a stage about 845 pt tall: the ribbon’s cards and the ring at 828, the altar card at 774, the table’s cards at 845, and the verse is already at its preferred size. Past that, the sky, the wheel, the ribbon’s span and every position keep scaling, so a full-screen room is sparser than the one that was designed. Nobody has looked at it closely.',
    tags: [['open'], ['shipped']] })
  const r1 = await L.img('shots/81-large-1728-reading.png', { w: 1320, r: 12, name: 'Render · 81-large-1728-reading' })
  const r2 = await L.img('shots/84-large-2560-reading.png', { w: 1320, r: 12, name: 'Render · 84-large-2560-reading' })
  L.add(bL, L.row([
    L.col([r1, L.text('1728 × 1117 (a 16" MacBook Pro, full screen). Stage-only render (shots/81), no title bar.', 'caption', { w: 1320 })], { gap: 8, name: 'Large 1728' }),
    L.col([r2, L.text('2560 × 1440 (a 27" display). Stage-only render at @1.5x (shots/84), no title bar.', 'caption', { w: 1320 })], { gap: 8, name: 'Large 2560' }),
  ], { gap: 48, name: 'Large renders' }))
  const sz = [[1260, 828], [1728, 1117], [2560, 1440]], Ls = sz.map(([W, H]) => F.layout(W, H, 3)), L1 = sz.map(([W, H]) => F.layout(W, H, 1))
  const row = (m, fn, kind, src) => ({ m, a: fn(0), b: fn(1), c: fn(2), k: L.chip(kind === 'stop' ? 'fixed' : 'measured', kind === 'stop' ? 'stops growing' : 'keeps scaling'), s: src })
  const rows = [
    row('Slot, 3 or 5 cards', i => f1(Ls[i].slotW) + ' × ' + f1(Ls[i].slotH), 'stop', 'Game.swift:852-858'),
    row('Slot, one card (reading)', i => f1(L1[i].slotW) + ' × ' + f1(L1[i].slotH), 'stop', 'Game.swift:852-858'),
    row('Ribbon card · ring radius', i => f1(Ls[i].fanW) + ' × ' + f1(Ls[i].fanH) + ' · ' + f1(Ls[i].ringR), 'stop', 'Game.swift:862-891'),
    row('Altar card', i => f1(Ls[i].altarH) + ' × ' + f1(Ls[i].altarW), 'stop', 'RootView.swift:1406-1407'),
    row('Verse (3 lines)', i => f1(Ls[i].verse) + ' pt', 'stop', 'RootView.swift:1199-1206'),
    row('Share of width the 3 cards fill', i => Math.round((3 * Ls[i].slotW + 2 * Ls[i].gap) / sz[i][0] * 100) + '%', 'scale', 'Game.swift:880-885'),
    row('Ribbon span 0.74 W', i => f1(Ls[i].span), 'scale', 'Game.swift:897'),
    row('rowY · deck y', i => f1(Ls[i].rowY) + ' · ' + f1(Ls[i].deck.y), 'scale', 'Game.swift:865-890'),
    row('Moon', i => f1(Ls[i].moon.x) + ', ' + f1(Ls[i].moon.y), 'scale', 'Chamber.swift:43-47'),
    row('Wheel, 1.32 × the longer side', i => f1(1.32 * Math.max(...sz[i])), 'scale', 'Chamber.swift:220'),
  ]
  L.add(bL, L.row([
    L.table([
      { key: 'm', label: 'Measure', w: 300, style: 'smallStrong' },
      { key: 'a', label: '1260 × 828', w: 220, style: 'codeStrong' },
      { key: 'b', label: '1728 × 1117', w: 220, style: 'codeStrong' },
      { key: 'c', label: '2560 × 1440', w: 220, style: 'codeStrong' },
      { key: 'k', label: '', w: 150 },
      { key: 's', label: 'Source', w: 300, style: 'code' },
    ], rows, { zebra: true, name: 'Large window table' }),
    L.col([
      L.note({ w: 720, tags: ['open'], title: 'For the designer', body: 'Decide what a large room should be: let the cards keep growing (raise the 262 / 360 / 178 / 480 caps), hold the composition to a maximum size and let the sky fill the rest, or accept the sparser room. The full-screen shots here are the only look anyone has had at it.' }),
      L.note({ w: 720, tags: ['fixed'], title: 'The code gives no reason', body: 'The caps (262, 360, 178, 480, and the verse’s preferred sizes) are plain constants. Every render made while building Arcana was at 1260 × 860 or the minimum, so they were tuned there, not for large screens.', source: 'Game.swift:858, 862; RootView.swift:1406' }),
    ], { gap: 16, name: 'Large notes' }),
  ], { gap: 48, align: 'MIN', name: 'Large table and notes' }))
  bL.findAll(n => n.type === 'TEXT' && /\.swift/.test(n.characters)).forEach(t => L.linkRefs(t))
  L.add(sec, bL)
}

L.fit(sec)
await L.arrange('Design system')
const out = []
for (const b of sec.children.filter(n => MINE.includes(n.name))) out.push(await L.snap(b, 'pages/layout/' + b.name.replace(/[^\w]+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: out.length ? 300 : 2000 }))
return out
