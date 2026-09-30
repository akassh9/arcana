// Minor Arcana, step 4 of 6: the Swords. Run with cards-lib.js and minor-arcana-lib.js in front (see minor-arcana-lib.js).
const L = S.lib, K = S.cards, M = S.minor
const NAME = 'Minor Arcana · Swords'
const sec = await M.begin([NAME])
const { board, built } = await M.suitBoard('swords', {
  motto: 'Held, hung, laid down, and stood in the ground.', mottoSrc: 'the suit’s heading in Suits.swift:649',
  lead: 'Two emblems: a slim sword for the numbers, and for the Ace and the courts a great sword with a fuller and oxblood ends on its guard.',
  tags: [['claude', 'Written without a per-suit review']],
  notes: [
    { tags: ['open'], title: 'The Knight at Rest has no knight', body: 'The Four of Swords is named for the effigy on the tomb, but only the tomb, three hung swords and one laid on the lid are drawn.', source: 'Deck.swift:313; Suits.swift:688-696' },
    { tags: ['open'], title: 'A crowded quilt', body: 'On the Nine, the gold flower (r 6) sits between two quilt diamonds instead of taking a diamond’s place, leaving about 1 pt either side.', source: 'Suits.swift:780-783' },
    { tags: ['open'], title: 'Paper shapes over their own grooves', body: 'On a returned blank, shapes filled with paper (the Six’s hull; the clouds of the Three, the Queen and the Seven of Cups) are painted over the pressed marks and half hide their own outline, so the Six’s hull reads faint.', source: 'CardArt.swift:556-573; CardImages.swift:210-215' },
  ],
  source: 'Deck.swift:299-356 (words); Suits.swift:648-803 (numbers), 1013-1172 (courts); CardImages.swift:45-122 (face), 198-235 (blank)',
})
L.add(sec, board)
const r = await M.end(sec, [NAME])
return Object.assign({ built }, r)
