// Minor Arcana, step 1 of 6: the header and the suit emblems. Run with cards-lib.js and minor-arcana-lib.js in front.
// This step also sweeps out anything in the chapter that is not one of its seven boards.
const L = S.lib, K = S.cards, M = S.minor
const MINE = ['Minor Arcana · Header', 'Minor Arcana · Suit emblems']
const sec = await M.begin(MINE, { sweep: true })
const G = await L.json('glyphs/manifest.json')
const gi = f => G.items.find(x => x.file === f)
const src = it => it.source.replace(/Sources\/Arcana\//g, '')

// ---- 1. Header ---------------------------------------------------------------------------------
const head = L.board({ name: MINE[0], kicker: 'THE DECK', title: 'Minor Arcana', w: 1600,
  lead: 'The fifty-six suit cards, as real components: Ace to Ten, Page, Knight, Queen and King of Wands, Cups, Swords and Pentacles. They are drawn by the same pen as the Majors, in ink, gold leaf and oxblood on cream stock, and no people are drawn.',
  tags: ['shipped'] })
L.add(head, L.rich([['In this chapter   ', 'smallStrong'], ['Suit emblems  ·  The court scheme  ·  Wands  ·  Cups  ·  Swords  ·  Pentacles', 'small']], 'small', { w: 1456 }))
const hero = await L.img('shots/61-suits.png', { w: 1456, name: 'Render · 61-suits', r: 12, stroke: L.C.stroke })
L.add(head, L.col([hero,
  L.text('All 56 upright, a suit to a row in deck order: Wands, Cups, Swords, Pentacles. A render from the app’s shot tool, 113 × 200 pt a card.', 'caption', { w: 1456 }),
  L.source('Tools/shot/main.swift:382 (shot 61)')], { gap: 8, name: 'Figure · every suit card' }))
const N = (tags, title, body, source) => L.note({ w: 464, tags, title, body, source })
const commit = L.text('commit 3829999 · 26 Sep 2026', 'code', { size: 11, lh: 16, alpha: 0.55 })
L.link(commit, L.REPO + '/commit/3829999')
const whole = N(['akash'], 'The whole deck', 'The design panel had left the Minors out, and Akash first said “no need to do anything about this yet”. Then they raised the full deck themselves, approved a preview, and said: “build it out fully… we are aligned well enough in terms of direction and vision.”')
L.add(whole, commit)
L.add(head, L.frame({ name: 'Notes', dir: 'h', gap: 32, wrap: true, wrapGap: 24, w: 1456, kids: [
  whole,
  N(['claude'], 'Pips that tell a scene', 'Claude proposed Marseille-style pips: a number card lays out that many emblems. How they lie tells its Rider–Waite–Smith scene with the figures taken out, so read the deck as RWS iconography in pip form.', 'Suits.swift:4-11'),
  N(['claude'], 'About one gold per card', 'The gold is what a returned card keeps. Two Minors keep two: the Five of Cups and the Two of Pentacles. Every card below says where its gold is.', 'Suits.swift:11; CardArt.swift:539-591'),
  N(['claude'], 'Numerals, and none on courts', 'Numbers carry roman numerals, Ace = I. Courts leave the band empty, and on the altar a reversed court says only “reversed”.', 'Deck.swift:423, 430; RootView.swift:1473-1481'),
  N(['claude'], 'The sky answers no Minor', 'Only the Wheel, the Star, the Moon and the Sun change the sky. With 78 cards that is about 15% of three-card readings, down from 47% with 22.', 'Answers.swift:31-32'),
  N(['fixed'], 'How to use them', 'Drop in an instance of Card/<name> and switch State: Upright, Reversed, Returned. 226 × 400 pt, like the Majors. Ids read like cups-ace, swords-10, pentacles-queen. Suits.swift is written Cups first; this file follows the deck.', 'Deck.swift:156, 416-432'),
] }))

// ---- 2. Suit emblems -------------------------------------------------------------------------------
const em = L.board({ name: MINE[1], kicker: 'MINOR ARCANA', title: 'Suit emblems', w: 2400,
  lead: 'One emblem to a suit, in deck order, with the variants the cards use. On a card the pen draws each emblem with that card’s seed, so no two are quite alike; these are drawn once on their own. Shown at 1.25 ×.', leadW: 1300,
  tags: [['claude', 'A pentagram in every pentacle']] })
const SC = 1.25, TW = 176, TH = 300
const tile = async (file, label, body) => {
  const it = gi('glyphs/suits/' + file + '.svg')
  const f = L.frame({ name: 'Paper · ' + it.title, w: TW, h: TH, fill: '#F3EDE0', r: 12, clip: false })
  M.place(f, await L.svg(it.file), SC)
  return L.col([f, L.text(label, 'smallStrong', { w: TW }), L.text(body, 'caption', { w: TW }), L.source(src(it), { w: TW })], { gap: 6, w: TW, name: 'Emblem · ' + label })
}
const EMB = {
  Wands: [['emblem-wand', 'Staff, ink bud', 'As the courts carry it: 2.6 pt, the foot turned, five leaves under the head.'],
    ['emblem-wand-gilt', 'Staff, gold bud', 'The bud in leaf: the Page’s and the Knight’s.']],
  Cups: [['emblem-cup', 'Cup', 'Bowl, rim, knopped stem and foot.'],
    ['emblem-cup-full', 'Full cup', 'Its water laid in leaf: the Five’s standing two, the Knight’s.'],
    ['emblem-cup-lidded', 'Lidded cup', 'The Queen’s: a gold dome and an oxblood finial.'],
    ['emblem-cup-fish', 'Cup with a fish', 'The Page’s: a gold fish rising head-up.']],
  Swords: [['emblem-sword', 'Sword', 'The numbers’: blade, crossguard, grip, ringed pommel; 1.5 pt.'],
    ['emblem-great-sword', 'Great sword', 'The Ace’s and the courts’: two edges, a fuller, oxblood ends on the guard.'],
    ['emblem-great-sword-gilt', 'Great sword, gilt', 'A leaf lozenge on the guard: the Page’s and the Queen’s; the Knight’s slants.']],
  Pentacles: [['emblem-pentacle', 'Pentacle', 'A rimmed disc with a five-pointed star in it; r 36, the courts’ size.'],
    ['emblem-pentacle-gilt', 'Pentacle, gilt', 'The disc laid in leaf under the star.']],
}
const groups = []
for (const [suit, list] of Object.entries(EMB)) {
  const tiles = []
  for (const e of list) tiles.push(await tile(...e))
  groups.push(L.col([L.text(suit, 'kicker'), L.row(tiles, { gap: 16, align: 'MIN', name: 'Tiles' })], { gap: 14, name: 'Suit · ' + suit }))
}
L.add(em, L.row(groups, { gap: 56, align: 'MIN', name: 'The four emblems' }))

L.add(em, L.section('The small things the numbers are told with', { style: 'h2',
  lead: 'Every helper the number cards use to tell their scenes, each drawn once on its own pen and cropped. Shown at 2 × or, if wider, scaled to fit; sizes are the drawn ink, in points.', leadW: 1100 }))
const MOT = [['spill', 'Spill', 'Five of Cups: a cup on its side, three oxblood drops'], ['leaf', 'Leaf', 'An almond leaf, base to tip'],
  ['sprig', 'Sprig', 'Four of Wands: the garland'], ['flower', 'Flower', 'Queen of Pentacles: the bower'],
  ['flower-gilt', 'Given flower', 'Four of Wands: its heart in leaf'], ['sunflower', 'Sunflower', 'Queen of Wands'],
  ['grapes', 'Grapes', 'King of Pentacles'], ['butterfly', 'Butterfly', 'King of Swords'], ['bird', 'Bird', 'Page of Swords'],
  ['ship', 'Ship', 'Three of Wands'], ['ship-gilt', 'Ship coming in', 'Three of Wands: its sail in leaf'], ['wreath', 'Laurel wreath', 'Six of Wands'],
  ['pyramid', 'Pyramid', 'Page of Wands'], ['wind', 'Wind', 'Page of Swords'], ['rain', 'Rain', 'Three of Swords'],
  ['heart', 'Heart', 'Three of Swords, in leaf'], ['ground', 'Ground', 'A line and a band of hatching'],
  ['cloud', 'Cloud bank', 'Filled with stock, so what stands in it rises out of it'], ['ripples', 'Water', 'Queen of Cups: three wavy lines'],
  ['crescent', 'Crescent', 'Two of Swords, in leaf']]
const MW = 204, MH = 128
const motifs = []
for (const [f, name, where] of MOT) {
  const it = gi('glyphs/suits/motifs/motif-' + f + '.svg')
  const box = L.frame({ name: 'Paper · ' + it.title, w: MW, h: MH, fill: '#F3EDE0', r: 12, clip: false })
  const ink = M.place(box, await L.svg(it.file), (w, h) => Math.min(2, (MW - 16) / w, (MH - 16) / h))
  const pt = `${Math.round(ink.w)} × ${Math.round(ink.h)} pt · `
  motifs.push(L.col([box, L.text(name, 'smallStrong', { w: MW }), L.text(where, 'caption', { w: MW }), L.source(pt + src(it), { w: MW })], { gap: 6, w: MW, name: 'Motif · ' + name }))
}
L.add(em, L.frame({ name: 'Motifs', dir: 'h', gap: 24, wrap: true, wrapGap: 32, w: 2256, kids: motifs }))

L.add(sec, head, em)
return await M.end(sec, MINE)
