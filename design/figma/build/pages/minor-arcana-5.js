// Minor Arcana, step 5 of 6: the Pentacles. Run with cards-lib.js and minor-arcana-lib.js in front (see minor-arcana-lib.js).
const L = S.lib, K = S.cards, M = S.minor
const NAME = 'Minor Arcana · Pentacles'
const sec = await M.begin([NAME])
const { board, built } = await M.suitBoard('pentacles', {
  motto: 'Kept, carved, weighed, grown and handed down.', mottoSrc: 'the suit’s heading in Suits.swift:805',
  lead: 'The emblem is a rimmed disc with a pentagram drawn in it. Gilt, the disc is laid in leaf under the star.',
  tags: [['claude', 'Written without a per-suit review'], ['claude', 'A pentagram in every pentacle']],
  notes: [
    { tags: ['open'], title: 'The plainest courts', body: 'The Knight is only a gilt pentacle over four straight furrows; the Page a pentacle, a sapling and five furrows. Both were noted as plain after the build and not revisited.', source: 'Suits.swift:1058-1073, 1102-1110' },
    { tags: [['fixed', 'Two golds']], title: 'The Two keeps two golds', body: 'Both juggled pentacles are gilt: the other exception to about one gold a card.', source: 'Suits.swift:840-860' },
  ],
  source: 'Deck.swift:357-414 (words); Suits.swift:804-1012 (numbers), 1013-1172 (courts); CardImages.swift:45-122 (face), 198-235 (blank)',
})
L.add(sec, board)
const r = await M.end(sec, [NAME])
return Object.assign({ built }, r)
