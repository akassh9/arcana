// Minor Arcana, step 2 of 6: the Wands. Run with cards-lib.js and minor-arcana-lib.js in front (see minor-arcana-lib.js).
const L = S.lib, K = S.cards, M = S.minor
const NAME = 'Minor Arcana · Wands'
const sec = await M.begin([NAME])
const { board, built } = await M.suitBoard('wands', {
  motto: 'Staves planted, carried, raised and crossed.', mottoSrc: 'the suit’s heading in Suits.swift:501',
  lead: 'The emblem is a living staff: a heavy stave, a turned foot, leaves under the head and a diamond bud. Half the golds are buds.',
  tags: [['claude', 'Written without a per-suit review']],
  notes: [
    { tags: ['open'], title: 'Buds stay upright on slanting staves', body: 'A bud is an axis-aligned diamond, so on the diagonal staves of the Five, Seven, Eight, Nine, Ten and the Knight it does not turn with the staff. It may be intended; nothing in the code says so.', source: 'Ink.swift:202-204; Suits.swift:123' },
    { tags: ['open'], title: 'The Ace’s hidden ink bud', body: 'The staff’s own ink bud is drawn first and the gold flame bud covers most of it. Its lower tip may show just under the gold.', source: 'Suits.swift:506-512, 123' },
  ],
  source: 'Deck.swift:239-298 (words); Suits.swift:500-647 (numbers), 1013-1172 (courts); CardImages.swift:45-122 (face), 198-235 (blank)',
})
L.add(sec, board)
const r = await M.end(sec, [NAME])
return Object.assign({ built }, r)
