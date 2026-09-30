// Chapter: The words (Design system). Every word of the deck, the spreads, and the words as a reading shows them.
//   node design/figma/bridge/run.mjs design/figma/build/pages/cards-lib.js design/figma/build/pages/the-words.js
const L = S.lib
const K = S.cards
await K.load()
const sec = await L.chapter('The words')
const D = K.deck
const styles = await figma.getLocalTextStylesAsync()
const styleLike = prefix => styles.find(s => s.name === prefix) || styles.find(s => s.name.startsWith(prefix))
const spec = async (chars, prefix, o = {}) => {
  const t = L.text(chars, 'body', { w: o.w })
  const s = styleLike(prefix); if (s) await t.setTextStyleIdAsync(s.id)
  t.fills = [L.solid(o.color || L.C.ink, o.alpha == null ? 0.92 : o.alpha)]
  if (o.w) { t.textAutoResize = 'HEIGHT'; t.resize(o.w, t.height) }
  t.name = o.name || chars.slice(0, 40)
  return t
}

// ---- 1. Header --------------------------------------------------------------------------------------
const head = L.board({ name: 'The words · Header', kicker: 'THE DECK', title: 'The words', w: 1600,
  lead: 'Every word the deck holds, verbatim from Deck.swift: for each card a numeral, a name, an essence, one line upright, one line reversed, and three keys either way. Then the spreads, and the words as a reading shows them.',
  tags: ['shipped'] })
L.add(head, L.rich([['In this chapter   ', 'smallStrong'], ['Major Arcana  ·  Wands  ·  Cups  ·  Swords  ·  Pentacles  ·  The spreads  ·  In a reading', 'small']], 'small', { w: 1456 }))
L.add(head, L.row([
  L.note({ w: 440, tags: [['fixed', 'Origin not recorded']], title: 'The rule', kids: [L.text('The deck. One line per card, per orientation. Nothing longer.', 'voiceSmall', { w: 400 }), L.text('The comment at the head of the deck. It predates, and fits, Akash’s later “as minimal as possible”.', 'small', { w: 400 }), L.source('Deck.swift:4', { w: 400 })] }),
  L.note({ w: 440, title: 'Where each word appears', body: 'Numeral, name, essence: on the face (the essence is the oxblood italic) and on the altar. The line: read as verse in the reading, and on the altar. Keys: on the altar only, and sent with the reading when the thread is asked for.', source: 'CardImages.swift:73-94; RootView.swift:1486-1511; Weave.swift:180' }),
  L.note({ w: 440, tags: ['claude'], title: 'British spelling', body: 'Instalments, idealising, defence, honour, candour, pretence, Judgement. Keep it when editing.' }),
], { gap: 24, align: 'MIN' }))

// ---- 2–6. The tables ---------------------------------------------------------------------------------
const COLS = [
  { key: 'n', label: 'No.', w: 52 }, { key: 'name', label: 'Card', w: 180 }, { key: 'ess', label: 'Essence', w: 200 },
  { key: 'up', label: 'Upright', w: 300 }, { key: 'rev', label: 'Reversed', w: 300 },
  { key: 'ku', label: 'Keys upright', w: 340 }, { key: 'kr', label: 'Keys reversed', w: 340 },
]
const line = (s, w) => L.text(s, 'body', { family: 'Didot', style: 'Regular', size: 16, lh: 22, w, alpha: 0.9 })
const rowOf = c => [
  L.text(c.numeral || '—', 'code', { w: 52, size: 13, lh: 22, alpha: c.numeral ? 0.8 : 0.3 }),
  L.text(c.name, 'smallStrong', { w: 180, lh: 22 }),
  L.text(c.essence, 'voiceSmall', { w: 200, size: 16, lh: 22, color: L.C.blood }),
  line(c.upright, 300), line(c.reversed, 300),
  L.text(c.keys.join(' · '), 'small', { w: 340, lh: 22 }),
  L.text(c.keys_reversed.join(' · '), 'small', { w: 340, lh: 22 }),
]
const tableBoard = (title, cards, lead, source) => {
  const b = L.board({ name: 'The words · ' + title, kicker: 'THE WORDS', title, titleStyle: 'h1', w: 2000, lead })
  L.add(b, L.table(COLS, cards.map(rowOf), { zebra: true, name: 'Words · ' + title }))
  L.add(b, L.source(source))
  return b
}
const majors = D.cards.filter(c => c.arcana === 'major')
const boards = [tableBoard('Major Arcana', majors, 'O to XXI. The Fool’s numeral is the letter O.', 'Deck.swift:56-150')]
const SUIT_SRC = 'Deck.swift:152-434 (suit words); Deck.swift:417-431 (names and numerals)'
for (const suit of D.other_text.suits_in_deck_order) {
  const cards = D.cards.filter(c => c.suit && c.suit.toLowerCase() === suit.toLowerCase())
  boards.push(tableBoard(suit, cards, `Ace to Ten (numerals I to X), then Page, Knight, Queen and King, which carry no numeral.`, SUIT_SRC))
}

// ---- 7. The spreads -----------------------------------------------------------------------------------
const sp = L.board({ name: 'The words · The spreads', kicker: 'THE WORDS', title: 'The spreads', titleStyle: 'h1', w: 1600,
  lead: 'Three ways to lay the cards. The chooser shows each spread’s name and a short gloss; the table labels each place with its position name. Every position sounds its own note from one pentatonic scale, so any spread lands as a consonant chord; a reversed card sounds an octave under, in a darker voice.' })
const tile = async (id, chosen) => L.img(`glyphs/ui/spread/spread-tile-${id}-${chosen ? 'chosen' : 'rest'}@3x.png`, { scale: 3, w: 304, name: `Spread choice · ${id}${chosen ? ' · chosen' : ''}` })
const tiles = []
for (const [id, ch] of [['one', false], ['three', true], ['road', false]]) tiles.push(await tile(id, ch))
L.add(sp, L.col([
  L.row(tiles, { gap: 24, align: 'CENTER', name: 'Chooser' }),
  L.text('The chooser with Three Fates chosen (app renders at 3×, shown at 2×). Chosen: bold caps, gold gloss, gold diamonds; the others in grey.', 'caption', { w: 960 }),
  L.source('RootView.swift:1107-1119 (Caps/Spread, Spread/Sub)'),
], { gap: 10 }))
const posRows = []
for (const s of D.spreads) s.positions.forEach((p, i) => posRows.push([
  i === 0 ? L.text(s.name, 'smallStrong', { w: 160 }) : L.text('', 'small', { w: 160 }),
  i === 0 ? L.text(s.sub, 'voiceSmall', { w: 200, size: 16, lh: 22, color: L.C.gold }) : L.text('', 'small', { w: 200 }),
  L.text(String(i + 1), 'code', { w: 56 }),
  L.text(p.name, 'label', { w: 200, family: 'Didot', style: 'Regular', size: 12, lh: 20, ls: 26, upper: true, color: L.C.gold, alpha: 1 }),
  L.text(`${p.note} · MIDI ${p.note_midi}`, 'code', { w: 160 }),
]))
const posTable = L.table([
  { key: 's', label: 'Spread', w: 160 }, { key: 'sub', label: 'Gloss (under the name)', w: 200 }, { key: 'i', label: 'Place', w: 56 },
  { key: 'p', label: 'Position (slot label)', w: 200 }, { key: 'n', label: 'Note', w: 160 },
], posRows, { name: 'Spreads and positions' })
L.add(sp, L.row([posTable, L.col([
  L.note({ w: 520, title: 'Slot labels', body: 'Each position name is printed under its place on the thread in Caps/Slot: Didot 9 pt capitals, tracking 3.2. Grey (text 32%) while the place is empty, gold ink at 80% once its card is face up, full gold while its line is read (0.45 s).', source: 'RootView.swift:674-680; Keeping.swift:806-808' }),
  L.note({ w: 520, title: 'One scale', body: 'The notes are all from one pentatonic scale (G3, C4, D4, E4, G4, A4, E5), so any spread lands as a consonant chord. The One Card sounds G4; a reversed card sounds its note an octave under, in a darker voice.', source: 'Deck.swift:38-50; Sfx.swift' }),
], { gap: 16 })], { gap: 48, align: 'MIN' }))
L.add(sp, L.source('Deck.swift:38-50 (spreads, slots, notes); RootView.swift:674-680 (slot labels, Caps/Slot 9 pt, tracking 3.2)'))

// ---- 8. In a reading ------------------------------------------------------------------------------------
const rd = L.board({ name: 'The words · In a reading', kicker: 'THE WORDS', title: 'In a reading', titleStyle: 'h1', w: 3280,
  lead: 'Once the cards have written themselves, each card’s line for the way it fell is read in turn, one line per card, and together they make a verse. The same words, larger, on the altar when a card is opened. Real window renders at 80%.', leadW: 1300 })
const byId = id => K.card(id)
const verseCol = async (path, styleName, sizeNote, rows) => {
  const win = await L.window(path); win.rescale(0.8)
  const lines = []
  for (const [pos, id, rev] of rows) {
    const c = byId(id)
    lines.push(L.row([
      L.col([L.text(pos, 'kicker', { w: 200 }), L.text(c.name + (rev ? ', reversed' : ''), 'small', { w: 200 })], { gap: 2, w: 200 }),
      await spec(rev ? c.reversed : c.upright, styleName, { w: 760 }),
    ], { gap: 24, align: 'CENTER', name: 'Verse line · ' + pos }))
  }
  return L.col([win, L.text(sizeNote, 'code', { w: win.width }), ...lines], { gap: 14, w: win.width, name: 'Reading · ' + path })
}
L.add(rd, L.row([
  await verseCol('shots-window/9-one.png', 'Verse/One', 'One Card · Verse/One · Didot 27 / 33', [['The Answer', 'strength', false]]),
  await verseCol('shots-window/5-reading.png', 'Verse/Three', 'Three Fates · Verse/Three · Didot 22 / 27, 12 pt apart', [['What Was', 'emperor', false], ['What Is', 'pentacles-9', false], ['What Tends', 'hermit', true]]),
  await verseCol('shots-window/8-five.png', 'Verse/Five', 'The Long Road · Verse/Five · Didot 19 / 24 (18.5 in code), 8 pt apart; 16 at 940 × 660, 13 at 940 × 628', [['Situation', 'cups-page', false], ['Crossing', 'cups-6', true], ['Root', 'swords-6', false], ['Counsel', 'wands-4', false], ['Outcome', 'cups-10', false]]),
], { gap: 40, align: 'MIN' }))
const p9 = byId('pentacles-9')
const altar = await L.window('shots-window/7-inspect.png'); altar.rescale(0.8)
const court = await L.window('shots-window/58-altar-court.png'); court.rescale(0.8)
L.add(rd, L.row([
  L.col([altar, L.text('The altar: Nine of Pentacles, opened from What Is.', 'caption', { w: altar.width })], { gap: 10 }),
  L.col([court, L.text('A court card reversed (Queen of Wands): no numeral, a REVERSED label, and the reversed line.', 'caption', { w: court.width })], { gap: 10 }),
  L.col([
    L.text('On the altar', 'h2', { w: 760 }),
    L.text('The opened card’s words in a column beside it: position, name and numeral in caps, the essence in gold italic, its line, and its three keys.', 'body', { w: 760 }),
    L.spacer(1, 8),
    await spec(p9.essence, 'Altar/Essence', { w: 760, color: L.C.gold, alpha: 1 }),
    await spec(p9.upright, 'Altar/Line', { w: 760 }),
    L.text(p9.keys.join('   ◆   ').toUpperCase(), 'label', { family: 'Didot', style: 'Regular', size: 11, lh: 16, ls: 26, alpha: 0.55, w: 760 }),
    L.spacer(1, 8),
    L.specs([
      ['Essence', 'Altar/Essence · Didot Italic 20 / 25, gold ink', 'RootView.swift:1486-1488'],
      ['Line', 'Altar/Line · Didot 25 / 31, text 92%, wraps at 360 pt', 'RootView.swift:1494-1497'],
      ['Keys', 'Caps 10 (9.5 in code), tracking 2.6, text 50%, between 4 × 4 pt gold diamonds (drawn here as ◆)', 'RootView.swift:1500-1511'],
      ['Verse', 'Text 92% while lit, 30% when another line is being read', 'RootView.swift:1199-1227'],
    ], { w: 760, keyW: 110 }),
  ], { gap: 14, w: 760 }),
], { gap: 40, align: 'MIN' }))

L.add(sec, head, ...boards, sp, rd)
L.fit(sec)
await L.arrange('Design system')
return await L.snapChapter(sec, 'pages/the-words', { scale: 0.3 })
