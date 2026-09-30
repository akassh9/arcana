// Experience & notes · The reading (1 of 3) — header, the ribbon and the hand, taking a card, the thread.
// Each reading-* step removes and rebuilds only its own boards, then puts the chapter's boards in order.
const L = S.lib
const sec = await L.chapter('The reading', { clear: false })
const WIN = 'shots-window/'
const ORDER = ['The reading · Header', 'The reading · The ribbon and the hand', 'The reading · Taking a card', 'The reading · The thread',
  'The reading · The recital and the verse', 'The reading · At rest and under the pointer', 'The reading · One, three and five cards',
  'The reading · The altar', 'The reading · Find the thread', 'The reading · The epigraph']
const MINE = ORDER.slice(0, 4)
for (const n of [...sec.children]) if (MINE.includes(n.name) || !ORDER.includes(n.name)) n.remove()

// ---------- local kit ------------------------------------------------------------
const annotatedWin = async (path, pins, o = {}) => {
  const win = await L.window(path, { name: o.name || ('Window · ' + (o.title || path)) })
  const holder = L.frame({ name: 'Annotated · ' + (o.title || path), w: win.width, h: win.height })
  holder.appendChild(win); win.x = 0; win.y = 0
  pins.forEach((p, i) => { const pn = L.pin(i + 1); holder.appendChild(pn); pn.x = Math.round(p.x - 13); pn.y = Math.round(p.y - 13) })
  const lw = o.legendW || 520
  const legend = L.col(pins.map((p, i) => L.row([L.pin(i + 1), L.col([
    L.text(p.label, 'smallStrong', { w: lw - 40 }),
    p.body ? L.text(p.body, 'small', { w: lw - 40 }) : null,
    p.tags ? L.chips(p.tags) : null,
    p.source ? L.source(p.source, { w: lw - 40 }) : null,
  ], { gap: 3 })], { gap: 12, name: 'Pin ' + (i + 1) + ' · ' + p.label })), { gap: 18, w: lw, name: 'Legend' })
  const left = L.col([holder, o.caption ? L.text(o.caption, 'caption', { w: win.width }) : null], { gap: 12, name: 'Screen' })
  return L.row([left, legend], { gap: 48, name: 'Annotated screen · ' + (o.title || path) })
}
const smallWin = async (file, s, title, caption) => {
  const w = await L.window(WIN + file, { name: 'Window · ' + title })
  w.rescale(s)
  return L.col([w, L.text(title, 'smallStrong', { w: w.width }), caption ? L.text(caption, 'caption', { w: w.width }) : null], { gap: 8, name: 'State · ' + title })
}
// A native timeline: rows of bars (from → to, seconds) and marks (a moment).
const timeline = (rows, o) => {
  const W = o.w || 2256, LW = o.labelW || 460, T = o.t, CH = W - LW - 150
  const px = s => LW + (s / T) * CH
  const RH = 34, top = 30
  const f = L.frame({ name: o.name || 'Timeline', w: W, h: top + rows.length * RH + 8 })
  for (let s = 0; s <= T + 1e-6; s += o.step) {
    const x = Math.round(px(s))
    const ln = figma.createRectangle(); ln.name = 'Tick ' + s.toFixed(1); ln.resize(1, rows.length * RH + 6); ln.x = x; ln.y = top - 4; ln.fills = [L.solid(L.C.rule, 1)]; f.appendChild(ln)
    const t = L.text(s.toFixed(o.step < 1 ? 1 : 0) + ' s', 'code', { size: 11, lh: 14 }); f.appendChild(t); t.x = Math.round(x - t.width / 2); t.y = 6
  }
  rows.forEach((r, i) => {
    const y = top + i * RH
    if (i % 2 === 0) { const z = figma.createRectangle(); z.name = 'Band'; z.resize(W, RH); z.x = 0; z.y = y; z.fills = [L.solid('#FFFFFF', 0.45)]; f.insertChild(0, z) }
    const lab = L.text(r.label, 'small', { w: LW - 24, alpha: 0.86 }); f.appendChild(lab); lab.x = 12; lab.y = y + Math.round((RH - lab.height) / 2)
    const col = r.sound ? L.C.ink : L.C.gold
    let endX
    if (r.to != null) {
      const b = figma.createRectangle(); b.name = 'Bar · ' + r.label
      const x0 = px(r.from), x1 = px(r.to)
      b.resize(Math.max(4, x1 - x0), 12); b.x = x0; b.y = y + 11; b.cornerRadius = 6; b.fills = [L.solid(col, r.soft ? 0.35 : 0.8)]
      if (r.soft) { b.strokes = [L.solid(col, 0.8)]; b.strokeWeight = 1; b.dashPattern = [4, 3] }
      f.appendChild(b); endX = x1
    } else {
      const d = figma.createEllipse(); d.name = 'Mark · ' + r.label; d.resize(12, 12); d.x = px(r.from) - 6; d.y = y + 11; d.fills = [L.solid(col, 0.9)]
      f.appendChild(d); endX = px(r.from) + 6
    }
    const v = L.text(r.value || (r.to != null ? `${r.from.toFixed(2)} → ${r.to.toFixed(2)} s` : `${r.from.toFixed(2)} s`), 'code', { size: 11, lh: 14, alpha: 0.7 })
    f.appendChild(v); v.x = Math.round(endX + 10); v.y = y + 10
  })
  return f
}
const fig = (path, w, title, caption, o = {}) => L.figure(path, Object.assign({ w, title, caption }, o))

// ---------- header ----------------------------------------------------------------
const head = L.board({ name: 'The reading · Header', kicker: 'EXPERIENCE', title: 'The reading', w: 1600,
  lead: 'After the cut the room becomes a table. The 78 cards open into a ribbon, the hand takes cards into the spread, each one writes itself in gold, and the reading is spoken back as verse. A card can then be opened on the altar, and a key in Settings lets OpenAI find the thread.' })
L.add(head, L.rich([['In this chapter   ', 'smallStrong'], ['The ribbon and the hand  ·  Taking a card  ·  The thread  ·  The recital and the verse  ·  At rest and under the pointer  ·  One, three and five cards  ·  The altar  ·  Find the thread  ·  The epigraph', 'small']], 'small', { w: 1456 }))
const hw = (1456 - 3 * 24) / 4
L.add(head, L.row([
  L.note({ w: hw, tags: [['claude', 'Claude chose · kept by Akash']], title: 'From the dark redesign', body: 'Cards that write themselves in gold, a bowl for every card that rings as a chord, chimes across the fan, the thread of light, the verse and the altar all came with Claude’s dark version (23 Sep). Akash kept them when the world became first light.' }),
  L.note({ w: hw, tags: ['akash', 'claude'], title: 'The full deck, as a ribbon', body: 'Akash asked for all 78 cards (26 Sep). Claude suggested laying them out as one ribbon; Akash approved a preview and said to build it out fully.' }),
  L.note({ w: hw, tags: ['panel'], title: 'The question arrives whole', body: 'When a written question is read back it appears printed, all at once, never typed out again. That was the design panel’s spec, not a rule of Akash’s.' }),
  L.note({ w: hw, tags: ['rejected'], title: 'No cross for five cards', body: 'The panel turned down a cross layout for The Long Road (“polish, not a new feeling”). Every spread is a single row.' }),
], { gap: 24, name: 'Provenance' }))
sec.appendChild(head)

// ---------- the ribbon and the hand ---------------------------------------------------
const rib = L.board({ name: 'The reading · The ribbon and the hand', kicker: 'THE DRAW', title: 'The ribbon and the hand', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'The cut opens the deck into a ribbon of all 78 cards, face down along a shallow arc, with the spread’s empty places above it. Move the pointer or the arrow keys along it and the hand goes too, each card sounding as it passes.',
  tags: [['akash', 'Akash: all 78 cards'], ['claude', 'Claude: one ribbon']] })
sec.appendChild(rib)
L.add(rib, await annotatedWin(WIN + '3-draw.png', [
  { x: 250, y: 700, label: 'The ribbon', body: 'All 78, each 178 × 100.6 pt, along a parabola 74 % of the stage wide (932 pt) that dips 5.5 % of its height (45.5 pt) at the ends, each card turned up to ±12°. Dealt from the squared deck at the cut, 6.8 ms apart (card/deal).', source: 'Game.swift:862-863, 889-907; RootView.swift:408-411' },
  { x: 1100, y: 720, label: 'Face down', body: 'Only the cream back shows: a blind-embossed rose and one gold-leaf sun, mirrored so it never gives away which way up a card lies. See Card anatomy & back.', source: 'RootView.swift:295-413' },
  { x: 376, y: 164, label: 'An empty place', body: 'Four corner brackets 10 % larger than the card, 1 pt gold/ink-42. For three cards each place is 145 × 256.7 pt, 29 pt apart, centred at y 273.2 on the 1260 × 828 stage.', source: 'RootView.swift:654-688; Game.swift:853-885' },
  { x: 430, y: 459, label: 'A hollow node', body: 'A diamond outline, 0.8 pt gold/ink-40, where the thread will run. It fills when its card lands.', source: 'RootView.swift:506-633' },
  { x: 872, y: 478, label: 'Position names', body: 'caps/slot (Didot 9, tracking 3.2) in ink/text-32, 20 pt under the thread; gold/ink-80 once the card is face up.', source: 'RootView.swift:654-688' },
  { x: 705, y: 537, label: 'The draw prompt', body: 'One 6 × 6 diamond per card, 7 pt apart: ink/text-20, then gold/ink when taken. 13 pt below, caps/prompt (Didot 10, tracking 4, ink/text-52): DRAW ONE CARD · DRAW THREE · DRAW FIVE. Centred at y max(0.60 H, names + 46) = 496.8.', source: 'RootView.swift:1139-1176' },
  { x: 630, y: 300, label: 'A faint halo', body: 'A soft oval of gold/light behind each empty place at 11 %, 2.6 × 1.7 of the card, screen-blended so it only brightens the sky.', source: 'RootView.swift:467-499' },
  { x: 160, y: 420, label: 'The sky is not a button now', body: 'Pressing the empty sky does nothing during the draw. Esc clears the table and nothing is kept.', source: 'RootView.swift:213-220, 420-436' },
], { title: 'The draw, 1260 × 860', caption: 'shots-window/3-draw · Three Fates, just after the deal. y values are on the 1260 × 828 stage (the window less its 32 pt title bar).' }))

L.add(rib, L.section('The hand', { style: 'h2', lead: 'There is no cursor on the ribbon besides the pointer itself: the cards near it rise like a hand of cards being fanned.' }))
L.add(rib, L.row([
  await smallWin('60-ribbon-small.png', 0.8, 'The ribbon at the minimum window', 'shots-window/60-ribbon-small · 940 × 660, card 30 lifted under the pointer. The ribbon card is 135 pt tall here (0.215 H, never under 96).'),
  L.col([
    L.specs([
      ['Lift', '38 × (1 − d / 2.5)^1.6 pt for cards within 2.5 cards of the pointer: 38, 16.8 and 2.9 pt. Spring 0.3 / 0.68 (card/hand-lift).', 'RootView.swift:304-311, 354-358'],
      ['Light', 'Past 2 pt of lift a card takes Glow/Card lit (gold/light 55 %, radius 26) and Shadow/Card lifted, and rises above its neighbours.', 'RootView.swift:354-358, 405-406'],
      ['Sound', 'Each card the hand passes chimes: low at the left end, high at the right.', 'Game.swift:418-425'],
      ['Keys', '← → move the hand one card from the one under the pointer, or from beside the last card taken. Held, each repeat sweeps 4 cards, so the 78 cross as fast as the old 22 did. At the ends it stays put.', 'Game.swift:427-455'],
      ['Take', 'Click, space or return takes the card under the hand. Over a live card the pointer is a pointing hand. The hit area stays where the card rests, so hover doesn’t flicker as it rises.', 'RootView.swift:295-413'],
      ['Size', 'Ribbon cards are clamp(96…178, 0.215 H) tall and 0.565 as wide: 178 × 100.6 pt at the default window.', 'Game.swift:851-863'],
    ], { w: 1040, keyW: 110 }),
    L.note({ w: 1040, tags: ['fixed'], title: 'Cards go to the places in order', body: 'The first card taken goes to the first place, the next to the second, and so on. You choose the card, never the place.', source: 'Game.swift:457-467' }),
  ], { gap: 24, name: 'The hand specs' }),
], { gap: 64, align: 'MIN', name: 'Hand row' }))

// ---------- taking a card ------------------------------------------------------------
const take = L.board({ name: 'The reading · Taking a card', kicker: 'THE DRAW', title: 'Taking a card', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'Taking a card is one continuous motion. It flies to the next place, turns over and writes itself in gold that cools to ink, while a flash, its halo and a new length of thread greet it.',
  tags: [['claude', 'Claude chose · kept by Akash']] })
sec.appendChild(take)
L.add(take, await annotatedWin(WIN + '56-ribbon-hand.png', [
  { x: 790, y: 596, label: 'The hand', body: 'The card under the pointer, lifted 38 pt with Glow/Card lit; its neighbours rise 16.8 and 2.9 pt.', source: 'RootView.swift:304-311, 354-358' },
  { x: 540, y: 190, label: 'The card, landed', body: 'It flies from the ribbon to its place and grows to full size (spring 0.64 / 0.76, card/take). It settles at −0.7° in even places and +0.7° in odd ones. Shadow/Card on table.', source: 'Game.swift:467; RootView.swift:323-330' },
  { x: 430, y: 459, label: 'Its node, filled', body: 'Fills gold/ink with a gold/light glow of radius 14, as its length of thread grows in from the previous node over 0.9 s (thread/grow).', source: 'RootView.swift:533-536, 556-589' },
  { x: 512, y: 478, label: 'Its name, now gold', body: 'caps/slot eases from ink/text-32 to gold/ink-80 as the face comes up (0.45 s).', source: 'RootView.swift:674-680' },
  { x: 596, y: 516, label: 'One pip taken', body: 'The first diamond is gold/ink now. The prompt goes once the spread is complete.', source: 'RootView.swift:1139-1176' },
  { x: 630, y: 300, label: 'The next place', body: 'Still brackets, a faint halo and a hollow node, waiting.', source: 'RootView.swift:654-688' },
], { title: 'A card taken, 1260 × 860', caption: 'shots-window/56-ribbon-hand · the Five of Cups taken into What Was, the pointer on card 44 of the ribbon.' }))

L.add(take, L.section('After the click', { style: 'h2', lead: 'Everything that happens to one card, in seconds from the click. Gold bars are light and motion; ink dots are sound and touch.' }))
L.add(take, timeline([
  { label: 'A tap on the trackpad and a slide sound', from: 0, sound: true },
  { label: 'Flies to its place (spring, response 0.64 s)', from: 0, to: 0.64, soft: true, value: 'spring 0.64 / 0.76' },
  { label: 'Turns over (card/flip, easeInOut)', from: 0.16, to: 0.66 },
  { label: 'Its position name turns gold', from: 0.16, to: 0.61 },
  { label: 'Land sound', from: 0.32, sound: true },
  { label: 'Its bowl: the place’s note (reversed: an octave lower, darker)', from: 0.42, sound: true },
  { label: 'A flash at the place; the halo flares to full', from: 0.46, to: 0.76 },
  { label: 'The halo settles back to 34 %', from: 0.81, to: 2.41 },
  { label: 'Its length of thread grows in', from: 0.46, to: 1.36 },
  { label: 'The face writes itself (card/write, easeInOut)', from: 0.46, to: 2.56 },
  { label: 'The last card only: the reading begins', from: 2.91 },
], { t: 3, step: 0.5, name: 'Timeline · After the click' }))
L.add(take, L.source('Game.swift:457-496, 551-559; RootView.swift:476-490, 533-536, 674-680 · Reduce Motion: the face is written at once, and the reading begins 0.55 s after the last card lands.', { w: 2256 }))
L.add(take, await fig('sky/near/flash-landing-strip-over-sky.png', 2256, 'The landing flash over the sky', '0.00 · 0.15 · 0.35 · 0.65 · 1.00 · 1.60 s after it blooms, at 0.46 s (sky/near/flash-landing-strip-over-sky; the single frames are alpha overlays for the whole window).'))
L.add(take, L.row([
  L.col([
    await fig('type-ink/ink/writing-the-star-strip@2x.png', 1540, 'The Star writing itself', 'Ink 0 → 1 in eight steps (0.46 → 2.56 s after the click), at the place’s size for the default window.'),
    await fig('type-ink/ink/writing-six-of-cups-strip@2x.png', 1540, 'A pip card, the Six of Cups', 'The same ink, the same order: frame, art, numeral, name, essence.'),
  ], { gap: 32, name: 'Writing strips' }),
  L.col([
    L.specs([
      ['Ink', '0 → 1 over 2.1 s, easeInOut, from 0.46 s after the click.', 'Game.swift:477-487'],
      ['Order', 'Frame over ink 0–0.22, art 0.05–0.92, numeral 0.46–0.74, name 0.62–0.90, essence 0.72–1.0, the reversed diamond 0.80–1.0.', 'CardImages.swift'],
      ['A stroke', 'Laid from its start along the nib curve 1 − (1 − t)^2.2 (ease/nib), lit at the tip, cooling gold/light → gold/metal → card/ink.', 'CardImages.swift'],
      ['Finished', 'At ink 1 the live drawing is swapped for a cached picture of the finished face.', 'CardImages.swift'],
      ['Reduce Motion', 'The face is already written when it turns up.', 'Game.swift:477-487'],
    ], { w: 668, keyW: 120 }),
    L.note({ w: 668, tags: ['claude', ['akash', 'Akash kept it']], title: 'Gold cooling to ink', body: 'One of the ideas Akash kept from the dark version: every card is handwritten on the table, never shown ready-made.' }),
  ], { gap: 24, name: 'Ink specs' }),
], { gap: 48, align: 'MIN', name: 'Writing row' }))
const face = async (p, t) => fig(p, 150, t, null)
L.add(take, L.row([
  await fig('type-ink/ink/flip-taken-strip@2x.png', 1002, 'The flip', 'A 3D turn about the vertical axis (perspective 0.4), 0.5 s easeInOut from 0.16 s: the back until 90°, then the face. Frames at 0, 0.125, 0.24, 0.375, 0.5 s; at 0.25 s the card is edge-on and nothing shows.'),
  await smallWin('4-mid.png', 0.45, 'One card in place', 'shots-window/4-mid · the Emperor in What Was, its node lit, one pip of three.'),
  L.col([
    L.row([await face('cards/faces/hermit.png', 'Upright'), await face('cards/faces-reversed/hermit-reversed.png', 'Reversed')], { gap: 16, name: 'Hermit pair' }),
    L.text('Drawn reversed (42 % of cards), only the art turns 180° in its window. The numeral, name and essence stay upright and lift 6.5 pt, and a small card/oxblood diamond sits under the essence.', 'caption', { w: 316 }),
    L.source('CardImages.swift:70, 95, 217; Game.swift:155-157', { w: 316 }),
  ], { gap: 10, name: 'Reversed faces' }),
], { gap: 48, align: 'MIN', name: 'Flip row' }))

// ---------- the thread -------------------------------------------------------------------
const th = L.board({ name: 'The reading · The thread', kicker: 'THE TABLE', title: 'The thread', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'A gold hairline under the spread, laid one length at a time as each card lands, with a diamond node under every place. Once the reading has been spoken a bead of light runs its length. With one card it becomes two short wings.',
  tags: [['claude', 'Claude chose · kept by Akash']] })
sec.appendChild(th)
// The sheet is 17 rows of 72 pt (glyphs/ui/thread/thread-{1,3,5}-*.svg stacked); label each row beside it.
const threadSheet = async () => {
  const SW = 1100, k = SW / 1260, pitch = 72 * k, LW = 170
  const im = await L.img('glyphs/ui/thread/thread-sheet@3x.png', { w: SW, scale: 3, name: 'Thread sheet' })
  const box = L.frame({ name: 'Thread sheet, labelled', w: LW + SW, h: im.height })
  box.appendChild(im); im.x = LW; im.y = 0
  const G = [['One card', ['draw', 'reading', 'lit · a card hovered', 'woven', 'kept']], ['Three cards', ['draw', 'reading', 'lit · a card hovered', 'woven', 'running light', 'kept']], ['Five cards', ['draw', 'reading', 'lit · a card hovered', 'woven', 'running light', 'kept']]]
  let i = 0
  for (const [g, states] of G) {
    states.forEach((st, j) => {
      const t = j === 0 ? L.rich([[g + '\n', 'smallStrong'], [st, 'small']], 'small', { w: LW - 16 }) : L.text(st, 'small', { w: LW - 16 })
      box.appendChild(t); t.x = 0; t.y = Math.round(i * pitch + pitch / 2 - (j === 0 ? 10 : 10) - (j === 0 ? 10 : 0))
      i++
    })
    if (i < 17) { const r = figma.createRectangle(); r.name = 'Group rule'; r.resize(LW + SW, 1); r.x = 0; r.y = Math.round(i * pitch); r.fills = [L.solid(L.C.gold, 0.25)]; box.appendChild(r) }
  }
  return L.col([box, L.text('The thread, every state', 'smallStrong'), L.text('glyphs/ui/thread/thread-sheet · also as one SVG per row (thread-1-draw.svg … thread-5-kept.svg), 1260 × 72 pt each, at the default window.', 'caption', { w: LW + SW })], { gap: 10, name: 'Sheet' })
}
const nodes = []
for (const [f, t] of [['thread-node-empty', 'Empty'], ['thread-node-growing', 'Landing'], ['thread-node', 'Laid'], ['thread-node-lit', 'Lit (hovered)']]) {
  nodes.push(L.col([await L.svg('glyphs/ui/diamonds/' + f + '.svg', { w: 96 }), L.text(t, 'smallStrong')], { gap: 8, align: 'CENTER', name: 'Node · ' + t }))
}
L.add(th, L.row([
  await threadSheet(),
  L.col([
    L.specs([
      ['Line', '1 pt gold/ink at the base strength over a 5 pt gold/light glow at 0.45 × base. Base 0.30 in the draw, 0.40 in the reading, 0.62 once the thread is found. Each length stops 9 pt short of its nodes.', 'RootView.swift:506-560'],
      ['Nodes', 'Diamonds with a 4.2 pt half-diagonal (5.5 hovered). Empty: a 0.8 pt gold/ink-40 outline. Laid: filled gold/ink with a gold/light glow of radius 14 (26 hovered).', 'RootView.swift:556-589'],
      ['Where', 'A 40 pt band across the stage, 26 pt under the cards: y 452.4 for three or five cards on the 1260 × 828 stage, 520.6 for one. The names hang 20 pt below it.', 'Game.swift:869-872'],
      ['Growing', 'Each length grows from the previous node over 0.9 s (smoothstep, thread/grow) as its card lands. Reduce Motion: drawn whole.', 'RootView.swift:533-536'],
      ['Running light', 'Three gold/light glows (radius 34, 12 and 2.6, at 30, 55 and 100 %) with a 90 pt trail of 1.4 pt gold/ink, first node to last in 1.8 s (thread/spark). It runs at the end of the recital, when a thread is found, and every 13 s while the reading lies open.', 'RootView.swift:591-625; Game.swift:529-546'],
      ['Resting', 'The 13 s run skips while the altar is open, while weaving or returning, under the keys, and when no one can see the window.', 'Game.swift:535-546'],
      ['Weaving', 'While OpenAI is asked, the bead swings end to end and back, 3.3 s a cycle (thread/weaving).', 'RootView.swift:594-595'],
      ['One card', 'Two 1 pt wings from ±10 pt to ±(10 + 0.55 × card width), fading out from gold/ink.', 'RootView.swift:506-633'],
      ['Dimmed', 'To 10 % under the altar; hushed by the return.', 'RootView.swift:506-633'],
    ], { w: 930, keyW: 130 }),
    L.col([L.text('The node, four ways', 'h3'), L.row(nodes, { gap: 40, name: 'Nodes' }), L.source('glyphs/ui/diamonds/thread-node-*.svg · RootView.swift:556-589', { w: 930 })], { gap: 12, name: 'Node block' }),
    L.note({ w: 930, tags: ['open'], title: 'A kept thread never looks woven', body: 'On the moon’s pages a kept reading’s thread stays at 0.40 even when a thread was found, so the brighter 0.62 never shows there. Intended or not is yours to decide.', source: 'Keeping.swift' }),
  ], { gap: 32, name: 'Thread specs' }),
], { gap: 56, align: 'MIN', name: 'Thread row' }))

// ---------- order, fit, look -------------------------------------------------------------
const idx = n => { const i = ORDER.indexOf(n.name); return i < 0 ? 99 : i }
;[...sec.children].sort((a, b) => idx(a) - idx(b)).forEach((k, i) => sec.insertChild(i, k))
L.fit(sec)
await L.arrange('Experience & notes')
const out = []
for (const b of [head, rib, take, th]) out.push(await L.snap(b, 'pages/reading/' + b.name.replace('The reading · ', '').toLowerCase().replace(/[^\w]+/g, '-') + '.png', { scale: 0.3, wait: out.length ? 300 : 1800 }))
return out
