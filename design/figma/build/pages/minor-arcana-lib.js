// minor-arcana-lib.js — shared helpers for the Minor Arcana chapter (S.minor). No chapter of its own.
// Run each step with the card generator and this file in front:
//   node design/figma/bridge/run.mjs design/figma/build/pages/cards-lib.js design/figma/build/pages/minor-arcana-lib.js design/figma/build/pages/minor-arcana-<n>.js
// Steps: 1 header + suit emblems · 2 Wands · 3 Cups · 4 Swords · 5 Pentacles · 6 the court scheme.
// Each step replaces only its own boards (rescuing the Card/ and Art/ components on them first), then puts the
// chapter's boards in order and fits the section, so any step can be re-run alone.
{
const L = S.lib
const K = S.cards
const M = S.minor = {}
M.CH = 'Minor Arcana'
M.ORDER = ['Minor Arcana · Header', 'Minor Arcana · Suit emblems', 'Minor Arcana · The court scheme',
  'Minor Arcana · Wands', 'Minor Arcana · Cups', 'Minor Arcana · Swords', 'Minor Arcana · Pentacles']
M.SUITS = ['wands', 'cups', 'swords', 'pentacles']
M.RANKS = ['page', 'knight', 'queen', 'king']
M.cap = s => s.charAt(0).toUpperCase() + s.slice(1)

// Put an imported SVG in a tile, scaled and centred on its ink (some crops draw past their own frame).
// scale: a number, or (inkW, inkH) => number. Returns the ink size at 1 × in points.
M.place = (tile, n, scale) => {
  tile.appendChild(n); n.x = 0; n.y = 0
  let rb = n.absoluteRenderBounds || { width: n.width, height: n.height }
  const ink = { w: rb.width, h: rb.height }
  n.rescale(typeof scale === 'function' ? scale(ink.w, ink.h) : scale)
  rb = n.absoluteRenderBounds || { x: tile.absoluteTransform[0][2], y: tile.absoluteTransform[1][2], width: n.width, height: n.height }
  const tx = tile.absoluteTransform[0][2], ty = tile.absoluteTransform[1][2]
  n.x = Math.round(n.x + (tile.width - rb.width) / 2 - (rb.x - tx))
  n.y = Math.round(n.y + (tile.height - rb.height) / 2 - (rb.y - ty))
  return ink
}

M.begin = async (names, o = {}) => {
  await K.load()
  const sec = await L.chapter(M.CH, { clear: false })
  for (const b of [...sec.children]) {
    if (names.includes(b.name) || (o.sweep && !M.ORDER.includes(b.name))) { K.rescue(b); b.remove() }
  }
  K.refresh()
  await K.base()
  return sec
}
M.end = async (sec, names) => {
  for (const n of M.ORDER) { const b = sec.children.find(c => c.name === n); if (b) sec.appendChild(b) }
  K.unpark()
  L.fit(sec)
  const order = await L.arrange('Design system')
  const snaps = []
  for (const n of names) {
    const b = sec.children.find(c => c.name === n)
    if (b) snaps.push(await L.snap(b, 'pages/minor-arcana/' + n.replace(/^Minor Arcana · /, '').replace(/[^\w]+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: snaps.length ? 400 : 1500 }))
  }
  return { snaps, order: order.join(' > ') }
}

// Where each card's gold sits, in plain words (from deck.json art.gold, Suits.swift).
M.GOLD = {
  'wands-ace': 'the flame bud', 'wands-2': 'the globe between the staves', 'wands-3': 'the sail of the ship coming in',
  'wands-4': 'the heart of the hanging flower', 'wands-5': 'the point where the staves cross', 'wands-6': 'the raised staff’s bud',
  'wands-7': 'the bud of the staff held across', 'wands-8': 'the last staff’s bud', 'wands-9': 'the bud of the ninth, leant-on staff',
  'wands-10': 'the strap that binds the bundle', 'wands-page': 'the bud', 'wands-knight': 'the bud',
  'wands-queen': 'the sunflower’s heart (the staff is plain)', 'wands-king': 'the crown (the staff’s bud is ink)',
  'cups-ace': 'the water in the brimming bowl', 'cups-2': 'the spark where the cups meet, in place of the caduceus and lion',
  'cups-3': 'the spark above the raised cups', 'cups-4': 'the water in the offered fourth cup',
  'cups-5': 'the water in both standing cups: two golds', 'cups-6': 'the heart of the given flower, bottom row, centre',
  'cups-7': 'the water in the one real cup, centre of the lower three', 'cups-8': 'the waning crescent moon',
  'cups-9': 'the water in the centre cup', 'cups-10': 'the lit window of the house', 'cups-page': 'the fish (the cup is plain)',
  'cups-knight': 'the water in the winged cup', 'cups-queen': 'the lid (its finial is oxblood)', 'cups-king': 'the crown (the cup is plain)',
  'swords-ace': 'the crown on the blade', 'swords-2': 'the crescent moon', 'swords-3': 'the heart',
  'swords-4': 'the diamond on the tomb’s panel', 'swords-5': 'the grip of the three swords held together',
  'swords-6': 'the half-sun on the far shore', 'swords-7': 'the grip of the five swords carried off',
  'swords-8': 'the empty place inside the fence', 'swords-9': 'the heart of the flower on the quilt',
  'swords-10': 'the band of dawn on the horizon', 'swords-page': 'the diamond on the guard', 'swords-knight': 'the diamond on the guard',
  'swords-queen': 'the diamond on the guard', 'swords-king': 'the crown (the sword is plain)',
  'pentacles-ace': 'the pentacle', 'pentacles-2': 'both pentacles: two golds', 'pentacles-3': 'the top pentacle in the arch',
  'pentacles-4': 'the pentacle held tight', 'pentacles-5': 'the centre pentacle: the lit light', 'pentacles-6': 'the scale’s fulcrum (all six pentacles plain)',
  'pentacles-7': 'the ripe pentacle low on the vine', 'pentacles-8': 'the pentacle on the bench', 'pentacles-9': 'the centre pentacle',
  'pentacles-10': 'the lowest pentacle, the root', 'pentacles-page': 'the pentacle', 'pentacles-knight': 'the pentacle',
  'pentacles-queen': 'the pentacle', 'pentacles-king': 'the crown (the pentacle is plain)',
}
M.DEVICE = { page: 'the ground', knight: 'the road', queen: 'the ring', king: 'the seat' }
// Chips on single cards. Everything else open is in the suit's notes.
M.CHIPS = {
  'cups-5': [['fixed', 'Two golds']], 'pentacles-2': [['fixed', 'Two golds']],
  'cups-knight': [['claude', 'The only wings']],
  'swords-4': [['open', 'No knight drawn']],
  'pentacles-knight': [['open', 'Plain · furrows, not road']], 'pentacles-page': [['open', 'Plain']],
}
M.scene = c => {
  const s = c.art.what_it_shows.replace(/^Follows: RWS [^:]+: /, '').split(' Drawn:')[0].trim()
  return M.cap(s)
}

// ---- a suit board: fourteen component sets, Ace to King, with their captions -----------------
const COLW = 226, GAP = 36, LABW = 80
M.suitBoard = async (suit, o) => {
  const t0 = Date.now()
  const cards = K.deck.cards.filter(c => c.suit === suit)
  for (const c of cards) await K.makeCard(c.id)
  const built = Date.now() - t0
  const i = M.SUITS.indexOf(suit)
  const pipsW = 10 * COLW + 9 * GAP, courtsW = 4 * COLW + 3 * GAP
  const W = 144 + LABW + GAP + pipsW + GAP + 1 + GAP + courtsW
  const b = L.board({ name: 'Minor Arcana · ' + M.cap(suit), kicker: `MINOR ARCANA · SUIT ${i + 1} OF 4`, title: M.cap(suit), w: W })
  const head = b.children[0]
  L.add(head, L.rich([[o.motto, 'lead', { family: 'Inter', style: 'Italic' }], ['   ' + o.mottoSrc, 'code', { size: 11, lh: 16, alpha: 0.55 }]], 'lead', { w: 1500 }))
  L.linkRefs(head.children[head.children.length - 1])
  L.add(head, L.text(o.lead, 'lead', { w: 1500 }))
  if (o.tags) L.add(head, L.chips(o.tags))

  const labels = () => {
    const f = L.frame({ name: 'State labels', w: LABW, h: 400 * 3 + 24 * 2 })
    ;['Upright', 'Reversed', 'Returned'].forEach((s, k) => { const t = L.text(s, 'kicker', { w: LABW }); f.appendChild(t); t.x = 0; t.y = k * 424 + 192 })
    return f
  }
  const cell = c => {
    const court = M.RANKS.includes(c.rank)
    const kick = court ? `${c.rank} · ${c.rank === 'knight' && suit === 'pentacles' ? 'the furrows' : M.DEVICE[c.rank]}` : c.numeral
    const set = K.find('Card/' + c.name)
    const cap = L.col([
      L.text(kick, 'kicker', { w: COLW }),
      L.text(c.name, 'h3', { w: COLW, size: 17, lh: 22 }),
      L.text(c.essence, 'voiceSmall', { w: COLW, color: L.C.blood, size: 16, lh: 22 }),
      L.rich([['Gold  ', 'smallStrong', { color: L.C.gold }], [M.GOLD[c.id], 'small']], 'small', { w: COLW }),
      L.rich([['Scene  ', 'smallStrong'], [M.scene(c), 'small']], 'small', { w: COLW }),
      M.CHIPS[c.id] ? L.chips(M.CHIPS[c.id], { w: COLW }) : null,
      L.source(c.art.source.replace('Sources/Arcana/', ''), { w: COLW }),
    ], { gap: 6, name: 'Caption · ' + c.name, w: COLW })
    return L.col([set, cap], { gap: 20, name: 'Card · ' + c.name, w: COLW })
  }
  const group = (label, w) => L.col([L.text(label, 'kicker', { w }), L.rule(w, { color: L.C.gold, alpha: 0.35 })], { gap: 8, w, name: 'Group · ' + label })
  L.add(b, L.row([L.spacer(LABW, 1), group('The numbers · Ace to Ten', pipsW), L.spacer(1, 1), group('The courts', courtsW)], { gap: GAP, name: 'Groups' }))
  const pips = L.row(cards.slice(0, 10).map(cell), { gap: GAP, name: 'Numbers', align: 'MIN' })
  const courts = L.row(cards.slice(10).map(cell), { gap: GAP, name: 'Courts', align: 'MIN' })
  const divider = L.rule(1, { h: 400 * 3 + 48, color: L.C.gold, alpha: 0.3, fill: false })
  divider.name = 'Divider'
  L.add(b, L.row([labels(), pips, divider, courts], { gap: GAP, name: 'Row · ' + M.cap(suit), align: 'MIN' }))
  // the art masters, under their cards: Art/<name> and Art/Returned/<name>
  const inner = W - 144
  L.add(b, L.col([L.text('The art, and what it leaves', 'kicker'), L.rule(inner, { color: L.C.gold, alpha: 0.35 }),
    L.text('The Art/<name> and Art/Returned/<name> masters the faces and blanks use, 186 × 248 pt, on the card’s paper. A returned blank keeps strokes of 1.2 pt and more as grooves, filled shapes as outline grooves, and the gold leaf.', 'small', { w: 1400 }),
    L.source('CardImages.swift:178-235; CardArt.swift:539-591')], { gap: 8, w: inner, name: 'Group · The art' }))
  const tileOf = comp => { const f = L.frame({ name: 'Paper · ' + comp.name, w: COLW, h: 288, fill: '#F3EDE0', clip: false }); f.appendChild(comp); comp.x = 20; comp.y = 20; return f }
  const artCell = c => L.col([tileOf(K.find('Art/' + c.name)), tileOf(K.find('Art/Returned/' + c.name)),
    L.text(c.name, 'smallStrong', { w: COLW }),
    L.text(`${c.art.marks} pen marks · ${c.art.pressed_marks} pressed · ${c.art.leaf_marks} leaf`, 'code', { w: COLW, size: 11, lh: 16 })],
    { gap: 12, w: COLW, name: 'Art · ' + c.name })
  const artLabels = () => {
    const f = L.frame({ name: 'Art labels', w: LABW, h: 288 * 2 + 12 })
    ;['Art', 'Returned'].forEach((s, k) => { const t = L.text(s, 'kicker', { w: LABW }); f.appendChild(t); t.x = 0; t.y = k * 300 + 136 })
    return f
  }
  const div2 = L.rule(1, { h: 288 * 2 + 12, color: L.C.gold, alpha: 0.3, fill: false }); div2.name = 'Divider'
  L.add(b, L.row([artLabels(), L.row(cards.slice(0, 10).map(artCell), { gap: GAP, name: 'Numbers · art', align: 'MIN' }), div2,
    L.row(cards.slice(10).map(artCell), { gap: GAP, name: 'Courts · art', align: 'MIN' })], { gap: GAP, name: 'Art row · ' + M.cap(suit), align: 'MIN' }))
  if (o.notes && o.notes.length) L.add(b, L.row(o.notes.map(n => L.note(Object.assign({ w: 560 }, n))), { gap: 24, align: 'MIN', name: 'Notes' }))
  L.add(b, L.source(o.source))
  return { board: b, built }
}
}
