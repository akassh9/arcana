// Experience & notes · The reading (2 of 3) — the recital and the verse, at rest and under the pointer, three readings.
const L = S.lib
const sec = await L.chapter('The reading', { clear: false })
const WIN = 'shots-window/'
const ORDER = ['The reading · Header', 'The reading · The ribbon and the hand', 'The reading · Taking a card', 'The reading · The thread',
  'The reading · The recital and the verse', 'The reading · At rest and under the pointer', 'The reading · One, three and five cards',
  'The reading · The altar', 'The reading · Find the thread', 'The reading · The epigraph']
const MINE = ORDER.slice(4, 7)
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

// ---------- the recital and the verse ---------------------------------------------
const rec = L.board({ name: 'The reading · The recital and the verse', kicker: 'THE READING', title: 'The recital and the verse', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'Once the last card has written itself the reading is spoken back: the written question first, if there was one, then one line of verse for each card, each with its card’s bowl. Then light runs the thread and the spread rings as one chord.',
  tags: [['claude', 'Claude chose · kept by Akash']] })
sec.appendChild(rec)
const RF = [
  ['recital-1-cards-laid', 'Before the recital', 'The last card written; the cards not drawn have gone.'],
  ['recital-2-epigraph', '0.9 s · the question read back', 'Arriving over 1.1 s on a low bowl (C3, dark).'],
  ['recital-3-line-1-arriving', '3.08 s · the first line arriving', 'Half-way: opacity 0.5, blur 2.5, 3.5 pt low.'],
  ['recital-4-line-1', '3.8 s · the first line', 'In place. It began at 2.7 s, 1.8 s after the question.'],
  ['recital-5-line-2', '4.15 s · the second line', 'A line every 1.45 s, each with its card’s bowl and a halo flare.'],
  ['recital-6-line-3', '5.6 s · the third line', 'FIND THE THREAD appears now, with a key.'],
  ['recital-7-rung', '7.05 s · rung', 'Light runs the thread; the chord; HOLD · RETURN THE CARDS.'],
  ['recital-8-reading-a-line', 'Afterwards · reading a line', 'The pointer on the middle card: its line lit, the others at 30 %.'],
]
const rfw = (2256 - 3 * 32) / 4
const rfs = []
for (const [f, t, c] of RF) rfs.push(await fig(`type-ink/verse/${f}@2x.png`, rfw, t, c, { stroke: '#000000', strokeA: 0.06, r: 8 }))
L.add(rec, L.col([L.row(rfs.slice(0, 4), { gap: 32, align: 'MIN' }), L.row(rfs.slice(4), { gap: 32, align: 'MIN' })], { gap: 32, name: 'The recital, eight moments' }))
L.add(rec, L.text('type-ink/verse/recital-* · stage renders, no title-bar inset. The Six of Cups, the Hermit and the Six of Swords, asked “Should I leave the city before winter”. Times from the moment the reading begins, 0.35 s after the last card is written.', 'caption', { w: 2256 }))
L.add(rec, L.section('The cadence', { style: 'h2', lead: 'Three Fates with a written question. Without one, the verse starts at 0.9 s and everything after moves 1.8 s earlier. With Reduce Motion the pause after the question is 0.5 s and the lines come 0.15 s apart. After the chord, light runs the thread again every 13 s.' }))
L.add(rec, timeline([
  { label: 'The cards not drawn fall 40 pt and fade', from: 0, to: 0.5 },
  { label: 'The row rises to its reading place (spring)', from: 0, to: 1.1, soft: true, value: 'spring 1.1 / 0.86' },
  { label: 'The question read back, on a low bowl', from: 0.9, to: 2.0 },
  { label: 'Line 1, its bowl, its halo flares', from: 2.7, to: 3.8 },
  { label: 'Line 2', from: 4.15, to: 5.25 },
  { label: 'Line 3', from: 5.6, to: 6.7 },
  { label: 'FIND THE THREAD fades in (with a key)', from: 5.6, to: 6.3 },
  { label: 'Light runs the thread', from: 7.05, to: 8.85 },
  { label: 'The chord: every card’s note at once', from: 7.05, sound: true },
  { label: 'HOLD · RETURN THE CARDS fades in', from: 7.05, to: 7.85 },
], { t: 9, step: 1, name: 'Timeline · The recital' }))
L.add(rec, L.source('Game.swift:489-494, 501-547; RootView.swift:332, 986-997, 1178-1190, 1219-1241, 1289', { w: 2256 }))
const VL = [['verse-one-line', 900, 'One card · verse/one', 'Didot 27, one line.'], ['verse-three-lines', 800, 'Three cards · verse/three', 'Didot 22, lines 12 pt apart.'], ['verse-five-lines', 800, 'Five cards · verse/five', 'Didot 19 (18.5 in code), lines 8 pt apart.']]
const vls = []
for (const [f, w, t, c] of VL) vls.push(await fig(`type-ink/verse/${f}@2x.png`, Math.round(w * 0.78), t, c))
L.add(rec, L.row([
  L.col([L.text('The verse, three sizes', 'h3'), L.row(vls, { gap: 40, align: 'MAX', name: 'Verse sizes' })], { gap: 16, name: 'Verse block' }),
], { gap: 48, name: 'Verse row' }))
L.add(rec, L.row([
  L.specs([
    ['Type', 'verse/one 27, verse/three 22, verse/five 19 pt Didot; ink/text-92 when lit, ink/text-30 when another card is looked at.', 'RootView.swift:1196-1241'],
    ['Column', 'Centred in 0.86 of the stage width (1083.6 pt), from 38 pt under the names: y 510.4 for three or five cards, 578.6 for one. Line box 1.34 × the size.', 'RootView.swift:1199-1206; Game.swift:873-878'],
    ['Fitting', 'Every line is one line. It shrinks to 70 % before it would wrap, and the whole verse shrinks in small windows, never under 13 pt.', 'RootView.swift:1199-1206'],
    ['Arriving', 'word/arrive: opacity 0 → 1, blur 5 → 0, 7 pt up, 1.1 s easeOut.', 'RootView.swift:1219-1231'],
    ['Sound', 'Each line rings its card’s bowl (gain 0.26), an octave lower and darker if reversed; the chord at the end is every note at once (0.34).', 'Game.swift:515-547'],
  ], { w: 1100, keyW: 110 }),
  L.col([
    L.note({ w: 1108, tags: ['fixed'], title: 'Each line is the card’s own', body: 'A line belongs to the card, upright or reversed, not to its place in the spread. The places only name themselves and go to OpenAI when the thread is found.', source: 'Deck.swift:20-25; Weave.swift:172-186' }),
    L.note({ w: 1108, tags: ['open'], title: 'The thread is offered before the reading is over', body: 'FIND THE THREAD appears as the last line begins, about 1.45 s before the chord; HOLD · RETURN THE CARDS waits for the chord. So the thread can be asked for while the reading is still being spoken.', source: 'RootView.swift:1156, 1252-1254' }),
  ], { gap: 24, name: 'Verse notes' }),
], { gap: 48, align: 'MIN', name: 'Verse specs row' }))

// ---------- at rest and under the pointer -------------------------------------------------
const rest = L.board({ name: 'The reading · At rest and under the pointer', kicker: 'THE READING', title: 'At rest and under the pointer', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'Once the chord has rung the reading lies open for as long as you like. From here you can look at a card, open it on the altar, find the thread, or hold to give the cards back (next chapter).' })
sec.appendChild(rest)
L.add(rest, await annotatedWin(WIN + '67-closing-prompt.png', [
  { x: 455, y: 190, label: 'The spread', body: 'Three cards, 145 × 256.7 pt, 29 pt apart, centred at y 298.1 (0.36 H). They rose there from 273.2 as the reading began. Tilted ∓0.7°, Shadow/Card on table.', source: 'Game.swift:489-494, 853-885; RootView.swift:323-330' },
  { x: 840, y: 440, label: 'A reversed card', body: 'The Hermit, reversed: its art turned, a small card/oxblood diamond under the essence. It speaks its reversed line and its bowl sounds an octave lower, in a darker voice.', source: 'CardImages.swift:70, 95; Game.swift:520-525' },
  { x: 540, y: 484, label: 'The thread', body: 'At base 0.40 now. Light ran along it as the chord rang and runs again every 13 s.', source: 'RootView.swift:506-633; Game.swift:529-546' },
  { x: 455, y: 522, label: 'Position names', body: 'caps/slot in gold/ink-80.', source: 'RootView.swift:654-688' },
  { x: 930, y: 330, label: 'Halos at rest', body: 'Each card’s halo holds at 34 %. It flared to full as that card’s line was spoken.', source: 'RootView.swift:467-499; Game.swift:551-559' },
  { x: 470, y: 556, label: 'The verse', body: 'verse/three: Didot 22, ink/text-92, one line per card in the order of the places, centred, from y 510.4.', source: 'RootView.swift:1196-1241' },
  { x: 525, y: 698, label: 'FIND THE THREAD', body: 'Only with a usable OpenAI key in Settings. caps/thread-action (Didot 10, tracking 3.8, gold/ink) beside the thread glyph, 44 pt under the verse. See Find the thread.', source: 'RootView.swift:1248-1306' },
  { x: 520, y: 828, label: 'HOLD · RETURN THE CARDS', body: 'caps/foot-hold (Didot 9, tracking 4) in gold/ink-60, 32 pt above the foot, fading in over 0.8 s once the chord has rung. The reading’s only instruction.', tags: ['akash'], source: 'RootView.swift:1178-1190' },
], { title: 'The reading at rest, 1260 × 860', caption: 'shots-window/67-closing-prompt · the Emperor (What Was), the Nine of Pentacles (What Is), the Hermit reversed (What Tends), after the chord.' }))
L.add(rest, L.section('Looking at a card', { style: 'h2', lead: 'Hover is the reading’s one quiet interaction: the card rises and its line is read out of the verse. A click opens it on the altar.' }))
L.add(rest, await annotatedWin(WIN + '6-reading-hover.png', [
  { x: 712, y: 196, label: 'The card looked at', body: 'Rises 12 pt (spring 0.3 / 0.7) with Glow/Card lit. The pointer is a pointing hand; a click opens the altar.', source: 'RootView.swift:378-386, 404' },
  { x: 560, y: 190, label: 'Its halo brightens', body: 'From 34 to 64 %.', source: 'RootView.swift:467-499' },
  { x: 662, y: 484, label: 'Its node grows', body: 'Half-diagonal 4.2 → 5.5 pt, glow radius 14 → 26.', source: 'RootView.swift:556-589' },
  { x: 684, y: 503, label: 'Its name in full gold', body: 'caps/slot in gold/ink.', source: 'RootView.swift:654-688' },
  { x: 485, y: 597, label: 'Its line, lit', body: 'ink/text-92 with Glow/Verse lit (gold/light 90 %, radius 12).', source: 'RootView.swift:1209-1241' },
  { x: 475, y: 556, label: 'The other lines dim', body: 'To ink/text-30. The card moves in 0.22 s, the verse in 0.35 s (hover/read). Leaving the card undoes it all.', source: 'RootView.swift:379-385, 1233' },
], { title: 'A card looked at, 1260 × 860', caption: 'shots-window/6-reading-hover · the pointer on the Nine of Pentacles.' }))

// ---------- three readings -------------------------------------------------------------
const three = L.board({ name: 'The reading · One, three and five cards', kicker: 'THE READING', title: 'One, three and five cards', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'The same table for every spread: one row, centred, the cards 0.2 of a card apart. A single card is larger and its verse bigger. Every size is a proportion of the stage, capped so a large window doesn’t blow the cards up.',
  tags: [['panel', 'Design panel: one row, no cross']] })
sec.appendChild(three)
const tw = (2256 - 2 * 48) / 3, ts = tw / 1260
L.add(three, L.row([
  await smallWin('68-closing-prompt-one.png', ts, 'One Card', 'shots-window/68-closing-prompt-one · Strength, “Do not raise your voice.”, HOLD · RETURN THE CARD.'),
  await smallWin('57-minors.png', ts, 'Three Fates, suit cards', 'shots-window/57-minors · Five of Cups, Queen of Cups, the Star (the sky has answered it).'),
  await smallWin('69-closing-prompt-five.png', ts, 'The Long Road', 'shots-window/69-closing-prompt-five · Page of Cups, Six of Cups reversed, Six of Swords, Four of Wands, Ten of Cups.'),
], { gap: 48, align: 'MIN', name: 'Three spreads' }))
const G = [
  ['Card in the draw', '168.4 × 298.1 (0.36 H)', '145.0 × 256.7 (0.31 H)', '145.0 × 256.7 (0.31 H)'],
  ['Card in the reading', '203.4 × 360 (0.44 H, capped at 360)', '145.0 × 256.7', '145.0 × 256.7 (the width would allow 323)'],
  ['Between cards', '—', '29.0 (0.2 of a card)', '29.0; the row is 841 wide'],
  ['Row centre, draw → reading', '273.2 → 314.6 (0.33 → 0.38 H)', '273.2 → 298.1 (0.33 → 0.36 H)', '273.2 → 298.1'],
  ['Thread · names', '520.6 · 540.6', '452.4 · 472.4', '452.4 · 472.4'],
  ['Verse', 'verse/one 27 pt from 578.6', 'verse/three 22 pt, gap 12, from 510.4', 'verse/five 19 pt, gap 8, from 510.4'],
  ['The thread', 'two short wings', 'two lengths', 'four lengths'],
  ['Positions', 'THE ANSWER', 'WHAT WAS · WHAT IS · WHAT TENDS', 'SITUATION · CROSSING · ROOT · COUNSEL · OUTCOME'],
  ['Closing prompt', 'HOLD · RETURN THE CARD', 'HOLD · RETURN THE CARDS', 'HOLD · RETURN THE CARDS'],
]
L.add(three, L.col([
  L.text('Geometry, in pt on the 1260 × 828 stage', 'h3'),
  L.table([{ label: '', w: 300, style: 'smallStrong' }, { label: 'One Card', w: 620 }, { label: 'Three Fates', w: 620 }, { label: 'The Long Road', w: 620 }], G, { name: 'Spread geometry', zebra: true }),
  L.source('Computed from Layout: Game.swift:846-885 (slotH = max(110, min(cap, H × 0.31 or 0.36 / 0.44, 0.84 W ÷ (n × 0.565 + (n − 1) × 0.113)))); RootView.swift:1178-1241; Deck.swift:38-50', { w: 2256 }),
], { gap: 14, name: 'Geometry block' }))
L.add(three, L.row([
  await smallWin('11-five-small.png', 0.75, 'The Long Road at the minimum window', 'shots-window/11-five-small · 940 × 660: cards 110.0 × 194.7 pt; the verse shrinks to fit.'),
  L.col([
    await fig('shots/81-large-1728-reading.png', 1000, 'A large window, 1728 × 1117', 'shots/81-large-1728-reading · stage render, no title-bar inset. The cards stop at 262 pt while the sky keeps growing, so the room gets sparser.'),
  ], { gap: 10, name: 'Large' }),
  L.col([
    L.note({ w: 408, tags: ['open'], title: 'Nobody has designed full screen', body: 'Past the default size the cards (262 or 360 pt), the ribbon card (178), the altar card (480) and the verse (27 / 22 / 19) stop growing; the sky, the wheel and the ribbon’s span keep scaling.', source: 'Game.swift:853-863; RootView.swift:1406' }),
    L.note({ w: 408, tags: ['rejected'], title: 'A cross for five', body: 'The design panel turned down a cross layout for The Long Road on 24 Sep: polish, not a new feeling.' }),
  ], { gap: 24, name: 'Size notes' }),
], { gap: 48, align: 'MIN', name: 'Sizes row' }))
// ---------- order, fit, look -------------------------------------------------------------
const idx = n => { const i = ORDER.indexOf(n.name); return i < 0 ? 99 : i }
;[...sec.children].sort((a, b) => idx(a) - idx(b)).forEach((k, i) => sec.insertChild(i, k))
L.fit(sec)
await L.arrange('Experience & notes')
const out = []
for (const b of [rec, rest, three]) out.push(await L.snap(b, 'pages/reading/' + b.name.replace('The reading · ', '').toLowerCase().replace(/[^\w]+/g, '-') + '.png', { scale: 0.3, wait: out.length ? 300 : 1800 }))
return out
