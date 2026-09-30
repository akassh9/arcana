// Experience & notes · The reading (3 of 3) — the altar, find the thread, the epigraph.
const L = S.lib
const sec = await L.chapter('The reading', { clear: false })
const WIN = 'shots-window/'
const ORDER = ['The reading · Header', 'The reading · The ribbon and the hand', 'The reading · Taking a card', 'The reading · The thread',
  'The reading · The recital and the verse', 'The reading · At rest and under the pointer', 'The reading · One, three and five cards',
  'The reading · The altar', 'The reading · Find the thread', 'The reading · The epigraph']
const MINE = ORDER.slice(7)
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

const cw3 = (2256 - 2 * 48) / 3, s3 = cw3 / 1260
// ---------- the altar ------------------------------------------------------------------
const alt = L.board({ name: 'The reading · The altar', kicker: 'THE READING', title: 'The altar', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'Click a card in the reading and it opens full size on the altar. A pearl veil falls over the table, the card floats on a breathing light and turns toward the pointer, and its words arrive beside it one after another. A click anywhere, esc, space or return closes it.',
  tags: [['claude', 'Claude chose · kept by Akash']] })
sec.appendChild(alt)
L.add(alt, await annotatedWin(WIN + '7-inspect.png', [
  { x: 130, y: 430, label: 'The veil', body: 'A radial wash of sky/pearl over the whole window: 82 % at the centre, 62 % half-way, 36 % at the rim, so the sky still shows. Beneath it the cards drop to 4 %, the thread to 10 %, the names to 15 % and a question to 40 %; the verse, prompts, halos and thread panel go.', source: 'RootView.swift:1428-1437; Game.swift:660-675' },
  { x: 416, y: 175, label: 'Back-light', body: 'A circle 1.9 × the card’s height: gold/light at 55 % (+12 % at each breath) through sky/dawn at 35 % to nothing, screen-blended. Glow/Altar back-light.', source: 'RootView.swift:1424-1446' },
  { x: 556, y: 212, label: 'The card', body: 'min(480, 0.62 H) tall: 271.2 × 480 pt. It floats ±3 pt and breathes over 10 s, and turns toward the pointer, up to 6° about x and 8° about y (perspective 0.45, spring 0.8 / 0.86), a soft-light sheen sliding with it. Shadow/Altar card.', source: 'RootView.swift:1532-1573; Chamber.swift:28-36' },
  { x: 598, y: 319, label: 'Its place', body: 'caps/altar-label: Didot 10, tracking 4.2, gold/ink. The column is at most 360 pt wide, 69.3 pt from the card (min(72, 0.055 W)).', source: 'RootView.swift:1461-1513' },
  { x: 598, y: 380, label: 'Its name', body: 'display/altar-name: Didot Bold 32, tracking 4, ink/text, Glow/Altar name. It wraps.', source: 'RootView.swift:1461-1513' },
  { x: 598, y: 435, label: 'Its numeral', body: 'caps/altar-numeral: Didot 10, tracking 3, ink/text-42, 8 pt under the name. Court cards have none.', source: 'RootView.swift:1470-1482' },
  { x: 598, y: 469, label: 'Its essence', body: 'altar/essence: Didot Italic 20, gold/ink.', source: 'RootView.swift:1461-1513' },
  { x: 598, y: 498, label: 'A rule', body: '54 × 1 pt, ink/text-20.', source: 'RootView.swift:1461-1513' },
  { x: 598, y: 531, label: 'Its line', body: 'altar/line: Didot 25, ink/text-92: the line the verse spoke.', source: 'RootView.swift:1461-1513' },
  { x: 598, y: 572, label: 'Three keywords', body: 'caps/altar-keys: Didot 10, tracking 2.6, ink/text-50, between 4 × 4 gold/ink-55 diamonds, 10 pt apart.', source: 'RootView.swift:1461-1513' },
], { title: 'The altar, 1260 × 860', caption: 'shots-window/7-inspect · the Nine of Pentacles, opened from What Is.' }))
L.add(alt, L.section('The words arrive', { style: 'h2', lead: 'One item after another: place, name and numeral, essence, rule, line, keywords. Item k rises over 0.18 + 0.17k → 0.95 + 0.17k s (smoothstep): opacity 0 → 1, 10 pt up, blur 4 → 0. All in place 1.8 s after the altar opens. With Reduce Motion they are there at once.' }))
const RS = ['0.25', '0.45', '0.65', '0.85', '1.05', '1.25', '1.50']
const rw = (2256 - 6 * 26) / 7
const rise = []
for (const t of RS) rise.push(await fig(`type-ink/altar/altar-rising-${t}s-column@2x.png`, rw, t + ' s', null, { stroke: '#000000', strokeA: 0.05, r: 8 }))
L.add(alt, L.col([L.row(rise, { gap: 26, name: 'Rising' }), L.source('RootView.swift:1461-1513, 1575-1585 · type-ink/altar/altar-rising-*-column (the Star)', { w: 2256 })], { gap: 12, name: 'Rising block' }))
L.add(alt, L.section('A court card, a reversed card, a question', { style: 'h2' }))
L.add(alt, L.row([
  await smallWin('58-altar-court.png', s3, 'A court card, reversed', 'shots-window/58-altar-court · the Queen of Wands. No numeral, so REVERSED stands alone in card/oxblood, caps/altar-numeral. The reversed line and keywords.'),
  await fig('type-ink/altar/altar-the-star-reversed-crop@2x.png', Math.round(491 * 800 / 620), 'A Major, reversed', 'type-ink/altar/altar-the-star-reversed-crop · XVII, then “· REVERSED” 10 pt after it in card/oxblood. The art turned in its window, the type upright.', { r: 8, stroke: '#000000', strokeA: 0.05 }),
  await smallWin('43-altar-asked.png', s3, 'Under a question', 'shots-window/43-altar-asked · the Star; the question read back stays above, dimmed to 40 %.'),
], { gap: 48, align: 'MIN', name: 'Altar variants' }))
L.add(alt, L.row([
  L.specs([
    ['Opens', 'A click on a card in the reading (not during the draw): 0.45 s easeOut, with a tick and the card’s bowl.', 'Game.swift:660-675'],
    ['Closes', 'A click anywhere, esc, space or return: 0.3 s. The card stops turning at once.', 'Game.swift:668-674; RootView.swift:1519'],
    ['Reduce Motion', 'No turning; the card is still (the breath held at half); the words are there at once.', 'RootView.swift:1424, 1446, 1456'],
    ['Clock', 'The words’ clock runs at 60 fps for the first 1.9 s, then 30 fps while the card floats.', 'RootView.swift:1523-1528'],
    ['Kept readings', 'The same altar opens from the moon’s pages.', 'Keeping.swift'],
  ], { w: 1100, keyW: 130 }),
  L.col([
    L.note({ w: 1108, tags: ['claude'], title: 'A radial veil', body: 'Claude made the veil radial on 25 Sep, thinner at the edges so the room never goes blank. The same day a closed altar that kept catching clicks was fixed.' }),
    L.note({ w: 1108, tags: ['open'], title: 'Two veils, two dims', body: 'The keys page veil is 80 / 60 / 32 %, the altar’s 82 / 62 / 36 %. The table under the altar dims cards to 4 %, a kept page to 6 %. One value each, or on purpose? Yours to decide.', source: 'RootView.swift:1428-1437; Keeping.swift' }),
  ], { gap: 24, name: 'Altar notes' }),
], { gap: 48, align: 'MIN', name: 'Altar specs row' }))

// ---------- find the thread -----------------------------------------------------------------
const ft = L.board({ name: 'The reading · Find the thread', kicker: 'THE READING', title: 'Find the thread', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'An optional closing ritual. With an OpenAI key in Settings, a small gold invitation waits under the verse. Pressed, the cards settle while the model is asked, and the answer replaces the verse as one finished folio: two sentences, a gold diamond and a question.',
  tags: [['akash', 'Akash: the key lives in Settings'], ['claude', 'Claude: offered only with a usable key']] })
sec.appendChild(ft)
L.add(ft, await annotatedWin(WIN + '10-woven.png', [
  { x: 300, y: 554, label: 'Two sentences', body: 'thread/body: Didot 19, ink/text-92, line spacing +5, centred in min(660, 0.62 W) = 660 pt, from y 510.4 where the verse was.', source: 'RootView.swift:1307-1363' },
  { x: 660, y: 615, label: 'A gold diamond', body: '5 × 5 pt gold/ink with Glow/Thread end diamond, 18 pt below the sentences.', source: 'RootView.swift:1307-1363' },
  { x: 400, y: 647, label: 'Its question', body: 'thread/question: Didot Italic 18, gold/ink, line spacing +3, Glow/Thread question (gold/light 60 %, radius 12), 18 pt below the diamond.', source: 'RootView.swift:1307-1363' },
  { x: 540, y: 484, label: 'The thread, brighter', body: 'Base 0.62 once found. The light runs it once more, with a soft chord.', source: 'RootView.swift:506-633; Game.swift:700-703' },
  { x: 160, y: 420, label: 'Set in the air', body: 'In the code’s words: “a single finished folio, never a chat transcript… set in the air where the verse was, not in a box”. No panel, border or scrolling. It stays until the table is cleared, and is kept with a returned reading.', source: 'RootView.swift:1244-1245' },
], { title: 'The folio, 1260 × 860', caption: 'shots-window/10-woven · “What was rooted is being lifted into the light. The hand that steadies it is already yours.” / “What would you tend if no one were watching the roots?”' }))
L.add(ft, L.section('Every state', { style: 'h2', lead: 'The panel’s states cross-fade in 0.3–0.7 s; the verse leaves in 0.6 s and the folio arrives in 0.5 s. Crops of the stage from the verse down (type-ink/thread/thread-*-panel).' }))
const PS = [
  ['offered', 'Offered', 'FIND THE THREAD in caps/thread-action (Didot 10, tracking 3.8, gold/ink), 11 pt right of the thread glyph (an 8 pt gold/ink-90 diamond on an 18 pt gold/ink-40 stem). A 200 × 30 button, 44 pt under the verse.'],
  ['settling', 'Settling', 'LETTING THE CARDS SETTLE in caps/thread-status (Didot 10, tracking 3.2, ink/text-52) beside a 7 pt glyph, while the bead swings along the thread. The return prompt steps away. Up to 45 s.'],
  ['found', 'Found', 'The folio in the verse’s place.'],
  ['quiet', 'The thread stayed quiet', 'THE THREAD STAYED QUIET in caps/thread-status and, 18 pt to its right, “try again” in italic/small (Didot Italic 13, gold/ink). Any failure while the key still works.'],
  ['quiet-refused', 'Quiet, the key refused', 'The same words without “try again”, when OpenAI refused the key or it is out of credit. The invitation doesn’t come back this launch.'],
  ['found-asked', 'Found, under a question', 'A written question stays above the spread.'],
]
const pw = (2256 - 2 * 48) / 3
const pcs = []
for (const [f, t, c] of PS) pcs.push(await fig(`type-ink/thread/thread-${f}-panel@2x.png`, pw, t, c, { r: 8, stroke: '#000000', strokeA: 0.05 }))
L.add(ft, L.col([L.row(pcs.slice(0, 3), { gap: 48, align: 'MIN' }), L.row(pcs.slice(3), { gap: 48, align: 'MIN' }), L.source('RootView.swift:1248-1380; Game.swift:677-727', { w: 2256 })], { gap: 32, name: 'Thread states' }))
L.add(ft, L.row([
  await smallWin('73-reading-no-key.png', s3, 'Not offered', 'shots-window/73-reading-no-key · the app as downloaded, with no key: only the verse and the closing prompt.'),
  L.col([
    L.text('What OpenAI is sent', 'h3'),
    L.specs([
      ['Sent', 'The spread’s name and gloss, then for each place its name, the card, upright or reversed, the card’s essence, its line and its keywords. Never the written question.', 'Weave.swift:72-75, 172-186'],
      ['Model', 'gpt-5 by default (ARCANA_AI_MODEL overrides it), store: false, a strict JSON schema of thread and question, a 45 s timeout.', 'Weave.swift:28, 76-127'],
      ['Voice', 'From the prompt: “Write with restraint: precise, literary, humane, and concrete. Never mention AI, models, prompts, tarot stereotypes, prediction, fate, or certainty.” The thread is “exactly two short sentences”, the question “exactly one short reflective question that gives the reader agency”.', 'Weave.swift:84-99'],
      ['Offered when', 'A key is in Settings and OpenAI hasn’t refused it. The key is checked with OpenAI for free.', 'Weave.swift:32-66; Settings.swift:89-159'],
      ['Kept', 'A found thread goes with the reading when the hold returns it, and comes back on the moon’s pages.', 'Keeping.swift:169-173'],
    ], { w: 1400, keyW: 130 }),
  ], { gap: 14, name: 'What is sent' }),
], { gap: 48, align: 'MIN', name: 'Not offered row' }))

// ---------- the epigraph -----------------------------------------------------------------
const ep = L.board({ name: 'The reading · The epigraph', kicker: 'THE READING', title: 'The epigraph', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'If a question was written it comes back first, small and italic above the spread, under a short gold rule. It arrives whole, never typed out again, and stays until the table is cleared.',
  tags: ['panel', ['akash', 'Akash: keep the question with the reading']] })
sec.appendChild(ep)
L.add(ep, await annotatedWin(WIN + '22-epigraph.png', [
  { x: 590, y: 140, label: 'A gold rule', body: '30 × 1 pt, gold/ink-45, 21 pt above the line’s centre.', source: 'RootView.swift:973-1025' },
  { x: 490, y: 161, label: 'The question', body: 'voice/epigraph: Didot Italic 16, ink/text-62, one line, centred at y max(44, row − card / 2 − 40): 129.7 on the stage for three or five cards.', source: 'RootView.swift:973-1025' },
  { x: 772, y: 161, label: 'Printed, not written', body: 'The pen wrote it letter by letter; read back, it arrives whole out of a blur (1.1 s easeOut, blur 5 → 0, 7 pt up) on a low bowl, C3, dark.', tags: ['panel'], source: 'RootView.swift:986-997; Game.swift:504-514' },
  { x: 470, y: 556, label: 'The verse answers', body: 'The first line comes 1.8 s after the question.', source: 'Game.swift:501-514' },
], { title: 'The question read back, 1260 × 860', caption: 'shots-window/22-epigraph · “Should I leave the city before winter” over Three Fates, just spoken.' }))
const EA = ['0.00', '0.25', '0.50', '0.75', '1.00']
const eaw = (2256 - 4 * 32) / 5
const eas = []
for (const a of EA) eas.push(await fig(`type-ink/verse/epigraph-arriving-${a}@2x.png`, eaw, Math.round(Number(a) * 100) + ' %', null, { r: 8, stroke: '#000000', strokeA: 0.05 }))
L.add(ep, L.col([L.text('Arriving', 'h3'), L.row(eas, { gap: 32, name: 'Arriving' }), L.source('type-ink/verse/epigraph-arriving-* · progress through the 1.1 s arrival · RootView.swift:986-997', { w: 2256 })], { gap: 12, name: 'Arriving block' }))
const ew = (2256 - 3 * 32) / 4, es = ew / 1260
L.add(ep, L.row([
  await smallWin('23-epigraph-one.png', es, 'Over One Card', 'shots-window/23-epigraph-one'),
  await smallWin('28-five-asked.png', es, 'Over The Long Road', 'shots-window/28-five-asked'),
  await smallWin('24-epigraph-woven.png', es, 'Over the folio', 'shots-window/24-epigraph-woven · it stays when the thread replaces the verse.'),
  await smallWin('25-epigraph-small.png', es, 'The longest question, smallest window', 'shots-window/25-epigraph-small · 940 × 660.'),
], { gap: 32, align: 'MIN', name: 'Epigraph states' }))
L.add(ep, L.row([
  L.specs([
    ['Under the altar', 'Dims to 40 % (0.4 s easeOut).', 'RootView.swift:1020-1025'],
    ['Leaving', 'Fades over 0.7 s when the table clears. Returned with the hold, it is kept with the reading.', 'RootView.swift:986-997; Keeping.swift:169-173'],
    ['Reduce Motion', 'Fades in over 0.6 s, without the blur or the rise.', 'RootView.swift:986-997'],
    ['Never sent', 'The question stays on this Mac. It never touches the shuffle and never goes to OpenAI.', 'Quill.swift:11; Weave.swift:72; Game.swift:382'],
  ], { w: 1100, keyW: 150 }),
  L.col([
    L.note({ w: 1108, tags: ['panel'], title: 'The question arrives whole', body: 'Question in Gold, the panel’s runner-up, specified the question as printed when read back: the pen’s motion belongs to the asking, not the answer.' }),
    L.note({ w: 1108, tags: ['fixed'], title: 'Dim under the altar since 25 Sep', body: 'The epigraph used to stay at full strength over the altar; it dims since 25 Sep so the card is the only thing lit.' }),
  ], { gap: 24, name: 'Epigraph notes' }),
], { gap: 48, align: 'MIN', name: 'Epigraph specs row' }))
// ---------- order, fit, look -------------------------------------------------------------
const idx = n => { const i = ORDER.indexOf(n.name); return i < 0 ? 99 : i }
;[...sec.children].sort((a, b) => idx(a) - idx(b)).forEach((k, i) => sec.insertChild(i, k))
L.fit(sec)
await L.arrange('Experience & notes')
const out = []
for (const b of [alt, ft, ep]) out.push(await L.snap(b, 'pages/reading/' + b.name.replace('The reading · ', '').toLowerCase().replace(/[^\w]+/g, '-') + '.png', { scale: 0.3, wait: out.length ? 300 : 1800 }))
return out
