// Components, step 4: the card's parts (suit emblems, motifs, court devices) and the pen's primitives.
//   node design/figma/bridge/run.mjs design/figma/build/pages/components-lib.js design/figma/build/pages/components-4.js
const L = S.lib, CL = S.cl
const MINE = ['Components · Suits & motifs', 'Components · Courts & the pen']
const sec = await CL.start(MINE)
const BW = 2400, INNER = BW - 144 - 64 - 64
const M = {}
for (const it of (await L.json('glyphs/manifest.json')).items) M[it.file] = it
const man = f => M['glyphs/' + f] || {}
// A component from a glyph SVG, described by its manifest entry.
const mk = async (file, name) => { const c = await CL.comp(file, name); const m = man(file); c.description = (m.description || '') + (m.source ? ' Source: ' + m.source.replace('Sources/Arcana/', '') + '.' : ''); return c }
const INKS = 'card ink #15110E strokes; gold as leaf (Palette.leaf, four stops across each shape’s own box) under a 0.8 pt ink keyline; oxblood #8C2E25 solid; paper #F3EDE0 fills that hide what is behind'

// ------------------------------------------------------------------ Suits & motifs
{
  const b = L.board({ name: 'Components · Suits & motifs', kicker: 'PARTS · THE CARDS', title: 'Suits & motifs', w: BW,
    lead: 'The Minor Arcana’s emblems and the small scenes drawn around them, in the same pen and inks as the cards. Each is a component, so a card can be rebuilt from its parts. Shown on the card’s paper.' })

  const SUITS = [
    ['Suit emblem/Cup', [['emblem-cup', 'Form=Plain', 'Plain'], ['emblem-cup-full', 'Form=Full', 'Full'], ['emblem-cup-lidded', 'Form=Lidded', 'Lidded'], ['emblem-cup-fish', 'Form=With fish', 'With fish']],
      'The chalice: bowl, rim, knopped stem, foot. Full: its water laid in leaf (the standing cups of the Five, the Knight’s). Lidded: the Queen of Cups’ closed cup, a gilded dome and a leaf finial. With fish: the Page of Cups’ cup, a gold fish rising out of it.', 'Sources/Arcana/Suits.swift:53-88'],
    ['Suit emblem/Wand', [['emblem-wand', 'Bud=Ink', 'Ink bud'], ['emblem-wand-gilt', 'Bud=Gold', 'Gold bud']],
      'A living staff 2.6 pt, the foot turned, five leaves under the head, an ink bud; gold bud: the Page’s and the Knight’s.', 'Sources/Arcana/Suits.swift:102-124'],
    ['Suit emblem/Sword', [['emblem-sword', 'Form=Sword', 'Sword'], ['emblem-great-sword', 'Form=Great sword', 'Great sword'], ['emblem-great-sword-gilt', 'Form=Great sword · gilt guard', 'Gilt guard']],
      'The plain sword of the numbered cards (blade, crossguard, grip, ringed pommel, 1.5 pt); the great sword of the Ace and the courts (two edges and a fuller, a broad guard with oxblood ends); gilt guard: a leaf lozenge on the guard (the Page’s, the Queen’s).', 'Sources/Arcana/Suits.swift:127-196'],
    ['Suit emblem/Pentacle', [['emblem-pentacle', 'Gilt=No', 'Plain'], ['emblem-pentacle-gilt', 'Gilt=Yes', 'Gilt']],
      'A rimmed disc with the five-pointed star drawn in it (r 36, the courts’ size); gilt: the disc laid in leaf under the star.', 'Sources/Arcana/Suits.swift:217-233'],
  ]
  const groups = [], previews = []
  for (const [name, vs, desc, src] of SUITS) {
    const items = []
    for (const [f, vn, label] of vs) items.push({ c: await mk('suits/' + f + '.svg', vn), label })
    const g = CL.grid(items, name, { pad: 16, gap: 24, valign: 'bottom', colW: 70, desc: desc + ' Inks: ' + INKS + '.', src })
    groups.push(L.col([L.text(name, 'codeStrong', { size: 13, alpha: 0.8 }), g.holder], { gap: 8, name: 'Set · ' + name }))
    previews.push(L.col([L.text(name.replace('Suit emblem/', ''), 'smallStrong'), CL.previews(items, { k: 2, gap: 24, colW: 90 })], { gap: 12, name: 'Previews · ' + name }))
  }
  L.add(b, await CL.card({ name: 'Suit emblem/*', stack: true, infoW: 620, bg: 'paper',
    what: 'The four suits’ emblems as the courts and Aces carry them, with the forms the cards need: the cup plain, full, lidded or with a fish; the wand with an ink or a gold bud; the plain sword and the great sword, with or without its gilt guard; the pentacle plain or gilt.',
    stage: [L.row(previews, { gap: 64, align: 'MAX', name: 'Previews ×2' }), CL.masters(L.row(groups, { gap: 40, align: 'MIN', name: 'Sets' }), 'Masters · 1×, four component sets')],
    specs: [
      ['Sets', 'Suit emblem/Cup (Form: Plain · Full · Lidded · With fish) · Wand (Bud: Ink · Gold) · Sword (Form: Sword · Great sword · Great sword · gilt guard) · Pentacle (Gilt: No · Yes)'],
      ['Scale', 'drawn at the courts’ size (the cup at s 100, the pentacle r 36); the pips draw the same emblems at their own sizes', 'Suits.swift:36-233, 1017-1027'],
      ['Inks', INKS, 'Palette.swift'],
      ['Gold', 'about one gold per card (Claude’s rule); most emblems come plain and gilt'],
    ],
    tags: [['akash', 'Akash: the full 78-card deck'], ['claude', 'Claude: Marseille-style pips'], ['claude', 'Claude: a pentagram on each Pentacle'], ['claude', 'Claude: about one gold per card']] }))

  // Motifs: standalone components
  const MOT = ['spill', 'leaf', 'sprig', 'flower', 'flower-gilt', 'sunflower', 'grapes', 'butterfly', 'bird', 'ship', 'ship-gilt', 'wreath', 'pyramid', 'wind', 'crescent', 'rain', 'heart', 'ground', 'cloud', 'ripples']
  const title = s => s.split('-').map((w, i) => i ? w : w[0].toUpperCase() + w.slice(1)).join(' · ').replace('· gilt', '· gilt')
  const motifs = []
  for (const m of MOT) {
    const c = await mk('suits/motifs/motif-' + m + '.svg', 'Motif/' + title(m))
    try { c.documentationLinks = [{ uri: CL.url(man('suits/motifs/motif-' + m + '.svg').source) }] } catch (e) {}
    motifs.push({ c, label: title(m), m })
  }
  const small = motifs.filter(x => x.c.width <= 80), wide = motifs.filter(x => x.c.width > 80)
  const shelf = CL.shelf(motifs.map(x => ({ c: x.c })), 'Motif · masters', { gap: 20, colW: 40, w: INNER })
  L.add(b, await CL.card({ name: 'Motif/*', stack: true, infoW: 620, bg: 'paper',
    what: 'The small scenes the pen draws round the suits, borrowed from Rider–Waite–Smith and redrawn in the cards’ hand: a spill of water, a sprig, flowers, a ship, a wreath, rain, a heart, the ground, a cloud, ripples, a crescent. Twenty components.',
    stage: [CL.previews(small, { k: 2, gap: 20, colW: 116 }), CL.previews(wide, { k: 2, gap: 40 }), CL.masters(shelf, 'Masters · 1× (Motif/Spill … Motif/Ripples)')],
    specs: [
      ['Components', MOT.map(title).join(', ')],
      ['Scale', 'as drawn on the cards (1×); gilt forms carry the card’s leaf', 'Suits.swift:91-498'],
      ['Inks', INKS],
      ['Where', 'each component’s description gives the lines in Suits.swift where the cards use it', 'Suits.swift:374-498; Ink.swift:281-315'],
    ],
    tags: [['claude', 'Claude: RWS scenes in the pen’s language'], 'shipped'] }))
  sec.appendChild(b)
}

// ------------------------------------------------------------------ Courts & the pen
{
  const b = L.board({ name: 'Components · Courts & the pen', kicker: 'PARTS · THE CARDS', title: 'Courts & the pen', w: BW,
    lead: 'How a court card says its rank without a figure, and the pen every card is drawn with: its primitives, its stroke weights, and the seed that gives each line its hand.' })

  const CR = [['page', 'Rank=Page', 'Page', 'on the ground'], ['knight-road', 'Rank=Knight', 'Knight', 'carried along the road'], ['knight-furrows', 'Rank=Knight of Pentacles', 'Knight of Pentacles', 'the furrows: he does not hurry'],
    ['queen', 'Rank=Queen', 'Queen', 'held in the ring'], ['king', 'Rank=King', 'King', 'on the squared seat, crowned']]
  const courts = []
  for (const [f, vn, label, sub] of CR) courts.push({ c: await mk('suits/court/court-device-' + f + '.svg', vn), label, sub })
  const cSet = CL.grid(courts, 'Court device', { pad: 24, gap: 40,
    desc: 'The rank device of a court card, in the card’s 186 × 248 art frame (it sits at (20, 52) in the 226 × 400 card), under the suit’s emblem. Page: a small oxblood lozenge (4 × 5.5) at the top, on the ground. Knight: three bowed lines across the foot (1.5, 1.25, 1.0 pt), the road. Knight of Pentacles: four straight furrows (1.5 → 0.9 pt). Queen: a hand-wobbled ring (r 66, 1.4 pt) with an oxblood lozenge either side. King: a double square (1.8 and 1.0 pt) with a three-pointed crown of leaf.', src: 'Sources/Arcana/Suits.swift:1029-1170' })
  L.add(b, await CL.card({ name: 'Court device', infoW: 620, bg: 'paper',
    what: 'A court card’s rank, drawn round its emblem instead of a figure: the page on the ground, the knight on the road, the queen in the ring, the king on the squared seat.',
    stage: [CL.masters(cSet.holder, 'Masters · 1× · the card’s art frame, 186 × 248')],
    specs: [
      ['Variants', 'Rank = Page · Knight · Knight of Pentacles · Queen · King'],
      ['Frame', '186 × 248 pt, the art panel at (20, 52) in the 226 × 400 card', 'Suits.swift:1029-1170'],
      ['Page', 'a small oxblood lozenge, 4 × 5.5, at the top of the art'],
      ['Knight', 'three bowed lines across the foot, 1.5, 1.25, 1.0 pt; of Pentacles, four straight furrows, 1.5 → 0.9 pt'],
      ['Queen', 'a hand-wobbled ring, r 66, 1.4 pt, an oxblood lozenge either side'],
      ['King', 'a double square, 1.8 and 1.0 pt, with a three-pointed crown of leaf'],
    ],
    tags: [['claude', 'Claude: the court-card scheme'], 'shipped'] }))

  // Pen primitives
  const PEN = ['line', 'ring', 'ring-squashed', 'dot', 'dot-ink', 'poly', 'poly-open', 'fillPoly', 'fillPoly-accent', 'smooth', 'smooth-open', 'fillSmooth', 'fillChord', 'fillSmoothPts', 'diamond', 'fillDiamond', 'fillDiamond-gold', 'rays', 'hatch', 'ticks', 'ripples', 'crescent', 'eye']
  const PENSRC = { line: '101-109', ring: '121-129', dot: '130-138', poly: '160-166', fillPoly: '167-173', smooth: '174-180', fillSmooth: '181-188', fillChord: '189-194', fillSmoothPts: '195-205', diamond: '206-212', fillDiamond: '213-220', rays: '221-234', hatch: '235-268', ticks: '269-280', ripples: '281-295', crescent: '296-316', eye: '317-325' }
  const pens = []
  for (const p of PEN) {
    const c = await mk('pen/pen-' + p + '.svg', 'Pen/' + p)
    // each primitive points at its own function in Ink.swift, not the whole Pen struct
    const src = 'Ink.swift:' + PENSRC[p.split('-')[0]]
    c.description = c.description.replace(/ Source: [^ ]+\.swift:[\d-]+\./, '') + ' Source: ' + src + '.'
    CL.doc(c, null, src)
    const g = c.findOne(n => n.name === 'ground'); if (g) g.visible = false
    pens.push({ c, label: p })
  }
  const penShelf = CL.shelf(pens, 'Pen · masters', { gap: 16, colW: 104, w: INNER - 700 })
  const sheet = await L.svg('glyphs/pen/pen-primitives-sheet.svg', { name: 'The pen’s primitives (sheet)' }); sheet.fills = []
  const ladder = await L.svg('glyphs/pen/pen-stroke-ladder.svg', { name: 'Stroke weights 0.8 – 2.6 pt (sheet)' }); ladder.fills = []
  const wobble = await L.svg('glyphs/pen/pen-seed-wobble.svg', { name: 'One line, six seeds (sheet)' }); wobble.fills = []
  for (const s of [sheet, ladder, wobble]) CL.bind(s)
  const fig = (n, t, c) => L.col([n, L.text(t, 'smallStrong', { w: n.width }), L.text(c, 'caption', { w: n.width })], { gap: 8, name: 'Sheet · ' + t })
  L.add(b, await CL.card({ name: 'Pen/*', stack: true, infoW: 620, bg: 'paper',
    what: 'Every mark on a card is laid by a seeded pen (Ink.swift): lines that bow a hair, rings of nudged points, curves, fills in leaf, oxblood or paper, lozenges, rays, hatching, ticks, ripples, a crescent, an eye. The seed decides the wobble, so the same seed always draws the same hand.',
    stage: [L.row([L.col([CL.cap('Masters · 1×, each in its 80 pt cell (the paper ground is hidden)'), penShelf], { gap: 10, name: 'Masters' }),
      fig(sheet, 'The pen’s primitives, the sheet', 'every primitive at its defaults, on card paper, as one vector frame')], { gap: 48, align: 'MIN', name: 'Primitives' }),
      L.row([fig(ladder, 'Stroke weights, 0.8 – 2.6 pt', 'one line at every weight, seed 7, round caps'), fig(wobble, 'One line, six seeds', 'seeds 1 to 6: each bows the stroke and moves its ends differently')], { gap: 64, align: 'MIN', name: 'The hand' })],
    specs: [
      ['Components', 'Pen/' + PEN.join(', ')],
      ['Weights', 'strokes 0.8 – 2.6 pt; the frame’s hairlines 0.8 – 1.1', 'Ink.swift:37-42, 101-107'],
      ['Seeds', 'Rng and seedHash: a primitive’s seed is seedHash of its name, so it redraws the same every time', 'Ink.swift:10-33'],
      ['Inks', 'card ink #15110E, oxblood #8C2E25, gold as leaf, paper'],
      ['Code', 'Pen’s primitives', 'Ink.swift:77-325'],
    ],
    tags: [['claude', 'Claude: the pen’s hand'], 'shipped'] }))
  sec.appendChild(b)
}

await CL.finish(sec)
const out = []
for (const n of sec.children.filter(n => MINE.includes(n.name))) out.push(await L.snap(n, 'pages/components/' + n.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: out.length ? 300 : 1200 }))
return { bound: CL.bound, out }
