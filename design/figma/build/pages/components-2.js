// Components, step 2: choosing and drawing (spread tiles, corner brackets, the draw prompt, the diamonds).
//   node design/figma/bridge/run.mjs design/figma/build/pages/components-lib.js design/figma/build/pages/components-2.js
const L = S.lib, CL = S.cl
const MINE = ['Components · Choosing & drawing']
const sec = await CL.start(MINE)
const INNER = 868
const side = c => { const r = c.findOne(x => x.type === 'RECTANGLE'); return r ? Math.round(r.width * 10) / 10 : '?' }

const b = L.board({ name: 'Components · Choosing & drawing', kicker: 'PARTS · THE TABLE', title: 'Choosing & drawing', w: 1600,
  lead: 'Under the question the room offers three spreads. While drawing, corner marks wait where each card will land and a row of pips counts the cards taken. The square turned 45° is the app’s one ornament.' })

// ---- Spread tile
const SPREADS = [['one', 'One Card', 'the blunt answer'], ['three', 'Three Fates', 'was · is · tends'], ['road', 'The Long Road', 'five cards, one weight']]
const tiles = []
for (const chosen of [true, false]) for (const [id, name, sub] of SPREADS) {
  const c = await CL.comp('ui/spread/spread-tile-' + id + '-' + (chosen ? 'chosen' : 'rest') + '.svg', 'Spread=' + name + ', State=' + (chosen ? 'Chosen' : 'Not chosen'))
  const pips = c.findOne(n => n.name === 'pips'); if (pips) { pips.name = 'Pips'; if (chosen) await CL.glow(pips, 'Glow/Spread pips chosen') }
  const br = c.findOne(n => n.name === 'brackets'); if (br) br.name = 'Corner brackets'
  const t1 = await CL.type(name, 'Caps/Spread', chosen ? 'ink/text' : 'ink/text-48', { w: 150, h: 15, name: 'Name', font: chosen ? { family: 'Didot', style: 'Bold' } : null })
  const t2 = await CL.type(sub, 'Spread/Sub', chosen ? 'gold/ink' : 'ink/text-40', { w: 150, h: 15, name: 'Sub' })
  c.appendChild(t1); t1.x = 1; t1.y = 1 + 40.5 - 7.5
  c.appendChild(t2); t2.x = 1; t2.y = 1 + 64.5 - 7.5
  tiles.push({ c, label: name + (chosen ? ' · chosen' : ' · not chosen'), id, chosen })
}
const tileSet = CL.grid(tiles, 'Spread tile', { cols: 3, labels: false, pad: 12, gap: 16, rowGap: 12,
  desc: 'One of the three spreads offered under the question (150 × 86 pt; frame inset 1 pt). A pip per card, the spread’s name in small capitals, a line in italic under it. Chosen: pips gold ink + Glow/Spread pips chosen, name Didot Bold text 100 %, sub gold ink, corner brackets gold ink 60 %. Not chosen: pips text 28 %, name Didot Regular text 48 %, sub text 40 %. Choosing is instant; plain button, no hover look.', src: 'Sources/Arcana/RootView.swift:1085-1132' })
// in the room: three tiles 34 pt apart, one chosen
const inRoom = L.row(['one', 'three', 'road'].map((id, i) => { const t = tiles.find(x => x.id === id && x.chosen === (i === 0)); const n = t.c.createInstance(); n.name = 'Tile · ' + id; return n }), { gap: 32, name: 'The chooser row' })
L.add(b, await CL.card({ name: 'Spread tile',
  what: 'One of the three spreads offered under the question in the room: a pip for each card, the spread’s name in small capitals and a line in italic under it, held in corner brackets when chosen.',
  stage: [CL.previews(tiles, { k: 1.75, gap: 32, w: INNER }),
    L.row([L.col([CL.cap('In the room · 1×, One Card chosen'), inRoom], { gap: 10, name: 'In the room' }),
      await CL.render('glyphs/ui/spread/spread-tile-one-chosen@3x.png', 'App render · 1×', { scale: 3 })], { gap: 48, align: 'MAX', name: 'In use' }),
    CL.masters(tileSet.holder)],
  specs: [
    ['Variants', 'Spread = One Card · Three Fates · The Long Road  ×  State = Chosen · Not chosen'],
    ['Size', '150 × 86 pt (frame 152 × 88, inset 1 pt); in the room three tiles in a 518 pt row', 'RootView.swift:724-732'],
    ['Chosen', 'pips gold ink + Glow/Spread pips chosen (#ECCE6E 90 %, blur 8); name Didot Bold, text 100 %; sub gold ink; brackets gold ink 60 %', 'RootView.swift:1094-1126'],
    ['Not chosen', 'pips text 28 %; name Didot Regular, text 48 %; sub text 40 %; no brackets', 'RootView.swift:1107-1119'],
    ['Type', 'Caps/Spread (Didot 11, tracking 3) centred on y 40.5; Spread/Sub (Didot Italic 11.5, drawn at 12) on y 64.5; they may shrink to 82 % and 85 %', 'RootView.swift:1107-1119'],
    ['Words', 'names and lines verbatim from the spreads’ data', 'Deck.swift:38-50'],
    ['Behaviour', 'choosing is instant, no animation; a plain button with no hover look'],
  ],
  tags: ['shipped', ['open', 'No hover look']] }))

// ---- Corner brackets
const br = [
  { c: await CL.comp('ui/brackets-chooser.svg', 'Use=Chosen spread'), label: 'Chosen spread', sub: '150 × 86 · gold ink 60 %' },
  { c: await CL.comp('ui/brackets-slot-1.svg', 'Use=Slot · one card'), label: 'Empty slot · one card', sub: '185.3 × 327.9 · gold ink 42 %' },
  { c: await CL.comp('ui/brackets-slot-3.svg', 'Use=Slot · three or five'), label: 'Empty slot · three or five', sub: '159.5 × 282.3 · gold ink 42 %' },
]
const brSet = CL.grid(br, 'Corner brackets', { pad: 24, gap: 48, colW: 210, valign: 'bottom',
  desc: 'Four corner marks, each arm 13 % of the box’s shorter side, 1 pt. Round the chosen spread (150 × 86, gold ink 60 %), and round each empty slot while drawing (110 % of the slot, gold ink 42 %), gone once the card lands. Slot sizes are for the default 1260 × 828 stage and scale with it. The three- and five-card slots are the same size.', src: 'Sources/Arcana/RootView.swift:639-652' })
L.add(b, await CL.card({ name: 'Corner brackets',
  what: 'Four corner marks that hold a place: round the chosen spread, and round each empty slot while the cards are drawn.',
  stage: [CL.masters(brSet.holder, 'Masters · 1× (the default stage)')],
  specs: [
    ['Variants', 'Use = Chosen spread · Slot · one card · Slot · three or five'],
    ['Arms', '13 % of the box’s shorter side (11.2 pt on a tile); 1 pt, square ends', 'RootView.swift:639-652'],
    ['Chosen', 'gold ink 60 %, only on the chosen spread', 'RootView.swift:1122-1126'],
    ['Slots', '110 % of the slot: 185.3 × 327.9 pt (one card), 159.5 × 282.3 (three or five) at 1260 × 828; gold ink 42 %; gone once the card lands', 'RootView.swift:666-671'],
    ['Scale', 'slot sizes follow the stage’s layout, so they shrink in a smaller window', 'Game.swift'],
  ],
  tags: ['shipped'] }))

// ---- Draw prompt
const WORD = { 1: 'draw one card', 3: 'draw three', 5: 'draw five' }
const prompts = []
for (const n of [1, 3, 5]) for (let k = 0; k <= n; k++) {
  const c = figma.createComponent()
  c.name = 'Cards=' + n + ', Taken=' + k
  c.fills = []; c.clipsContent = false
  c.layoutMode = 'VERTICAL'; c.itemSpacing = 11; c.counterAxisAlignItems = 'CENTER'
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'
  const pips = await L.svg('glyphs/ui/prompt/prompt-pips-' + n + '-' + k + '.svg', { name: 'Pips' })
  pips.fills = []; pips.clipsContent = false
  c.appendChild(pips)
  c.appendChild(await CL.type(WORD[n], 'Caps/Prompt', 'ink/text-52', { name: 'Word' }))
  CL.bind(c)
  prompts.push({ c, n, k, label: k + ' of ' + n })
}
const promptSet = CL.grid(prompts, 'Draw prompt', { rows: [1, 3, 5].map(n => prompts.filter(p => p.n === n)), pad: 20, gap: 28, rowGap: 16, colW: 90,
  desc: 'Over the one line of instruction while drawing: a pip for each card of the spread, gold once taken, and under it (13 pt lower) ‘draw one card’, ‘draw three’ or ‘draw five’ in Caps/Prompt (Didot 10, tracking 4), text 52 %. Pips: 6 pt squares turned 45°, 7 pt apart; taken gold ink, to take text 20 %. Centred on the stage at y = max(0.60 × H, labelY + 46). Leaves once the last card is taken; hidden while a card is inspected.', src: 'Sources/Arcana/RootView.swift:1139-1193' })
L.add(b, await CL.card({ name: 'Draw prompt',
  what: 'Over the one line of instruction while drawing: a pip for each card of the spread, gold once taken.',
  stage: [CL.previews(prompts.filter(p => p.n === 3), { k: 1.25, gap: 32, colW: 150 }), CL.masters(promptSet.holder, 'Masters · 1×, every count')],
  specs: [
    ['Variants', 'Cards = 1 · 3 · 5  ×  Taken = 0 … n (12 in all)'],
    ['Pips', '6 pt squares turned 45°, 7 pt apart; taken gold ink, to take text 20 %', 'RootView.swift:1143-1151'],
    ['Words', '‘draw one card’, ‘draw three’, ‘draw five’ in Caps/Prompt (Didot 10, tracking 4), text 52 %, 13 pt under the pips', 'RootView.swift:1159-1172'],
    ['Place', 'centred on the stage at y = max(0.60 × H, labelY + 46)', 'RootView.swift:1167-1176'],
    ['Life', 'shown only while drawing; it leaves once the last card is taken, so an all-gold row is never a resting state; hidden while a card is inspected', 'RootView.swift:1167-1190'],
  ],
  tags: ['shipped'] }))

// ---- Diamond + Folio diamond
const dia = [
  { c: await CL.comp('ui/diamonds/diamond-prompt-pip-taken.svg', 'Use=Prompt pip · taken'), label: 'Prompt pip · taken', sub: 'gold ink' },
  { c: await CL.comp('ui/diamonds/diamond-prompt-pip-open.svg', 'Use=Prompt pip · to take'), label: 'Prompt pip · to take', sub: 'text 20 %' },
  { c: await CL.comp('ui/diamonds/diamond-spread-pip-chosen.svg', 'Use=Spread pip · chosen', { glow: 'Glow/Spread pips chosen' }), label: 'Spread pip · chosen', sub: 'gold ink + glow' },
  { c: await CL.comp('ui/diamonds/diamond-spread-pip.svg', 'Use=Spread pip'), label: 'Spread pip', sub: 'text 28 %' },
  { c: await CL.comp('ui/diamonds/diamond-keyword.svg', 'Use=Keyword separator'), label: 'Keyword separator', sub: 'gold ink 55 %' },
  { c: await CL.comp('ui/diamonds/diamond-reversed.svg', 'Use=Reversed mark'), label: 'Reversed mark', sub: 'oxblood' },
]
const sides = dia.map(d => side(d.c))
const diaSet = CL.grid(dia, 'Diamond', { labels: false, pad: 14, gap: 20,
  desc: 'A square turned 45°, the app’s one ornament. Prompt pips (6 pt, gold ink when taken, text 20 % to take); spread pips (5 pt, gold ink + Glow/Spread pips chosen on the chosen spread, text 28 % otherwise); the keyword separator on the altar (4 pt, gold ink 55 %); the reversed mark under a reversed card’s essence (oxblood, fades in with the ink at 0.8–1).', src: 'Sources/Arcana/RootView.swift:1094-1151' })
const folio = await CL.comp('ui/diamonds/diamond-folio.svg', 'Folio diamond', { glow: 'Glow/Thread end diamond' })
CL.doc(folio, 'Between the thread’s two sentences and its question once the thread is found, and on a kept reading’s folio: a 5 pt square turned 45°, gold ink + Glow/Thread end diamond (#ECCE6E 100 %, SwiftUI radius 5, blur 10).', 'Sources/Arcana/RootView.swift:1343-1348')
const folioItem = { c: folio, label: 'Folio diamond', sub: 'gold ink + glow' }
L.add(b, await CL.card({ name: 'Diamond · Folio diamond',
  what: 'A square turned 45°, the app’s one ornament: pips that count cards and spreads, the separator between keywords, the mark of a reversed card, and the folio diamond where the thread is found.',
  stage: [CL.previews([...dia, folioItem], { k: 5, gap: 14, colW: 92 }),
    L.row([CL.masters(diaSet.holder, 'Diamond · 1×'), CL.masters(CL.shelf([{ c: folio }], 'Folio diamond · master', { colW: 24, h: 24, pad: 14 }), 'Folio diamond · 1×'),
      await CL.render('glyphs/ui/diamonds/diamond-folio-app@3x.png', 'Folio · app render ×5', { scale: 0.6, sub: 'with its glow' })], { gap: 40, name: 'Masters' })],
  specs: [
    ['Variants', 'Diamond: Use = Prompt pip · taken · to take · Spread pip · chosen · Spread pip · Keyword separator · Reversed mark. Folio diamond: its own component'],
    ['Sides', 'prompt pips 6 pt · spread pips 5 · keyword 4 · reversed 5 · folio 5 (the square’s side before the turn)', 'RootView.swift:1094-1101, 1143-1151; CardImages.swift:95-101'],
    ['Ink', 'as labelled; oxblood is card/oxblood #8C2E25 and fades in with the ink at 0.8–1', 'CardImages.swift:95-101'],
    ['Glows', 'spread pip: Glow/Spread pips chosen (blur 8). Folio: Glow/Thread end diamond (blur 10)', 'RootView.swift:1100, 1348'],
    ['Where', 'prompt pips over the draw prompt; spread pips on the tiles; keywords under a card’s line on the altar; folio between the thread’s sentences and its question, and on a kept reading', 'RootView.swift:1343-1348, 1501-1508; Keeping.swift:864-869'],
  ],
  tags: ['shipped'] }))

sec.appendChild(b)
await CL.finish(sec)
return { bound: CL.bound, snap: await L.snap(b, 'pages/components/components-choosing-drawing.png', { scale: 0.4 }) }
