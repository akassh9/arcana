// Minor Arcana, step 6 of 6: the court scheme. Run after steps 2-5 (it places instances of the sixteen court cards).
const L = S.lib, K = S.cards, M = S.minor
const NAME = 'Minor Arcana · The court scheme'
const sec = await M.begin([NAME])
const G = await L.json('glyphs/manifest.json')
const gi = f => G.items.find(x => x.file === f)
for (const s of M.SUITS) for (const r of M.RANKS) await K.makeCard(s + '-' + r)

const b = L.board({ name: NAME, kicker: 'MINOR ARCANA', title: 'The court scheme', w: 2400, leadW: 1300,
  lead: 'A court card sets one emblem where its rank belongs, so rank reads at a glance: the page on the ground, the knight on the road, the queen in the ring, the king on the squared seat, crowned in gold. Courts carry no numeral.',
  tags: ['claude'] })

// ---- the devices ----
L.add(b, L.section('Four devices, and one exception', { style: 'h2', lead: 'Each drawn from a real card’s marks (the Cups’, and the Knight of Pentacles’), in the 186 × 248 art frame, at 1.8 ×. The other suits’ are the same shapes with their own wobble.', leadW: 1100 }))
const DEV = [
  ['page', 'Page · on the ground', 'A small oxblood diamond (4 × 5.5) at the top of the art, over the thing the page was given; the emblem stands on the ground.', 'Suits.swift:1031-1073'],
  ['knight-road', 'Knight · on the road', 'Three bowed lines across the foot, thinning 1.5, 1.25, 1.0 pt. The emblem is carried along them.', 'Suits.swift:1076-1101, 1111-1116'],
  ['knight-furrows', 'Knight of Pentacles · the furrows', '“The knight who does not hurry”: four straight furrows instead of the road, 1.5 to 0.9 pt.', 'Suits.swift:1102-1110'],
  ['queen', 'Queen · in the ring', 'A hand-wobbled ring (r 66, 1.4 pt) round the emblem, an oxblood diamond either side.', 'Suits.swift:1118-1122'],
  ['king', 'King · on the seat', 'A double square (1.8 and 1.0 pt) crowned with three points of gold leaf. A king’s emblem is never gilt.', 'Suits.swift:1144-1150'],
]
const TW = 416, TH = 496, devs = []
for (const [f, title, body, source] of DEV) {
  const it = gi('glyphs/suits/court/court-device-' + f + '.svg')
  const tile = L.frame({ name: 'Paper · ' + it.title, w: TW, h: TH, fill: '#F3EDE0', r: 12, clip: false })
  const n = await L.svg(it.file); tile.appendChild(n); n.rescale(1.8); n.x = Math.round((TW - n.width) / 2); n.y = Math.round((TH - n.height) / 2)
  devs.push(L.col([tile, L.text(title, 'smallStrong', { w: TW }), L.text(body, 'small', { w: TW }), L.source(source, { w: TW })], { gap: 6, w: TW, name: 'Device · ' + title }))
}
L.add(b, L.row(devs, { gap: 44, align: 'MIN', name: 'Devices' }))

// ---- the sixteen ----
L.add(b, L.section('The sixteen courts', { style: 'h2', lead: 'Instances of each Card/<name>, upright, at 0.8 ×. Each suit adds its own details to the scheme.', leadW: 1100 }))
const DET = {
  wands: ['Three pyramids on the horizon', 'Speed lines; the staff thrust up', 'A sunflower beside a plain staff', 'A flowering staff on the seat'],
  cups: ['A gold fish rising from the cup', 'Wings: three feathers a side', 'A lidded cup; the sea below', 'Four rows of sea: calm over deep water'],
  swords: ['Wind and three birds', 'Four strokes of wind; the sword slants up', 'One bird above, a cloud bank below', 'A butterfly on each top corner'],
  pentacles: ['A sapling and five furrows', 'Four straight furrows, nothing else', 'Five flowers on the ring: the rose bower', 'Bull’s horns and grapes at the seat'],
}
const CW = 200, RL = 110
const headRow = L.row([L.spacer(RL, 1), ...M.RANKS.map(r => L.text(r + ' · ' + M.DEVICE[r], 'kicker', { w: CW }))], { gap: 32, name: 'Rank labels' })
const rows = M.SUITS.map(s => L.row([
  L.frame({ name: 'Suit label', w: RL, h: 320, dir: 'v', justify: 'CENTER', kids: [L.text(M.cap(s), 'kicker', { w: RL })] }),
  ...M.RANKS.map((r, k) => {
    const i = K.instance(s + '-' + r, 'Upright'); i.rescale(0.8)
    return L.col([i, L.text(DET[s][k], 'caption', { w: CW })], { gap: 8, w: CW, name: 'Court · ' + K.card(s + '-' + r).name })
  }),
], { gap: 32, align: 'MIN', name: 'Suit · ' + M.cap(s) }))
const grid = L.col([headRow, ...rows], { gap: 28, name: 'Sixteen courts' })

const win = await L.window('shots-window/58-altar-court.png', { name: 'Window · 58-altar-court' })
win.rescale(1100 / win.width)
const N = (tags, title, body, source) => L.note({ w: 538, tags, title, body, source })
const side = L.col([
  win,
  L.text('The altar, a court reversed (the Queen of Wands): no numeral, only “REVERSED” in oxblood caps, then the reversed line.', 'caption', { w: 1100 }),
  L.source('RootView.swift:1473-1481 · shots-window/58-altar-court', { w: 1100 }),
  L.spacer(1, 16),
  L.frame({ name: 'Notes', dir: 'h', gap: 24, wrap: true, wrapGap: 24, w: 1100, kids: [
    N(['claude'], 'Wings only on the Knight of Cups', 'Three feathers each side of the full cup, after the Rider–Waite–Smith knight’s winged helmet and heels. No other card is winged.', 'Suits.swift:1078-1089'),
    N(['claude'], 'Where a court keeps its gold', 'Pages, knights and queens gild the emblem, or what it holds: the Page of Cups’ fish, the Queen of Cups’ lid, the Queen of Wands’ sunflower. Kings keep theirs in the crown.', 'Suits.swift:1029-1170'),
    N(['claude', 'open'], 'An empty numeral band', 'Sixteen cards carry 41 pt of blank band where a pip’s numeral sits. A rank device could go there.', 'Deck.swift:430; CardImages.swift:73'),
    N(['open'], 'What the Page’s diamond means', 'Never stated. The code says “looking at the thing it was given”; it may read as a star or a seed.', 'Suits.swift:1032-1033'),
  ] }),
], { gap: 10, name: 'The altar and notes' })
L.add(b, L.row([grid, side], { gap: 80, align: 'MIN', name: 'Courts and the altar' }))

L.add(sec, b)
return await M.end(sec, [NAME])
