// Chapter: Major Arcana (Design system). Run with the card generator in front:
//   node design/figma/bridge/run.mjs design/figma/build/pages/cards-lib.js design/figma/build/pages/major-arcana.js
// The component sets Card/<name> and the Art/ masters live on these boards; re-running rescues them first,
// so instances elsewhere in the file keep working.
const L = S.lib
const K = S.cards
await K.load()
const sec = await L.chapter('Major Arcana', { clear: false })
K.rescue(sec)
for (const c of [...sec.children]) c.remove()
K.refresh()
await K.base()

const MAJORS = K.deck.cards.filter(c => c.arcana === 'major')
// What each drawing is, in one line (condensed from deck.json art.what_it_shows), and where its gold sits.
const DRAW = {
  fool: ['Stair steps over a hatched ledger; one line strikes off into open space, ending in an oxblood diamond.', 'the sun, top right'],
  magician: ['Eighteen rays burst from a ringed eye inside an oxblood diamond compass; the rays overrun the window.', 'the almond eye, dead centre'],
  priestess: ['Two heavy pillars either side of a hatched veil; oxblood diamonds in a cross on it; a crescent below.', 'the veil diamond and the crescent (two golds)'],
  empress: ['Six bowed furrows; a seed-sun in eight rays sends up two curling stems to an oxblood bud.', 'the seed-sun, upper centre'],
  emperor: ['Two nested squares quartered by a cross, two quadrants hatched; an oxblood diamond on the seat.', 'the central block, the seat'],
  hierophant: ['Three nested arches over two pillars; two crossed keys hang inside an oxblood diamond outline.', 'the diamond where the keys cross'],
  lovers: ['Two overlapping rings make a vesica; an oxblood diamond in a crown of seven rays; hatched ground.', 'the shared almond'],
  chariot: ['A ten-spoked wheel with twenty rim ticks over three sweeping road curves; two level dashes above.', 'the hub, in an oxblood diamond'],
  strength: ['A hand-drawn figure-eight in a ring of sixteen soft rays; oxblood diamonds above and below.', 'the crossing of the figure-eight'],
  hermit: ['A staff tipped with an oxblood diamond beside a six-sided lantern throwing nine rays.', 'the lamp flame, left of centre'],
  wheel: ['Three rings, eight spokes, thirty-two ticks; oxblood diamonds at the four points, the side two on the window rule.', 'the hub'],
  justice: ['A post and level beam carrying two shallow pans; an oxblood diamond outline on the post.', 'the fulcrum'],
  hanged: ['A beam and rope to an inverted, hatched triangle, the head below it in a ring. Built upside down on purpose.', 'the head, low centre'],
  death: ['A long horizon with a rayed half-sun, seven strokes beneath, an arc overhead peaking in an oxblood diamond.', 'the half-sun on the horizon'],
  temperance: ['An hourglass of two triangles; five oxblood drops zig-zag into the lower vessel; a faint ring holds it.', 'the block at the waist'],
  devil: ['A horned trapezoid with hatching under its eye; loose chain links either side; an oxblood diamond at the foot.', 'the eye'],
  tower: ['A tapering tower with a battlement and three floors, struck from above; four oxblood diamonds fall.', 'the lightning bolt'],
  star: ['An eight-point star in a ring with an oxblood diamond; four pen sparkles; five ripples of water below.', 'the star’s heart'],
  moon: ['A crescent in a crown of 24 ticks; two small towers with oxblood windows; a dashed path down to the water.', 'the crescent: a gold disc bitten by a paper disc'],
  sun: ['A great disc in a heavy ring with twelve long and twelve short rays; oxblood diamonds in the top corners.', 'the disc, and the eye painted on it (two golds)'],
  judgement: ['A horn opens over a rayed note; three narrowing strata; two arms rise, each tipped with oxblood.', 'the note under the horn'],
  world: ['A wreath of two rings bound by 26 strokes; four oxblood corner diamonds, each with four little rays.', 'the world at the centre'],
}
const SKY = { wheel: 'the wheel turns one house', star: 'the glints are held lit', moon: 'lilac half-light', sun: 'the dawn rises' }

const t0 = Date.now()
for (const c of MAJORS) await K.makeCard(c.id)
const built = Date.now() - t0

// ---- 1. Header --------------------------------------------------------------------------------
const head = L.board({ name: 'Major Arcana · Header', kicker: 'THE DECK', title: 'Major Arcana', w: 1600,
  lead: 'The twenty-two trumps, as real components. Each card is a component set, Card/<name>, with one property, State: Upright, Reversed or Returned. The drawings are the app’s own vector art and the type is live text in the Card text styles.',
  tags: ['shipped'] })
L.add(head, L.rich([['In this chapter   ', 'smallStrong'], ['The twenty-two  ·  The art, and what each card leaves when it is returned', 'small']], 'small', { w: 1456 }))
L.add(head, L.row([
  L.note({ w: 440, tags: ['claude'], title: 'About one gold per card', body: 'Every drawing is ink with a few oxblood accents and, almost always, one shape of gold leaf: the one thing a returned card keeps. The High Priestess and the Sun carry two.', source: 'CardArt.swift:539-591' }),
  L.note({ w: 440, tags: ['claude'], title: 'The sky answers four', body: 'Only the Wheel, the Star, the Moon and the Sun change the sky when they are drawn (see As Above). They are tagged below.', source: 'Answers.swift:31-32; Chamber.swift:258' }),
  L.note({ w: 440, tags: ['fixed'], title: 'How to use them', body: 'Drop in an instance of Card/<name> and switch State. Components are 226 × 400 pt; scale instances for the table (slots up to 262 pt tall, one card 360) and the altar (up to 480). Base parts are in Card anatomy & back.', source: 'Game.swift:853-863' }),
], { gap: 24, align: 'MIN' }))

// ---- 2. The twenty-two ------------------------------------------------------------------------
const COLW = 226, GAP = 40, LABW = 96
const grid = L.board({ name: 'Major Arcana · The twenty-two', kicker: 'THE DECK · MAJOR ARCANA', title: 'The twenty-two', w: 3200,
  lead: 'O to XXI in deck order. Each column is one component set: the finished face upright, the same card reversed (only the art turns; a small oxblood diamond appears under the essence), and the blank it leaves once the reading is returned.', leadW: 1300 })
const labels = () => {
  const f = L.frame({ name: 'State labels', w: LABW, h: 400 * 3 + 24 * 2 })
  ;['Upright', 'Reversed', 'Returned'].forEach((s, i) => {
    const t = L.text(s, 'kicker', { w: LABW }); f.appendChild(t); t.x = 0; t.y = i * 424 + 192
  })
  return f
}
const cell = c => {
  const [drawing, gold] = DRAW[c.id]
  const set = K.find('Card/' + c.name)
  const cap = L.col([
    L.text(c.numeral, 'kicker', { w: COLW }),
    L.text(c.name, 'h3', { w: COLW, size: 17, lh: 22 }),
    L.text(c.essence, 'voiceSmall', { w: COLW, color: L.C.blood, size: 16, lh: 22 }),
    L.rich([['Gold  ', 'smallStrong', { color: L.C.gold }], [gold, 'small']], 'small', { w: COLW }),
    L.text(drawing, 'small', { w: COLW }),
    SKY[c.id] ? L.chips([['claude', 'Sky: ' + SKY[c.id]]]) : null,
  ], { gap: 6, name: 'Caption · ' + c.name, w: COLW })
  return L.col([set, cap], { gap: 20, name: 'Card · ' + c.numeral + ' ' + c.name, w: COLW })
}
for (const [from, to] of [[0, 11], [11, 22]]) {
  const row = L.row([labels(), ...MAJORS.slice(from, to).map(cell)], { gap: GAP, name: `Row · ${MAJORS[from].numeral}–${MAJORS[to - 1].numeral}`, align: 'MIN' })
  L.add(grid, row)
}
L.add(grid, L.source('Deck.swift:56-150 (words); CardArt.swift:69-435 (art); CardImages.swift:45-122 (face), 198-235 (blank)'))

// ---- 3. The art and what it leaves --------------------------------------------------------
const artB = L.board({ name: 'Major Arcana · The art', kicker: 'THE DECK · MAJOR ARCANA', title: 'The art, and what it leaves', w: 3200,
  lead: 'The Art/<name> and Art/Returned/<name> masters, each 186 × 248 pt, shown on the card’s paper. Art is not clipped to its window. The returned art keeps only strokes of 1.2 pt and more (as grooves), filled shapes as 1.0 pt outline grooves, and the gold leaf.', leadW: 1300 })
const artCell = c => {
  const tile = comp => { const f = L.frame({ name: 'Paper · ' + comp.name, w: COLW, h: 288, fill: '#F3EDE0', clip: false }); f.appendChild(comp); comp.x = 20; comp.y = 20; return f }
  const a = K.find('Art/' + c.name), b = K.find('Art/Returned/' + c.name)
  return L.col([
    tile(a), tile(b),
    L.text(c.numeral + ' · ' + c.name, 'smallStrong', { w: COLW }),
    L.text(`${c.art.marks} pen marks · ${c.art.pressed_marks} pressed · ${c.art.leaf_marks} leaf`, 'code', { w: COLW, size: 11, lh: 16 }),
  ], { gap: 12, name: 'Art · ' + c.name, w: COLW })
}
const artLabels = () => {
  const f = L.frame({ name: 'Labels', w: LABW, h: 288 * 2 + 12 })
  ;['Art', 'Returned'].forEach((s, i) => { const t = L.text(s, 'kicker', { w: LABW }); f.appendChild(t); t.x = 0; t.y = i * 300 + 136 })
  return f
}
for (const [from, to] of [[0, 11], [11, 22]]) L.add(artB, L.row([artLabels(), ...MAJORS.slice(from, to).map(artCell)], { gap: GAP, name: `Art row · ${MAJORS[from].numeral}–${MAJORS[to - 1].numeral}`, align: 'MIN' }))
L.add(artB, L.row([
  L.note({ w: 520, tags: ['open'], title: 'Art that runs past its window', body: 'The Magician’s rays reach the heavy border, the Wheel’s side diamonds straddle the window rule and the World’s corner diamonds crowd the brackets. The app does not clip the art; the intent was never recorded.', source: 'CardArt.swift:86, 240, 429' }),
  L.note({ w: 520, tags: ['open'], title: 'The Hanged Man reads upright reversed', body: 'The figure is drawn upside down on purpose (head at the bottom), so the reversed card shows it the right way up. It may confuse readers.', source: 'CardArt.swift:262-272' }),
  L.note({ w: 520, tags: ['open'], title: 'Death’s rays', body: 'The nine rays go all the way round the half-sun, so several fall below the horizon among the vertical strokes; at small sizes this reads as noise.', source: 'CardArt.swift:283' }),
], { gap: 24, align: 'MIN' }))

L.add(sec, head, grid, artB)
K.unpark()
L.fit(sec)
const order = await L.arrange('Design system')
const snaps = await L.snapChapter(sec, 'pages/major-arcana', { scale: 0.3 })
return { built, snaps, order }
