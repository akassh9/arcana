// Start here · Read me first, step 1 of 3 — Welcome & what Arcana is, A reading in seven moments,
// Status and links, How it was made. Steps 2 and 3 add the rest; each step replaces only its own boards.
const L = S.lib
const CH = 'Read me first'
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Read me first · Welcome', 'Read me first · A reading in seven moments', 'Read me first · Status and links',
  'Read me first · How it was made', 'Read me first · How to read this file', 'Read me first · Glossary',
  "Read me first · Where we'd most like your eyes"]
const MINE = ORDER.slice(0, 4)
for (const c of [...sec.children]) if (MINE.includes(c.name) || !ORDER.includes(c.name)) c.remove()

// ---- local helpers ----
const IN = 1600 - 144
const ref = (label, path, a, b) => L.link(L.text(label, 'code', { size: 11, lh: 16, alpha: 0.55 }), `${L.REPO}/blob/${L.SHA}/${path}${a ? '#L' + a + (b ? '-L' + b : '') : ''}`)
const linkText = (label, url, o = {}) => {
  const t = L.text(label, o.preset || 'bodyStrong', Object.assign({ color: L.C.gold, alpha: 1 }, o))
  t.textDecoration = 'UNDERLINE'
  return L.link(t, url)
}
const diamond = (size = 10, hex = L.C.gold, a = 1) => {
  const n = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 10 10"><path d="M5 0 L10 5 L5 10 L0 5 Z" fill="${hex}" fill-opacity="${a}"/></svg>`)
  n.name = 'Diamond'
  return n
}
// A gold hairline with a diamond over the centre of each column, like the app's thread under a spread.
const threadRow = (n, colW, gap, o = {}) => {
  const w = n * colW + (n - 1) * gap, h = 14
  const f = L.frame({ name: o.name || 'Thread', w, h })
  const line = figma.createRectangle(); line.name = 'Hairline'
  line.resize(w - colW, 1); line.x = colW / 2; line.y = h / 2 - 0.5
  line.fills = [L.solid(L.C.gold, 0.45)]
  f.appendChild(line)
  for (let i = 0; i < n; i++) { const d = diamond(10); f.appendChild(d); d.x = i * (colW + gap) + colW / 2 - 5; d.y = h / 2 - 5 }
  return f
}
const noteRow = (notes, w, gap = 24) => {
  const cw = Math.floor((w - gap * (notes.length - 1)) / notes.length)
  const r = L.row(notes.map(n => L.note(Object.assign({ w: cw }, n))), { gap, name: 'Notes', align: 'MIN' })
  const hMax = Math.max(...r.children.map(c => c.height))
  for (const c of r.children) { c.layoutSizingVertical = 'FIXED'; c.resize(c.width, hMax) }
  return r
}

// ============ 1 · Welcome + What Arcana is ============
{
  const b = L.board({ name: ORDER[0], kicker: 'Start here', title: 'Read me first',
    lead: 'Everything you need before the other two pages: what Arcana is, how a reading goes, where it stands, how it was made, how to read this file, its words, and where we’d most like your eyes.' })
  L.add(b.children[0], L.rich([['In this chapter   ', 'smallStrong'], ['What Arcana is  ·  A reading in seven moments  ·  Status and links  ·  How it was made  ·  How to read this file  ·  Glossary  ·  Where we’d most like your eyes', 'small']], 'small', { w: IN, name: 'In this chapter' }))
  const s = L.section('What Arcana is')
  L.add(b, s)
  const para = L.text('Arcana is a tarot reading for the Mac that should feel like stepping into first light: a pale sky with dawn rising from below, an old celestial wheel engraved faintly across it, and tonight’s real moon still up in the day. You hold a question in your mind, or write it with a pen that lays gold ink, then press and hold the sky until the deck is cut. You take your cards from a ribbon of all 78; each writes itself in gold that cools to ink and sounds a singing bowl, and the reading comes back as a few lines of verse. Hold once more and the ink sinks back into the stock, and the moon keeps the reading.', 'lead', { w: 860, size: 20, lh: 32 })

  // The invitation, as the room sets it, on a patch of the room's own sky.
  const inv = L.frame({ name: 'The invitation, verbatim', dir: 'v', w: 520, h: 250, r: 16, align: 'CENTER', justify: 'CENTER', gap: 14, clip: true })
  inv.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [
    { position: 0, color: L.rgba('#CCDBF5', 0.85) }, { position: 0.55, color: L.rgba('#F9F7F2', 1) }, { position: 1, color: L.rgba('#FFE0B0', 0.9) }] }]
  inv.strokes = [L.solid(L.C.stroke)]; inv.strokeWeight = 1; inv.strokeAlign = 'INSIDE'
  const rule = figma.createRectangle(); rule.name = 'Rule · gold (46 × 1 pt)'; rule.resize(46, 1); rule.fills = [L.solid(L.C.gold, 0.55)]
  const invT = L.text('Hold the question in your mind.', 'voice', { size: 26, lh: 34, name: 'Hold the question in your mind.' })
  const st = await L.styleByName('text', 'Voice/Question')
  if (st) { await invT.setTextStyleIdAsync(st.id) }
  invT.fills = [L.solid(L.C.ink, 0.74)]
  L.add(inv, rule, invT)
  const invCol = L.col([inv, L.text('The room’s one line of invitation, verbatim. It is the only sentence in the room at rest.', 'caption', { w: 520 }), ref('RootView.swift:766, 797', 'Sources/Arcana/RootView.swift', 766, 797)], { gap: 8, name: 'Invitation' })
  L.add(b, L.row([para, invCol], { gap: 76, name: 'What Arcana is · text and invitation', align: 'MIN' }))
  L.add(b, noteRow([
    { title: 'A native Mac app', body: 'SwiftUI, no dependencies. Type is Didot throughout, which ships with macOS.', kids: [ref('README.md:3, 165', 'README.md', 3)] },
    { title: '78 cards, three spreads', body: 'One Card, Three Fates and The Long Road: one, three or five cards.', source: 'Deck.swift:38-49' },
    { title: 'Kept on this Mac only', body: 'Readings returned with the hold are kept in one file on the Mac and sent nowhere. No counts, streaks or notifications.', source: 'Keeping.swift:26-60' },
    { title: 'One optional online step', body: '“find the thread” asks OpenAI, with the person’s own key from Settings, for two sentences and a question.', source: 'Weave.swift:84-96; Settings.swift:12-83' },
  ], IN))
  sec.appendChild(b)
}

// ============ 2 · A reading in seven moments ============
{
  const BW = 3600, inner = BW - 144, gap = 37, cw = 462
  const b = L.board({ name: ORDER[1], w: BW, kicker: 'Start here', title: 'A reading in seven moments', titleStyle: 'h1',
    lead: 'One Three Fates reading from the room at rest to the moon’s door, as the live window shows it. Everything between these moments moves; see Motion and the demo video.', leadW: 1200 })
  const M = [
    ['shots-window/1-invocation.png', 'The room at rest', 'The title, one line of invitation, three spreads, and the deck breathing in its ring. The only instruction is PRESS AND HOLD.', 'Hold the question in your mind.', 'RootView.swift:756-914'],
    ['shots-window/20-written.png', 'The question, written', 'Writing is optional. The invitation breathes out and the pen lays each letter in wet gold that cools to ink.', 'Should I leave the city before winter', 'Quill.swift:214-257'],
    ['shots-window/21-giving.png', 'The hold', 'Press and hold anywhere on the sky for 3.2 s. A gold arc fills round the deck and the question gives its gold to the dust. At full charge the deck is cut.', null, 'Game.swift:37; Chamber.swift:443-467, 579-611'],
    ['shots-window/56-ribbon-hand.png', 'The ribbon', 'All 78 cards fan out. The hand lifts the card under the pointer; a click takes it, and it flies to its slot and writes itself.', null, 'RootView.swift:295-413, 1139-1176'],
    ['shots-window/5-reading.png', 'The reading', 'The cards lie on the thread. A written question comes back first, then one line of verse per card, and the bowls ring as a chord.', 'Decide once. Hold the line.', 'RootView.swift:963-1025, 1196-1241'],
    ['shots-window/7-inspect.png', 'The altar', 'Click a card to lay it on the altar: full size under a pearl veil, with its position, name, essence, line and keywords.', 'Yours, by your own hand.', 'RootView.swift:1382-1585'],
    ['shots-window/44-kept.png', 'The return, and the moon’s door', 'Hold again: the ink sinks into the stock and the cards go home. The moon keeps the reading; click it, or press ↑, to open its door.', 'hold · remember', 'Game.swift:295-330; Keeping.swift:892-903, 979-1013'],
  ]
  const cells = []
  for (let i = 0; i < M.length; i++) {
    const [path, title, line, said, src] = M[i]
    const win = await L.window(path, { name: 'Window · ' + title + ' (' + path + ' @2x)' })
    win.rescale(cw / win.width)
    win.effects = [{ type: 'DROP_SHADOW', color: { r: 0.18, g: 0.14, b: 0.1, a: 0.14 }, offset: { x: 0, y: 8 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' }]
    const head = L.row([L.text(String(i + 1), 'h2', { size: 30, lh: 34, color: L.C.gold }), L.text(title, 'h3', { size: 17, lh: 24, w: cw - 40 })], { gap: 12, align: 'CENTER', name: 'Moment ' + (i + 1) })
    const kids = [head, win, L.text(line, 'body', { w: cw })]
    if (said) kids.push(L.text('“' + said + '”', 'voiceSmall', { w: cw, alpha: 0.8 }))
    kids.push(L.col([L.source(src, { w: cw }), L.text(path.replace('shots-window/', 'render · shots-window/'), 'code', { size: 10, lh: 14, alpha: 0.4, w: cw })], { gap: 2 }))
    cells.push(L.col(kids, { gap: 14, w: cw, name: 'Moment ' + (i + 1) + ' · ' + title }))
  }
  const strip = L.row(cells, { gap, name: 'Seven moments', align: 'MIN' })
  L.add(b, L.col([threadRow(7, cw, gap, { name: 'Thread · seven moments' }), strip], { gap: 22, name: 'Strip' }))
  L.add(b, L.text('Real window renders at @2x from the code at c7e12f4, with the Window/Title bar component on top. Posed readings are seeded, so the same cards recur across this file: The Emperor, Nine of Pentacles and The Hermit reversed. Moment 7 shows a kept reading opened from the moon; the sinking itself is in The return & the moon\'s door.', 'caption', { w: 1500 }))
  sec.appendChild(b)
}

// ============ 3 · Status and links ============
{
  const b = L.board({ name: ORDER[2], kicker: 'Start here', title: 'Status and links', titleStyle: 'h1',
    lead: 'Arcana 1.3 is out, as a free download on GitHub. These are the places it lives.' })
  const rows = [
    ['Version', [L.text('1.3, released on GitHub on 28 September 2026. 1.0 was the first download; 1.1 added an OpenAI key in Settings, kept in the Keychain; 1.2 checks the key with OpenAI; 1.3 added “⌘ , settings” to the keys page.', 'body', { w: 1000 }), L.chips(['shipped'])]],
    ['Runs on', [L.text('Apple silicon Macs, macOS 14 or later.', 'body', { w: 1000 }), L.row([ref('README.md:8', 'README.md', 8), ref('Package.swift:6', 'Package.swift', 6)], { gap: 16 })]],
    ['Signing', [L.text('Ad hoc signed, not notarized. People open it once, then System Settings ▸ Privacy & Security ▸ Open Anyway. There is no Apple team signature (which is also why a widget could never appear).', 'body', { w: 1000 }), L.chips([['open', 'Open: notarization']])]],
    ['Repository', [linkText('github.com/akassh9/arcana', 'https://github.com/akassh9/arcana'), L.text('Public since 24 September. Every source ref in this file links here, at commit c7e12f4.', 'small', { w: 1000 })]],
    ['Download', [linkText('github.com/akassh9/arcana/releases/latest', 'https://github.com/akassh9/arcana/releases/latest'), L.text('The link the launch post uses.', 'small', { w: 1000 })]],
    ['Demo video', [linkText('akassh9.github.io/arcana/demo.mp4', 'https://akassh9.github.io/arcana/demo.mp4'), L.text('One continuous 57 s take of a whole reading, for people who won’t install the app. Served by GitHub Pages from docs/. It is linked in the launch post, so it must never move.', 'small', { w: 1000 })]],
    ['Agent reading', [linkText('arcana.khanikad.workers.dev/today', 'https://arcana.khanikad.workers.dev/today'), L.text('A plain-text reading for people’s agents to fold into a morning brief. It is for agents only: people use the app. Code in agent/worker.js (never rename it).', 'small', { w: 1000 }), L.chips(['akash'])]],
    ['Launch film', [linkText('film/ in the repo', 'https://github.com/akassh9/arcana/tree/' + L.SHA + '/film'), L.text('“Everyone’s question”: a square, hand-drawn riso film, every frame drawn by code (film/arcana.html). The rendered mp4 is not committed.', 'small', { w: 1000 })]],
    ['Launch post', [L.text('Not in the repo. Ask Akash for the text.', 'body', { w: 1000 })]],
  ]
  const list = L.col([], { name: 'Status', gap: 0, w: IN })
  rows.forEach(([k, vs], i) => {
    const r = L.row([L.text(k, 'smallStrong', { w: 220 }), L.col(vs, { gap: 6, name: 'Value' })], { gap: 24, pad: [16, 0], name: 'Status · ' + k, w: IN })
    r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = i === 0 ? 1 : 0; r.strokeBottomWeight = 1; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeAlign = 'INSIDE'
    L.add(list, r)
  })
  L.add(b, list)
  sec.appendChild(b)
}

// ============ 4 · How it was made ============
{
  const b = L.board({ name: ORDER[3], kicker: 'Start here', title: 'How it was made', titleStyle: 'h1',
    lead: 'In nine days, by two people, without a design file.' })
  L.add(b, L.text('Akash owns Arcana. Claude designed and coded it with them in sessions from 21 to 29 September 2026. No designer worked on it before you. Akash judged by eye and by feeling: Claude rendered candidates, often side by side, and Akash chose. So there has never been a design file behind the app. The code is the source of truth, and this file was drawn from it on 30 September; where they disagree, the code wins.', 'lead', { w: 1100 }))
  const D = [
    ['21 Sep', 'First build: 22 Majors, a draw, a reading.'],
    ['23 Sep', 'Asked for more emotion, Claude builds a dark “lapis night sky”.'],
    ['24 Sep', 'First light: light colours only. The Return, Question in Gold, the day moon.'],
    ['25 Sep', 'As Above. The Star’s fading glints.'],
    ['26 Sep', 'What the Moon Keeps. The full 78-card deck.'],
    ['27 Sep', 'The keys page, cut to six lines. The agent reading.'],
    ['28 Sep', 'Releases 1.0 to 1.3. The launch film.'],
    ['29 Sep', 'The demo video.'],
    ['30 Sep', 'This handoff.'],
  ]
  const n = D.length, gap = 20, cw = Math.floor((IN - gap * (n - 1)) / n)
  const days = L.row(D.map(([d, t]) => L.col([L.text(d, 'codeStrong', { size: 13, color: L.C.gold, alpha: 1 }), L.text(t, 'small', { w: cw })], { gap: 6, w: cw, name: 'Day · ' + d })), { gap, name: 'Days', align: 'MIN' })
  L.add(b, L.col([threadRow(n, cw, gap, { name: 'Thread · nine days' }), days], { gap: 18, name: 'Timeline' }))
  L.add(b, L.row([
    L.note({ w: 700, tags: ['akash'], title: 'What this means for you', body: 'Akash set a direction and judged the results; many details are Claude’s defaults that nobody argued with. The provenance tags on every page tell you which is which. Principles & provenance lists them all.' }),
    L.note({ w: 732, tags: ['lesson'], title: 'How decisions were made', body: 'Render the candidates side by side at 2× and let Akash choose. A render is not the window: check the real titled window before you trust a layout. The full story is in History & rejected directions.' }),
  ], { gap: 24, name: 'Notes', align: 'MIN' }))
  sec.appendChild(b)
}

// ---- order, fit, arrange, look ----
for (const name of ORDER) { const n = sec.children.find(c => c.name === name); if (n) sec.appendChild(n) }
L.fit(sec)
await L.arrange('Start here')
const out = []
for (const name of MINE) { const n = sec.children.find(c => c.name === name); if (n) out.push(await L.snap(n, 'pages/read-me-first/' + (ORDER.indexOf(name) + 1) + '.png', { scale: 0.3, wait: out.length ? 300 : 2000 })) }
const styles = (await figma.getLocalTextStylesAsync()).map(s => s.name).filter(n => /voice|question/.test(n))
return { out, styles }
