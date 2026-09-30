// Minor Arcana, step 3 of 6: the Cups. Run with cards-lib.js and minor-arcana-lib.js in front (see minor-arcana-lib.js).
const L = S.lib, K = S.cards, M = S.minor
const NAME = 'Minor Arcana · Cups'
const sec = await M.begin([NAME])
const { board, built } = await M.suitBoard('cups', {
  motto: 'Each number told by how its cups stand.', mottoSrc: 'the suit’s heading in Suits.swift:234',
  lead: 'The emblem is a chalice: bowl, rim, knopped stem and foot. A cup whose water is laid in gold is a full cup. The Cups were written first, and Akash saw them before the other suits were built.',
  tags: [['akash', 'Previewed by Akash']],
  notes: [
    { tags: [['fixed', 'Two golds']], title: 'The Five keeps two golds', body: 'Both standing cups are full, so the returned Five keeps two golds: one of two exceptions to about one gold a card (the other is the Two of Pentacles).', source: 'Suits.swift:287-300' },
    { tags: ['claude'], title: 'Wings only on the Knight of Cups', body: 'Three feathers each side of a full gold cup, after the winged helmet and heels of the Rider–Waite–Smith knight. No other card has wings.', source: 'Suits.swift:1078-1089' },
  ],
  source: 'Deck.swift:179-238 (words); Suits.swift:233-396 (numbers), 1013-1172 (courts); CardImages.swift:45-122 (face), 198-235 (blank)',
})
L.add(sec, board)
const r = await M.end(sec, [NAME])
return Object.assign({ built }, r)
