// Start here · Read me first, step 3 of 3 — Glossary, and Where we'd most like your eyes.
const L = S.lib
const CH = 'Read me first'
const sec = await L.chapter(CH, { clear: false })
const ORDER = ['Read me first · Welcome', 'Read me first · A reading in seven moments', 'Read me first · Status and links',
  'Read me first · How it was made', 'Read me first · How to read this file', 'Read me first · Glossary',
  "Read me first · Where we'd most like your eyes"]
const MINE = [ORDER[5], ORDER[6]]
for (const c of [...sec.children]) if (MINE.includes(c.name)) c.remove()

const BW = 2400, IN = BW - 144
const ref = (label, path, a, b) => L.link(L.text(label, 'code', { size: 11, lh: 16, alpha: 0.55 }), `${L.REPO}/blob/${L.SHA}/${path}${a ? '#L' + a + (b ? '-L' + b : '') : ''}`)
const BG = '#F3EFE7'
const rec = async path => { if (!S.img[path]) (await L.img(path)).remove(); return S.img[path] }
// A crop of a render. r = [x, y, w, h] as fractions of the image (so it doesn't matter whether the PNG is @2x or @3x).
const cropF = async (path, [x, y, w, h], tw, th, o = {}) => {
  const R = await rec(path)
  const n = figma.createRectangle()
  n.name = o.name || 'Crop · ' + path
  n.resize(tw, th)
  n.fills = [{ type: 'IMAGE', imageHash: R.hash, scaleMode: 'CROP', imageTransform: [[w, 0, x], [0, h, y]] }]
  n.cornerRadius = o.r == null ? 10 : o.r
  n.strokes = [L.solid('#000000', 0.07)]; n.strokeWeight = 1; n.strokeAlign = 'INSIDE'
  return n
}
// Crop of a 1260 × 860 pt window render, in points.
const cropW = (path, [x, y, w, h], tw, th, o) => cropF(path, [x / 1260, y / 860, w / 1260, h / 860], tw, th, o)
// Crop of a 226 × 400 pt card face, in points.
const cropC = (path, [x, y, w, h], tw, th, o) => cropF(path, [x / 226, y / 400, w / 226, h / 400], tw, th, o)
// An image (PNG or SVG) centred in a quiet box.
const boxed = async (kids, tw, th, o = {}) => {
  const f = L.frame({ name: o.name || 'Picture', dir: 'h', w: tw, h: th, r: 10, fill: o.fill || BG, stroke: '#000000', strokeA: 0.07, align: 'CENTER', justify: 'CENTER', gap: o.gap || 12, clip: true })
  L.add(f, kids)
  return f
}
const pic = async (path, h, o = {}) => {
  if (path.endsWith('.svg')) return L.svg(path, { h })
  const R = await rec(path)
  return L.img(path, { h, w: h * R.size.width / R.size.height, name: path.split('/').pop() })
}
const equalize = row => { const h = Math.max(...row.children.map(c => c.height)); for (const c of row.children) { c.layoutSizingVertical = 'FIXED'; c.resize(c.width, h) } return row }

// ============ 6 · Glossary ============
{
  const b = L.board({ name: ORDER[5], w: BW, kicker: 'Start here', title: 'Glossary', titleStyle: 'h1', leadW: 1300,
    lead: 'The app’s own vocabulary, in the order you meet it. The code, this file and Akash use these words; so can you. Words in quotation marks are the app’s copy, verbatim.' })
  const W1 = 'shots-window/'
  const G = [
    ['first light', 'The look of the whole world: a pale blue sky, lilac and rose in the air, dawn rising from below. It replaced a dark night sky on 24 September. Light colours only.', 'Chamber.swift:186-212', { crop: ['sky/composite/sky-full-charge-0-1260x860@2x.png', [0, 0, 1260, 840]] }, ['akash']],
    ['the room', 'The one window and everything in it: a single stage over the sky, placed by formulas of its size. Nothing scrolls and there are no screens to navigate.', 'RootView.swift:19-159', { crop: [W1 + '1-invocation.png', [0, 0, 1260, 840]] }],
    ['the invitation', 'The italic line under ARCANA at rest: “Hold the question in your mind.” It breathes out as you start to type and comes back when the line is empty.', 'RootView.swift:756-914', { crop: [W1 + '1-invocation.png', [420, 150, 420, 280]] }],
    ['the question and the pen', 'What you type, set in the pen’s italic. Each letter is laid lit, then wet gold, and cools to ink within 0.9 s. One line of about 73 characters (560 pt).', 'Quill.swift:62, 214-257', { crop: [W1 + '20-written.png', [465, 212, 330, 220]] }, ['panel']],
    ['the spreads', 'One Card, “the blunt answer”; Three Fates, “was · is · tends”; The Long Road, “five cards, one weight”. Chosen with ← →, 1 2 3 or a click; the choice stays.', 'Deck.swift:38-49', { pic: 'glyphs/ui/spread/spread-tile-three-chosen@3x.png', h: 64 }],
    ['the hold and the charge', 'Press and hold anywhere on the sky, or hold space or return. The charge rises from 0 to 1 over 3.2 s and fills a gold arc round the deck; let go early and it drains.', 'Game.swift:37, 182-250', { crop: [W1 + '21-giving.png', [360, 440, 540, 360]] }],
    ['the cut', 'The moment the charge is full: a white-gold flash at the deck, a riffle and a low bowl. The question is taken into the deck and the ribbon is dealt.', 'Game.swift:395-418; Chamber.swift:613-636'],
    ['the ribbon and the hand', 'The draw lays all 78 cards in an arc across the foot of the room. The hand is the lift of the cards nearest the pointer, with a chime. Click to take one.', 'RootView.swift:295-413', { crop: [W1 + '56-ribbon-hand.png', [420, 500, 480, 320]] }],
    ['the draw', 'Between the cut and the reading: one card per slot. Each flies to its slot, flips and writes itself, and the prompt counts what is left: “draw three”.', 'RootView.swift:1139-1176', { crop: [W1 + '56-ribbon-hand.png', [330, 150, 600, 400]] }],
    ['slots and positions', 'A slot is a card’s place: four gold corner brackets until a card lands. Its position name hangs under the thread, e.g. What Was, What Is, What Tends.', 'RootView.swift:654-688; Deck.swift:40-48'],
    ['the table', 'Where the cards are. All 78 are always on it, each one sprite moving between three homes: the squared deck, the ribbon and a slot.', 'RootView.swift:295-413', { crop: [W1 + '5-reading.png', [330, 160, 600, 400]] }],
    ['the halo', 'A soft oval of gold light behind each slot: faint while waiting, steady once a card is face up, brighter under the pointer, flaring as its line is spoken.', 'RootView.swift:467-499', { crop: [W1 + '6-reading-hover.png', [330, 160, 600, 400]] }],
    ['the thread', 'The gold hairline under the spread, laid a segment at a time as the cards land, with a diamond under each position. A light runs along it as the reading is spoken.', 'RootView.swift:506-633', { pic: 'glyphs/ui/diamonds/thread-node-lit.svg', h: 60 }],
    ['gold cooling to ink', 'How everything is written: each mark is laid by a bright nib in wet gold, then cools into its own ink. The cards write themselves this way, and so does the question.', 'CardImages.swift:125-172; Quill.swift:214-257', { crop: [W1 + '19-writing.png', [560, 240, 240, 160]] }],
    ['gold leaf', 'The gilded mark on a card, about one per card, filled with a leaf gradient. A returned blank keeps it and loses everything else.', 'CardImages.swift:34-38', { pic: 'cards/leaf/sun-leaf.svg', h: 80 }, ['claude']],
    ['the essence', 'The short red italic line under a card’s name on its face, e.g. “The Old Order” for the Hierophant.', 'Deck.swift:13; CardImages.swift:81-90', { cropC: ['cards/faces/hierophant.png', [13, 282, 200, 116]] }],
    ['the line', 'What a card says, said once: one sentence upright, one reversed. It is the card’s line of verse in the recital, e.g. “Yours, by your own hand.”', 'Deck.swift:14-15, 23', { crop: [W1 + '7-inspect.png', [600, 440, 330, 220]] }],
    ['the recital and the verse', 'The reading spoken back after the last card: one line of verse per card, in order, 1.45 s apart, each out of a blur as its card flares and its bowl sounds.', 'RootView.swift:1196-1241', { crop: [W1 + '5-reading.png', [405, 500, 450, 300]] }],
    ['the epigraph', 'A written question, read back small and italic above the spread under a short gold rule. It arrives whole; it is never typed out again.', 'RootView.swift:963-1025', { crop: [W1 + '22-epigraph.png', [405, 110, 450, 300]] }, ['panel']],
    ['the chord', 'The spread’s bowls together. Each position has its note from one pentatonic, so any spread is consonant; a reversed card sounds an octave under, in a darker voice.', 'Deck.swift:32-35'],
    ['the altar', 'Click a drawn card and it opens full size under a pearl veil, with its position, name, essence, line and keywords. Click, space, return or esc closes it.', 'RootView.swift:1382-1585', { crop: [W1 + '7-inspect.png', [240, 150, 780, 520]] }],
    ['find the thread', 'An optional ending, offered only with an OpenAI key: two short sentences and one question from the cards. Its other words are “letting the cards settle”, “the thread stayed quiet” and “try again”.', 'RootView.swift:1248-1380', { crop: [W1 + '5-reading.png', [450, 610, 360, 240]] }],
    ['As Above', 'When the Wheel, the Star, the Moon or the Sun is drawn, the sky answers once its ink cools: the wheel turns a house, the glints stay lit, lilac half-light spreads, the dawn rises.', 'Answers.swift:43-52', { crop: [W1 + '33-star.png', [0, 0, 1260, 840]] }, [['claude', 'Claude proposed · Akash approved']]],
    ['the return', 'The closing hold. The room goes quiet and each card’s ink sinks into its stock, last drawn first, as the bowls fall to the root; then the cards turn face down and go home.', 'Game.swift:295-330', { crop: [W1 + '15-returning.png', [330, 160, 600, 400]] }, ['panel']],
    ['the sink', 'How far one card’s ink has sunk during the return, from 0 to 1. Let go early and the ink rises back, twice as fast.', 'Game.swift:75, 295-321'],
    ['grooves and the blank', 'What a returned card becomes: cream stock with its art pressed in as blind-embossed grooves. It keeps only its gold leaf.', 'Keeping.swift:674-717; CardImages.swift:174-193', { crop: [W1 + '44-kept.png', [330, 160, 600, 400]] }],
    ['the moon’s door', 'Tonight’s moon, top right, is the way in to kept readings: only readings returned with the hold, each with its question. It takes a click, or ↑, only when something is kept; ← → turn the pages.', 'Keeping.swift:979-1013', { crop: [W1 + '44-kept.png', [960, 60, 270, 180]] }, ['akash']],
    ['remember', 'On a kept page the hold brings the ink back into the blanks, and the reading is spoken again. Its one instruction: “hold · remember”.', 'Keeping.swift:892-903', { crop: [W1 + '45-kept-rising.png', [330, 160, 600, 400]] }, ['claude']],
    ['forget', '⌘⌫ lets one kept reading go, at once and for good. There is no undo and no confirmation, which is why it asks for a modifier.', 'RootView.swift:271; Keeping.swift:176', { pics: ['glyphs/ui/keys/keycap-command-forget-a-reading.svg', 'glyphs/ui/keys/keycap-delete-forget-a-reading.svg'], h: 44 }, ['claude']],
    ['ONE MOON AGO', 'About a lunar month after a reading with a written question was returned, the question comes back faintly under the moon, under these tiny caps, until the door is opened.', 'Keeping.swift:1047-1078', { crop: [W1 + '50-brought-back.png', [920, 70, 330, 220]] }, ['claude']],
    ['the keys', 'The page of the room’s few keys, opened with ⌘/ or the old key top left: seven lines of one to three words.', 'Legend.swift:44-50, 60-165', { crop: [W1 + '62-keys.png', [0, 0, 1260, 840]] }, ['akash', 'claude']],
    ['the bowl', 'The pen-drawn singing bowl top right is the sound toggle. While sound is on, two small arcs, its note, rise off it.', 'RootView.swift:1587-1641', { pic: 'glyphs/ui/bowl-sound-on.svg', h: 64 }],
  ]
  const cols = 4, gap = 24, cw = Math.floor((IN - gap * (cols - 1)) / cols), pad = 20, tw = 132, th = 88
  const cards = []
  for (const [term, def, src, t, tags] of G) {
    let thumb = null
    if (t && t.crop) thumb = await cropW(t.crop[0], t.crop[1], tw, th, { name: 'Thumb · ' + term })
    else if (t && t.cropC) thumb = await cropC(t.cropC[0], t.cropC[1], tw, th, { name: 'Thumb · ' + term })
    else if (t && t.pic) thumb = await boxed([await pic(t.pic, t.h)], tw, th, { name: 'Thumb · ' + term })
    else if (t && t.pics) thumb = await boxed(await Promise.all(t.pics.map(p => pic(p, t.h))), tw, th, { name: 'Thumb · ' + term, gap: 6 })
    const textW = cw - pad * 2 - (thumb ? tw + 18 : 0)
    const txt = L.col([L.text(term, 'voice', { size: 21, lh: 26, w: textW }), L.text(def, 'small', { w: textW }), L.source(src, { w: textW })], { gap: 6, name: 'Words' })
    if (tags) L.add(txt, L.chips(tags))
    const card = L.row(thumb ? [thumb, txt] : [txt], { gap: 18, pad, w: cw, fill: L.C.card, fillA: 0.7, stroke: L.C.stroke, r: 14, name: 'Term · ' + term, align: 'MIN' })
    cards.push(card)
  }
  const grid = L.col([], { gap, name: 'Terms' })
  for (let i = 0; i < cards.length; i += cols) L.add(grid, equalize(L.row(cards.slice(i, i + cols), { gap, name: 'Terms row ' + (i / cols + 1), align: 'MIN' })))
  L.add(b, grid)
  sec.appendChild(b)
}

// ============ 7 · Where we'd most like your eyes ============
{
  const b = L.board({ name: ORDER[6], w: BW, kicker: 'Start here', title: 'Where we’d most like your eyes', titleStyle: 'h1', leadW: 1800,
    lead: 'The eight open questions that matter most, chosen from everything unresolved. Each is yours to decide; the full list is in Experience & notes ▸ Open questions & issues.' })
  const cols = 4, gap = 24, cw = Math.floor((IN - gap * (cols - 1)) / cols), pad = 24, pw = cw - pad * 2, ph = 220
  // Window sizes drawn to scale: what was rendered, and what nobody has looked at.
  const sizes = async () => {
    const f = L.frame({ name: 'Picture · window sizes to scale', w: pw, h: ph, r: 10, fill: BG, stroke: '#000000', strokeA: 0.07, clip: true })
    const s = 190 / 1440, ox = 22, oy = 15
    for (const [w, h, label, hot] of [[2560, 1440, '2560 × 1440', false], [1728, 1117, '1728 × 1117 · MacBook Pro 16', false], [1260, 860, '1260 × 860 · default', true], [940, 660, '940 × 660 · minimum', true]]) {
      const r = figma.createRectangle(); r.name = 'Window ' + label
      r.resize(w * s, h * s); r.x = ox; r.y = oy
      r.fills = hot ? [L.solid(L.C.gold, 0.08)] : []
      r.strokes = [L.solid(hot ? L.C.gold : L.C.ink, hot ? 0.7 : 0.3)]; r.strokeWeight = 1; r.strokeAlign = 'INSIDE'
      if (!hot) r.dashPattern = [4, 3]
      f.appendChild(r)
      const t = L.text(label, 'code', { size: 10, lh: 12, alpha: hot ? 0.8 : 0.5, color: hot ? L.C.gold : L.C.ink })
      f.appendChild(t); t.x = ox + w * s - t.width - 5; t.y = oy + h * s - 15
    }
    const key = L.col([L.text('gold: rendered', 'code', { size: 10, lh: 12, color: L.C.gold, alpha: 0.9 }), L.text('dashed: unseen', 'code', { size: 10, lh: 12, alpha: 0.5 })], { gap: 2 })
    f.appendChild(key); key.x = pw - key.width - 14; key.y = 16
    return f
  }
  const E = [
    ['The logo is dark in a light world', 'The shipped mark, a black eclipse-and-compass disc, dates from the first day and predates first light, which is light colours only. It sits on no squircle tile, and its matte fringe turns red on dark grounds.', [ref('README.md:156', 'README.md', 156), ref('build.sh:41', 'build.sh', 41)], 'Brand & icon',
      async () => boxed([await pic('brand/logo/arcana-logo-on-pearl.png', 190)], pw, ph, { fill: '#F9F7F2' })],
    ['Faint labels', 'The quiet is deliberate, but most labels are 7–11 pt capitals at 32–55% ink or 60–80% gold (1.97–3.61:1 on pearl), and ONE MOON AGO is 7 pt at 36% (2.16:1). Increase Contrast is ignored.', 'Keeping.swift:1062; RootView.swift:12', 'Edge cases & accessibility',
      () => cropW('shots-window/50-brought-back.png', [810, 70, 400, 174], pw, ph)],
    ['Large windows and full screen', 'Every render is 1260 × 860 or 940 × 660. Past the default the cards stop growing (slots cap at 262 pt, 360 for one card) while the sky, the wheel and the ribbon keep scaling. Nobody has looked at a full-screen room.', 'Game.swift:853-863, 896-905; Chamber.swift:220', 'Layout', sizes],
    ['Captions that don’t agree', 'PRESS AND HOLD and HOLD · RETURN THE CARDS differ in size, tracking, colour and baseline. DRAW ONE CARD sits beside DRAW THREE and DRAW FIVE, and “try again” is the only lower-case italic action.', 'RootView.swift:448-450, 1159-1165, 1179-1182, 1324', 'The room',
      async () => { const c = L.col([await cropW('shots-window/1-invocation.png', [405, 796, 450, 60], pw, 104, { r: 8 }), await cropW('shots-window/67-closing-prompt.png', [405, 796, 450, 60], pw, 104, { r: 8 })], { gap: 12, name: 'Picture · two foot captions' }); return c }],
    ['Card names wrap by chance', 'About 29 of the 78 names overflow the 182 pt name column, and TextKit breaks them where it likes: THE / HIEROPHANT orphans THE, and THREE / OF WANDS sits beside THREE OF / SWORDS.', 'CardImages.swift:81-88', 'Card anatomy & back',
      async () => boxed([await cropC('cards/faces/hierophant.png', [8, 290, 210, 110], 236, 124), await cropC('cards/faces/hanged.png', [8, 290, 210, 110], 236, 124)], pw, ph, { gap: 10 })],
    ['The plainest cards', 'The Knight and Page of Pentacles are the least drawn cards in the deck, at 12 and 20 marks. All 16 courts leave the numeral band empty, which was Claude’s choice.', 'Suits.swift:1102-1110; Deck.swift:430', 'Minor Arcana',
      async () => boxed([await pic('cards/faces/pentacles-knight.png', 196), await pic('cards/faces/pentacles-page.png', 196)], pw, ph, { gap: 14 }), ['claude']],
    ['No hover, press or focus states', 'The spread choices, find the thread, try again, the bowl and the old key are plain buttons: no hover look, the arrow cursor, no focus ring. Only cards, chevrons and the moon answer the pointer, and VoiceOver can’t reach the cards.', 'RootView.swift:35-36, 367-400, 1091-1131', 'Edge cases & accessibility',
      () => cropW('shots-window/1-invocation.png', [376, 318, 508, 221], pw, ph)],
    ['Settings speaks system', 'The Settings window uses a system secure field: SF type and a focus ring in the user’s accent colour, the only non-Didot type in the app’s own views. Keep macOS conventions there, or bring it closer to the room?', 'Settings.swift:30-32', 'Keys & Settings',
      async () => boxed([await pic('surfaces/settings/settings-window-ready@2x.png', 150)], pw, ph, { fill: '#ECE7DE' })],
  ]
  const cards = []
  for (let i = 0; i < E.length; i++) {
    const [title, body, src, where, mkPic, more] = E[i]
    const p = await mkPic()
    const srcNode = Array.isArray(src) ? L.row(src, { gap: 14, name: 'Sources' }) : L.source(src, { w: pw })
    const c = L.col([
      p,
      L.row([L.text(String(i + 1), 'h2', { size: 30, lh: 34, color: L.C.gold }), L.text(title, 'h3', { size: 17, lh: 24, w: pw - 44 })], { gap: 12, align: 'CENTER', name: 'Title' }),
      L.text(body, 'body', { w: pw }),
      srcNode,
      L.row([L.chips(['open'].concat(more || [])), L.text('More in ' + where, 'caption', { alpha: 0.6 })], { gap: 12, align: 'CENTER', name: 'Where' }),
    ], { gap: 14, pad, w: cw, fill: L.C.card, fillA: 0.7, stroke: L.C.stroke, r: 16, name: 'Question ' + (i + 1) + ' · ' + title })
    cards.push(c)
  }
  const grid = L.col([], { gap, name: 'Eight questions' })
  for (let i = 0; i < cards.length; i += cols) L.add(grid, equalize(L.row(cards.slice(i, i + cols), { gap, name: 'Questions row ' + (i / cols + 1), align: 'MIN' })))
  L.add(b, grid)
  sec.appendChild(b)
}

for (const name of ORDER) { const n = sec.children.find(c => c.name === name); if (n) sec.appendChild(n) }
L.fit(sec)
await L.arrange('Start here')
const out = []
for (const name of MINE) { const n = sec.children.find(c => c.name === name); out.push(await L.snap(n, 'pages/read-me-first/' + (ORDER.indexOf(name) + 1) + '.png', { scale: 0.3, wait: out.length ? 500 : 2500 })) }
return out
