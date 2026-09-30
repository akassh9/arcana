// Experience & notes · Flow & keys — the states of a reading as a native diagram, the keys by moment,
// the three spreads, and the inputs the room ignores.
const L = S.lib
const sec = await L.chapter('Flow & keys')
const WIN = 'shots-window/'
const GOLD = L.C.gold, INK = L.C.ink

// ---------- 1 · header ------------------------------------------------------
const head = L.board({ name: 'Flow & keys · Header', kicker: 'EXPERIENCE', title: 'Flow & keys', w: 1600,
  lead: 'A reading is one ritual on one stage: no screens, no navigation. One gesture, press and hold, asks the question and later gives the cards back, and esc is always the plain way out.' })
L.add(head, L.rich([['In this chapter   ', 'smallStrong'], ['A reading, state by state  ·  The keys and the pointer, moment by moment  ·  Three spreads  ·  What the room ignores', 'small']], 'small', { w: 1456 }))
const stat = (v, label, src) => L.col([
  L.text(v, 'h2', { size: 34, lh: 42, color: GOLD, name: v }),
  L.text(label, 'small', { w: 226 }),
  L.source(src, { w: 226 }),
], { gap: 6, w: 226, name: 'Tempo · ' + v })
L.add(head, L.col([
  L.text('The tempo of the room', 'h3'),
  L.row([
    stat('3.2 s', 'The hold that asks, and the hold that returns: one slow inhale. Reduce Motion: 0.8 s.', 'Game.swift:37, 201'),
    stat('2×', 'Let go early and the light drains back at twice the speed. Nothing is lost.', 'Game.swift:219-234'),
    stat('0.28 s', 'A space held this long asks; a shorter tap writes a space.', 'QuillInput.swift:132, 306-323'),
    stat('2.1 s', 'Each card writes itself in gold. Reduce Motion: at once.', 'Game.swift:39, 477-487'),
    stat('1.45 s', 'Between the verse lines of the recital, one line per card.', 'Game.swift:501-547'),
    stat('42 %', 'Cards land reversed, drawn fresh at every cut.', 'Game.swift:155-157, 382'),
  ], { gap: 20, name: 'Tempo' }),
], { gap: 14, name: 'Tempo block' }))
sec.appendChild(head)

// ---------- 2 · the flow diagram --------------------------------------------
const flow = L.board({ name: 'Flow & keys · A reading, state by state', kicker: 'FLOW', title: 'A reading, state by state', titleStyle: 'h1', w: 3600, leadW: 1300,
  lead: 'Every state is a change of the same stage, never a new screen. Numbers follow the state list in the code (Game.Phase has three phases: invocation, draw, reading). Each thumbnail is the real window render of that state; arrows carry what moves you on.' })
sec.appendChild(flow)

const CW = 3456, NW = 236, TH = Math.round(NW * 860 / 1260)
const X = c => 110 + c * 344
const R = [72, 452, 832]
const STY = {
  go: { color: INK, alpha: 0.55, sw: 1.5 },
  hold: { color: GOLD, alpha: 0.95, sw: 2.25 },
  esc: { color: INK, alpha: 0.5, sw: 1.5, dash: [6, 5] },
}
const line = (parent, pts, kind, o = {}) => {
  const s = STY[kind]
  const v = figma.createVector()
  const x0 = Math.min(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1]))
  v.vectorNetwork = {
    vertices: pts.map((p, i) => ({ x: p[0] - x0, y: p[1] - y0,
      strokeCap: (i === pts.length - 1 || (o.both && i === 0)) ? 'ARROW_LINES' : 'NONE',
      cornerRadius: (i > 0 && i < pts.length - 1) ? 18 : 0 })),
    segments: pts.slice(1).map((_, i) => ({ start: i, end: i + 1 })), regions: [] }
  v.strokes = [L.solid(s.color, s.alpha)]; v.strokeWeight = s.sw; v.strokeJoin = 'ROUND'
  if (s.dash) v.dashPattern = s.dash
  v.name = o.name || ('Arrow · ' + (o.label || kind).replace(/\n/g, ' '))
  parent.appendChild(v); v.x = x0; v.y = y0
  if (o.label) tag(parent, o.label, o.at || [(pts[0][0] + pts[pts.length - 1][0]) / 2, (pts[0][1] + pts[pts.length - 1][1]) / 2], kind)
  return v
}
const tag = (parent, s, at, kind) => {
  const t = L.text(s, 'label', { size: 11, lh: 15, align: 'CENTER', color: kind === 'hold' ? GOLD : INK, alpha: kind === 'hold' ? 1 : 0.8 })
  const f = L.frame({ name: 'Trigger · ' + s.replace(/\n/g, ' '), dir: 'v', pad: [3, 7], r: 6, fill: L.C.board, kids: [t], align: 'CENTER' })
  parent.appendChild(f); f.x = Math.round(at[0] - f.width / 2); f.y = Math.round(at[1] - f.height / 2)
  return f
}

const cv = L.frame({ name: 'Flow · diagram', w: CW, h: 1200 })
L.add(flow, cv)
// the three phases as bands
const band = (name, code, c0, c1, hex, a) => {
  const x0 = X(c0) - 30, x1 = X(c1) + NW + 30
  const r = figma.createRectangle(); r.name = 'Phase · ' + name
  r.resize(x1 - x0, 1090); r.x = x0; r.y = 0; r.cornerRadius = 20; r.fills = [L.solid(hex, a)]
  cv.appendChild(r)
  const t = L.row([L.text(name, 'kicker'), L.text(code, 'code', { size: 11, lh: 16 })], { gap: 10, align: 'CENTER', name: 'Phase label · ' + name })
  cv.appendChild(t); t.x = x0 + 24; t.y = 22
}
band('Invocation', 'Game.Phase .invocation', 0, 2, '#CCDBF5', 0.3)
band('Draw', '.draw — from the cut', 3, 5, '#FFE0B0', 0.34)
band('Reading', '.reading', 6, 9, '#E0D7F7', 0.4)

const N = {}
const node = async (id, c, r, o) => {
  const x = X(c), y = R[r]
  const f = L.frame({ name: 'State ' + id + ' · ' + o.name, dir: 'v', gap: 4, w: NW })
  let pic
  if (o.img) {
    // a real-window render: the Window/Title bar component on top, scaled down with it
    pic = await L.window(o.img, { name: 'Window · ' + o.name })
    pic.rescale(NW / pic.width)
  } else if (o.layers) {
    pic = L.frame({ name: 'Render · ' + o.name + ' (composite)', w: NW, h: TH, r: 8, clip: true, stroke: '#000000', strokeA: 0.08 })
    for (const p of o.layers) pic.appendChild(await L.img(p, { w: NW, h: TH, name: p.split('/').pop() }))
  } else if (o.inset) {
    pic = L.frame({ name: 'Render · ' + o.name, dir: 'v', w: NW, h: TH, r: 8, fill: '#ECE7DE', align: 'CENTER', justify: 'CENTER', stroke: '#000000', strokeA: 0.08 })
    L.add(pic, await L.img(o.inset, { w: NW - 24, name: 'Render · ' + o.inset.split('/').pop() }))
  } else {
    pic = L.frame({ name: 'No render · ' + o.name, dir: 'v', w: NW, h: TH, r: 8, fill: L.C.board, fillA: 0.7, stroke: INK, strokeA: 0.35, align: 'CENTER', justify: 'CENTER', pad: 18 })
    pic.dashPattern = [5, 4]
    L.add(pic, L.text(o.ghost, 'small', { w: NW - 36, align: 'CENTER', alpha: 0.7 }))
  }
  L.add(f, pic, L.spacer(1, 4))
  L.add(f, L.rich([[id + '   ', 'smallStrong', { color: GOLD }], [o.name, 'smallStrong']], 'smallStrong', { w: NW }))
  if (o.note) L.add(f, L.text(o.note, 'caption', { w: NW, alpha: 0.75 }))
  cv.appendChild(f); f.x = x; f.y = y
  N[id] = { x, y, cx: x + NW / 2, r: x + NW, b: y + f.height, c, row: r }
  return f
}

// row 0 — the side doors, and the thread
await node('K', 0, 0, { img: WIN + '62-keys.png', name: 'The keys page', note: 'Seven lines. ⌘/ or the key from any moment; ? once the question is asked.' })
await node('M', 1, 0, { img: WIN + '44-kept.png', name: "The moon's door", note: 'What the moon keeps. Opens only at rest, with a reading kept.' })
await node('S', 2, 0, { inset: 'surfaces/settings/settings-window-ready@2x.png', name: 'Settings, its own window', note: '⌘ , from any moment: the one OpenAI key that finds the thread.' })
await node('10b', 6, 0, { img: WIN + '71-thread-quiet-retry.png', name: 'The thread stayed quiet', note: "Any failure. 'try again' shows only while the key is usable." })
await node('10', 7, 0, { img: WIN + '70-settling.png', name: 'Finding the thread', note: "'letting the cards settle' until the model answers (45 s at most)." })
await node('10a', 8, 0, { img: WIN + '10-woven.png', name: 'The folio', note: 'Two sentences and a question, set in the air where the verse was.' })
// row 1 — the spine
await node('1', 0, 1, { img: WIN + '1-invocation.png', name: 'Room at rest', note: 'Title, invitation, three spreads, tonight’s moon, the deck in its ring.' })
await node('2', 1, 1, { img: WIN + '19-writing.png', name: 'Writing the question', note: 'No field, no caret. Each letter is laid in gold and cools to ink.' })
await node('4', 2, 1, { img: WIN + '21-giving.png', name: 'Holding', note: 'The room quiets; a written question goes to the deck as gold dust.' })
await node('5', 3, 1, { layers: ['sky/composite/sky-full-charge-1-1260x860@2x.png', 'sky/near/flash-cut-3-age-0.35s-1260x860.png'], name: 'The cut', note: 'Flash, riffle, a low bowl, a firm click. The deck is reshuffled. (Sky + flash at 0.35 s: stage render, no title-bar inset.)' })
await node('6', 4, 1, { img: WIN + '3-draw.png', name: 'The draw', note: 'All 78 cards as a ribbon. The hand lifts a card and it chimes.' })
await node('6a', 5, 1, { img: WIN + '56-ribbon-hand.png', name: 'A card taken', note: 'It flies to its place, turns, flashes and writes itself (2.1 s).' })
await node('7', 6, 1, { img: WIN + '5-reading.png', name: 'The recital', note: 'The question read back, then one line of verse per card.' })
await node('8', 7, 1, { img: WIN + '67-closing-prompt.png', name: 'Spoken', note: 'Light runs the thread, the spread rings as one chord, the prompt appears.' })
await node('11', 8, 1, { img: WIN + '15-returning.png', name: 'Returning', note: 'The same hold: the room hushes, the ink sinks, last drawn first.' })
await node('12', 9, 1, { img: WIN + '51-moon-took.png', name: 'Kept · the cards go home', note: 'Faces turn, the spread flies home, the moon brightens as it keeps.' })
// row 2 — branches
await node('3', 0, 2, { img: WIN + '64-chooser-one.png', name: 'Spread chosen', note: 'Stays in the room. ← → even while writing; never while holding.' })
await node('2b', 1, 2, { img: WIN + '74-spent.png', name: 'Line full', note: 'The line holds 560 pt of ink; a key with no room leaves a touch of the pen.' })
await node('4a', 2, 2, { ghost: 'No render. The ring and the room ease back as the charge falls.', name: 'Draining back', note: 'Nothing is lost: back where it was, the question still written.' })
await node('13', 4, 2, { ghost: 'No render. Everything on the table leaves together over 0.6 s.', name: 'Start over', note: 'The plain door. Nothing is kept; a pending thread is cancelled.' })
await node('7a', 6, 2, { img: WIN + '6-reading-hover.png', name: 'A card looked at', note: 'Its verse line lights; the other lines dim to 30 %.' })
await node('9', 7, 2, { img: WIN + '7-inspect.png', name: 'The altar', note: 'The card full size, turning toward the pointer. Also from the recital.' })

// arrows
const ym = r => R[r] + TH / 2, yf = r => R[r] + 66, yb = r => R[r] + 96
const hx = (ca, cb, y, kind, label, ly) => {
  const a = ca < cb ? X(ca) + NW + 6 : X(ca) - 6
  const b = ca < cb ? X(cb) - 6 : X(cb) + NW + 6
  return line(cv, [[a, y], [b, y]], kind, { label, at: [(a + b) / 2, ly == null ? y : ly] })
}
const down = (top, bottom, kind, label, dx = 0, o = {}) => {
  const x = N[top].cx + dx, ya = N[top].b + 8, yb2 = N[bottom].y - 8
  return line(cv, o.up ? [[x, yb2], [x, ya]] : [[x, ya], [x, yb2]], kind, Object.assign({ label, at: [x + (o.lx || 0), o.ly != null ? o.ly : (ya + yb2) / 2] }, o))
}
// the spine
hx(0, 1, yf(1), 'go', 'type · ⌘V', yf(1) - 20)
hx(1, 0, yb(1), 'esc', 'delete it all\n(0.6 s) · esc', yb(1) + 27)
hx(1, 2, ym(1), 'hold', 'press\nand hold')
hx(2, 3, ym(1), 'go', 'full at\n3.2 s')
hx(3, 4, ym(1), 'go', 'at once:\nthe deal')
hx(4, 5, yf(1), 'go', 'click · space\n· return', yf(1) - 27)
hx(5, 4, yb(1), 'go', 'more\nto draw', yb(1) + 27)
hx(5, 6, ym(1), 'go', 'last card\n+2.45 s')
hx(6, 7, ym(1), 'go', 'the chord\nhas rung')
hx(7, 8, yf(1), 'hold', 'press\nand hold', yf(1) - 27)
hx(8, 7, yb(1), 'esc', 'let go early:\nink rises back', yb(1) + 27)
hx(8, 9, ym(1), 'go', 'full at\n3.2 s')
// row 0
hx(7, 8, ym(0), 'go', 'a thread\nfound')
hx(7, 6, yf(0), 'go', 'any\nfailure', yf(0) - 27)
hx(6, 7, yb(0), 'go', 'try again', yb(0) + 20)
// row 1 ↔ row 0
down('K', '1', 'go', '⌘/ · the key\nesc · click', -58, { both: true })
{
  const x1 = N['1'].x + 186, xm = N['M'].cx, yTop = N['M'].b + 8, yMid = Math.round((N['M'].b + R[1]) / 2)
  line(cv, [[x1, R[1] - 8], [x1, yMid], [xm, yMid], [xm, yTop]], 'go', { both: true, label: '↑ · click the moon\nesc · ↓ · the moon', at: [(x1 + xm) / 2 + 6, yMid] })
}
down('10', '8', 'go', 'find the\nthread', 0, { up: true })
down('10a', '11', 'hold', 'press\nand hold')
// row 1 ↔ row 2
down('1', '3', 'go', '← → · 1 2 3\n· click', 0, { both: true })
down('2', '2b', 'go', 'no room\nleft', 0, { both: true })
down('4', '4a', 'esc', 'let go\n· esc', -30, { ly: N['4'].b + 44 })
down('4', '4a', 'go', 'press\nagain', 30, { up: true, ly: R[2] - 44 })
down('6', '13', 'esc', 'esc')
down('7', '7a', 'go', 'hover\n· leave', 0, { both: true })
down('8', '9', 'go', 'click a card\nclick · esc closes', 0, { both: true })
// esc from anywhere in the reading
{
  const y = ym(2), xa = X(6) - 16, xb = X(4) + NW + 6
  const dot = figma.createEllipse(); dot.name = 'From anywhere in the reading'; dot.resize(8, 8); dot.x = xa - 4; dot.y = y - 4; dot.fills = [L.solid(INK, 0.5)]; cv.appendChild(dot)
  line(cv, [[xa, y], [xb, y]], 'esc', { label: 'esc, from any\nreading moment', at: [(xa + xb) / 2, y - 30] })
}
// the two ways home, along the foot
{
  const lane1 = 1122, lane2 = 1162
  line(cv, [[N['13'].cx, N['13'].b + 8], [N['13'].cx, lane1], [56, lane1], [56, yb(1)], [X(0) - 6, yb(1)]], 'esc', { label: 'back to the room · nothing kept', at: [760, lane1] })
  line(cv, [[N['12'].cx, N['12'].b + 8], [N['12'].cx, lane2], [30, lane2], [30, yf(1)], [X(0) - 6, yf(1)]], 'hold', { label: 'back to the room · the reading kept (the room returns from +0.45 s over 1.0 s)', at: [1760, lane2] })
}

// legend
const sample = (kind, label, both) => {
  const f = L.frame({ name: 'Legend sample', w: 56, h: 16 })
  line(f, [[2, 8], [54, 8]], kind, { both })
  return L.row([f, L.text(label, 'small', { alpha: 0.8 })], { gap: 10, align: 'CENTER', name: 'Legend · ' + label })
}
L.add(flow, L.row([
  L.text('Key', 'smallStrong'),
  sample('go', 'a click, a key or time moves you on'),
  sample('hold', 'press and hold (the sky, space or return)'),
  sample('esc', 'letting go, esc and the ways back'),
  sample('go', 'opens and closes', true),
  L.row([L.frame({ name: 'Ghost', w: 36, h: 22, r: 5, stroke: INK, strokeA: 0.35 }), L.text('a state with no render yet', 'small', { alpha: 0.8 })], { gap: 10, align: 'CENTER', name: 'Legend · no render' }),
], { gap: 36, align: 'CENTER', name: 'Legend' }))
flow.findOne(n => n.name === 'Ghost').dashPattern = [5, 4]

// footnotes
const fw = (CW - 3 * 24) / 4
L.add(flow, L.row([
  L.note({ w: fw, title: 'Anywhere, nobody watching', body: 'Window covered, minimised or hidden, screens asleep, the session switched: the clocks rest and the sound stops. Visible again, everything resumes in step.', source: 'Game.swift:102-107; RootView.swift:1685-1733' }),
  L.note({ w: fw, title: 'Anywhere, the app loses focus', body: 'Any hold is let go, and a space waiting to become a hold stops waiting. There is no way to hold while another app is in front.', source: 'RootView.swift:46-48; QuillInput.swift:70-77, 266-273' }),
  L.note({ w: fw, title: 'Composing with an input method (2a)', body: 'Part of writing: every key, arrows and esc included, goes to the input method first. A hold, the keys page or the moon’s door lays what was seen.', source: 'QuillInput.swift:150, 259-264, 302-305, 398-411' }),
  L.note({ w: fw, title: 'Reduce Motion, a variant of every state', body: 'The hold takes 0.8 s, the ink is laid at once, the reading opens 0.55 s after the last card, and the pause after the question is 0.5 s.', source: 'Game.swift:37, 70, 201, 483-490, 513, 527' }),
], { gap: 24, name: 'Footnotes' }))

// decisions
const dw = (CW - 4 * 24) / 5
L.add(flow, L.col([
  L.text('Who decided the shape of the flow', 'h3'),
  L.row([
    L.note({ w: dw, tags: ['claude'], title: 'Hold to ask', body: 'The breathing ring and the 3.2 s hold came with Claude’s dark first redesign (23 Sep). Akash kept the ritual when the world became first light.', source: 'Game.swift:37' }),
    L.note({ w: dw, tags: ['panel'], title: 'The Return and Question in Gold', body: 'The second hold that gives the cards back, and the question written in gold and taken by the hold. Approved by Akash on 24 Sep.', source: 'Game.swift:295-375; Quill.swift:14-322' }),
    L.note({ w: dw, tags: ['akash'], title: 'Only returned readings are kept', body: 'Esc keeps nothing; the hold keeps the reading and its question, on this Mac only.', source: 'Game.swift:729-752; Keeping.swift:169-173' }),
    L.note({ w: dw, tags: ['akash'], title: 'Settings is a window', body: '⌘ , opens it; the room never shows a settings surface. Akash added ‘⌘ , settings’ to the keys page when they couldn’t find it.', source: 'ArcanaApp.swift:25-29' }),
    L.note({ w: dw, tags: ['claude'], title: 'The thread only with a usable key', body: '‘find the thread’ appears only when a key is found and not refused, so it never fails for want of one.', source: 'RootView.swift:1252-1254; Settings.swift:89-159' }),
  ], { gap: 24, name: 'Decisions' }),
], { gap: 14, name: 'Decisions block' }))

// ---------- 3 · keys by moment ------------------------------------------------
const keys = L.board({ name: 'Flow & keys · The keys and the pointer, moment by moment', kicker: 'KEYS', title: 'The keys and the pointer, moment by moment', titleStyle: 'h1', w: 2640, leadW: 1300,
  lead: 'Read down a column to see what every input does in that moment; a dash means the room does nothing with it. Before the question is asked the pen takes every key that writes, so m and ? are letters there.' })
sec.appendChild(keys)
const MOM = ['At rest', 'Writing', 'Holding', 'The draw', 'The reading', 'Altar open', 'Returning', 'Keys page', 'Moon’s door']
const cell = s => (s === '—' ? L.text('—', 'small', { w: 206, alpha: 0.28 }) : L.text(s, 'small', { w: 206, alpha: 0.88 }))
const K = [
  ['← →', ['Previous / next spread, a tick; stops at the ends', 'Still choose the spread (not while an input method composes)', '—', 'Move the hand one card; held, it sweeps four a repeat', '—', '—', '—', 'Swallowed', 'An earlier / a later kept reading'], 'RootView.swift:177-191; Keeping.swift:254-261'],
  ['1  2  3', ['One Card · Three Fates · The Long Road', 'Written: numbers are letters now', '—', '—', '—', '—', '—', 'Swallowed', '—'], 'RootView.swift:221-223; Game.swift:171-176'],
  ['↑', ['Opens the moon’s door (a reading kept, the room still)', 'Swallowed: the moon stays shut while anything is written', '—', '—', '—', '—', '—', 'Swallowed', '—'], 'RootView.swift:170-173; Game.swift:580-590'],
  ['↓', ['—', 'Swallowed', '—', '—', '—', '—', '—', 'Swallowed', 'Back to tonight'], 'RootView.swift:277; QuillInput.swift:151'],
  ['space · return', ['Press: the hold begins. Release: let go', 'return holds. space: a tap is a space; held 0.28 s, it holds', 'Release (the last one holding): drains back at 2×', 'Takes the card under the hand', 'Once the chord has rung: hold to return the cards', 'Closes the altar', 'Release: the ink rises back at 2×', 'Closes the keys', 'Held: remember (the ink rises back)'], 'RootView.swift:193-212, 235-246, 279-280; QuillInput.swift:306-355'],
  ['esc', ['—', 'Erases the whole line', 'Lets go', 'Start over: nothing is kept', 'Start over: the reading is not kept', 'Closes the altar', 'Start over: not kept', 'Closes the keys', 'Back to tonight'], 'RootView.swift:213-220, 243, 277; QuillInput.swift:324-327; Game.swift:729-752'],
  ['⌫  ⌥⌫  ⌘⌫', ['—', 'A letter · a word · the whole line', 'Silent', '—', '—', '—', '—', 'Swallowed', '⌘⌫ lets this kept reading go, for good'], 'QuillInput.swift:294-300, 362-372; RootView.swift:268-273'],
  ['keys that write', ['Begin the question: letters, digits, punctuation, dead keys, input methods', 'Written', 'Silent', '—', '—', '—', '—', 'Swallowed', 'Nothing is written'], 'QuillInput.swift:139-153, 282-300'],
  ['m', ['A letter', 'A letter', 'Silent', 'Sound on / off', 'Sound on / off', 'Sound on / off', 'Sound on / off', 'Sound on / off', 'Sound on / off'], 'RootView.swift:224, 245, 281'],
  ['?', ['A letter', 'A letter', 'Silent', 'The keys page', 'The keys page', 'The keys page', 'The keys page', 'Closes the keys', 'The keys page'], 'RootView.swift:225, 244, 285'],
  ['⌘V', ['Pastes as the question, cleaned and cut to fit', 'Pasted, cut back to its last whole word that fits', '—', '—', '—', '—', '—', '—', '—'], 'QuillInput.swift:100-109, 418-430'],
  ['tab · page keys', ['—', 'Swallowed', '—', '—', '—', '—', '—', 'Swallowed', '—'], 'QuillInput.swift:151, 285'],
  ['pointer · hover', ['The moon lights, if a reading is kept (pointing hand)', 'The moon lights, if a reading is kept', '—', 'The hand: cards near it rise, the one under it chimes', 'A card lifts 12 pt; its verse line lights', 'The card turns toward the pointer', '—', '—', 'Chevrons and cards take the pointing hand'], 'RootView.swift:371-392, 1558-1571; Keeping.swift:700-708, 979-1000'],
  ['pointer · click', ['A spread · the moon · the bowl · the key', 'A spread · the moon · the bowl · the key', '—', 'Takes the card', 'A card: the altar. ‘find the thread’, ‘try again’', 'Anywhere: closes the altar', '—', 'Anywhere: closes the keys', 'The moon: back to tonight. A chevron: turn'], 'RootView.swift:1085-1133, 1294-1330, 1520-1521; Keeping.swift:979-993'],
  ['pointer · press and hold', ['Asks, anywhere on the sky, over the words too', 'Asks, with the question', 'Key and pointer can hold together; the last to lift lets go', 'Nothing: the empty sky does nothing in the draw', 'Once the chord has rung: returns the cards', '—', 'Lift to let go', '—', 'Remember: the ink rises back'], 'RootView.swift:420-436; Game.swift:182-214'],
]
L.add(keys, L.table(
  [{ label: 'Input', w: 170 }, ...MOM.map(m => ({ label: m, w: 206 })), { label: 'Source', w: 190 }],
  K.map(([k, cells, src]) => [L.text(k, 'codeStrong', { w: 170, size: 14, lh: 20, name: 'Input · ' + k }), ...cells.map(cell), L.source(src, { w: 190 })]),
  { name: 'Keys by moment', zebra: true, gap: 20 }))
const nw = (2496 - 3 * 24) / 4
L.add(keys, L.row([
  L.note({ w: nw, title: 'Any moment: ⌘/ and ⌘ ,', body: '⌘/ (Help ▸ The Keys) opens or closes the keys page; ⌘ , (Arcana ▸ Settings…) opens the Settings window. The bowl and the old key, top corners, always work too.', source: 'ArcanaApp.swift:19-29; RootView.swift:1587-1641' }),
  L.note({ w: nw, title: 'No second room', body: '⌘N (New Window) is removed from the menus. There is one window and one reading at a time.', source: 'ArcanaApp.swift:17' }),
  L.note({ w: nw, title: 'No keyboard way to the altar or the thread', body: 'In the reading the arrows and numbers do nothing: opening a card and finding the thread need the pointer.', tags: ['open'], source: 'RootView.swift:171, 180-191' }),
  L.note({ w: nw, title: 'The trackpad answers too', body: 'On a Force Touch trackpad: a tap when a card is taken, a pulse at half of any hold, a firm click at the cut and when a return completes.', source: 'Game.swift:250-253, 336-339, 348, 409, 465, 830-840' }),
], { gap: 24, name: 'Keys notes' }))

// ---------- 4 · the three spreads -------------------------------------------
const spreads = L.board({ name: 'Flow & keys · Three spreads', kicker: 'SPREADS', title: 'Three spreads', titleStyle: 'h1', w: 2400, leadW: 1200,
  lead: 'Chosen in the room before the ask; Three Fates is chosen when the app opens. Each position sounds its own note, all from one C-major pentatonic, so any spread rings as a consonant chord. A reversed card sounds an octave lower, in a darker voice.' })
sec.appendChild(spreads)
const SP = [
  { name: 'One Card', sub: 'the blunt answer', img: '9-one.png', draw: 'draw one card', close: 'hold · return the card', pos: [['The Answer', 'G4', 67]] },
  { name: 'Three Fates', sub: 'was · is · tends', img: '67-closing-prompt.png', draw: 'draw three', close: 'hold · return the cards', pos: [['What Was', 'C4', 60], ['What Is', 'E4', 64], ['What Tends', 'G4', 67]] },
  { name: 'The Long Road', sub: 'five cards, one weight', img: '69-closing-prompt-five.png', draw: 'draw five', close: 'hold · return the cards', pos: [['Situation', 'C4', 60], ['Crossing', 'D4', 62], ['Root', 'G3', 55], ['Counsel', 'A4', 69], ['Outcome', 'E5', 76]] },
]
const colW = (2256 - 2 * 48) / 3
const spreadCols = []
for (const sp of SP) {
  const win = await L.window(WIN + sp.img, { name: 'Window · ' + sp.name })
  win.rescale(colW / 1260)
  const posT = L.table([{ label: 'Position', w: 200 }, { label: 'Note', w: 80 }, { label: 'MIDI', w: 60 }],
    sp.pos.map(([p, n, m]) => [L.text(p, 'voiceSmall', { w: 200 }), L.text(n, 'codeStrong', { w: 80 }), L.text(String(m), 'code', { w: 60 })]), { name: 'Positions · ' + sp.name, gap: 16 })
  spreadCols.push(L.col([
    win,
    L.col([L.text(sp.name, 'h2'), L.text(sp.sub, 'voiceSmall', { alpha: 0.75 })], { gap: 2 }),
    posT,
    L.specs([['Draw prompt', sp.draw.toUpperCase(), 'RootView.swift:1161-1163'], ['Closing prompt', sp.close.toUpperCase(), 'RootView.swift:1180']], { w: colW, keyW: 130 }),
  ], { gap: 20, w: colW, name: 'Spread · ' + sp.name }))
}
L.add(spreads, L.row(spreadCols, { gap: 48, name: 'Spreads' }))
L.add(spreads, L.source('Deck.swift:38-50 (names, glosses, positions, notes); Game.swift:326-328, 656-658, 853-885 (chord, sizes, row)', {}))
const sw3 = (2256 - 2 * 24) / 3
L.add(spreads, L.row([
  L.note({ w: sw3, title: 'What a position means', body: 'Only its name. The verse line is the card’s own line, upright or reversed, not written for the position; the position names do go to the model when the thread is found.', tags: ['fixed'], source: 'Deck.swift:20-25; Weave.swift:172-186' }),
  L.note({ w: sw3, title: 'Always one row', body: 'Cards sit side by side, centred, 0.2 of a card apart: up to 262 pt tall for three or five, 360 pt for one. A cross layout for five was considered and turned down by the design panel.', tags: ['rejected'], source: 'Game.swift:853-885' }),
  L.note({ w: sw3, title: 'Who named them', body: 'The three spreads, their glosses and position names are in the app from before the sessions this file draws on; who chose them is not recorded.', tags: ['shipped'], source: 'Deck.swift:38-50' }),
], { gap: 24, name: 'Spread notes' }))

// ---------- 5 · what the room ignores ----------------------------------------
const ign = L.board({ name: 'Flow & keys · What the room ignores', kicker: 'INPUT', title: 'What the room ignores', titleStyle: 'h1', w: 1600,
  lead: 'The only inputs are hover, click, press and hold, and keys. Nothing else is handled, so don’t spec a gesture the room will ignore.' })
sec.appendChild(ign)
const iw = (1456 - 2 * 24) / 3
const IG = [
  ['Scroll and swipe', 'No scroll or swipe handling anywhere. A trackpad scroll over the ribbon does nothing; the arrows or the hand move along it.', 'RootView.swift:161-288, 420-436'],
  ['Pinch and rotate', 'None. The one gesture is a press held in place: a drag gesture with a minimum distance of 0, used only to hold.', 'RootView.swift:420-436'],
  ['Drag and drop', 'Nothing can be dragged in or out: not a card, not text into the question. Paste (⌘V) is the only way to bring words in.', 'RootView.swift:420-436; QuillInput.swift:100-109'],
  ['Tab and focus', 'Tab does nothing and no focus ring is ever drawn. The question is typed into a hidden 0 × 0 text view.', 'QuillInput.swift:120-154, 285'],
  ['Context menus', 'No right-click menu anywhere, on the sky, the cards or the words.', 'RootView.swift:19-159'],
  ['A second window', 'New Window is removed; there is one room.', 'ArcanaApp.swift:16-17'],
]
const igRows = []
for (let i = 0; i < IG.length; i += 3) igRows.push(L.row(IG.slice(i, i + 3).map(([t, b, s]) => L.note({ w: iw, title: t, body: b, source: s, tags: ['fixed'] })), { gap: 24, name: 'Ignored row' }))
L.add(ign, L.col(igRows, { gap: 24, name: 'Ignored' }))
L.add(ign, L.note({ w: 1456, tags: ['open'], title: 'Text buttons have no hover look',
  body: 'The spread choices, ‘find the thread’, ‘try again’, the bowl and the old key are plain buttons: no hover state, the arrow cursor, and only the system’s pressed dim. Only the cards, the moon and the page-turn chevrons take the pointing hand. Whether that is quiet enough or too quiet is yours to decide.',
  source: 'RootView.swift:35-36, 1091-1131, 1295-1305, 1324-1325, 1594-1606; Legend.swift:318-323' }))

L.fit(sec)
await L.arrange('Experience & notes')
return await L.snapChapter(sec, 'pages/flow-keys', { scale: 0.3 })
